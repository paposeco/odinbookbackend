import mongoose from "mongoose";
import { DateTime } from "luxon";
import User from "./user";
const Schema = mongoose.Schema;

const BirthdaySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  birthday: { type: Date, required: true },
});

BirthdaySchema.virtual("date_of_birth").get(function() {
  return DateTime.fromJSDate(this.birthday)
    .setLocale("en-gb")
    .toLocaleString(DateTime.DATETIME_SHORT);
});

module.exports = mongoose.model("Birthday", BirthdaySchema);
