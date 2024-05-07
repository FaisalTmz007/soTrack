const axios = require("axios");

const getCity = async (req, res) => {
  try {
    const province_id = req.query.province_id;

    const response = await axios.get(
      `https://api.rajaongkir.com/starter/city`,
      {
        headers: {
          key: process.env.RAJAONGKIR_KEY,
        },
        params: {
          province: province_id,
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

module.exports = getCity;
