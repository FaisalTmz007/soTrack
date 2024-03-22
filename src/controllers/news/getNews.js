const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const beritajatim = require("../../utils/news-scraping/beritajatim");
const detikjatim = require("../../utils/news-scraping/detikjatim");
const jpnnjatim = require("../../utils/news-scraping/jpnnjatim");
const zonajatim = require("../../utils/news-scraping/zonajatim");

const getNews = async (req, res) => {
  try {
    if (req.query.page) {
      const page = req.query.page;
      const beritajatimData = await beritajatim.getData(page);
      const detikjatimData = await detikjatim.getData(page);
      const jpnnjatimData = await jpnnjatim.getData(page);
      const zonajatimData = await zonajatim.getData(page);

      // merge all data
      const data = [
        ...beritajatimData,
        ...detikjatimData,
        ...jpnnjatimData,
        ...zonajatimData,
      ];

      // order data by date
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({
        message: "News has been fetched",
        statusCode: 200,
        data,
      });
    } else {
      const beritajatimData = await beritajatim.getData();
      const detikjatimData = await detikjatim.getData();
      const jpnnjatimData = await jpnnjatim.getData();
      const zonajatimData = await zonajatim.getData();

      // merge all data
      const data = [
        ...beritajatimData,
        ...detikjatimData,
        ...jpnnjatimData,
        ...zonajatimData,
      ];

      //   console.log(data);

      // store to db
      data.forEach(async (news) => {
        const newsExist = await prisma.Post.findUnique({
          where: {
            caption: news.title,
          },
        });

        if (!newsExist) {
          await prisma.Post.create({
            data: {
              caption: news.title,
              media_url: news.imgSrc,
              published_at: new Date(news.date),
              post_url: news.link,
              platform_id: "fc595eb6-342b-4ee5-b277-d44fdc9cf74d",
            },
          });
          //   console.log("News has been stored");
        }
      });

      // order data by date
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({
        message: "News has been fetched",
        statusCode: 200,
        data,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = getNews;
