const axios = require("axios");
const cheerio = require("cheerio");
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
  const year = dateParts[3].replace(",", "");
  const month = months[dateParts[2]];
  const day = dateParts[1];
  const time = dateParts[4];
  const formattedDate = `${year}-${month}-${day} ${time}`;

  return formattedDate;
}

const base_url = "https://beritajatim.com/kanal/hukum-kriminal/";

async function getData(page) {
  let url = base_url;
  let result = [];

  if (page) {
    url = base_url + "page/" + page;
  }

  console.log(url);

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const isi = $(".berita-list").children(".berita");
    // console.log(isi);

    isi.each((i, e) => {
      const title = $(e)
        .children("aside")
        .children("h3")
        .children("a")
        .text()
        .replace("\n", "");

      if (title != "") {
        const imageSrc = $(e)
          .children("figure")
          .children("picture")
          .children("a")
          .children("img")
          .attr("src");

        const time = $(e).children("aside").children("time").text().trim();

        const date = convertDate(time);

        const link = $(e)
          .children("aside")
          .children("h3")
          .children("a")
          .attr("href");

        const linkSplit = link.split("/");
        // console.log(linkSplit);
        const slug = linkSplit[4];

        result.push({
          title: title,
          imageSrc: imageSrc,
          date: date,
          link: link,
          slug: slug,
        });
      }
    });
  } catch (error) {
    console.log(error);
    result = { error: error.message };
  }
  return result;
}

module.exports = {
  getData: getData,
};
