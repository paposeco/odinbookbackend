import mongoose from "mongoose";
import User from "./user";
import Comment from "./comment";
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  post_content: { type: String, required: true },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  date: { type: Date, default: Date.now },
});

PostSchema.virtual("post_date").get(function() {
  return DateTime.fromJSDate(this.date)
    .setLocale("en-gb")
    .toLocaleString(DateTime.DATETIME_SHORT);
});

module.exports = mongoose.model("Post", PostSchema);
