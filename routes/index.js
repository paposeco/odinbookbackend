import express from "express";
import passport from "passport";
import homepage, { homepage_get } from "../controllers/homepage";
import { decodeToken } from "./auth";

const router = express.Router();

/* router.get(
 *   "/",
 *   passport.authenticate("jwt", { session: false }),
 *   decodeToken,
 *   homepage.homepage_get,
 * ); */

router.get(
  "/:facebookid",
  passport.authenticate("jwt", { session: false }),
  homepage_get,
);
/* router.get(
 *   "/jwttest",
 *   passport.authenticate("jwt", { session: false }),
 *   homepage.jwtteste_get
 * ); */

export default router;
