import { notFound } from "next/navigation";
import { updateRowAction } from "@/app/view-db/actions";
import { RecordForm } from "@/app/view-db/_components/record-form";
import { ViewDbShell } from "@/app/view-db/_components/view-db-shell";
import {
  fetchRecord,
  getTableColumns,
  isDbTarget,
  isViewDbTableName,
} from "@/lib/view-db";

export const dynamic = "force-dynamic";

type EditRecordPageProps = {
  params: Promise<{ table: string; id: string }>;
  searchParams: Promise<{ target?: string; page?: string }>;
};

export default async function EditRecordPage({
  params,
  searchParams,
}: EditRecordPageProps) {
  const { table, id } = await params;
  const query = await searchParams;

  if (!isDbTarget(query.target)) {
    notFound();
  }

  const tableName = decodeURIComponent(table);
  const recordId = decodeURIComponent(id);

  if (!isViewDbTableName(tableName)) {
    notFound();
  }

  const target = query.target;
  const page = query.page ?? "1";
  let record: Record<string, unknown> | null = null;
  let error: string | null = null;

  try {
    record = await fetchRecord(target, tableName, recordId);
  } catch (caught) {
    error =
      caught instanceof Error ? caught.message : "Не удалось загрузить запись";
  }

  if (!record && !error) {
    notFound();
  }

  const fields = getTableColumns(tableName);
  const cancelHref = `/view-db/${encodeURIComponent(tableName)}?target=${target}&page=${page}`;

  return (
    <ViewDbShell target={target} currentPath={`/view-db/${tableName}/${recordId}/edit`}>
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Изменить запись — {tableName}</h2>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}
        {record && (
          <RecordForm
            action={updateRowAction}
            fields={fields}
            target={target}
            table={tableName}
            recordId={recordId}
            initialValues={record}
            submitLabel="Сохранить"
            cancelHref={cancelHref}
          />
        )}
      </section>
    </ViewDbShell>
  );
}
