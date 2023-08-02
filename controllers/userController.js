import asyncHandler from "express-async-handler";
import User from "../models/user";

// post

exports.add_friend = asyncHandler(async (req, res, next) => {
  // add friend buttons needs to have the facebookid
  const currentUser = req.params.facebookid;
  const friendId = req.params.friendid;

  const currentUserDBId = await User.findOne({
    facebook_id: currentUser
  }).exec();
  const friendDBId = await User.findOne({ facebook_id: friendId }).exec();

  if (!currentUserDBId || !friendDBId) {
    const err = new Error("User not found");
    return res.status(404).json({ message: err });
  } else {
    const [updateUser, updateFriend] = await Promise.all([
      User.findByIdAndUpdate(currentUserDBId._id, {
        $push: { requests_sent: friendDBId._id }
      }).exec(),
      User.findByIdAndUpdate(friendDBId._id, {
        $push: { requests_received: currentUserDBId._id }
      }).exec()
    ]);
    return res.status(201).json({ message: "friend request sent" });
  }
});

// post
exports.remove_friend = asyncHandler(async (req, res, next) => {
  const currentUser = req.params.facebookid;
  const friendId = req.params.friendid;

  const currentUserDBId = await User.findOne({
    facebook_id: currentUser
  }).exec();
  const friendDBId = await User.findOne({ facebook_id: friendId }).exec();

  if (!currentUserDBId || !friendDBId) {
    const err = new Error("User not found");
    return res.status(404).json({ message: err });
  } else {
    const [updateUser, updateFriend] = await Promise.all([
      User.findByIdAndUpdate(currentUserDBId._id, {
        $pull: { friends: friendDBId._id }
      }).exec(),
      User.findByIdAndUpdate(friendDBId._id, {
        $pull: { friends: currentUserDBId._id }
      }).exec()
    ]);
    return res.status(201).json({ message: "friend removed" });
  }
});

// post
exports.accept_friend_request = asyncHandler(async (req, res, next) => {
  const currentUser = req.params.facebookid;
  const friendId = req.params.friendid;

  const currentUserDBId = await User.findOne({
    facebook_id: currentUser
  }).exec();
  const friendDBId = await User.findOne({ facebook_id: friendId }).exec();

  if (!currentUserDBId || !friendDBId) {
    const err = new Error("User not found");
    return res.status(404).json({ message: err });
  } else {
    const [updateUser, updateFriend] = await Promise.all([
      User.findByIdAndUpdate(currentUserDBId._id, {
        $pull: { requests_sent: friendDBId._id },
        $push: { friends: friendDBId._id }
      }).exec(),
      User.findByIdAndUpdate(friendDBId._id, {
        $pull: { requests_received: currentUserDBId._id },
        $push: { friends: friendDBId._id }
      }).exec()
    ]);
    return res.status(201).json({ message: "friend accepted" });
  }
});
