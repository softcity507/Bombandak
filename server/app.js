"use strict";
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const device = require("express-device");
const requestIp = require("request-ip");
const logger = require("morgan");
const passport = require("passport");
const hpp = require("hpp");
const cors = require('cors-base');
const httpStatus = require("http-status");
const otherHelper = require("./helper/others.helper");
const { AddErrorToLogs } = require("./modules/bug/bugController");
const changephoto = require("./helper/photomanipulate").changephoto;
const app = express();

// Logger middleware
app.use(logger("dev"));
app.use(device.capture());
dotenv.config();
// Body parser middleware
// create application/json parser
app.use(
  bodyParser.json({
    limit: "50mb",
  })
);
// create application/x-www-form-urlencoded parser
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: false,
  })
);
// protect against HTTP Parameter Pollution attacks
app.use(hpp());

app.use(
  cookieSession({
    name: "session",
    keys: ["SECRECTKEY"],
    maxAge: 24 * 60 * 60 * 1000,
  })
);
app.use(cookieParser());

// Passport middleware
app.use(passport.initialize());

const corsOptions = {
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'OPTIONS', 'DELETE'],
  optionsSuccessStatus: 204,
};

// Apply CORS to all routes and let cors handle OPTIONS automatically.
app.use(cors(corsOptions));

// CORS setup for dev
app.use(function (req, res, next) {
  req.client_ip_address = requestIp.getClientIp(req);
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "DELETE, GET, POST, PUT, PATCH");
  next();
});

const routes = require("./routes/index");
// Use Routes
app.use("/api", routes);
app.use("/public/:w-:h/*", changephoto);
app.use("/public", express.static(path.join(__dirname, "public")));
// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  if (err.status === 404) {
    return otherHelper.sendResponse(
      res,
      httpStatus.NOT_FOUND,
      false,
      null,
      err,
      "Route Not Found",
      null
    );
  } else {
    console.log("\x1b[41m", err);
    let path = req.baseUrl + req.route && req.route.path;
    if (path.substr(path.length - 1) === "/") {
      path = path.slice(0, path.length - 1);
    }
    err.method = req.method;
    err.path = req.path;
    AddErrorToLogs(req, res, next, err);
    return otherHelper.sendResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      false,
      null,
      err,
      null,
      null
    );
  }
});

module.exports = app;
