const axios = require("axios");
const cheerio = require("cheerio");
const e = require("express");
const moment = require("moment");
moment.locale("id");

function convertDate(dateString) {
  const months = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    Mei: "05",
    Jun: "06",
    Jul: "07",
    Agu: "08",
    Sep: "09",
    Okt: "10",
    Nov: "11",
    Des: "12",
  };

  const dateParts = dateString.split(" ");
  const year = dateParts[3];
  const month = months[dateParts[2]];
  const day = dateParts[1];
  const time = dateParts[4];
  const formattedDate = `${year}-${month}-${day} ${time}`;

  return formattedDate;
}

const base_url = "https://www.detik.com/jatim/hukum-kriminal/indeks";

async function getData(page) {
  let url = base_url;
  if (page) {
    url = base_url + "/" + page;
  }
  let result = [];
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const isi = $(".list-content__item");

    isi.each((i, e) => {
      const title = $(e).find(".media__title").text().replace("\n", "").trim();
      if (title != "") {
        const imgElement = $(e).find(".media__image img");
        const imageSrc = imgElement.attr("src");

        const time = $(e).find(".media__date").children("span").attr("title");

        const date = convertDate(time);

        const link = $(e).find(".media__link").attr("href");
        const linkSplit = link.split("/");
        const slug = "/" + linkSplit[5] + "/" + linkSplit[linkSplit.length - 1];

        result.push({
          title: title,
          imageSrc: imageSrc,
          date: date,
          link: link,
          slug: slug,
          source: "detikjatim",
        });
      }
    });
  } catch (error) {
    console.error(error);
    result = {
      error: error,
    };
  }
  return result;
}

async function getDetail(slug) {
  console.log(slug);
  const url =
    "https://www.detik.com/jatim/hukum-dan-kriminal/" + slug + "?single=1";
  let result = {};
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const title = $(".detail__title").text().trim();
    const content = $(".detail__body-text");

    let text = "";
    content.each((i, e) => {
      text += $(e).text().trim() + "\n";
    });

    result = {
      title: title,
      content: text,
    };
  } catch (error) {
    // console.error(error);
    result = {
      error: error,
    };
  }
  return result;
}

module.exports = {
  getData: getData,
  getDetail: getDetail,
};
