import mongoose from "mongoose";
import User from "./user";
import Country from " ./country";
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  display_name: { type: String, required: true },
  profilepic: { type: String },
  country: { type: Schema.Types.ObjectId, ref: "Country" },
  significant_other: { type: Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Profile", ProfileSchema);
