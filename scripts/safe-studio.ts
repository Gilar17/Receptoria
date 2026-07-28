import { config } from "dotenv";
import { createServer } from "node:http";
import { URL } from "node:url";
import {
  fetchTablePage,
  formatCell,
  getDbTargetEnvLabel,
  getDbTargetLabel,
  getTableColumns,
  isDbTarget,
  isViewDbTableName,
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

function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background: #f7f4ef; color: #18181b; }
    main { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
    .card { display: block; padding: 1rem 1.25rem; border-radius: 0.75rem; border: 1px solid #e4e4e7; background: #fff; text-decoration: none; color: inherit; margin-bottom: 0.75rem; }
    .card.active { background: #2563eb; border-color: #2563eb; color: #fff; }
    .btn { display: inline-block; padding: 0.5rem 1rem; border-radius: 0.5rem; background: #2563eb; color: #fff; text-decoration: none; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e4e4e7; }
    th, td { padding: 0.75rem 1rem; border-bottom: 1px solid #f4f4f5; font-size: 0.875rem; text-align: left; }
    th { background: #f4f4f5; text-transform: uppercase; color: #64748b; font-size: 0.75rem; }
  </style>
</head>
<body><main>${body}</main></body></html>`;
}

async function renderHome(target: DbTarget | null): Promise<string> {
  let body = `<h1>Receptoria — просмотр базы данных</h1>
    <p>Используйте <a href="http://localhost:3000/view-db?target=work">http://localhost:3000/view-db</a> для полного CRUD.</p>`;

  if (!target) {
    return page("view-db", body);
  }

  try {
    const tables = await listTables(target);
    const items = tables
      .map(
        (table) =>
          `<div class="card"><strong>${escapeHtml(table.name)}</strong> — ${table.rowCount} записей
          <a class="btn" href="/table/${encodeURIComponent(table.name)}?target=${target}">Открыть</a></div>`,
      )
      .join("");

    body += items;
  } catch (error) {
    body += `<p>${escapeHtml(error instanceof Error ? error.message : "Ошибка")}</p>`;
  }

  return page("view-db", body);
}

async function renderTable(tableName: string, target: DbTarget): Promise<string> {
  if (!isViewDbTableName(tableName)) {
    return page(tableName, "<p>Таблица недоступна</p>");
  }

  const result = await fetchTablePage(target, tableName, 1);
  const columns = getTableColumns(tableName);
  const head = columns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join("");
  const rows = result.rows
    .map((row) => {
      const cells = columns
        .map((col) => `<td>${escapeHtml(formatCell(row[col.name]))}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return page(
    tableName,
    `<p><a href="/?target=${target}">← Назад</a></p>
     <h1>${escapeHtml(tableName)}</h1>
     <p>${escapeHtml(getDbTargetLabel(target))}</p>
     <table><thead><tr>${head}</tr></thead><tbody>${rows || "<tr><td>Пусто</td></tr>"}</tbody></table>`,
  );
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? `localhost:${PORT}`;
    const url = new URL(req.url ?? "/", `http://${host}`);
    const targetParam = url.searchParams.get("target");
    const target: DbTarget | null =
      targetParam && isDbTarget(targetParam) ? targetParam : null;

    if (url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(await renderHome(target));
      return;
    }

    const tableMatch = url.pathname.match(/^\/table\/([^/]+)$/);
    if (tableMatch && target) {
      const tableName = decodeURIComponent(tableMatch[1]);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(await renderTable(tableName, target));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(error instanceof Error ? error.message : "Internal error");
  }
});

server.listen(PORT, () => {
  console.log(`Безопасный просмотр БД: http://localhost:${PORT}`);
  console.log(`Полный CRUD: http://localhost:3000/view-db?target=work`);
});
