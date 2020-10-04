const User = require('../models/User');
const Message = require('../models/Message');

async function name(parent, args, context, info) {
  if (parent.name) return parent.name;
  const members = await User.find({ _id: { $in: parent.memberIds } }).lean();
  const otherMembers = members.filter(member => !member._id.equals(context.session.userId));
  return (
    otherMembers.length > 0 ? otherMembers : members
  ).map(member => `${member.firstName} ${member.lastName}`).join(', ');
}

function members(parent, args, context, info) {
  return User.find({ _id: { $in: parent.memberIds } }).lean();
}

function admins(parent, args, context, info) {
  return User.find({ _id: { $in: parent.adminIds } }).lean();
}

function messages(parent, args, context, info) {
  const match = { chatId: parent._id };
  if (args.search) match.text = new RegExp(args.search, 'i');
  return Message.find(match)
    .sort({ createdAt: -1 })
    .skip(args.offset)
    .limit(args.limit)
    .lean();
}

function lastMessage(parent, args, context, info) {
  return Message.findOne({ chatId: parent._id }).sort({ createdAt: -1 }).lean();
}

module.exports = {
  name,
  members,
  admins,
  messages,
  lastMessage,
};
