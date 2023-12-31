import mongoose from "mongoose";
import { DateTime } from "luxon";
const Schema = mongoose.Schema;

const opts = { toJSON: { virtuals: true } };
const UserSchema = new Schema(
  {
    facebook_id: { type: String, required: true },
    display_name: { type: String, required: true },
    profile_pic: { type: String },
    birthday: { type: Date },
    gender: {
      type: String,
      enum: ["female", "male", "other", ""],
      default: ""
    },
    country: { type: Schema.Types.ObjectId, ref: "Country" },
    date_joined: { type: Date, default: Date.now },
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    requests_sent: [{ type: Schema.Types.ObjectId, ref: "User" }],
    requests_received: [{ type: Schema.Types.ObjectId, ref: "User" }],
    guest: { type: Boolean, default: false },
    password: { type: String }
  },
  opts
);

UserSchema.virtual("joined").get(function() {
  return DateTime.fromJSDate(this.date_joined)
    .setLocale("en-gb")
    .toLocaleString(DateTime.DATE_SHORT);
});

UserSchema.virtual("date_birthday").get(function() {
  return DateTime.fromJSDate(this.birthday)
    .setLocale("en-gb")
    .toLocaleString(DateTime.DATE_SHORT);
});

module.exports = mongoose.model("User", UserSchema);
