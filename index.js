import express from "express";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import postsRouter from "./routes/posts.js";
import dotenv from "dotenv/config";
import userRouter from "./routes/user.js";
import compression from "compression";
import helmet from "helmet";
import passport from "passport";
import path from "path";
import cors from "cors";
import userController from "./controllers/userController.js";
import { createError } from "http-errors";
import RateLimit from "express-rate-limit";

mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URI;
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

const app = express();
const port = process.env.PORT;
app.use(passport.initialize());

const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20
});

//app.use(limiter);

// compress routes
app.use(compression());

app.use("/public", express.static(path.join(__dirname, "public")));
//app.use(express.static(path.join(__dirname, "images")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());

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

app.listen(port, () => { });
