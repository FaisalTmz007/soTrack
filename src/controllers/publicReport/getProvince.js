const axios = require("axios");

const getProvince = async (req, res) => {
  try {
    // Make the HTTP request to retrieve provinces
    const response = await axios.get(
      "https://api.rajaongkir.com/starter/province",
      {
        headers: {
          key: process.env.RAJAONGKIR_KEY,
        },
      }
    );

    // Extract provinces from the response data
    const provinces = response.data.rajaongkir.results;

    // Send a successful response with the retrieved provinces
    res.status(200).json({
      message: "Provinces retrieved successfully",
      statusCode: 200,
      data: provinces,
    });
  } catch (error) {
    // Handle errors
    console.error("Error retrieving provinces:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while retrieving provinces",
    });
  }
};

module.exports = getProvince;
