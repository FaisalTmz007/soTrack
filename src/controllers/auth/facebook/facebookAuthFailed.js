const facebookCallback = async function (req, res) {
  try {
    res.send("Failed attempt");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = facebookCallback;
