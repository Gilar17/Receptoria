import Link from "next/link";
import type { FieldConfig } from "@/lib/view-db";

type RecordFormProps = {
  action: (formData: FormData) => Promise<void>;
  fields: FieldConfig[];
  target: string;
  table: string;
  recordId?: string;
  initialValues?: Record<string, unknown>;
  submitLabel: string;
  cancelHref: string;
};

export function RecordForm({
  action,
  fields,
  target,
  table,
  recordId,
  initialValues = {},
  submitLabel,
  cancelHref,
}: RecordFormProps) {
  const editableFields = fields.filter((field) =>
    recordId ? !field.readOnlyOnEdit : !field.readOnlyOnCreate,
  );

  return (
    <form action={action} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="table" value={table} />
      {recordId && <input type="hidden" name="id" value={recordId} />}

      {editableFields.map((field) => {
        const value = initialValues[field.name];
        const stringValue =
          value === null || value === undefined ? "" : String(value);

        return (
          <label key={field.name} className="block space-y-1">
            <span className="text-sm font-medium text-zinc-700">{field.label}</span>
            {field.type === "enum" ? (
              <select
                name={field.name}
                defaultValue={stringValue || field.enumValues?.[0] || ""}
                required={field.required}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                {(field.enumValues ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.name === "content" ? (
              <textarea
                name={field.name}
                defaultValue={stringValue}
                required={field.required}
                rows={4}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            ) : (
              <input
                name={field.name}
                type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : "text"}
                defaultValue={
                  field.type === "datetime" && stringValue
                    ? stringValue.slice(0, 16)
                    : stringValue
                }
                required={field.required}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            )}
          </label>
        );
      })}

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
