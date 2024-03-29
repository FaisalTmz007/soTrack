const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const criminalType = async (req, res) => {
  const { from, to } = req.query;

  try {
    const data = await prisma.Post.findMany({
      where: {
        published_at: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
    });

    // Count crime types in Post table based on published_at with query params from and to
    const countsByType = data.reduce((acc, post) => {
      const crimeType = post.crime_type;
      if (!acc[crimeType]) acc[crimeType] = 0;
      acc[crimeType]++;
      return acc;
    }, {});

    res.json({
      message: "Data has been fetched",
      statusCode: 200,
      data: countsByType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = criminalType;
