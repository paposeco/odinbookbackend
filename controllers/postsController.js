import User from "../models/user";
import Post from "../models/post";
import Comment from "../models/comment";
import { body, validationResult } from "express-validator";
import asyncHandler from "express-async-handler";

//get posts sends postid

exports.newpost_get = (req, res, next) => {
  return res.json({ message: "it works" });
};

exports.newpost_post = [
  body("content")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage("Post must not be empty")
    .isLength({ max: 10000 })
    .withMessage("Post exceeds maximum length of 10000 characters"),
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("error");
      return res.json({ errors: errors.array(), postcontent: req.body });
    }
    try {
      const userID = await User.findOne({
        facebook_id: req.params.facebookid
      }).exec();
      if (!userID) {
        return res.status(400).json({ message: "user not found" });
      }
      const newpost = new Post({
        author: userID._id,
        post_content: req.body.content
      });

      const savepost = await newpost.save();
      await User.findByIdAndUpdate(userID, {
        $push: { posts: savepost._id }
      }).exec();
      return res.json({ message: "post saved" });
    } catch (err) {
      return res.status(400).json({ message: err });
    }
  }
];

exports.likepost = async function (req, res, next) {
  try {
    const userID = await User.findOne({
      facebook_id: req.params.facebookid
    }).exec();
    await Post.findByIdAndUpdate(req.params.postid, {
      $push: { likes: userID._id }
    }).exec();
    return res.status(200).json({ message: "post liked" });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};

exports.newcomment = [
  body("content")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage("Comment must not be empty")
    .isLength({ max: 1000 })
    .withMessage("Comment exceeds maximum length of 1000 characters"),
  async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array(), commentcontent: req.body });
    }
    try {
      const userID = await User.findOne({
        facebook_id: req.params.facebookid
      }).exec();
      const comment = new Comment({
        author: userID._id,
        comment_content: req.body.content,
        post: req.params.postid
      });
      const newcomment = await comment.save();
      await Post.findByIdAndUpdate(req.params.postid, {
        $push: { comments: newcomment._id }
      }).exec();
      return res.status(200).json({ message: "comment saved" });
    } catch (err) {
      return res.status(400).json({ message: err });
    }
  }
];

exports.get_post = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postid)
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
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    } else {
      console.log(post.like_counter);
      return res.json({ post, message: "yeah\n" });
    }
  } catch (err) {
    return res.status(404).json({ message: err });
  }
};

// when fetching posts, check if current user liked it, so it shows and so the user can unlike it

exports.timeline = async function (req, res) {
  try {
    const currentUser = await User.findOne({
      facebook_id: req.params.facebookid
    }).exec();

    /*  model.find({
      '_id': { $in: [
          mongoose.Types.ObjectId('4ed3ede8844f0f351100000c'),
          mongoose.Types.ObjectId('4ed3f117a844e0471100000d'), 
          mongoose.Types.ObjectId('4ed3f18132f50c491100000e')
      ]}
  }, function(err, docs){
       console.log(docs);
  }); */
    if (!currentUser) {
      return res.status(404).json({ message: "user not found" });
    } else {
      console.log(currentUser.friends);
      // get current user friends' id
      // find posts made by friends
      // sort by date
      // also get last post made by user

      const friendsPosts = await Post.find({
        _id: { $in: currentUser.friends }
      }).exec();

      console.log(friendsPosts);
      return res.json({ message: "ok\n" });
    }
    //const posts = await Post.
  } catch (err) {
    return res.status(404).json({ message: "cant load content" });
  }
};
