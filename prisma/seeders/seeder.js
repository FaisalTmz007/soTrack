const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.Platform.createMany({
    data: [
      {
        name: "Facebook",
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
      },
      {
        name: "Instagram",
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg",
      },
      {
        name: "News",
        logo_url:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLe95jtEksMDjOer0AVQGEbcmsoK7XrvH3-nTweh9E&s",
      },
    ],
  }),
    await prisma.Category.createMany({
      data: [
        {
          name: "Keyword",
        },
        {
          name: "Mention",
        },
        {
          name: "Hashtag",
        },
      ],
    });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
