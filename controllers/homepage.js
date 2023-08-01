import User from "../models/user";


exports.homepage_get = async function(req, res, next) {
  const facebookID = req.params.facebookid;
  try {
    const userInfo = await User.findOne({ facebook_id: facebookID });
    return res.json({ userInfo });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};


exports.profilepic = async function(req, res, next) {
  const facebookID = req.params.facebookid;
  try {
    const profilePicLocation = await User.findOne(
      { facebook_id: facebookID },
      "profile_pic",
    ).exec();
    return res.sendFile(profilePicLocation.profile_pic);
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};
