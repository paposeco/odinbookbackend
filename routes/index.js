import express from "express";
import passport from "passport";
import homepage from "../controllers/homepage";

const router = express.Router();

router.get("/hello", (req, res, next) => {
  return res.json({ message: "hi" });
});

router.get(
  "/:facebookid",
  passport.authenticate("jwt", { session: false }),
  homepage.homepage_get
);

router.get(
  "/:facebookid/profilepic",
  passport.authenticate("jwt", { session: false }),
  homepage.profilepic
);

// timeline

export default router;
