const axios = require("axios");
const translate = require("translate-google");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

// INI PERLU DI UBAH

const mostDiscussed = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Please login first",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const { platform, since, until } = req.query;

    if (!platform || !since || !until) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide platform, since and until query parameters",
      });
    }

    if (platform.toLowerCase() === "instagram") {
      const facebook_access_token = req.cookies.facebook_access_token;

      const mentionFilter = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: {
            name: "Instagram",
          },
          Category: {
            name: "Mention",
          },
        },
      });

      let allPosts = [];

      if (mentionFilter.length > 0) {
        await Promise.all(
          mentionFilter.map(async (item) => {
            const posts = await axios.get(
              `https://graph.facebook.com/v19.0/${item.id}/tags`,
              {
                params: {
                  fields: `id,caption,timestamp`,
                  access_token: facebook_access_token,
                },
              }
            );

            if (posts.data.data.length === 0) return [];

            const translatedPosts = await Promise.all(
              posts.data.data.map(async (post) => {
                const caption = post.caption || "no caption";
                const translatedCaption = await translate(caption, {
                  from: "id",
                  to: "en",
                });

                const predict = await axios.post(
                  `${process.env.FLASK_URL}/predict`,
                  {
                    headline: translatedCaption,
                  }
                );

                post.crime_type = predict.data.prediction;

                return post;
              })
            );

            allPosts.push(...translatedPosts);
          })
        );
      }

      const hashtagFilter = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: {
            name: "Instagram",
          },
          Category: {
            name: "Hashtag",
          },
        },
      });

      if (hashtagFilter.length > 0) {
        await Promise.all(
          hashtagFilter.map(async (f) => {
            const hashtagId = await axios.get(
              `https://graph.facebook.com/v19.0/ig_hashtag_search`,
              {
                params: {
                  user_id: mentionFilter[0].id,
                  q: f.parameter,
                  access_token: facebook_access_token,
                },
              }
            );

            const posts = await axios.get(
              `https://graph.facebook.com/v19.0/${hashtagId.data.data[0].id}/top_media`,
              {
                params: {
                  user_id: mentionFilter[0].id,
                  fields: "timestamp",
                  access_token: facebook_access_token,
                },
              }
            );

            if (posts.data.data.length === 0) return [];

            const translatedPosts = await Promise.all(
              posts.data.data.map(async (p) => {
                const caption = p.caption || "no caption";
                const translatedCaption = await translate(caption, {
                  from: "id",
                  to: "en",
                });

                const predict = await axios.post(
                  `${process.env.FLASK_URL}/predict`,
                  {
                    headline: translatedCaption,
                  }
                );

                p.crime_type = predict.data.prediction;

                return p;
              })
            );

            allPosts.push(...translatedPosts);
          })
        );
      }

      const countsByType = allPosts.reduce((acc, post) => {
        if (!acc[post.crime_type]) {
          acc[post.crime_type] = 0;
        }
        acc[post.crime_type]++;
        return acc;
      }, {});

      res.json({
        message: "Success",
        statusCode: 200,
        data: countsByType,
      });

      // if (!pageId || !since || !until) {
      //   return res.status(400).json({
      //     error: "Bad Request",
      //     message: "Please provide pageId, since and until query parameters",
      //   });
      // }
      // const page_info = await axios.get(
      //   `https://graph.facebook.com/v19.0/${pageId}`,
      //   {
      //     params: {
      //       fields: "name, access_token",
      //       access_token: token,
      //     },
      //   }
      // );

      // const instagramId = await axios.get(
      //   `https://graph.facebook.com/v19.0/${pageId}`,
      //   {
      //     params: {
      //       fields: "instagram_business_account",
      //       access_token: token,
      //     },
      //   }
      // );

      // facebook_page_name = page_info.data.name;

      // if (!instagramId.data.instagram_business_account) {
      //   return res.status(400).json({
      //     error: "Unauthorized",
      //     message: `Connect your Instagram account with this facebook page first: ${facebook_page_name}`,
      //   });
      // }

      // const instagramBusinessId =
      //   instagramId.data.instagram_business_account.id;

      // const instagramTags = await axios.get(
      //   `https://graph.facebook.com/v19.0/${instagramBusinessId}/tags`,
      //   {
      //     params: {
      //       fields: `id,username,comments_count,like_count,caption,timestamp`,
      //       access_token: token,
      //     },
      //   }
      // );

      // const instagramTagsinRange = instagramTags.data.data.filter((tag) => {
      //   const tagTimestamp = Math.floor(
      //     new Date(tag.timestamp).getTime() / 1000
      //   );
      //   return (
      //     tagTimestamp >= convertToTimestamp(since) &&
      //     tagTimestamp <= convertToTimestamp(until)
      //   );
      // });

      // const updatedInstagramTagsinRange = await Promise.all(
      //   instagramTagsinRange.map(async (tag) => {
      //     const caption = tag.caption ? tag.caption : "No caption";
      //     const translatedcaption = await translate(caption, {
      //       from: "id",
      //       to: "en",
      //     });

      //     const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
      //       headline: translatedcaption,
      //     });

      //     // Add crime_type property to tag object
      //     return {
      //       ...tag,
      //       crime_type: predict.data.prediction,
      //     };
      //   })
      // );

      // const countsByType = updatedInstagramTagsinRange.reduce((acc, tag) => {
      //   const crimeType = tag.crime_type;
      //   if (!acc[crimeType]) acc[crimeType] = 0;
      //   acc[crimeType]++;
      //   return acc;
      // }, {});

      // return res.status(200).json({
      //   message: "Success",
      //   data: countsByType,
      // });
    } else if (platform.toLowerCase() === "facebook") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({
          error: "Unauthorized",
          message: "Please login first",
        });
      }

      // convert since and until into UNIX
      const sinceUnix = convertToTimestamp(since);
      const untilUnix = convertToTimestamp(until);

      const filter = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: {
            name: "Facebook",
          },
          Category: {
            name: "Mention",
          },
        },
      });

      let allMentions = [];

      if (filter.length > 0) {
        await Promise.all(
          filter.map(async (f) => {
            const page_token_response = await axios.get(
              `https://graph.facebook.com/v19.0/${f.id}`,
              {
                params: {
                  fields: "access_token",
                  access_token: facebook_access_token,
                },
              }
            );

            const page_token = page_token_response.data.access_token;

            const posts_response = await axios.get(
              `https://graph.facebook.com/v19.0/${f.id}/tagged`,
              {
                params: {
                  fields: `id, message, created_time, permalink_url`,
                  since: sinceUnix,
                  until: untilUnix,
                  access_token: page_token,
                },
              }
            );

            const posts = posts_response.data.data;

            if (posts.length === 0) return [];

            const translatedPosts = await Promise.all(
              posts.map(async (p) => {
                const caption = p.message || "no caption";
                const translatedCaption = await translate(caption, {
                  from: "id",
                  to: "en",
                });

                const predict = await axios.post(
                  `${process.env.FLASK_URL}/predict`,
                  {
                    headline: translatedCaption,
                  }
                );

                p.crime_type = predict.data.prediction;

                return p;
              })
            );

            allMentions.push(...translatedPosts);
          })
        );
      }

      const countsByType = allMentions.reduce((acc, post) => {
        if (!acc[post.crime_type]) {
          acc[post.crime_type] = 0;
        }
        acc[post.crime_type]++;
        return acc;
      }, {});

      res.json({
        message: "Success",
        statusCode: 200,
        data: countsByType,
      });
    } else if (platform.toLowerCase() === "news") {
      const filter = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: {
            name: "News",
          },
          Category: {
            name: "Keyword",
          },
        },
      });

      let allNews = [];

      if (filter.length > 0) {
        await Promise.all(
          filter.map(async (f) => {
            const news = await prisma.News.findMany({
              where: {
                title: {
                  contains: f.keyword,
                },
                published_at: {
                  gte: new Date(since),
                  lte: new Date(until),
                },
              },
            });

            if (news.length === 0) return [];

            news.forEach((n) => {
              allNews.push(n);
            });
          })
        );
      }

      const countsByType = allNews.reduce((acc, post) => {
        if (!acc[post.crime_type]) {
          acc[post.crime_type] = 0;
        }
        acc[post.crime_type]++;
        return acc;
      }, {});

      res.json({
        message: "Success",
        statusCode: 200,
        data: countsByType,
      });
    } else {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid platform. Please provide valid platform",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

// Function to convert date string to Unix timestamp
const convertToTimestamp = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return Math.floor(new Date(year, month - 1, day).getTime() / 1000); // Month is 0-indexed in JavaScript Date
};

module.exports = mostDiscussed;
