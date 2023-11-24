import passport from "passport";
import passportJWT from "passport-jwt";
import LocalStrategy from "passport-local";
import bcrypt from "bcryptjs";
import FacebookStrategy from "passport-facebook";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import path from "path";
import fs from "fs";
import { mkdir } from "node:fs/promises";
import https from "https";
import dotenv from "dotenv/config";

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const router = express.Router();

// create folder for facebookprofile and save profile picture
const downloadFile = async function(url, dest, facebookid) {
  try {
    const folderProfile = path.join(
      __dirname,
      "..",
      "/public",
      "/images",
      facebookid
    );
    const folderPostImages = path.join(
      __dirname,
      "..",
      "/public",
      "/images",
      facebookid,
      "/posts"
    );
    const folderProf = await mkdir(folderProfile);
    const folderPostImg = await mkdir(folderPostImages);
    // at this time there is a bug on the Facebook api that is preventing the profile photos from being downloaded

    /* const file = fs.createWriteStream("public/images/" + facebookid + dest);
     * https.get(url, (res) => {
     *   res.pipe(file);
     *   file
     *     .on("finish", function() {
     *       console.log("finished download");
     *       file.close();
     *     })
     *     .on("error", function() {
     *       fs.unlink("images/" + facebookid + dest);
     *     });
     * }); */
  } catch (err) {
    console.log("error creating folders");
    console.error(err.message);
  }
};

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env["FACEBOOK_APP_ID"],
      clientSecret: process.env["FACEBOOK_APP_SECRET"],
      callbackURL:
        "https://odinbookbackend-production.up.railway.app/api/auth/facebook/callback",
      profileFields: [
        "id",
        "displayName",
        "picture.type(large)",
        "birthday",
        "gender"
      ]
    },
    async function(accessToken, refreshToken, profile, cb) {
      // by returning a user on the callback, user is accessible on req.user
      try {
        const userDB = await User.findOne({ facebook_id: profile.id }).exec();
        if (!userDB) {
          // there is a bug on the Facebook api that is preventing the profile photos from being downloaded
          downloadFile(profile.photos[0].value, "/profilepic.jpg", profile.id);
          const profilePicLocation = path.join(
            "public",
            "images",
            "defaultimage.jpg"
          );
          const newUser = new User({
            facebook_id: profile.id,
            display_name: profile.displayName,
            profile_pic: profilePicLocation,
            birthday: profile.birthday,
            gender: profile.gender
          });
          await newUser.save();
          const user = { profile: profile };
          user.jwtoken = jwt.sign({ user }, process.env["JWTSECRET"]);

          return cb(null, user);
        } else {
          const user = { profile: profile };
          user.jwtoken = jwt.sign({ user }, process.env["JWTSECRET"]);
          return cb(null, user);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

// token

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env["JWTSECRET"],
      passReqToCallback: true
    },
    function(req, jwtPayload, done) {
      if (!jwtPayload.user) {
        return done(null, false);
      } else {
        const userFacebookId = req.params.facebookid;
        let tokenFacebookId = "";
        if (jwtPayload.user.profile === undefined) {
          tokenFacebookId = jwtPayload.user.facebook_id;
        } else {
          tokenFacebookId = jwtPayload.user.profile.id;
        }
        if (userFacebookId === tokenFacebookId) {
          return done(null, true);
        } else {
          console.log("tokens don't match");
          return done(null, false);
        }
      }
    }
  )
);

passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    try {
      const userDB = await User.findOne(
        { guest: true },
        "display_name facebook_id profile_pic password"
      ).exec();
      if (!userDB) {
        return cb(null, false, { message: "user not found" });
      }
      bcrypt.compare(password, userDB.password, (err, res) => {
        if (res) {
          //passwords match
          userDB.jwtoken = jwt.sign({ userDB }, process.env["JWTSECRET"]);

          return cb(null, userDB);
        } else {
          return cb(null, false, { message: "Wrong password" });
        }
      });
    } catch (err) {
      if (err) {
        console.log(err);
        return cb(err);
      }
    }
  })
);

// GET login

router.get("/api/auth/facebook", passport.authenticate("facebook"));

router.post("/guestlogin", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: "Something is not right\n",
        user: user
      });
    }
    req.login(user, { session: false }, (err) => {
      if (err) {
        res.send(err);
        return;
      }
      req.user.jwtoken = jwt.sign({ user }, process.env["JWTSECRET"]);
      return res.status(200).json({
        token: req.user.jwtoken,
        facebookid: req.user.facebook_id
      });
    });
  })(req, res);
});

