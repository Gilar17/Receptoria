import { notFound } from "next/navigation";
import { createRowAction } from "@/app/view-db/actions";
import { RecordForm } from "@/app/view-db/_components/record-form";
import { ViewDbShell } from "@/app/view-db/_components/view-db-shell";
import { getTableColumns, isDbTarget, isViewDbTableName } from "@/lib/view-db";

export const dynamic = "force-dynamic";

type NewRecordPageProps = {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ target?: string }>;
};

export default async function NewRecordPage({
  params,
  searchParams,
}: NewRecordPageProps) {
  const { table } = await params;
  const query = await searchParams;

  if (!isDbTarget(query.target)) {
    notFound();
  }

  const tableName = decodeURIComponent(table);

  if (!isViewDbTableName(tableName)) {
    notFound();
  }

  const target = query.target;
  const fields = getTableColumns(tableName);

  return (
    <ViewDbShell target={target} currentPath={`/view-db/${tableName}/new`}>
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Создать запись — {tableName}</h2>
        <RecordForm
          action={createRowAction}
          fields={fields}
          target={target}
          table={tableName}
          submitLabel="Создать"
          cancelHref={`/view-db/${encodeURIComponent(tableName)}?target=${target}`}
        />
      </section>
    </ViewDbShell>
  );
}
