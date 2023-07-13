import express from "express";
import passport from "passport";
import homepage from "../controllers/homepage";

const router = express.Router();

router.get("/", homepage.homepage_get);
router.get(
  "/jwttest",
  passport.authenticate("jwt", { session: false }),
  homepage.jwtteste_get
);

export default router;
