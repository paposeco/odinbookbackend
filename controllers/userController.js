import asyncHandler from "express-async-handler";
import User from "../models/user";
import Post from "../models/post";
import Country from "../models/country";
import { body, validationResult } from "express-validator";
import { unlink } from "node:fs";
import path from "path";

exports.check_friend_status = async function(req, res, next) {
  const currentUser = req.params.facebookid;
  const friendId = req.params.friendid;

  try {
    const currentUserDBId = await User.findOne({
      facebook_id: currentUser
    }).exec();

    /* const friendDBId = await User.findOne({
     *   facebook_id: friendId,
     *   friends: currentUserDBId
     * }).exec(); */
    const friendDBId = await User.findOne({
      facebook_id: friendId
    }).exec();

    const friends = currentUserDBId.friends.includes(friendDBId._id);
    if (friends) {
      return res.status(201).json({ friends: true, requestsent: false });
    } else {
      const friendrequestexists = currentUserDBId.requests_sent.includes(
        friendDBId._id
      );
      return res
        .status(201)
        .json({ friends: false, requestsent: friendrequestexists });
    }
  } catch (err) {
    return res.status(404).json({ err });
  }
};

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
        $push: { friends: currentUserDBId._id }
      }).exec()
    ]);
    return res.status(201).json({ message: "friend accepted" });
  }
});

exports.get_currentuserprofile = async function(req, res) {
  try {
    const user = await User.findOne({
      facebook_id: req.params.facebookid
    })
      .populate({ path: "country", select: ["country"] })
      .exec();

    const userposts = await Post.find({
      author: user._id
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

    if (!user) {
      return res.status(404).json({ message: "user not found ?" });
    } else {
      return res.status(201).json({ user, userposts });
    }
  } catch (err) {
    return res.status(404).json({ message: "db error" });
  }
};

//unsure if I should limit the information visible to users
exports.get_userprofile = async function(req, res) {
  try {
    const otherUser = await User.findOne({ facebook_id: req.params.userid })
      .populate({
        path: "posts",
        options: { limit: 5, sort: { date: -1 } },
        populate: {
          path: "author",
          select: ["facebook_id", "display_name", "profile_pic"]
        },
        populate: { path: "likes", select: ["facebook_id", "display_name"] },
        populate: {
          path: "comments",
          select: ["comment_content", "date"],
          populate: {
            path: "author",
            select: ["facebook_id", "display_name", "profile_pic"]
          }
        }
      })
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
      // see profile photo
      // name
      return res.status(201).json({
        display_name: otherUser.display_name,
        facebook_id: otherUser.facebook_id,
        profile_pic: otherUser.profile_pic
      });
    } else {
      //friends, can see everything
      // see profile photo
      // name
      // posts
      // friends
      return res.status(201).json({
        display_name: otherUser.display_name,
        facebook_id: otherUser.facebook_id,
        profile_pic: otherUser.profile_pic,
        birthday: otherUser.date_birthday,
        country: otherUser.country,
        posts: otherUser.posts,
        friends: otherUser.friends.length
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

    const skipNumber = req.params.skip * 10;
    const allUsersNotFriends = await User.find(
      { friends: { $nin: currentUser._id }, _id: { $ne: currentUser._id } },
      "display_name facebook_id profile_pic"
    )
      .limit(10)
      .skip(skipNumber)
      .sort({ date_joined: 1 })
      .exec();
    return res.status(201).json({ allUsersNotFriends, currentUser });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};

// edit profile
// need to format birthday on frontend as Date
// gender must be formated on frontend too

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
      "display_name birthday gender country profile_pic requests_received requests_sent"
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
      .exec();
    const formattedbirthday = formatDate(userprofile.date_birthday);
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
        requests_sent: userprofile.requests_sent
      }
    });
  } catch (err) {
    console.log(err);
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
  body("birthday")
    .optional()
    .trim()
    .isDate()
    .withMessage("Birthday must be a date"),
  body("gender").optional().trim().escape(),
  body("country").optional().trim().escape(),

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
          counter: 1,
          country: req.body.country
        });
        const savecountry = await newcountry.save();
        updateuser = new User({
          _id: existingProfile._id,
          facebook_id: existingProfile.facebook_id,
          display_name: req.body.display_name,
          birthday: req.body.birthday,
          gender: req.body.gender,
          country: savecountry._id,
          profile_pic: existingProfile.profile_pic,
          date_joined: existingProfile.date_joined,
          posts: existingProfile.posts,
          friends: existingProfile.friends,
          requests_sent: existingProfile.requests_sent,
          requests_received: existingProfile.requests_received,
          friends_birthdays: existingProfile.friends_birthdays
        });
      } else {
        await findByIdAndUpdate(countryDb._id, { $inc: { counter: 1 } }).exec();
        updateuser = new User({
          _id: existingProfile._id,
          facebook_id: existingProfile.facebook_id,
          display_name: req.body.display_name,
          birthday: req.body.birthday,
          gender: req.body.gender,
          country: countryDb._id,
          profile_pic: existingProfile.profile_pic,
          date_joined: existingProfile.date_joined,
          posts: existingProfile.posts,
          friends: existingProfile.friends,
          requests_sent: existingProfile.requests_sent,
          requests_received: existingProfile.requests_received,
          friends_birthdays: existingProfile.friends_birthdays
        });
      }

      // friends birthdays??

      await User.findByIdAndUpdate(existingProfile._id, updateuser);
      return res.status(201).json({ message: "profile updated" });
    } catch (err) {
      return res.status(400).json({ message: err });
    }
  }
];

// um user selecciona um pais
// se estiver criado, nao faz nada e vai buscar o object id desse pais e mete no user
// se nao estiver criado, faz um pais novo

// change profile pic

exports.post_uploadphoto = async function(req, res) {
  try {
    const userprofilepic = await User.findOne(
      { facebook_id: req.params.facebookid },
      "profile_pic"
    ).exec();

    unlink(path.join(__dirname, "..", userprofilepic.profile_pic), (err) => {
      if (err) throw err;
    });

    await User.findByIdAndUpdate(userprofilepic._id, {
      profile_pic: req.file.path
    }).exec();
    return res.status(201).json({ filepath: req.file.path });
  } catch (err) {
    return res.json({ message: err });
  }
};

// add images to posts
