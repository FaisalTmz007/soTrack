const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const session = require("express-session");
const axios = require("axios");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const authRoute = require("./routes/auth/authRoute");
const facebookAuthRoute = require("./routes/auth/facebookAuthRoute");
const categoryRoute = require("./routes/filterSettings/category/categoryRoute");
const filterRoute = require("./routes/filterSettings/filter/filterRoute");
const platformRoute = require("./routes/filterSettings/platform/platformRoute");
const dashboardRoute = require("./routes/dashboard/dashboardRoute");
const timelineRoute = require("./routes/timeline/timelineRoute");
const broadcastRoute = require("./routes/broadcast/broadcastRoute");
const publicReportRoute = require("./routes/publicReport/publicReportRoute");
const facebookRoute = require("./routes/posts/facebook/facebookRoute");
const instagramRoute = require("./routes/posts/instagram/instagramRoute");
const getNews = require("./controllers/posts/news/getNews");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
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
    // cookie: { maxAge: 2 * 30 * 24 * 60 * 60 * 1000 }, // 2 months
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

app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? process.env.FACEBOOK_CALLBACK_URL_PROD
          : process.env.FACEBOOK_CALLBACK_URL_DEV,
      profileFields: ["id", "emails", "name"],
    },
    async function (accessToken, refreshToken, profile, cb) {
      console.log(profile.emails[0].value);

      const user = await prisma.User.findUnique({
        where: {
          facebook_id: profile.id,
        },
      });
      if (!user) {
        console.log("Adding new facebook user to DB..");
        const userExist = await prisma.User.findUnique({
          where: {
            email: profile.emails[0].value,
          },
        });

        if (!userExist) {
          // Redirect to error route with message
          return cb(null, false);
        }

        const newUser = await prisma.User.update({
          where: {
            email: profile.emails[0].value,
          },
          data: {
            facebook_id: profile.id,
          },
        });

        // Attach accessToken to the user object
        newUser.accessToken = accessToken;
        return cb(null, newUser);
      } else {
        console.log("Facebook User already exist in DB..");
        // Attach accessToken to the user object
        user.accessToken = accessToken;
        return cb(null, user);
      }
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
app.use(facebookAuthRoute);

// filter settings
app.use(categoryRoute);
app.use(filterRoute);
app.use(platformRoute);
app.use(dashboardRoute);
app.use(timelineRoute);
app.use(publicReportRoute);

// sosmed route
app.use(facebookRoute);
app.use(instagramRoute);

// broadcast route
app.use(broadcastRoute);

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
