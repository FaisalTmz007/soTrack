const { appRouter } = require("../index");
// const {
//   FacebookAuthController,
// } = require("../../controllers/auth/facebook/index");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const passport = require("passport");
const axios = require("axios");

//middleware
const isLoggedIn = (req, res, next) => {
  if (req.cookies.facebook_access_token) {
    next();
  } else {
    res.status(401).send("Not Logged In");
  }
};

appRouter.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: [
      "email",
      "read_insights",
      "publish_video",
      "pages_show_list",
      "ads_management",
      "ads_read",
      "business_management",
      "instagram_basic",
      "instagram_manage_comments",
      "instagram_content_publish",
      "pages_read_engagement",
      "pages_manage_metadata",
      "pages_read_user_content",
      "pages_manage_ads",
      "pages_manage_posts",
      "pages_manage_engagement",
      "public_profile",
    ],
    authType: "reauthenticate",
    authNonce: "nonce",
  })
);

appRouter.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/auth/facebook/error",
  }),
  function (req, res) {
    // Successful authentication, redirect to success screen.
    const accessToken = req.user.accessToken;
    console.log("🚀 ~ access_token:", accessToken);
    res
      .cookie("facebook_access_token", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .redirect(`${process.env.FRONTEND_URL}/dashboard`); // ini harusnya redirect ke dashboard
  }
);

appRouter.get("/auth/facebook/success", isLoggedIn, async (req, res) => {
  const userInfo = {
    id: req.session.passport.user.id,
  };
  res.send(userInfo);
});

appRouter.get("/auth/facebook/error", (req, res) => {
  res.send("User with this email is not registered in Socialens.");
});

appRouter.get("/auth/facebook/signout", async (req, res) => {
  try {
    const user = req.user;

    await prisma.User.update({
      where: {
        id: user.id,
      },
      data: {
        facebook_id: null,
      },
    });

    // const page_list = await axios.get(
    //   `https://graph.facebook.com/v11.0/me/accounts`,
    //   {
    //     params: {
    //       fields: "id,name,access_token,instagram_business_account",
    //       access_token: user.accessToken,
    //     },
    //   }
    // );

    // const pages = page_list.data.data;
    // console.log("🚀 ~ appRouter.get ~ pages:", pages);

    // await Promise.all(
    //   pages.map(async (page) => {
    //     const igUsername = await axios.get(
    //       `https://graph.facebook.com/v11.0/${page.instagram_business_account.id}`,
    //       {
    //         params: {
    //           fields: "username",
    //           access_token: user.accessToken,
    //         },
    //       }
    //     );
    //     await prisma.filter.delete({
    //       where: {
    //         OR: [{ name: page.name }, { name: igUsername.data.username }],
    //       },
    //     });
    //   })
    // );

    console.log("🚀 ~ user:", user);
    req.session.destroy(function (err) {
      console.log("session destroyed.");
    });
    res
      .clearCookie("facebook_access_token")
      .clearCookie("connect.sid")
      .send("Logged out successfully");
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// appRouter.get(
//   "/auth/facebook",
//   FacebookAuthController.controllers.facebookAuth
// );

// appRouter.get(
//   "/auth/facebook/callback",
//   FacebookAuthController.controllers.facebookCallback
// );

// appRouter.get(
//   "/auth/failed",
//   FacebookAuthController.controllers.facebookAuthFailed
// );

// appRouter.get(
//   "/facebook/logout",
//   FacebookAuthController.controllers.facebookLogout
// );

module.exports = appRouter;
