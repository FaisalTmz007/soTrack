// const facebookLogout = async (req, res) => {
//   try {
//     res.clearCookie("facebook_access_token");
//     res.clearCookie("connect.sid");
//     res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
//   } catch (error) {
//     res.status(400).json({
//       error: "An error has occurred",
//       message: error.message,
//     });
//   }
// };

// module.exports = facebookLogout;
