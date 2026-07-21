import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.note.create({
    data: { title: "Первая заметка Receptoria" },
  });
  await prisma.note.create({
    data: { title: "Идея для нового рецепта" },
  });
  await prisma.note.create({
    data: { title: "Список ингредиентов на неделю" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
