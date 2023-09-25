import express from "express";
import passport from "passport";
import homepage from "../controllers/homepage";
import postsController from "../controllers/postsController";

const router = express.Router();

// does not work
// router.get(
//   "/:facebookid",
//   (req, res, next) => {
//     req._toParam = "oi";
//     passport.authenticate("jwt", { session: false })(req, res, next);
//   },
//   homepage.homepage_get
// );

// need to check how multer handles the form data because it might be expecting something different and breaking on uploadPhoto
// router.post(
//   "/:facebookid/uploadphoto",
//   //passport.authenticate("jwt", { session: false }),
//   (req, res, next) => {
//     console.log(req.file);
//     return res.json({ message: "stop" });
//   }
//   //uploadPhoto.single("newprofilepic"),
//   //user_controller.uploadphoto
// );

router.get(
  "/:facebookid/homepage",
  passport.authenticate("jwt", { session: false }),
  homepage.homepage_get
);

export default router;
