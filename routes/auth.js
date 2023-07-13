import passport from "passport";
import passportJWT from "passport-jwt";
import FacebookStrategy from "passport-facebook";
import express from "express";
import jwt from "jsonwebtoken";

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const router = express.Router();

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env["FACEBOOK_APP_ID"],
      clientSecret: process.env["FACEBOOK_APP_SECRET"],
      callbackURL: "http://localhost:3000/api/auth/facebook/callback",
    },
    function(accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
      /* db.get(
       *   "SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?",
       *   ["https://www.facebook.com", profile.id],
       *   function(err, cred) {
       *     if (err) {
       *       return cb(err);
       *     }
       *     if (!cred) {
       *       // The Facebook account has not logged in to this app before.  Create a
       *       // new user record and link it to the Facebook account.
       *       db.run(
       *         "INSERT INTO users (name) VALUES (?)",
       *         [profile.displayName],
       *         function(err) {
       *           if (err) {
       *             return cb(err);
       *           }

       *           var id = this.lastID;
       *           db.run(
       *             "INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)",
       *             [id, "https://www.facebook.com", profile.id],
       *             function(err) {
       *               if (err) {
       *                 return cb(err);
       *               }
       *               var user = {
       *                 id: id.toString(),
       *                 name: profile.displayName,
       *               };
       *               return cb(null, user);
       *             }
       *           );
       *         }
       *       );
       *     } else {
       *       // The Facebook account has previously logged in to the app.  Get the
       *       // user record linked to the Facebook account and log the user in.
       *       db.get(
       *         "SELECT * FROM users WHERE id = ?",
       *         [cred.user_id],
       *         function(err, user) {
       *           if (err) {
       *             return cb(err);
       *           }
       *           if (!user) {
       *             return cb(null, false);
       *           }
       *           return cb(null, user);
       *         }
       *       );
       *     }
       *   }
       * );
         } */
    }
  )
);

// GET login

router.get("/api/auth/facebook", passport.authenticate("facebook"));

// GET after login

router.get("/retarded", (req, res) => {
  res.json({ message: "sim" });
});

router.get(
  "/api/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/retarded",
    failureMessage: true,
    session: false,
  }),
  (req, res) => {
    res.redirect("/retarded");
    //res.json({ message: "help" });
  }
  /* function(req, res) {
   *   console.log("inside");
   *   res.redirect("/retarded");
   *   //res.status(200).json({ message: "non" });
   * } */
  /* function(req, res) {
   *   console.log("redirect");
   *   //res.status(301).redirect("http://localhost:8080");
   *   return res.status(200).json({ message: "stop it" });
   * } */
  // should create a token to keep user logged in?
);

export default router;
