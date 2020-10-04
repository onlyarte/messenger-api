const Chat = require('../models/Chat');

function fullName(parent, args, context, info) {
  return `${parent.firstName} ${parent.lastName}`;
}

function chats(parent, args, context, info) {
  if (!parent._id.equals(context.session.userId))
    throw new Error('Unauthorized');
  return Chat.find({ memberIds: { $elemMatch: { $eq: parent._id } } }).sort({ updatedAt: -1 }).lean();
}

module.exports = {
  fullName,
  chats,
};
