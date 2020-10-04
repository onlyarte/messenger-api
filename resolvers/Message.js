const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

function sender(parent, args, context, info) {
  return User.findById(parent.senderId).lean();
}

function chat(parent, args, context, info) {
  return Chat.findById(parent.chatId).lean();
}

function isNew(parent, args, context, info) {
  return !(
    parent.senderId.equals(context.session.userId) ||
    parent.seenByIds.some((id) => id.equals(context.session.userId))
  );
}

function offset(parent, args, context, info) {
  return Message.countDocuments({ createdAt: { $gt: parent.createdAt } });
}

module.exports = {
  sender,
  chat,
  isNew,
  offset,
};
