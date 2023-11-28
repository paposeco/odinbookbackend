import asyncHandler from "express-async-handler";
import User from "../models/user";
import Post from "../models/post";
import Country from "../models/country";
import { body, validationResult } from "express-validator";
import { unlink } from "node:fs";
import path from "path";
import { DateTime } from "luxon";
import postsController from "./postsController";

exports.check_friend_status = async function(req, res, next) {
  const currentUser = req.params.facebookid;
  const friendId = req.params.friendid;

  try {
    const currentUserDBId = await User.findOne({
      facebook_id: currentUser
    }).exec();
    const friendDBId = await User.findOne({
      facebook_id: friendId
    }).exec();

    const friends = currentUserDBId.friends.includes(friendDBId);
    if (friends) {
      return res.status(201).json({ friends: true, requestsent: false });
    } else {
      const friendrequestsentexists =
        currentUserDBId.requests_sent.includes(friendDBId);
      const friendrequestreceivedexists =
        currentUserDBId.requests_received.includes(friendDBId);
      return res.status(201).json({
        friends: false,
        requestsent: friendrequestsentexists,
        requestreceived: friendrequestreceivedexists
      });
    }
  } catch (err) {
    return res.status(404).json({ err });
  }
};

exports.add_friend = asyncHandler(async (req, res, next) => {
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
      User.findByIdAndUpdate(currentUserDBId, {
        $push: { requests_sent: friendDBId }
      }).exec(),
      User.findByIdAndUpdate(friendDBId, {
        $push: { requests_received: currentUserDBId }
      }).exec()
    ]);
    return res.status(201).json({ message: "friend request sent" });
  }
});

