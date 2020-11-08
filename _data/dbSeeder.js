const fs = require('fs');

const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');
dotenv.config();
const Camp = require('../models/campModel');
const Course = require('../models/courseModel');
const User = require('../models/userModel');

const bootCamps = JSON.parse(fs.readFileSync(`${__dirname}/bootcamps.json`, 'utf8'));
const courses = JSON.parse(fs.readFileSync(`${__dirname}/courses.json`, 'utf8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf8'));
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then((conn) => {
    console.log(`DB connected: listening  `.bgYellow.bold.black);
  });

const importData = async () => {
  try {
    await Camp.create(bootCamps);
    await Course.create(courses);
    await User.create(users);
    console.log(`Data Loaded Successfully`.green.inverse);
  } catch (e) {
    console.log(e);
  }
  process.exit();
};
const deleteData = async () => {
  try {
    await Camp.deleteMany();
    await Course.deleteMany();
    await User.deleteMany();
    console.log('Data Deleted Successfully'.red.inverse);
  } catch (e) {
    console.log(e);
  }
  process.exit();
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// node ./_data/dbSeeder.js --import
