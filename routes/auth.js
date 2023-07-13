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
      profileFields: [
        "id",
        "displayName",
        "picture.type(large)",
        "birthday",
        "gender",
      ],
    },
    function(accessToken, refreshToken, profile, cb) {
      // find user in db and return in the cb
      console.log(profile);
      //res.cookie("token", accessToken);

      // by returning a user on the callback, user is accessible on req.user
      const user = { profile: profile };
      user.jwtoken = jwt.sign({ user }, process.env["JWTSECRET"]);
      /* req.login(user, function(err) {
       *   if (err) {
       *     return next(err);
       *   }
       * }); */
      return cb(null, user);
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
    },
  ),
);

// token

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env["JWTSECRET"],
    },
    function(jwtPayload, cb) {
      // check if is user

      return cb(null, true);
    },
  ),
);

export function decodeToken(req, res, next) {
  const decoded = jwt.verify(req.body.token, process.env["JWTSECRET"]);
  next();
}

// GET login

router.get("/api/auth/facebook", passport.authenticate("facebook"));

// GET after login

router.get("/retarded", (req, res) => {
  res.json({ message: "sim" });
});

router.get(
  "/api/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: process.env["REACT_APP_URL"] + "/login",
    failureMessage: true,
    session: false,
  }),
  (req, res) => {
    // successfully logged in
    res.cookie("token", req.user.jwtoken);
    // I can just send the token and profile info on a cookie and not send the token on the request
    res.redirect(process.env["REACT_APP_URL"]);
  },
);

export default router;