// create guest
/* router.post("/createguestlogin", async function(req, res, next) {
 *   bcrypt.hash(req.body.password, 10, async function(err, hashedpassword) {
 *     if (err) {
 *       return next(err);
 *     }
 *     try {
 *       const guest = new User({
 *         facebook_id: "01111111122222221",
 *         display_name: "Guest",
 *         profile_pic: path.join("public", "images", "defaultimage.jpg"),
 *         guest: true,
 *         password: hashedpassword
 *       });
 *       const folderProfile = path.join(
 *         __dirname,
 *         "..",
 *         "public",
 *         "images",
 *         "01111111122222221"
 *       );
 *       const folderPostImages = path.join(
 *         __dirname,
 *         "..",
 *         "public",
 *         "images",
 *         "01111111122222221/posts"
 *       );
 *       await mkdir(folderProfile);
 *       await mkdir(folderPostImages);
 *       await guest.save();
 *       return res.json({ message: "user created" });
 *     } catch (err) {
 *       return res.json({ err });
 *     }
 *   });
 * });
 *
 * // add other users
 * router.post("/additionalusers", async function(req, res, next) {
 *   bcrypt.hash(req.body.password, 10, async function(err, hashedpassword) {
 *     if (err) {
 *       return next(err);
 *     }
 *     try {
 *       //john smith
 *       const fakeuserjohn = new User({
 *         facebook_id: "01111111122222222",
 *         display_name: "John Smith",
 *         profile_pic: path.join("public", "images", "defaultimage.jpg"),
 *         guest: false,
 *         password: hashedpassword
 *       });
 *       const folderProfilejohn = path.join(
 *         __dirname,
 *         "..",
 *         "public",
 *         "images",
 *         "01111111122222222"
 *       );
 *       const folderPostImagesjohn = path.join(
 *         __dirname,
 *         "..",
 *         "public",
 *         "images",
 *         "01111111122222222/posts"
 *       );
 *       await mkdir(folderProfilejohn);
 *       await mkdir(folderPostImagesjohn);
 *       await fakeuserjohn.save();
 *
 *       //jane doe
 *       const fakeuserjane = new User({
 *         facebook_id: "01111111122222223",
 *         display_name: "Jane Doe",
 *         profile_pic: path.join("public", "images", "defaultimage.jpg"),
 *         guest: false,
 *         password: hashedpassword
 *       });
 *       const folderProfilejane = path.join(
 *         __dirname,
 *         "..",
 *         "public",
 *         "images",
 *         "01111111122222223"
 *       );
 *       const folderPostImagesjane = path.join(
 *         __dirname,
 *         "..",
 *         "public",
 *         "images",
 *         "01111111122222223/posts"
 *       );
 *       await mkdir(folderProfilejane);
 *       await mkdir(folderPostImagesjane);
 *       await fakeuserjane.save();
 *
 *       // kate davis
 *       const fakeuserkate = new User({
 *         facebook_id: "01111111122222223",
 *         display_name: "Kate Davis",
 *         profile_pic: path.join("public", "images", "defaultimage.jpg"),
 *         guest: false,
 *         password: hashedpassword
 *       });
 *       const folderProfilekate = path.join(
 *         __dirname,
 *         "..",
 *         "public",
 *         "images",
 *         "01111111122222224"
 *       );
 *       const folderPostImageskate = path.join(
 *         __dirname,
 *         "..",
 *         "public",
 *         "images",
 *         "01111111122222224/posts"
 *       );
 *       await mkdir(folderProfilekate);
 *       await mkdir(folderPostImageskate);
 *       await fakeuserkate.save();
 *
 *       return res.json({ message: "user created" });
 *     } catch (err) {
 *       return res.json({ err });
 *     }
 *   });
 * }); */

router.get(
  "/api/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: process.env["REACT_APP_URL"] + "/login",
    failureMessage: true,
    session: false
  }),
  (req, res) => {
    // successfully logged in
    const tokenstring = encodeURIComponent(req.user.jwtoken);
    const facebookstring = encodeURIComponent(req.user.profile.id);
    //res.redirect(process.env["REACT_APP_URL"] + "loggedin");
    res.redirect(
      process.env["REACT_APP_URL"] +
      "/loggedin/valid?token=" +
      tokenstring +
      "&facebookid=" +
      facebookstring
    );
  }
);

export default router;
