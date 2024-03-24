const express = require("express");
const axios = require("axios");
const getNews = require("../../controllers/news/getNews");
const app = express();

app.get("/news", getNews);

// Automate get news in 24 hours to /news
function makePeriodicRequest() {
  setInterval(async () => {
    try {
      // Make the request to the endpoint
      const response = await axios.get("http://localhost:3000/news");
      console.log("Periodic request made successfully");
    } catch (error) {
      console.error("Error making periodic request:", error.message);
    }
  }, 1 * 60 * 60 * 1000); // 1 hours in milliseconds
}

module.exports = makePeriodicRequest;
