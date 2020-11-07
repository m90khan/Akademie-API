const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const port = process.env.PORT || 5000;

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
const app = require('./app');

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then((conn) => {
    console.log(`DB connected: listening port: ${port}`.bgYellow.bold.black);
  });

const server = app.listen(port);

// unhandled rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  //close server and exit process
  server.close(() => process.exit());
});
