import { withDb } from "@/lib/db-client";

async function main() {
  const users = await withDb("users", (prisma) =>
    prisma.user.findMany({
      select: { id: true, email: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  );

  const notes = await withDb("notes", (prisma) =>
    prisma.note.findMany({
      select: { id: true, title: true, ownerId: true },
      orderBy: { createdAt: "asc" },
    }),
  );

  const recipes = await withDb("recipes", (prisma) =>
    prisma.recipe.findMany({
      select: { id: true, title: true, ownerId: true },
      orderBy: { createdAt: "asc" },
    }),
  );

  const votes = await withDb("votes", (prisma) =>
    prisma.vote.findMany({
      select: { id: true, userId: true, recipeId: true, value: true },
      orderBy: { createdAt: "asc" },
    }),
  );

  console.log(`User (${users.length}):`);
  for (const user of users) {
    console.log(`  ${user.id} | ${user.email} | ${user.name ?? ""}`);
  }

  console.log(`\nNote (${notes.length}):`);
  for (const note of notes) {
    console.log(`  ${note.id} | ownerId=${note.ownerId} | ${note.title}`);
  }

  console.log(`\nRecipe (${recipes.length}):`);
  for (const recipe of recipes) {
    console.log(`  ${recipe.id} | ownerId=${recipe.ownerId} | ${recipe.title}`);
  }

  console.log(`\nVote (${votes.length}):`);
  for (const vote of votes) {
    console.log(`  ${vote.id} | userId=${vote.userId} | recipeId=${vote.recipeId}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
