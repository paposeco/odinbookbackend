import express from "express";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import postsRouter from "./routes/posts.js";
import dotenv from "dotenv/config";
import userRouter from "./routes/user.js";
import passport from "passport";
import path from "path";
import cors from "cors";
import userController from "./controllers/userController.js";
import { createError } from "http-errors";
// import multer from "multer";

// exports.uploadPhoto = multer({ dest: "images/" });

mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URI;
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

const app = express();
const port = process.env.PORT;
app.use(passport.initialize());

app.use("/images", express.static("./images"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Origin,Content-Type,Accept,Authorization"
};

app.use(cors(corsOptions));

// router

app.use("/", authRouter);
app.use("/", postsRouter);
app.use("/", userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.listen(port, () => {
  console.log("Listening on " + port);
});
