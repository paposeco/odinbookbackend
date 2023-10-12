import express from "express";
import passport from "passport";
import postsController from "../controllers/postsController";
import multer from "multer";

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, `images/${req.params.facebookid}/posts`);
  }
});
const uploadPhoto = multer({ storage: storage });

const router = express.Router();

/* router.get(
 *   "/:facebookid/posts/newpost",
 *   passport.authenticate("jwt", { session: false }),
 *   postsController.newpost_get
 * ); */

router.post(
  "/:facebookid/posts/newpost",
  passport.authenticate("jwt", { session: false }),
  uploadPhoto.single("postimage"),
  postsController.newpost_post
);

router.get(
  "/:facebookid/posts/timeline/:skip",
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
