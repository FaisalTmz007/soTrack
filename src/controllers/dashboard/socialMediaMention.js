const axios = require("axios");

const socialMediaMention = async (req, res) => {
  try {
    const token = req.cookies.facebook_access_token;

    if (!token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid access token",
      });
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = socialMediaMention;
