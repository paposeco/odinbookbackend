import mongoose from "mongoose";
import User from "./user";
import Birthday from "./birthday";

const Schema = mongoose.Schema;

const FriendNetworkSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
  requests_sent: [{ type: Schema.Types.ObjectId, ref: "User" }],
  requests_received: [{ type: Schema.Types.ObjectId, ref: "User" }],
  birthdays: [{ type: Schema.Types.ObjectId, ref: "Birthday" }],
});

module.exports = mongoose.model("FriendNetwork", FriendNetworkSchema);
