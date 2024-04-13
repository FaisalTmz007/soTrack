function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/auth/facebook");
  }
}

module.exports = isLoggedIn;
