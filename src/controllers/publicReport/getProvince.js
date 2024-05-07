const axios = require("axios");

const getProvince = async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.rajaongkir.com/starter/province`,
      {
        headers: {
          key: process.env.RAJAONGKIR_KEY,
        },
      }
    );

    res.json({
      message: "Success",
      statusCode: 200,
      data: response.data.rajaongkir.results,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = getProvince;
