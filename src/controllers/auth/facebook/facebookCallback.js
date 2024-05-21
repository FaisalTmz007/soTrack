const axios = require("axios");

const facebookCallback = async (req, res) => {
  const { code } = req.query;
  // console.log("🚀 ~ router.get ~ code:", code);

  try {
    // Exchange authorization code for access token
    const { data } = await axios.get(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}&redirect_uri=${process.env.FACEBOOK_CALLBACK_URL_DEV}`
    );

    const { access_token } = data;

    // Use access_token to fetch user profile
    const { data: profile } = await axios.get(
      `https://graph.facebook.com/v19.0/me?fields=name,email&access_token=${access_token}`
    );
    // console.log("🚀 ~ appRouter.get ~ profile:", profile);

    // Code to handle user authentication and retrieval using the profile data

    res
      .cookie("facebook_access_token", access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .redirect(`${process.env.FRONTEND_URL}/dashboard`);
    // .redirect("/profile");
  } catch (error) {
    console.error("Error:", error.response.data.error);
    res.redirect("/");
  }
};

module.exports = facebookCallback;
