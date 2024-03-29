const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const translate = require("translate-google");
const axios = require("axios");
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

      //   console.log(data);

      // order data by date
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      const newsPlatform = await prisma.Platform.findUnique({
        where: {
          name: "News",
        },
      });

      const newsId = newsPlatform.id;

      // store to db
      data.forEach(async (news) => {
        const newsExist = await prisma.Post.findUnique({
          where: {
            caption: news.title,
          },
        });

        if (!newsExist) {
          // translate caption to english
          const translatedcaption = await translate(news.title, {
            from: "id",
            to: "en",
          });

          const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
            headline: translatedcaption,
          });
          // console.log(predict.data);
          await prisma.Post.create({
            data: {
              caption: news.title,
              media_url: news.imgSrc,
              published_at: new Date(news.date),
              crime_type: predict.data.prediction,
              post_url: news.link,
              platform_id: newsId,
            },
          });
          return;
        }
      });

      res.json({
        message: `News has been fetched for page ${page}`,
        statusCode: 200,
        data: data,
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

      // order data by date
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      const newsPlatform = await prisma.Platform.findUnique({
        where: {
          name: "News",
        },
      });

      const newsId = newsPlatform.id;

      // store to db
      data.forEach(async (news) => {
        const newsExist = await prisma.Post.findUnique({
          where: {
            caption: news.title,
          },
        });

        if (!newsExist) {
          // translate caption to english
          const translatedcaption = await translate(news.title, {
            from: "id",
            to: "en",
          });

          const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
            headline: translatedcaption,
          });
          // console.log(predict.data);
          await prisma.Post.create({
            data: {
              caption: news.title,
              media_url: news.imgSrc,
              published_at: new Date(news.date),
              crime_type: predict.data.prediction,
              post_url: news.link,
              platform_id: newsId,
            },
          });
          return;
        }
      });

      res.json({
        message: "News has been fetched",
        statusCode: 200,
        data: data,
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
