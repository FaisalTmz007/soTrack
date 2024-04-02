const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const createHttpError = require("http-errors");
const morgan = require("morgan");
const axios = require("axios");
const session = require("express-session");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const authRoute = require("./routes/auth/authRoute");
const fbAuthRoute = require("./routes/auth/facebookAuthRoute");
const categoryRoute = require("./routes/filterSettings/category/categoryRoute");
const filterRoute = require("./routes/filterSettings/filter/filterRoute");
const platformRoute = require("./routes/filterSettings/platform/platformRoute");
const dashboardRoute = require("./routes/dashboard/dashboardRoute");
const getNews = require("./controllers/news/getNews");
const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
};

// middlewares
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Passport Facebook
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, done) {
      console.log("🚀 ~ accessToken:", accessToken);
      profile.accessToken = accessToken;
      return done(null, profile);
    }
  )
);

// default route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/news", getNews);

// auth route
app.use(authRoute);
app.use(fbAuthRoute);

// filter settings
app.use(categoryRoute);
app.use(filterRoute);
app.use(platformRoute);
app.use(dashboardRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createHttpError(404));
});

// Automate get news in 24 hours to /news
function makePeriodicRequest() {
  setInterval(async () => {
    try {
      // Make the request to the endpoint
      const response = await axios.get(
        `http://localhost:${process.env.PORT}/news`
      );
      console.log("Periodic request made successfully");
    } catch (error) {
      console.error("Error making periodic request:", error.message);
    }
  }, 1 * 60 * 60 * 1000); // 1 hours in milliseconds
}

makePeriodicRequest();

module.exports = app;
