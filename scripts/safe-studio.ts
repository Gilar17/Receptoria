import { config } from "dotenv";
import { createServer } from "node:http";
import { URL } from "node:url";
import {
  fetchTableRows,
  getDbTargetEnvLabel,
  getDbTargetLabel,
  isDbTarget,
  isSystemTable,
  listTables,
  type DbTarget,
} from "@/lib/view-db";

config();

const PORT = 5555;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (value instanceof Date) {
    return value.toLocaleString("ru-RU");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; background: #fafafa; color: #18181b; }
    main { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
    h1 { font-size: 1.75rem; margin: 0 0 0.5rem; }
    p { color: #52525b; }
    .cards { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin: 1.5rem 0; }
    .card { display: block; padding: 1rem 1.25rem; border-radius: 0.75rem; border: 1px solid #e4e4e7; background: #fff; text-decoration: none; color: inherit; }
    .card.active { background: #2563eb; border-color: #2563eb; color: #fff; }
    .card.active small { color: #dbeafe; }
    .card small { display: block; margin-top: 0.25rem; color: #71717a; font-size: 0.875rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.75rem 1rem; border-radius: 0.75rem; }
    .notice { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 0.75rem 1rem; border-radius: 0.75rem; margin-bottom: 1rem; font-size: 0.875rem; }
    ul { list-style: none; padding: 0; margin: 0; border: 1px solid #e4e4e7; border-radius: 0.75rem; overflow: hidden; background: #fff; }
    li { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.875rem 1rem; border-bottom: 1px solid #f4f4f5; }
    li:last-child { border-bottom: 0; }
    .btn { display: inline-block; padding: 0.5rem 1rem; border-radius: 0.5rem; background: #2563eb; color: #fff; text-decoration: none; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e4e4e7; border-radius: 0.75rem; overflow: hidden; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f4f4f5; font-size: 0.875rem; vertical-align: top; }
    th { background: #f4f4f5; font-weight: 600; }
    .table-wrap { overflow-x: auto; }
    a.back { color: #71717a; font-size: 0.875rem; }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

function targetCards(active: DbTarget | null): string {
  const targets: DbTarget[] = ["local", "work"];

  return targets
    .map((target) => {
      const label = getDbTargetLabel(target);
      const envLabel = getDbTargetEnvLabel(target);
      const className = active === target ? "card active" : "card";
      return `<a class="${className}" href="/?target=${target}">
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(envLabel)}</small>
      </a>`;
    })
    .join("");
}

async function renderHome(target: DbTarget | null): Promise<string> {
  let tablesHtml = "";
  let errorHtml = "";

  if (target) {
    try {
      const tables = await listTables(target);

      if (tables.length === 0) {
        tablesHtml = "<p>Таблицы не найдены.</p>";
      } else {
        const items = tables
          .map(
            (table) => `<li>
              <div>
                <strong>${escapeHtml(table.name)}</strong><br />
                <small>${table.rowCount} записей</small>
              </div>
              <a class="btn" href="/table/${encodeURIComponent(table.name)}?target=${target}">Открыть</a>
            </li>`,
          )
          .join("");

        tablesHtml = `<h2>Таблицы — ${escapeHtml(getDbTargetLabel(target))}</h2><ul>${items}</ul>`;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось подключиться к БД";
      errorHtml = `<div class="error">${escapeHtml(message)}</div>`;
    }
  }

  return page(
    "Receptoria — просмотр базы данных",
    `<p class="notice">Безопасный просмотр БД для Neon. Prisma Studio здесь не используется — он падает при загрузке связей (P1017).</p>
     <h1>Receptoria — просмотр базы данных</h1>
     <p>Выберите локальную или рабочую БД, затем откройте нужную таблицу.</p>
     <div class="cards">${targetCards(target)}</div>
     ${errorHtml}
     ${tablesHtml}`,
  );
}

async function renderTable(tableName: string, target: DbTarget): Promise<string> {
  if (isSystemTable(tableName)) {
    return page(
      tableName,
      `<p><a class="back" href="/?target=${target}">← Назад к списку таблиц</a></p>
       <div class="error">Служебная таблица недоступна для просмотра</div>`,
    );
  }

  try {
    const rows = await fetchTableRows(target, tableName);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    let tableHtml = "<p>Таблица пустая.</p>";

    if (rows.length > 0) {
      const head = columns.map((col) => `<th>${escapeHtml(col)}</th>`).join("");
      const body = rows
        .map((row) => {
          const cells = columns
            .map(
              (col) =>
                `<td>${escapeHtml(formatCell(row[col]))}</td>`,
            )
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      tableHtml = `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    }

    return page(
      tableName,
      `<p><a class="back" href="/?target=${target}">← Назад к списку таблиц</a></p>
       <h1>${escapeHtml(tableName)}</h1>
       <p>${escapeHtml(getDbTargetLabel(target))}</p>
       ${tableHtml}`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось загрузить таблицу";

    return page(
      tableName,
      `<p><a class="back" href="/?target=${target}">← Назад к списку таблиц</a></p>
       <h1>${escapeHtml(tableName)}</h1>
       <div class="error">${escapeHtml(message)}</div>`,
    );
  }
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? `localhost:${PORT}`;
    const url = new URL(req.url ?? "/", `http://${host}`);
    const targetParam = url.searchParams.get("target");
    const target = isDbTarget(targetParam ?? undefined) ? targetParam : null;

    if (url.pathname === "/") {
      const html = await renderHome(target);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    const tableMatch = url.pathname.match(/^\/table\/([^/]+)$/);
    if (tableMatch && target) {
      const tableName = decodeURIComponent(tableMatch[1]);
      const html = await renderTable(tableName, target);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(message);
  }
});

server.listen(PORT, () => {
  console.log("Prisma Studio нестабилен с Neon (P1017 при загрузке связей).");
  console.log(`Безопасный просмотр БД: http://localhost:${PORT}`);
  console.log("Выберите «Рабочая БД (Neon)» и откройте нужную таблицу.");
});
