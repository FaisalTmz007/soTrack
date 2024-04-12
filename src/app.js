const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const axios = require("axios");
const session = require("express-session");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const authRoute = require("./routes/auth/authRoute");
const facebookAuthRoute = require("./routes/auth/facebookAuthRoute");
const categoryRoute = require("./routes/filterSettings/category/categoryRoute");
const filterRoute = require("./routes/filterSettings/filter/filterRoute");
const platformRoute = require("./routes/filterSettings/platform/platformRoute");
const dashboardRoute = require("./routes/dashboard/dashboardRoute");
const facebookRoute = require("./routes/posts/facebook/facebookRoute");
const instagramRoute = require("./routes/posts/instagram/instagramRoute");
const getNews = require("./controllers/news/getNews");
const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
};

// middlewares
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
    cookie: { maxAge: 2 * 30 * 24 * 60 * 60 * 1000 }, // 2 months
  })
);

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
    cookie: { maxAge: 2 * 30 * 24 * 60 * 60 * 1000 }, // 2 months
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

if (process.env.NODE_ENV === "production") {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL_PROD,
      },
      function (accessToken, refreshToken, profile, done) {
        console.log("🚀 ~ accessToken:", accessToken);
        profile.accessToken = accessToken;
        return done(null, profile);
      }
    )
  );
} else {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL_DEV,
      },
      function (accessToken, refreshToken, profile, done) {
        console.log("🚀 ~ accessToken:", accessToken);
        profile.accessToken = accessToken;
        return done(null, profile);
      }
    )
  );
}

// default route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/news", getNews);

// auth route
app.use(authRoute);
app.use(facebookAuthRoute);

// filter settings
app.use(categoryRoute);
app.use(filterRoute);
app.use(platformRoute);
app.use(dashboardRoute);

// sosmed route
app.use(facebookRoute);
app.use(instagramRoute);

// catch 404 and forward to error handler
app.use(function (req, res) {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.url}`,
    statusCode: 404,
  });
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