exports.remove_friend = async function(req, res, next) {
  const currentUser = req.params.facebookid;
  const friendId = req.params.friendid;

  try {
    const currentUserDBId = await User.findOne({
      facebook_id: currentUser
    }).exec();
    const friendDBId = await User.findOne({ facebook_id: friendId }).exec();
    if (!currentUserDBId || !friendDBId) {
      const err = new Error("User not found");
      return res.status(404).json({ message: err });
    } else {
      await User.findByIdAndUpdate(currentUserDBId, {
        $pull: { friends: friendDBId }
      }).exec();

      await User.findByIdAndUpdate(friendDBId, {
        $pull: { friends: currentUserDBId }
      }).exec();

      return res.status(201).json({ message: "friend removed" });
    }
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};

exports.accept_friend_request = async function(req, res, next) {
  const currentUser = req.params.facebookid;
  const friendId = req.params.friendid;
  try {
    const currentUserDBId = await User.findOne({
      facebook_id: currentUser
    }).exec();
    const friendDBId = await User.findOne({ facebook_id: friendId }).exec();

    if (!currentUserDBId || !friendDBId) {
      const err = new Error("User not found");
      return res.status(404).json({ message: err });
    } else {
      currentUserDBId.friends.push(friendDBId);
      await currentUserDBId.save();
      friendDBId.friends.push(currentUserDBId);
      await friendDBId.save();
      if (currentUserDBId.requests_received.includes(friendDBId)) {
        // remove from requests received on current user and remove from requests sent from friend
        currentUserDBId.requests_received.pull(friendDBId);
        await currentUserDBId.save();
        friendDBId.requests_sent.pull(currentUserDBId);
        await friendDBId.save();
      } else {
        //remove from request received on friend and from requests sent from user
        currentUserDBId.requests_sent.pull(friendDBId);
        await currentUserDBId.save();
        friendDBId.requests_received.pull(currentUserDBId);
        await friendDBId.save();
      }
      return res.status(201).json({ message: "friend accepted" });
    }
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};

exports.get_currentuserprofile = async function(req, res) {
  try {
    const user = await User.findOne({
      facebook_id: req.params.facebookid
    })
      .populate({ path: "country", select: ["country"] })
      .exec();

    const userposts = await Post.find({
      author: user
    })
      .limit(5)
      .sort({ date: -1 })
      .populate({
        path: "author",
        select: ["facebook_id", "display_name", "profile_pic"]
      })
      .populate({
        path: "comments",
        select: ["comment_content", "date"],
        populate: {
          path: "author",
          select: ["facebook_id", "display_name", "profile_pic"]
        }
      })
      .populate({ path: "likes", select: ["facebook_id", "display_name"] })
      .exec();

    const decodedPosts = postsController.multiplePostDecoder(userposts);
    if (!user) {
      return res.status(404).json({ message: "user not found ?" });
    } else {
      return res.status(201).json({ user, userposts: decodedPosts });
    }
  } catch (err) {
    return res.status(404).json({ message: "db error" });
  }
};

exports.get_userprofile = async function(req, res) {
  try {
    const otherUser = await User.findOne({ facebook_id: req.params.userid })
      .populate({ path: "country", select: ["country"] })
      .exec();

    if (!otherUser) {
      return res.status(404).json({ message: "user not found" });
    }
    const currentUser = await User.findOne({
      facebook_id: req.params.facebookid,
      friends: { _id: otherUser._id }
    }).exec();

    if (!currentUser) {
      // not friends, can't see everything
      return res.status(201).json({
        display_name: otherUser.display_name,
        facebook_id: otherUser.facebook_id,
        profile_pic: otherUser.profile_pic
      });
    } else {
      //friends, can see everything
      const otherUserPosts = await Post.find({ author: otherUser._id })
        .limit(10)
        .sort({ date: -1 })
        .populate({
          path: "author",
          select: ["facebook_id", "display_name", "profile_pic"]
        })
        .populate({
          path: "comments",
          select: ["comment_content", "date"],
          populate: {
            path: "author",
            select: ["facebook_id", "display_name", "profile_pic"]
          }
        })
        .populate({ path: "likes", select: ["facebook_id", "display_name"] })
        .exec();
      const decodedPosts = postsController.multiplePostDecoder(otherUserPosts);
      return res.status(201).json({
        display_name: otherUser.display_name,
        facebook_id: otherUser.facebook_id,
        profile_pic: otherUser.profile_pic,
        birthday: otherUser.date_birthday,
        country:
          otherUser.country === undefined
            ? undefined
            : otherUser.country.country,
        posts: decodedPosts,
        friends: otherUser.friends.length,
        gender: otherUser.gender
      });
    }
  } catch (err) {
    return res.status(404).json({ message: "user not found" });
  }
};

// list of friends

exports.get_listfriends = async function(req, res) {
  try {
    const user = await User.findOne({ facebook_id: req.params.facebookid })
      .populate({
        path: "friends",
        select: ["facebook_id", "display_name", "profile_pic"]
      })
      .exec();
    return res.status(201).json({ friends: user.friends });
  } catch (err) {
    return res.status(404).json({ message: "couldn't fetch friends" });
  }
};
// list of other users friends

exports.get_friend_listfriends = async function(req, res) {
  try {
    const user = await User.findOne({
      facebook_id: req.params.facebookid
    }).exec();
    const friend = await User.findOne({
      facebook_id: req.params.friendid,
      friends: { _id: user._id }
    })
      .populate({
        path: "friends",
        select: ["facebook_id", "display_name", "profile_pic"]
      })
      .exec();
    if (!friend) {
      return res.status(400).json({
        message:
          "you need to be friends first to be able to see this user's friends' list"
      });
    } else {
      return res.json({ friends: friend.friends });
    }
  } catch (err) {
    return res
      .status(404)
      .json({ message: "couldn't fetch friends' friend list" });
  }
};

// all users

exports.get_users = async function(req, res) {
  try {
    const currentUser = await User.findOne(
      {
        facebook_id: req.params.facebookid
      },
      "requests_sent"
    )
      .populate({ path: "requests_sent", select: ["facebook_id"] })
      .exec();

    const skipNumber = req.params.skip * 20;
    const allUsersNotFriends = await User.find(
      {
        friends: { $nin: [currentUser] },
        _id: { $ne: currentUser }
      },
      "display_name facebook_id profile_pic"
    )
      .limit(20)
      .skip(skipNumber)
      .sort({ date_joined: 1 })
      .exec();

    return res.status(201).json({ allUsersNotFriends, currentUser });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};

const formatDate = function(dbdate) {
  if (!dbdate) {
    return undefined;
  }
  const datearray = dbdate.split("/");
  return `${datearray[2]}-${datearray[1]}-${datearray[0]}`;
};

// send current profile info
exports.get_update_profile = async function(req, res) {
  try {
    const userprofile = await User.findOne(
      { facebook_id: req.params.facebookid },
      "display_name birthday gender country profile_pic requests_received requests_sent friends"
    )
      .populate({ path: "country", select: ["country"] })
      .populate({
        path: "requests_received",
        select: ["display_name", "facebook_id", "profile_pic"]
      })
      .populate({
        path: "requests_sent",
        select: ["display_name", "facebook_id", "profile_pic"]
      })
      .populate({
        path: "friends",
        select: ["facebook_id", "display_name", "profile_pic", "birthday"]
      })
      .exec();
    const formattedbirthday = formatDate(userprofile.date_birthday);
    // only notifies user of today's birthdays
    let friendsbirthdays = [];
    if (userprofile.friends.length > 0) {
      const today = new Date();
      const month = today.getMonth();
      const day = today.getDate();
      userprofile.friends.forEach((friend) => {
        const friendbirthday = friend.birthday;
        if (friendbirthday !== undefined) {
          const friendBMonth = friendbirthday.getMonth();
          const friendBDay = friendbirthday.getDate();
          if (friendBMonth === month && friendBDay === day) {
            friendsbirthdays.push(friend);
          }
        }
      });
    }

    return res.json({
      userprofile: {
        display_name: userprofile.display_name,
        birthday: formattedbirthday,
        gender:
          userprofile.gender === undefined ? undefined : userprofile.gender,
        country:
          userprofile.country === undefined
            ? undefined
            : userprofile.country.country,
        profile_pic: userprofile.profile_pic,
        requests_received: userprofile.requests_received,
        requests_sent: userprofile.requests_sent,
        birthdaystoday: friendsbirthdays
      }
    });
  } catch (err) {
    return res.status(400).json({ message: "something went wrong" });
  }
};

exports.post_update_profile = [
  body("display_name")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Name can't be empty")
    .isLength({ max: 30 })
    .withMessage("Name length can't exceed 30 characters"),

  async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array(), profile_content: req.body });
    }
    try {
      const existingProfile = await User.findOne({
        facebook_id: req.params.facebookid
      }).exec();

      const countryDb = await Country.findOne({
        country: req.body.country
      }).exec();

      let updateuser;
      if (countryDb === null) {
        const newcountry = new Country({
          country: req.body.country
        });
        const savecountry = await newcountry.save();
        updateuser = new User({
          _id: existingProfile._id,
          facebook_id: existingProfile.facebook_id,
          display_name: req.body.display_name,
          country: savecountry._id,
          profile_pic: existingProfile.profile_pic,
          date_joined: existingProfile.date_joined,
          posts: existingProfile.posts,
          friends: existingProfile.friends,
          requests_sent: existingProfile.requests_sent,
          requests_received: existingProfile.requests_received,
          gender: req.body.gender !== "" ? req.body.gender.toLowerCase() : "",
          birthday: req.body.birthday.includes("undefined")
            ? existingProfile.birthday
            : req.body.birthday,
          guest: existingProfile.guest
        });
      } else {
        updateuser = new User({
          _id: existingProfile._id,
          facebook_id: existingProfile.facebook_id,
          display_name: req.body.display_name,
          country: countryDb._id,
          profile_pic: existingProfile.profile_pic,
          date_joined: existingProfile.date_joined,
          posts: existingProfile.posts,
          friends: existingProfile.friends,
          requests_sent: existingProfile.requests_sent,
          requests_received: existingProfile.requests_received,
          gender: req.body.gender !== "" ? req.body.gender.toLowerCase() : "",
          birthday: req.body.birthday.includes("undefined")
            ? existingProfile.birthday
            : req.body.birthday,
          guest: existingProfile.guest
        });
      }

      await User.findByIdAndUpdate(existingProfile._id, updateuser);
      return res.status(201).json({ message: "profile updated" });
    } catch (err) {
      return res.status(400).json({ message: err });
    }
  }
];

