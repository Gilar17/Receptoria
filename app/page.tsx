import { withDb } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const notes = await withDb("home-notes", (prisma) =>
    prisma.note.findMany({
      orderBy: { createdAt: "desc" },
    }),
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Receptoria
        </h1>
        <p className="text-zinc-600">
          Сервис по обмену рецептами. Ниже — заметки из PostgreSQL (Neon).
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-900">Заметки</h2>

        {notes.length === 0 ? (
          <p className="text-zinc-500">
            Пока нет записей. Выполните seed:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
              npx prisma db seed
            </code>
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 border border-zinc-200">
            {notes.map((note) => (
              <li key={note.id} className="flex flex-col gap-1 px-4 py-3">
                <span className="font-medium text-zinc-900">{note.content}</span>
                <span className="text-sm text-zinc-500">
                  {note.createdAt.toLocaleString("ru-RU")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
