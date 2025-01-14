const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const editFilter = async (req, res) => {
  const { id } = req.params;
  const { parameter, is_active } = req.body;
  const refresh_token = req.cookies.refresh_token;

  try {
    // Check if access token is present
    if (!refresh_token) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Refresh token missing" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    // Find filter by ID and user ID
    const filter = await prisma.filter.findFirst({
      where: {
        id,
      },
    });

    // Check if filter exists and user is authorized
    if (!filter || filter.user_id !== decoded.id) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Filter not found" });
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
