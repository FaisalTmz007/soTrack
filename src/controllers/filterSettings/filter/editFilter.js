const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const editFilter = async (req, res) => {
  const { id } = req.params;
  const { parameter, is_active } = req.body;
  const accessToken = req.headers["authorization"];

  try {
    // Check if access token is present
    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Access token missing" });
    }

    // Verify access token
    const decoded = jwt.verify(
      accessToken.split(" ")[1],
      process.env.ACCESS_TOKEN_SECRET
    );

    // Find filter by ID and user ID
    const filter = await prisma.filter.findFirst({
      where: {
        id,
        userId: decoded.id,
      },
    });

    // Check if filter exists and user is authorized
    if (!filter) {
      return res.status(403).json({
        error: "Access denied",
        message: "Filter not found or unauthorized",
      });
    }

    // Prepare update data
    const updateData = {};
    if (parameter) {
      updateData.parameter = parameter;
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    // Check if valid fields are provided for update
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ error: "Bad Request", message: "No valid fields to update" });
    }

    // Perform filter update
    const filterUpdate = await prisma.filter.update({
      where: { id },
      data: updateData,
    });

    // Return success response
    return res.status(200).json({
      message: "Filter has been updated",
      statusCode: 200,
      data: filterUpdate,
    });
  } catch (error) {
    // Handle errors
    return res
      .status(400)
      .json({ error: "An error has occurred", message: error.message });
  }
};

module.exports = editFilter;
