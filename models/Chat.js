const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const mongooseExistsValidator = require('./utils/mongoose-exists-validator');

const { Schema } = mongoose;
const { Types } = Schema;

const chatSchema = new Schema({
  name: {
    type: Types.String,
  },
  link: {
    type: Types.String,
  },
  isPublic: {
    type: Types.Boolean,
    default: false,
  },
  adminIds: [{
    type: Types.ObjectId,
    ref: 'User',
    exists: true,
  }],
  memberIds: [{
    type: Types.ObjectId,
    ref: 'User',
    exists: true,
  }],
}, { timestamps: { createdAt: true, updatedAt: true } });

chatSchema.virtual('members', {
  ref: 'User',
  localField: 'memberIds',
  foreignField: '_id',
});

chatSchema.virtual('admins', {
  ref: 'User',
  localField: 'adminIds',
  foreignField: '_id',
});

chatSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'chatId',
});

chatSchema.plugin(mongooseLeanVirtuals);
chatSchema.plugin(mongooseExistsValidator);

module.exports = mongoose.model('Chat', chatSchema);
