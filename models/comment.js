import mongoose from "mongoose";
import User from "./user";
import Post from "./post";
import { DateTime } from "luxon";
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  comment_content: { type: String, required: true },
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  date: { type: Date, default: Date.now },
});

CommentSchema.virtual("comment_date").get(function() {
  return DateTime.fromJSDate(this.date)
    .setLocale("en-gb")
    .toLocaleString(DateTime.DATETIME_SHORT);
});

module.exports = mongoose.model("Comment", CommentSchema);
