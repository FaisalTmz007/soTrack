const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const authRoute = require("./routes/auth/authRoute");
const authenticate = require("./middlewares/auth/authenticate");
const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// protected route
app.get("/protected", authenticate, (req, res) => {
  res.json({ message: "This is a protected route" });
});

app.use(authRoute);

module.exports = app;
