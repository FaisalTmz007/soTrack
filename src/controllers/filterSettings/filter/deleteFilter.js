const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const deleteFilter = async (req, res) => {
  const { id } = req.params;
  const refreshToken = req.cookies.refresh_token;

  try {
    // Check if refresh token is present
    if (!refreshToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Refresh token missing",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find filter by ID and user ID
    const filter = await prisma.filter.findUnique({
      where: {
        id,
      },
      select: {
        user_id: true,
      },
    });

    // Check if filter exists
    if (!filter) {
      return res.status(404).json({
        error: "Not Found",
        message: "Filter not found",
      });
    }

    // Check if user is authorized to delete the filter
    if (filter.user_id !== decoded.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not authorized to delete this filter",
      });
    }

    // Perform deletion
    const filterDelete = await prisma.filter.delete({
      where: {
        id,
      },
    });

    // Check if deletion was successful
    if (!filterDelete) {
      return res.status(404).json({
        error: "Not Found",
        message: "Filter not found",
      });
    }

    res.status(200).json({
      message: "Filter has been deleted",
      statusCode: 200,
      data: filterDelete,
    });
  } catch (error) {
    console.error("Error deleting filter:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while deleting the filter",
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = deleteFilter;
