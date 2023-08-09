import express from "express";
import passport from "passport";
import postsController from "../controllers/postsController";

const router = express.Router();

router.get(
  "/:facebookid/posts/newpost",
  passport.authenticate("jwt", { session: false }),
  postsController.newpost_get
);

router.post(
  "/:facebookid/posts/newpost",
  passport.authenticate("jwt", { session: false }),
  postsController.newpost_post
);

router.get(
  "/:facebookid/posts/timeline",
  passport.authenticate("jwt", { session: false }),
  postsController.timeline
);

//facebook id of signed in user, not author
router.get(
  "/:facebookid/posts/:postid",
  passport.authenticate("jwt", { session: false }),
  postsController.get_post
);

router.put(
  "/:facebookid/posts/:postid/like",
  passport.authenticate("jwt", { session: false }),
  postsController.likepost
);

router.post(
  "/:facebookid/posts/:postid/comment",
  passport.authenticate("jwt", { session: false }),
  postsController.newcomment
);

export default router;
