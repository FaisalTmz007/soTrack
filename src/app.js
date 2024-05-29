const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const session = require("express-session");
const axios = require("axios");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const authRoute = require("./routes/auth/authRoute");
const facebookAuthRoute = require("./routes/auth/facebookAuthRoute");
const categoryRoute = require("./routes/filterSettings/category/categoryRoute");
const filterRoute = require("./routes/filterSettings/filter/filterRoute");
const platformRoute = require("./routes/filterSettings/platform/platformRoute");
const dashboardRoute = require("./routes/dashboard/dashboardRoute");
const timelineRoute = require("./routes/timeline/timelineRoute");
const broadcastRoute = require("./routes/broadcast/broadcastRoute");
const publicReportRoute = require("./routes/publicReport/publicReportRoute");
const facebookRoute = require("./routes/posts/facebook/facebookRoute");
const getNews = require("./controllers/posts/news/getNews");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
};

// middlewares
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
    // cookie: { maxAge: 2 * 30 * 24 * 60 * 60 * 1000 }, // 2 months
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

app.use(express.json());
app.use(cors(corsOptions));
app.use(
  morgan("short", {
    skip: function (req, res) {
      return req.url.includes(process.env.FLASK_URL);
    },
  })
);
// app.use(morgan("short"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public/uploads"));

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? process.env.FACEBOOK_CALLBACK_URL_PROD
          : process.env.FACEBOOK_CALLBACK_URL_DEV,
      profileFields: ["id", "emails", "name"],
      passReqToCallback: true,
    },
    async function (req, accessToken, refreshToken, profile, cb) {
      // console.log(profile.emails[0].value);
      const state = JSON.parse(req.query.state);
      const user_id = state.id;
      console.log("🚀 ~ user_id:", user_id);

      let user = await prisma.User.findUnique({
        where: {
          facebook_id: profile.id,
        },
      });

      if (!user) {
        console.log("Adding new facebook user to DB..");
        user = await prisma.User.findUnique({
          where: {
            id: user_id,
          },
        });

        if (!user) {
          // Redirect to error route with message
          return cb(null, false);
        }

        user = await prisma.User.update({
          where: {
            id: user_id,
          },
          data: {
            facebook_id: profile.id,
          },
        });

        const pageListsResponse = await axios.get(
          `https://graph.facebook.com/v19.0/${profile.id}/accounts`,
          {
            params: {
              fields: "id,name,access_token,instagram_business_account",
              access_token: accessToken,
            },
          }
        );

        const fbPlatform = await prisma.Platform.findUnique({
          where: {
            name: "Facebook",
          },
        });

        const igPlatform = await prisma.Platform.findUnique({
          where: {
            name: "Instagram",
          },
        });

        const category = await prisma.Category.findUnique({
          where: {
            name: "Mention",
          },
        });

        // Process pages
        const pages = pageListsResponse.data.data;

        await Promise.all(
          pages.map(async (page) => {
            const pageExist = await prisma.Filter.findFirst({
              where: {
                parameter: page.name,
                platform_id: fbPlatform.id,
              },
            });

            if (!pageExist) {
              await prisma.Filter.create({
                data: {
                  id: page.id,
                  parameter: page.name,
                  platform_id: fbPlatform.id,
                  category_id: category.id,
                  User: {
                    connect: {
                      id: user_id,
                    },
                  },
                },
              });
            }

            if (page.instagram_business_account) {
              const igUsername = await axios.get(
                `https://graph.facebook.com/v19.0/${page.instagram_business_account.id}`,
                {
                  params: {
                    fields: "username",
                    access_token: page.access_token,
                  },
                }
              );

              const username = igUsername.data.username;

              const igExist = await prisma.Filter.findFirst({
                where: {
                  parameter: username,
                  platform_id: igPlatform.id,
                },
              });

              if (!igExist) {
                await prisma.Filter.create({
                  data: {
                    id: page.instagram_business_account.id,
                    parameter: username,
                    platform_id: igPlatform.id,
                    category_id: category.id,
                    User: {
                      connect: {
                        id: user_id,
                      },
                    },
                  },
                });
              }
            }
          })
        );

        // console.log(pages);

        // Attach accessToken to the user object
        user.accessToken = accessToken;
        // console.log("🚀 ~ cihuy:", accessToken);
        return cb(null, user);
      } else if (user_id === user.id) {
        console.log("Adding new facebook user to DB..");
        const pageListsResponse = await axios.get(
          `https://graph.facebook.com/v19.0/${profile.id}/accounts`,
          {
            params: {
              fields: "id,name,access_token,instagram_business_account",
              access_token: accessToken,
            },
          }
        );

        const fbPlatform = await prisma.Platform.findUnique({
          where: {
            name: "Facebook",
          },
        });

        const igPlatform = await prisma.Platform.findUnique({
          where: {
            name: "Instagram",
          },
        });

        const category = await prisma.Category.findUnique({
          where: {
            name: "Mention",
          },
        });

        // Process pages
        const pages = pageListsResponse.data.data;

        await Promise.all(
          pages.map(async (page) => {
            const pageExist = await prisma.Filter.findFirst({
              where: {
                parameter: page.name,
                platform_id: fbPlatform.id,
              },
            });

            if (!pageExist) {
              await prisma.Filter.create({
                data: {
                  id: page.id,
                  parameter: page.name,
                  platform_id: fbPlatform.id,
                  category_id: category.id,
                  User: {
                    connect: {
                      id: user_id,
                    },
                  },
                },
              });
            }

            if (page.instagram_business_account) {
              const igUsername = await axios.get(
                `https://graph.facebook.com/v19.0/${page.instagram_business_account.id}`,
                {
                  params: {
                    fields: "username",
                    access_token: page.access_token,
                  },
                }
              );

              const username = igUsername.data.username;

              const igExist = await prisma.Filter.findFirst({
                where: {
                  parameter: username,
                  platform_id: igPlatform.id,
                },
              });

              if (!igExist) {
                await prisma.Filter.create({
                  data: {
                    id: page.instagram_business_account.id,
                    parameter: username,
                    platform_id: igPlatform.id,
                    category_id: category.id,
                    User: {
                      connect: {
                        id: user_id,
                      },
                    },
                  },
                });
              }
            }
          })
        );

        // console.log(pages);

        // Attach accessToken to the user object
        user.accessToken = accessToken;
        // console.log("🚀 ~ cihuy:", accessToken);
        return cb(null, user);
      } else {
        console.log("Facebook User already exists in DB..");
        return cb(null, false, {
          message: "Facebook User already exists in DB.",
        });
      }

      // const pageListsResponse = await axios.get(
      //   `https://graph.facebook.com/v19.0/${profile.id}/accounts`,
      //   {
      //     params: {
      //       fields: "id,name,access_token,instagram_business_account",
      //       access_token: accessToken,
      //     },
      //   }
      // );

      // const fbPlatform = await prisma.Platform.findUnique({
      //   where: {
      //     name: "Facebook",
      //   },
      // });

      // const igPlatform = await prisma.Platform.findUnique({
      //   where: {
      //     name: "Instagram",
      //   },
      // });

      // const category = await prisma.Category.findUnique({
      //   where: {
      //     name: "Mention",
      //   },
      // });

      // // Process pages
      // const pages = pageListsResponse.data.data;

      // await Promise.all(
      //   pages.map(async (page) => {
      //     const pageExist = await prisma.Filter.findFirst({
      //       where: {
      //         parameter: page.name,
      //         platform_id: fbPlatform.id,
      //       },
      //     });

      //     if (!pageExist) {
      //       await prisma.Filter.create({
      //         data: {
      //           id: page.id,
      //           parameter: page.name,
      //           platform_id: fbPlatform.id,
      //           category_id: category.id,
      //           User: {
      //             connect: {
      //               id: user_id,
      //             },
      //           },
      //         },
      //       });
      //     }

      //     if (page.instagram_business_account) {
      //       const igUsername = await axios.get(
      //         `https://graph.facebook.com/v19.0/${page.instagram_business_account.id}`,
      //         {
      //           params: {
      //             fields: "username",
      //             access_token: page.access_token,
      //           },
      //         }
      //       );

      //       const username = igUsername.data.username;

      //       const igExist = await prisma.Filter.findFirst({
      //         where: {
      //           parameter: username,
      //           platform_id: igPlatform.id,
      //         },
      //       });

      //       if (!igExist) {
      //         await prisma.Filter.create({
      //           data: {
      //             id: page.instagram_business_account.id,
      //             parameter: username,
      //             platform_id: igPlatform.id,
      //             category_id: category.id,
      //             User: {
      //               connect: {
      //                 id: user_id,
      //               },
      //             },
      //           },
      //         });
      //       }
      //     }
      //   })
      // );

      // // console.log(pages);

      // // Attach accessToken to the user object
      // user.accessToken = accessToken;
      // // console.log("🚀 ~ cihuy:", accessToken);
      // return cb(null, user);
    }
  )
);

// default route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/news", getNews);

// auth route
app.use(authRoute);
app.use(facebookAuthRoute);

// filter settings
app.use(categoryRoute);
app.use(filterRoute);
app.use(platformRoute);
app.use(dashboardRoute);
app.use(timelineRoute);
app.use(publicReportRoute);

// sosmed route
app.use(facebookRoute);

// broadcast route
app.use(broadcastRoute);

// catch 404 and forward to error handler
app.use(function (req, res) {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.url}`,
    statusCode: 404,
  });
});

// Automate get news in 24 hours to /news
function makePeriodicRequest() {
  setInterval(async () => {
    try {
      // Make the request to the endpoint
      const response = await axios.get(
        `http://localhost:${process.env.PORT}/news`
      );
      console.log("Periodic request made successfully");
    } catch (error) {
      console.error("Error making periodic request:", error.message);
    }
  }, 1 * 60 * 60 * 1000); // 1 hours in milliseconds
}

makePeriodicRequest();

module.exports = app;