exports.post_uploadphoto = async function(req, res) {
  try {
    const userprofilepic = await User.findOne(
      { facebook_id: req.params.facebookid },
      "profile_pic"
    ).exec();

    console.log("inside profile upload");
    await User.findByIdAndUpdate(userprofilepic._id, {
      profile_pic: req.file.path
    }).exec();
    return res.status(201).json({ filepath: req.file.path });
  } catch (err) {
    return res.json({ message: err });
  }
};

// search for users using name

exports.post_search_user = [
  body("searchkeyword")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Search keyword must be at least 3 characters")
    .isLength({ max: 20 })
    .withMessage("Search keywords mustn't exceed 30 characters"),
  async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array(), profile_content: req.body });
    }
    try {
      // except current user
      const usersthatmatch = await User.find(
        {
          display_name: {
            $regex: ".*" + req.body.searchkeyword + ".*",
            $options: "i"
          }
        },
        "display_name facebook_id profile_pic"
      )
        .limit(20)
        .sort({ date_joined: 1 })
        .exec();
      const currentUser = await User.findOne(
        {
          facebook_id: req.params.facebookid
        },
        "requests_sent friends"
      )
        .populate({ path: "requests_sent", select: ["facebook_id"] })
        .exec();
      return res.status(200).json({ usersthatmatch, currentUser });
    } catch (err) {
      return res.status(400).json({ err });
    }
  }
];

