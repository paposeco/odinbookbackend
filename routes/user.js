import express from "express";
import user_controller from "../controllers/userController";
import passport from "passport";

const router = express.Router();

router.post(
  "/:facebookid/addfriend/:friendid",
  passport.authenticate("jwt", { session: false }),
  user_controller.add_friend
);

router.post(
  "/:facebookid/removefriend/:friendid",
  passport.authenticate("jwt", { session: false }),
  user_controller.remove_friend
);

router.post(
  "/:facebookid/acceptfriend/:friendid",
  passport.authenticate("jwt", { session: false }),
  user_controller.accept_friend_request
);

router.get(
  "/:facebookid/otheruserprofile/:userid",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_userprofile
);

export default router;
