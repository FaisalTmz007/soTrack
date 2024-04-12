const facebookProfile = async function (req, res) {
  try {
    // Kirim data pengguna dan token akses ke halaman profil
    res.json({
      message: "Logged in successfully",
      statusCode: 200,
      data: {
        user: req.user,
        facebook_user_id: req.user.id,
        access_token: req.user.accessToken,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = facebookProfile;
