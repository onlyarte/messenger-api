const { withFilter }  = require('graphql-yoga');
const Chat = require('../models/Chat');

const newChat = {
  subscribe: withFilter(
    (payload, args, context, info) => {
      return context.pubsub.asyncIterator('new chat');
    },
    (payload, args, context, info) => {
      return payload.newChat.memberIds.some(id => id.equals(context.session.userId));
    },
  ),
};

const joinedChat = {
  subscribe: withFilter(
    (payload, args, context, info) => {
      return context.pubsub.asyncIterator('joined chat');
    },
    (payload, args, context, info) => {
      return payload.joinedChat.member._id.equals(context.session.userId);
    },
  ),
};

const leftChat = {
  subscribe: withFilter(
    (payload, args, context, info) => {
      return context.pubsub.asyncIterator('left chat');
    },
    (payload, args, context, info) => {
      return payload.leftChat.member._id.equals(context.session.userId) &&
        (!args.chat || payload.leftChat.chat._id.toString() === args.chat);
    },
  ),
};

const newMessage = {
  subscribe: withFilter(
    (payload, args, context, info) => {
      return context.pubsub.asyncIterator('new message');
    },
    async (payload, args, context, info) => {
      if (args.chat) {
        const chat = await Chat.findById(args.chat);
        return (
          payload.newMessage.chatId.toString() === args.chat &&
          chat.memberIds.some(id => id.equals(context.session.userId))
        );
      } else {
        const chat = await Chat.findById(payload.newMessage.chatId);
        return chat.memberIds.some(id => id.equals(context.session.userId));
      }
    },
  ),
};

module.exports = {
  newChat,
  joinedChat,
  leftChat,
  newMessage,
};
