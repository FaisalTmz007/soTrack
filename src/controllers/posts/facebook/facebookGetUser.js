// Definisikan async function untuk mendapatkan req.user
const facebookGetUser = async function (req, res) {
  try {
    res.json({
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = facebookGetUser;
