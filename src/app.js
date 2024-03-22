const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const createHttpError = require("http-errors");
const morgan = require("morgan");
const authRoute = require("./routes/auth/authRoute");
const categoryRoute = require("./routes/filterSettings/category/categoryRoute");
const filterRoute = require("./routes/filterSettings/filter/filterRoute");
const platformRoute = require("./routes/filterSettings/platform/platformRoute");
// const getNews = require("./controllers/news/getNews");
const axios = require("axios");
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

// default route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// auth route
app.use(authRoute);

// filter settings
app.use(categoryRoute);
app.use(filterRoute);
app.use(platformRoute);
// app.get("/news", getNews);

// Automate get news in 24 hours to /news
// function makePeriodicRequest() {
//   setInterval(async () => {
//     try {
//       // Make the request to the endpoint
//       const response = await axios.get("http://localhost:3000/news");
//       console.log("Periodic request made successfully");
//     } catch (error) {
//       console.error("Error making periodic request:", error.message);
//     }
//   }, 1 * 60 * 60 * 1000); // 1 hours in milliseconds
// }

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createHttpError(404));
});

// makePeriodicRequest();

module.exports = app;
