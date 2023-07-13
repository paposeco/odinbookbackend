exports.homepage_get = (req, res, next) => {
  return res.status(200).json({ message: "user logged in" });
};
