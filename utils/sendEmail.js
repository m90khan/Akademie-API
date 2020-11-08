const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
    // * activate the less secure app option in gmail account
  });

  const mailOptions = {
    from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_FROM}>`, // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message, // Messageplain text body
    //html
  };

  const info = await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
