const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

function title(parent, args, context, info) {
  return 'Rimé Messenger';
}

function me(parent, args, context, info) {
  return User.findById(context.session.userId);
}

function users(parent, args, context, info) {
  return User.find({
    $expr: {
      $or: [
        { $regexMatch: { input: { $concat: ['$firstName', '$lastName'] }, regex: args.query, options: 'ix' } },
        { $regexMatch: { input: '$username', regex: args.query, options: 'ix' } },
      ],
    },
  }).lean();
}

async function chat(parent, args, context, info) {
  const chat = args.id
    ? await Chat.findById(args.id).lean()
    : await Chat.findOne({ link: args.link }).lean();
  if (chat.isPublic || chat.memberIds.some(id => id.equals(context.session.userId)))
    return chat;
  else
    throw new Error('Unauthorized');
}

async function chats(parent, args, context, info) {
  return Chat.find({
    memberIds: { $elemMatch: { $eq: context.session.userId } },
  }).sort({ updatedAt: -1 });
}

async function message(parent, args, context, info) {
  const message = await Message.findById(args.id).lean();
  const chat = await Chat.findById(message.chatId).lean();
  if (chat.isPublic || chat.memberIds.some(id => id.equals(context.session.userId)))
    return message;
  else
    throw new Error('Unauthorized');
}

async function messages(parent, args, context, info) {
  const chat = await Chat.findById(args.chat).lean();
  if (!chat.isPublic && !chat.memberIds.some(id => id.equals(context.session.userId)))
    throw new Error('Unauthorized');
  const match = { chatId: args.chat };
  if (args.search) match.text = new RegExp(args.search, 'i');
  return Message.find(match)
    .sort({ createdAt: -1 })
    .skip(args.offset)
    .limit(args.limit)
    .lean();
}

module.exports = {
  title,
  me,
  users,
  chat,
  chats,
  message,
  messages,
};
