const nodemailer = require("nodemailer");

const sendOTPEmail = (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: "info@sotrack.mail",
    to: email,
    subject: "One Time Password",
    text: `Your OTP is ${otp}`,
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

module.exports = sendOTPEmail;
