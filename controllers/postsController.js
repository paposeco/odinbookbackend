import User from "../models/user";
import Post from "../models/post";
import Comment from "../models/comment";
import { body, validationResult } from "express-validator";
import asyncHandler from "express-async-handler";
import path from "path";
import he from "he";

const postDecoder = function(post) {
  post.post_content = he.decode(post.post_content);
  return post;
};

const commentDecoder = function(post) {
  if (post.comments.length === 0) {
    return post;
  }
  let decodedcommentarray = [];
  post.comments.forEach((comment) => {
    const commentcontent = he.decode(comment.comment_content);
    comment.comment_content = commentcontent;
    decodedcommentarray.push(comment);
  });
  post.comments = decodedcommentarray;
  return post;
};

const multiplePostDecoder = function(posts) {
  let decodedpostsarray = [];
  posts.forEach((post) => {
    const postcontent = he.decode(post.post_content);
    post.post_content = postcontent;
    const decodedcommentspost = commentDecoder(post);
    decodedpostsarray.push(decodedcommentspost);
  });
  return decodedpostsarray;
};

exports.multiplePostDecoder = multiplePostDecoder;

const singleCommentDecoder = function(comment) {
  comment.comment_content = he.decode(comment.comment_content);
  return comment;
};

exports.newpost_post = [
  body("content")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage("Post must not be empty")
    .isLength({ max: 10000 })
    .withMessage("Post exceeds maximum length of 10000 characters"),
  async function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

      let newpost;
      if (!req.file && !req.body.imageurl) {
        newpost = new Post({
          author: userID._id,
          post_content: req.body.content
        });
      } else if (!req.file && req.body.imageurl) {
        newpost = new Post({
          author: userID._id,
          post_content: req.body.content,
          post_image: req.body.imageurl
        });
      } else {
        newpost = new Post({
          author: userID._id,
          post_content: req.body.content,
          post_image: path.join(req.file.path)
        });
      }
      const savepost = await newpost.save();
      await User.findByIdAndUpdate(userID, {
        $push: { posts: savepost._id }
      }).exec();
      return res.status(201).json({ message: "post saved" });
    } catch (err) {
      return res.status(400).json({ message: err });
    }
  }
];

exports.likepost = async function(req, res, next) {
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
  async function(req, res, next) {
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
      const newcommentpopulated = await Comment.findById(
        newcomment._id
      ).populate({
        path: "author",
        select: ["facebook_id", "display_name", "profile_pic"]
      });
      const decodedcomment = singleCommentDecoder(newcommentpopulated);
      return res.status(200).json({ newcommentpopulated: decodedcomment });
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
      const decodedpostcontent = postDecoder(post);
      const decodedpostcomments = commentDecoder(decodedpostcontent);
      return res.json({ post: decodedpostcomments });
    }
  } catch (err) {
    return res.status(404).json({ message: err });
  }
};

exports.timeline = async function(req, res) {
  try {
    const currentUser = await User.findOne({
      facebook_id: req.params.facebookid
    }).exec();

    const userAndFriendsPosts = currentUser.friends.concat(currentUser._id);
    const skipNumber = req.params.skip * 3;
    if (!currentUser) {
      return res.status(404).json({ message: "user not found" });
    } else {
      const timelinePosts = await Post.find({
        author: { $in: userAndFriendsPosts }
      })
        .limit(3)
        .skip(skipNumber)
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
      const decodedposts = multiplePostDecoder(timelinePosts);
      return res.json({ timelinePosts: decodedposts });
    }
  } catch (err) {
    return res.status(404).json({ message: "cant load content" });
  }
};
