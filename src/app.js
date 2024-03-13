const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const createHttpError = require("http-errors");
const morgan = require("morgan");
const authRoute = require("./routes/auth/authRoute");
const categoryRoute = require("./routes/filterSettings/category/categoryRoute");
const filterRoute = require("./routes/filterSettings/filter/filterRoute");
const authenticate = require("./middlewares/auth/authenticate");
const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// protected route
app.get("/protected", authenticate, (req, res) => {
  res.json({ message: "This is a protected route" });
});

app.use(authRoute);
app.use(categoryRoute);
app.use(filterRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createHttpError(404));
});

module.exports = app;
