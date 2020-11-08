const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // hash password
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email'],
    required: [true, 'Please add a email'],
    unique: [true, 'This email already exists'],
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'publisher'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be equal or greater than 8 characters'],
    select: false, // hide password on res output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // - validator only works on save and create
      validator: function (pass) {
        return pass === this.password;
      },
      message: 'Password Confirm field is not same as password',
    },
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordConfirm = undefined;
  next();
});

// userSchema.methods.getSignedjwtToken =

const User = mongoose.model('User', userSchema);

module.exports = User;
