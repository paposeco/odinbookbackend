import User from "../models/user";
import Post from "../models/post";
import Comment from "../models/comment";
import { body, validationResult } from "express-validator";
import asyncHandler from "express-async-handler";
import path from "path";

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

      //save file and save path to DB

      //need to handle url image
      let newpost;
      if (!req.file && !req.body.imageurl) {
        newpost = new Post({
          author: userID._id,
          post_content: req.body.content
        });
      } else if (!req.file && req.body.imageurl) {
        // get url and download file to server? no. it should be on frontend.
        newpost = new Post({
          author: userID._id,
          post_content: req.body.content,
          post_image: req.body.imageurl
        });
      } else {
        newpost = new Post({
          author: userID._id,
          post_content: req.body.content,
          post_image: path.join(__dirname, "..", req.file.path)
        });
      }
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

// if the user is very prolific, all he'll see are his posts

//load more with scroll ?
// timeline needs work and need to implement guest login
exports.timeline = async function (req, res) {
  try {
    const currentUser = await User.findOne({
      facebook_id: req.params.facebookid
    }).exec();

    const userAndFriendsPosts = currentUser.friends.concat(currentUser._id);
    if (!currentUser) {
      return res.status(404).json({ message: "user not found" });
    } else {
      const timelinePosts = await Post.find({
        author: { $in: userAndFriendsPosts }
      })
        .limit(5)
        .sort({ date: 1 })
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
      console.log(timelinePosts);
      return res.json({ message: "ok\n" });
    }
  } catch (err) {
    return res.status(404).json({ message: "cant load content" });
  }
};
