import User from "../models/user";

exports.homepage_get = async function(req, res, next) {
  const facebookID = req.params.facebookid;
  try {
    const userInfo = await User.findOne({ facebook_id: facebookID });
    return res.json({ userInfo });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
  //  return res.status(200).json({ message: "user logged in" });
};

exports.jwtteste_get = (req, res, next) => {
  return res.json({ message: "hello" });
};
