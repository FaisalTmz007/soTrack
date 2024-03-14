const { PrismaClient } = require("@prisma/client");
const hashPassword = require("../utils/hashPassword");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      {
        email: "example01@gmail.com",
        password: hashPassword("example01"),
      },
      {
        email: "example02@gmail.com",
        password: hashPassword("example02"),
      },
    ],
  });

  // add multiple platform
  await prisma.platform.createMany({
    data: [
      {
        name: "Facebook",
      },
      {
        name: "Instagram",
      },
      {
        name: "Twitter",
      },
    ],
  });

  await prisma.category.createMany({
    data: [
      {
        name: "Keyword",
      },
      {
        name: "Mention",
      },
      {
        name: "Topic",
      },
    ],
  });
}

main()
  .then(async () => {
    console.log("Seed has been added");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
