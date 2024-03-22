const axios = require("axios");
const cheerio = require("cheerio");
const e = require("express");
const moment = require("moment");
moment.locale("id");

function convertDate(dateString) {
  const months = {
    Januari: "01",
    Februari: "02",
    Maret: "03",
    April: "04",
    Mei: "05",
    Juni: "06",
    Juli: "07",
    Agustus: "08",
    September: "09",
    Oktober: "10",
    November: "11",
    Desember: "12",
  };

  const dateParts = dateString.split(" ");
  const year = dateParts[2];
  const month = months[dateParts[1]];
  const day = dateParts[0];
  // Assuming default time values
  const time = "00:00:00.000";

  const formattedDate = `${year}-${month}-${day} ${time}`;
  return formattedDate;
}

const base_url = "https://zonajatim.com/category/kriminal/";

async function getData(page) {
  let url = base_url;
  let result = [];

  if (page) {
    url = base_url + "page/" + page;
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const isi = $(".jeg_posts>.jeg_post");

    isi.each((i, e) => {
      const title = $(e)
        .children(".jeg_postblock_content")
        .children(".jeg_post_title")
        .children("a")
        .text()
        .replace("\n", "")
        .trim();

      const imgSrc = $(e)
        .children(".jeg_thumb")
        .children("a")
        .children(".thumbnail-container")
        .children("img")
        .attr("data-src");

      const time = $(e)
        .children(".jeg_postblock_content")
        .children(".jeg_post_meta")
        .children(".jeg_meta_date")
        .children("a")
        .text()
        .trim();

      const date = convertDate(time);

      const link = $(e)
        .children(".jeg_postblock_content")
        .children(".jeg_post_title")
        .children("a")
        .attr("href");

      result.push({
        title: title,
        imgSrc: imgSrc,
        date: date,
        link: link,
      });
    });
  } catch (error) {
    console.error(error);
    result = { error: error };
  }
  return result;
}

module.exports = {
  getData: getData,
};
