import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.note.upsert({
    where: { id: "11111111-1111-4111-8111-111111111111" },
    update: { title: "Первая заметка Receptoria" },
    create: {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Первая заметка Receptoria",
    },
  });

  await prisma.note.upsert({
    where: { id: "22222222-2222-4222-8222-222222222222" },
    update: { title: "Идея для нового рецепта" },
    create: {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Идея для нового рецепта",
    },
  });

  await prisma.note.upsert({
    where: { id: "33333333-3333-4333-8333-333333333333" },
    update: { title: "Список ингредиентов на неделю" },
    create: {
      id: "33333333-3333-4333-8333-333333333333",
      title: "Список ингредиентов на неделю",
    },
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
