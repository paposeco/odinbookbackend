import mongoose from "mongoose";
import { DateTime } from "luxon";
import Post from "./post";
import Birthday from "./birthday";
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  facebook_id: { type: String, required: true },
  display_name: { type: String, required: true },
  profile_pic: { type: String },
  birthday: { type: String },
  gender: { type: String },
  country: { type: Schema.Types.ObjectId, ref: "Country" },
  significant_other: { type: Schema.Types.ObjectId, ref: "User" },
  date_joined: { type: Date, default: Date.now },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
  requests_sent: [{ type: Schema.Types.ObjectId, ref: "User" }],
  requests_received: [{ type: Schema.Types.ObjectId, ref: "User" }],
  friends_birthdays: [{ type: Schema.Types.ObjectId, ref: "Birthday" }],
});

UserSchema.virtual("joined").get(function() {
  return DateTime.fromJSDate(this.date_joined)
    .setLocale("en-gb")
    .toLocaleString(DateTime.DATETIME_SHORT);
});

module.exports = mongoose.model("User", UserSchema);
