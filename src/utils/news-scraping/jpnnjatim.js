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
  // Selasa, 19 Maret 2024 – 15:03 WIB

  const dateParts = dateString.split(" – ")[0].split(" ");
  const year = dateParts[3];
  const month = months[dateParts[2]];
  const day = dateParts[1];
  const time = dateString.split(" – ")[1].replace(" WIB", "");
  const formattedDate = `${year}-${month}-${day} ${time}`;

  return formattedDate;
}

const base_url = "https://jatim.jpnn.com/kriminal";

async function getData(page) {
  let url = base_url;
  let result = [];

  if (page) {
    url = base_url + "?page=" + page;
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const isi = $(".content-list>li");

    isi.each((i, e) => {
      const title = $(e)
        .children(".content-description")
        .children(".content")
        .children("h3")
        .children("a")
        .text()
        .replace("\n", "")
        .trim();

      if (title != "") {
        const imgSrc = $(e)
          .children(".content-picture")
          .children("a")
          .children("img")
          .attr("src");

        const time = $(e)
          .children(".content-description")
          .children(".content")
          .children("h6")
          .children("a")
          .children(".silver")
          .text();

        const date = convertDate(time);

        const link = $(e)
          .children(".content-description")
          .children(".content")
          .children("h3")
          .children("a")
          .attr("href");

        result.push({
          title: title,
          imgSrc: imgSrc,
          date: date,
          link: link,
          source: "jpnnjatim",
        });
      }
    });
  } catch (error) {
    console.error(error);
    result = {
      status: "error",
      message: error.message,
    };
  }
  return result;
}

module.exports = {
  getData: getData,
};
