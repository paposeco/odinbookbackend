import mongoose from "mongoose";
import { DateTime } from "luxon";
const Schema = mongoose.Schema;

const opts = { toJSON: { virtuals: true } };
const PostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post_content: { type: String, required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    date: { type: Date, default: Date.now },
    post_image: { type: String }
  },
  opts
);

PostSchema.virtual("post_date").get(function() {
  return DateTime.fromJSDate(this.date)
    .setLocale("en-gb")
    .toLocaleString(DateTime.DATETIME_SHORT);
});

PostSchema.virtual("like_counter").get(function() {
  return this.likes.length;
});

module.exports = mongoose.model("Post", PostSchema);
