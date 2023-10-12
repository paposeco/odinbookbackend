import User from "../models/user";
import path from "path";

exports.homepage_get = async function(req, res, next) {
  console.log("inside 12");
  const facebookID = req.params.facebookid;
  try {
    const userInfo = await User.findOne({ facebook_id: facebookID });
    return res.json({ userInfo });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};
