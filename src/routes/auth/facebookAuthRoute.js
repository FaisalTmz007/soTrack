const { appRouter } = require("../index");
const passport = require("passport");
const isLoggedIn = require("../../middlewares/auth/facebookAuth");

appRouter.get("/auth/facebook", passport.authenticate("facebook"));

appRouter.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/auth/failed" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/profile");
  }
);

appRouter.get("/auth/failed", function (req, res) {
  res.send("Failed attempt");
});

appRouter.get("/profile", isLoggedIn, function (req, res) {
  // Send user data and access token to the profile page
  res.json({
    message: "Logged in successfully",
    statusCode: 200,
    data: {
      user: req.user,
      faebook_user_id: req.user.id,
      access_token: req.user.accessToken,
    },
  });
});

module.exports = appRouter;
