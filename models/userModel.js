const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // hash password
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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
    minlength: [6, 'Password must be equal or greater than 8 characters'],
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
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordConfirm = undefined;
  next();
});

// statics are called on model and methods are for instant
// JWT TOKEN. using method
userSchema.methods.getSignedjwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// match user entered password to the password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
// Generate reset password token
userSchema.methods.createPasswordResetToken = function () {
  // generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken) // stored value
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; //15 minutes
  console.log({ resetToken }, this.resetPasswordToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
