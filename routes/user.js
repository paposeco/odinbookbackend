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

router.get(
  "/:facebookid/otheruserprofile/:friendid/friends",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_friend_listfriends
);

router.get(
  "/:facebookid/friends",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_listfriends
);

router.get(
  "/:facebookid/users",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_users
);

router.get(
  "/:facebookid/editprofile",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_update_profile
);

router.post(
  "/:facebookid/editprofile",
  passport.authenticate("jwt", { session: false }),
  user_controller.post_update_profile
);

export default router;
