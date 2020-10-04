const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const mongooseExistsValidator = require('./utils/mongoose-exists-validator');

const { Schema } = mongoose;
const { Types } = Schema;

const messageSchema = new Schema({
  senderId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    exists: true,
  },
  chatId: {
    type: Types.ObjectId,
    ref: 'Chat',
    required: true,
    exists: true,
  },
  text: {
    type: Types.String,
    required: true,
  },
  seenByIds: [{
    type: Types.ObjectId,
    ref: 'User',
    exists: true,
  }],
}, { timestamps: { createdAt: true } });

messageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true,
});

messageSchema.virtual('chat', {
  ref: 'Chat',
  localField: 'chatId',
  foreignField: '_id',
  justOne: true,
});

messageSchema.virtual('seenBy', {
  ref: 'User',
  localField: 'seenByIds',
  foreignField: '_id',
});

messageSchema.plugin(mongooseLeanVirtuals);
messageSchema.plugin(mongooseExistsValidator);

module.exports = mongoose.model('Message', messageSchema);
