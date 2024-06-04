const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const sendEmail = async (email, subject, message, files) => {
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
    html: `
    <div style="text-align: center;">
      <img src="cid:socialensLogo" alt="Socialens Logo" style="width: 480px;"/>
    </div>
    <br/><br/>
    ${message}
  `,
    attachments: [],
  };

  // Attach the logo image
  const socialensLogoPath = path.join(
    __dirname,
    "../../public/assets/socialens_logo.png"
  );
  const socialensLogoContent = fs.readFileSync(socialensLogoPath);
  mailOptions.attachments.push({
    filename: "socialens_logo.png",
    content: socialensLogoContent,
    encoding: "base64",
    cid: "socialensLogo",
  });

  // Attach additional files from request
  if (files && files.length > 0) {
    files.forEach((file) => {
      const filePath = path.join(
        __dirname,
        "../../public/uploads/",
        file.filename
      );
      const fileContent = fs.readFileSync(filePath);
      mailOptions.attachments.push({
        filename: file.filename,
        content: fileContent,
      });
    });
  }

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
