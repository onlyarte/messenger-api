const { Types } = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Expo } = require('expo-server-sdk');
const config = require('../config');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');

const expo = new Expo();

async function signup(parent, args, context, info) {
  const password = await bcrypt.hash(args.password, 10);
  const user = new User({
    ...args,
    password,
  });
  await user.save();
  const token = jwt.sign({ userId: user._id }, config.jwtSecret);
  return { token, user };
}

async function login(parent, args, context, info) {
  const user = await User.findOne({ username: args.username }).lean();
  if (!user) throw new Error('User not found');
  const isPasswordCorrect = await bcrypt.compare(args.password, user.password);
  if (!isPasswordCorrect) throw new Error('Wrong password');
  const token = jwt.sign({ userId: user._id }, config.jwtSecret);
  return { token, user };
}

async function startChat(parent, args, context, info) {
  const { name, link, isPublic, members: memberIds } = args;
  const { userId } = context.session;
  const chat = new Chat({
    name,
    link,
    isPublic,
    memberIds,
  });
  if (!isPublic) {
    if (!chat.memberIds.some(id => id.equals(userId))) {
      chat.memberIds.push(userId);
    }
    chat.adminIds = [userId];
  }
  await chat.save();
  context.pubsub.publish('new chat', { newChat: chat });
  return chat;
}

async function leaveChat(parent, args, context, info) {
  const chat = await Chat.findById(args.chat);
  if (!chat.memberIds.some(id => id.equals(context.session.userId)))
    throw new Error('Unauthorized');
  const member = await User.findById(context.session.userId).lean();
  chat.memberIds = chat.memberIds.filter(
    (id) => !id.equals(context.session.userId)
  );
  chat.adminIds = chat.adminIds.filter(
    (id) => !id.equals(context.session.userId)
  );
  await chat.save();
  context.pubsub.publish('left chat', { leftChat: { chat, member } });
  return chat;
}

async function addChatMember(parent, args, context, info) {
  const chat = await Chat.findById(args.chat);
  // only admins can add members to private chats
  if (!chat.isPublic && !chat.adminIds.some(id => id.equals(context.session.userId)))
    throw new Error('Unauthorized');
  const member = await User.findById(args.member).lean();
  if (!chat.memberIds.some(id => id.equals(member._id))) {
    chat.memberIds.push(member._id);
    await chat.save();
  }
  context.pubsub.publish('joined chat', { joinedChat: { chat, member } });
  return chat;
}

async function removeChatMember(parent, args, context, info) {
  const chat = await Chat.findById(args.chat);
  // only admins can remove members
  if (!chat.adminIds.some(id => id.equals(context.session.userId)))
    throw new Error('Unauthorized');
  const member = await User.findById(args.member).lean();
  // admins cannot be removed from chat
  if (chat.adminIds.some(id => id.equals(member._id)))
    throw new Error('Unauthorized');
  chat.memberIds = chat.memberIds.filter(
    id => !id.equals(member._id)
  );
  await chat.save();
  context.pubsub.publish('left chat', { leftChat: { chat, member } });
  return chat;
}

async function assignChatAdmin(parent, args, context, info) {
  const chat = await Chat.findById(args.chat);
  // only admins can add admins
  if (!chat.adminIds.some(id => id.equals(context.session.userId)))
    throw new Error('Unauthorized');
  const adminOID = new Types.ObjectId(args.admin);
  if (!chat.adminIds.some(id => id.equals(adminOID))) {
    chat.adminIds.push(adminOID);
    await chat.save();
  }
  return chat;
}

async function renameChat(parent, args, context, info) {
  const chat = await Chat.findById(args.chat);
  // only admins can rename chat
  if (!chat.idPublic && !chat.adminIds.some(id => id.equals(context.session.userId)))
    throw new Error('Unauthorized');
  chat.name = args.name;
  await chat.save();
  return chat;
}

async function sendMessage(parent, args, context, info) {
  const sender = await User.findById(context.session.userId).lean();
  const chat = await Chat.findById(args.chat);
  if (!chat.memberIds.some(id => id.equals(context.session.userId))) {
    if (chat.isPublic) {
      const addChatMemberArgs = { chat: args.chat, member: context.session.userId };
      await addChatMember(parent, addChatMemberArgs, context, info);
    } else {
      throw new Error('Unauthorized');
    }
  }
  const message = new Message({
    senderId: context.session.userId,
    chatId: args.chat,
    text: args.text,
  });
  await message.save();
  context.pubsub.publish('new message', { newMessage: message });

  const notifications = [];
  for (const memberId of chat.memberIds) {
    if (memberId.equals(message.senderId)) continue;
    const receiver = await User.findById(memberId);
    for (const pushToken of receiver.pushTokens) {
      if (!Expo.isExpoPushToken(pushToken)) continue;
      console.log('sending a notification');
      notifications.push({
        to: pushToken,
        sound: 'default',
        title: `New message from ${sender.firstName} ${sender.lastName}`,
        body: message.text || '📎 attachment',
      });
    }
  }

  const chunks = expo.chunkPushNotifications(notifications);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error(error);
    }
  }

  return message;
}

async function readMessages(parent, args, context, info) {
  const chat = await Chat.findById(args.chat);
  if (!chat.isPublic && !chat.memberIds.some(id => id.equals(context.session.userId)))
    throw new Error('Unauthorized');
  const messages = await Message.find({ _id: { $in: args.messages } });
  for (const message of messages) {
    if (!message.seenByIds.some(id => id.equals(context.session.userId))) {
      message.seenByIds.push(context.session.userId);
    }
  }
  await Promise.all(messages.map(message => message.save()));
  return messages;
  // // read all chat messages
  // const res = await Message.updateMany(
  //   { senderId: { $ne: context.session.userId }, seenByIds: { $nin: [context.session.userId] } },
  //   { $push: { seenByIds: context.session.userId } }
  // );
  // return res.nModified;
}

async function subscribeToNotifications(parent, args, context, info) {
  const user = await User.findById(context.session.userId);
  user.pushTokens.push(args.pushToken);
  await user.save();
  console.log('subscribed to notifications');
  return true;
}

module.exports = {
  signup,
  login,
  startChat,
  leaveChat,
  addChatMember,
  removeChatMember,
  assignChatAdmin,
  renameChat,
  sendMessage,
  readMessages,
  subscribeToNotifications,
};
