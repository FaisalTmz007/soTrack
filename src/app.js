const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const createHttpError = require("http-errors");
const morgan = require("morgan");
const authRoute = require("./routes/auth/authRoute");
const categoryRoute = require("./routes/filterSettings/category/categoryRoute");
const filterRoute = require("./routes/filterSettings/filter/filterRoute");
const platformRoute = require("./routes/filterSettings/platform/platformRoute");
const dashboardRoute = require("./routes/dashboard/dashboardRoute");
const makePeriodicRequest = require("./utils/news-scraping/getAllNews");
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
app.use(dashboardRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createHttpError(404));
});

makePeriodicRequest();

module.exports = app;
