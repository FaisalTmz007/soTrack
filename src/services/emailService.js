const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, message, attachment) => {
  // send email here
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: {
      name: "Socialens",
      address: process.env.EMAIL,
    },
    to: email,
    subject: subject,
    html: message,
    attachments: attachment,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};

module.exports = sendEmail;
