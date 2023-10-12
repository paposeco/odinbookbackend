import express from "express";
import passport from "passport";
import homepage from "../controllers/homepage";
import postsController from "../controllers/postsController";

const router = express.Router();

router.get(
  "/:facebookid/homepage",
  passport.authenticate("jwt", { session: false }),
  homepage.homepage_get
);

export default router;
