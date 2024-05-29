const axios = require("axios");

const getCity = async (req, res) => {
  try {
    // Validate province ID
    const { province_id } = req.query;
    if (!province_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Province ID is required",
      });
    }

    // Make API request to retrieve cities
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

    // Check for errors in API response
    if (response.data.rajaongkir && response.data.rajaongkir.results) {
      res.json({
        message: "Success",
        statusCode: 200,
        data: response.data.rajaongkir.results,
      });
    } else {
      throw new Error("Invalid response from RajaOngkir API");
    }
  } catch (error) {
    console.error("Error retrieving cities:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while retrieving cities",
    });
  }
};

module.exports = getCity;
