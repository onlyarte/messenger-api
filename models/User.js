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
    required: true,
  },
  lastName: {
    type: Types.String,
    required: true,
  },
  isEnabled: {
    type: Types.Boolean,
    default: false,
  },
});

module.exports = mongoose.model('User', userSchema);