// browser users near you

exports.get_users_bycountry = async function(req, res) {
  try {
    const currentUser = await User.findOne(
      {
        facebook_id: req.params.facebookid
      },
      "requests_sent"
    )
      .populate({ path: "requests_sent", select: ["facebook_id"] })
      .exec();
    const countrycode = req.params.countrycode;
    const country = await Country.findOne({ country: countrycode }).exec();
    const allUsersNotFriends = await User.find(
      {
        country: country._id,
        friends: { $nin: currentUser._id },
        _id: { $ne: currentUser._id }
      },
      "display_name facebook_id profile_pic"
    )
      .limit(20)
      .sort({ date_joined: 1 })
      .exec();

    return res.status(201).json({ allUsersNotFriends, currentUser });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};

const sortBirthdays = function(a, b) {
  if (a.birthday <= b.birthday) {
    return 1;
  } else {
    return -1;
  }
};

exports.get_birthdays = async function(req, res) {
  try {
    const user = await User.findOne(
      {
        facebook_id: req.params.facebookid
      },
      "friends"
    )
      .populate({
        path: "friends",
        select: ["facebook_id", "display_name", "profile_pic", "birthday"]
      })
      .exec();
    let friendsbirthdays = [];
    let futurebirthdays = [];
    if (user.friends.length > 0) {
      const today = new Date();
      const month = today.getMonth();
      const day = today.getDate();
      const weekday = DateTime.local(today).weekNumber;
      user.friends.forEach((friend) => {
        const friendbirthday = friend.birthday;
        if (friendbirthday !== undefined) {
          const friendBMonth = friendbirthday.getMonth();
          const friendBDay = friendbirthday.getDate();
          const friendBWeek = DateTime.fromJSDate(friendbirthday).weekNumber;
          if (friendBMonth === month && friendBDay === day) {
            friendsbirthdays.push(friend);
          } else if (
            friendBDay > day &&
            friendBWeek >= weekday &&
            friendBWeek < weekday + 2
          ) {
            futurebirthdays.push(friend);
          }
        }
      });
    }
    futurebirthdays.sort(sortBirthdays);
    return res.status(201).json({ friendsbirthdays, futurebirthdays });
  } catch (err) {
    return res.status(400).json({ err });
  }
};
