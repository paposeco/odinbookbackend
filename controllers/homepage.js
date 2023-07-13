exports.homepage_get = (req, res, next) => {
  return res.status(200).json({ message: "user logged in" });
};

exports.jwtteste_get = (req, res, next) => {
  console.log("here");
  return res.json({ message: "hello" });
};
