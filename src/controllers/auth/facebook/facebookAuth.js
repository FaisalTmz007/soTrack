const facebookAuth = async (req, res) => {
  const url = `https://www.facebook.com/v13.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_CALLBACK_URL_DEV}&scope=email, read_insights, publish_video, pages_show_list, ads_management, ads_read, business_management, instagram_basic, instagram_manage_comments, instagram_content_publish, pages_read_engagement, pages_manage_metadata, pages_read_user_content, pages_manage_ads, pages_manage_posts, pages_manage_engagement, public_profile`;
  res.redirect(url);
};

module.exports = facebookAuth;
