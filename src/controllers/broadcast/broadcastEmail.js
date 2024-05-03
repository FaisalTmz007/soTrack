const sendEmail = require("../../services/emailService");

const broadcastEmail = async (req, res) => {
  try {
    const { email, subject, message } = req.body;
    const files = req.files;

    await sendEmail(email, subject, message, files);

    res.json({
      message: "Email has been sent",
      statusCode: 200,
      data: {
        to: email,
        subject,
        message,
        attachments: files.map((file) => file.filename),
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = broadcastEmail;
