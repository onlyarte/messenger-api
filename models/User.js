const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types } = Schema;

const userSchema = new Schema({
  username: {
    type: Types.String,
    required: true,
  },
  password: {
    type: Types.String,
    required: true,
  },
  firstName: {
    type: Types.String,
  },
  lastName: {
    type: Types.String,
  },
  isEnabled: {
    type: Types.Boolean,
    default: false,
  },
  pushTokens: {
    type: [Types.String],
    default: [],
  },
});

module.exports = mongoose.model('User', userSchema);
