import mongoose from "mongoose";
import User from "./user";
import Birthday from "./birthday";

const Schema = mongoose.Schema;

const FriendNetworkSchema = new Schema({
  facebookid: { type: string, required: true },
});

module.exports = mongoose.model("FriendNetwork", FriendNetworkSchema);
