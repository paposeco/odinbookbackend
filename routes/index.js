import express from "express";
import passport from "passport";
import homepage from "../controllers/homepage";

const router = express.Router();

router.get("/hello", (req, res, next) => {
  return res.json({ message: "hi" });
});

// does not work
router.get(
  "/:facebookid",
  (req, res, next) => {
    req._toParam = "oi";
    passport.authenticate("jwt", { session: false })(req, res, next);
  },
  homepage.homepage_get
);

router.get(
  "/:facebookid/profilepic",
  passport.authenticate("jwt", { session: false }),
  homepage.profilepic
);

// timeline

export default router;
