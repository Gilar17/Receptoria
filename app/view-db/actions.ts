"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRecord,
  deleteRecord,
  isDbTarget,
  isViewDbTableName,
  updateRecord,
  type DbTarget,
  type ViewDbTableName,
} from "@/lib/view-db";

function buildRedirectPath(table: ViewDbTableName, target: DbTarget, page?: number) {
  const params = new URLSearchParams({ target });
  if (page && page > 1) {
    params.set("page", String(page));
  }
  return `/view-db/${table}?${params.toString()}`;
}

function parseActionParams(formData: FormData) {
  const targetRaw = String(formData.get("target") ?? "");
  const tableRaw = String(formData.get("table") ?? "");

  if (!isDbTarget(targetRaw) || !isViewDbTableName(tableRaw)) {
    throw new Error("Некорректные параметры");
  }

  return { target: targetRaw, table: tableRaw };
}

export async function createRowAction(formData: FormData) {
  const { target, table } = parseActionParams(formData);

  await createRecord(target, table, formData);
  revalidatePath("/view-db");
  revalidatePath(`/view-db/${table}`);
  redirect(buildRedirectPath(table, target));
}

export async function updateRowAction(formData: FormData) {
  const { target, table } = parseActionParams(formData);
  const id = formData.get("id");

  if (!id) {
    throw new Error("Некорректные параметры");
  }

  await updateRecord(target, table, String(id), formData);
  revalidatePath("/view-db");
  revalidatePath(`/view-db/${table}`);
  redirect(buildRedirectPath(table, target));
}

export async function deleteRowAction(formData: FormData) {
  const { target, table } = parseActionParams(formData);
  const id = formData.get("id");
  const page = Number(formData.get("page") ?? "1");

  if (!id) {
    throw new Error("Некорректные параметры");
  }

  await deleteRecord(target, table, String(id));
  revalidatePath("/view-db");
  revalidatePath(`/view-db/${table}`);
  redirect(buildRedirectPath(table, target, page));
}
