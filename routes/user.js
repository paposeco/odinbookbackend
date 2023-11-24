import express from "express";
import user_controller from "../controllers/userController";
import passport from "passport";
import multer from "multer";
import User from "../models/user";
import process from "process";

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    console.log(req.params.facebookid);
    cb(null, `public/images/${req.params.facebookid}`);
  },
  filename: function(req, file, cb) {
    cb(null, "newprofilepic");
  }
});

/* const storage = multer.diskStorage({
 *   destination: function(req, file, cb) {
 *     cb(null, `.public/images/${req.params.facebookid}`);
 *   },
 *   filename: function(req, file, cb) {
 *     cb(null, "newprofilepic");
 *   }
 * }); */

const upload = multer({ storage: storage }).single("newprofilepic");

const router = express.Router();

router.post(
  "/removefriend/:facebookid/:friendid",
  passport.authenticate("jwt", { session: false }),
  user_controller.remove_friend
);

router.get(
  "/:facebookid/profile",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_currentuserprofile
);

router.get(
  "/:facebookid/friends",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_listfriends
);

router.get(
  "/:facebookid/editprofile",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_update_profile
);

router.get(
  "/:facebookid/headerinfo",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_update_profile
);

router.post(
  "/:facebookid/editprofile",
  passport.authenticate("jwt", { session: false }),
  user_controller.post_update_profile
);

router.post(
  "/:facebookid/uploadit",
  (req, res, next) => {
    console.log("inside uploadit");
    next();
  },
  passport.authenticate("jwt", { session: false }),
  function(req, res) {
    upload(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.log("multer");
        console.log(err);
      } else if (err) {
        console.log("other");
        console.log(err);
        // An unknown error occurred when uploading.
      }
    });
  },
  (req, res, next) => {
    console.log("ended uplaod");
    next();
  },
  user_controller.post_uploadphoto
);

/* router.post(
 *   "/:facebookid/uploadit",
 *   passport.authenticate("jwt", { session: false }),
 *   function(req, res) {
 *     uploadPhoto(req, res, function(err) {
 *       if (err instanceof multer.MulterError) {
 *         console.log("multer error");
 *         console.log(err);
 *       } else if (err) {
 *         console.log("other error");
 *         console.log(err);
 *       }
 *       console.log("this is fine");
 *     });
 *   },
 *   user_controller.post_uploadphoto
 * );
 *  */

/* uploadPhoto.single("newprofilepic"), */

router.post(
  "/:facebookid/searchuser",
  passport.authenticate("jwt", { session: false }),
  user_controller.post_search_user
);

router.get(
  "/:facebookid/birthdays",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_birthdays
);

router.get(
  "/:facebookid/usersnear/:countrycode",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_users_bycountry
);

router.get(
  "/:facebookid/relationship/:friendid",
  passport.authenticate("jwt", { session: false }),
  user_controller.check_friend_status
);

router.put(
  "/:facebookid/addfriend/:friendid",
  passport.authenticate("jwt", { session: false }),
  user_controller.add_friend
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
  "/:facebookid/users/:skip",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_users
);

router.get(
  "/:facebookid/otheruserprofile/:friendid/friends",
  passport.authenticate("jwt", { session: false }),
  user_controller.get_friend_listfriends
);

export default router;
