import type { PrismaClient } from "@prisma/client";

export const VIEW_DB_TABLE_NAMES = [
  "User",
  "Note",
  "Category",
  "Recipe",
  "Tag",
  "Vote",
] as const;

export type ViewDbTableName = (typeof VIEW_DB_TABLE_NAMES)[number];

export type FieldType = "string" | "number" | "boolean" | "datetime" | "enum";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  enumValues?: string[];
  readOnlyOnCreate?: boolean;
  readOnlyOnEdit?: boolean;
  displayFormat?: "ru-datetime";
};

export type TableConfig = {
  label: string;
  orderBy: Record<string, "asc" | "desc">;
  fields: FieldConfig[];
};

export const VIEW_DB_TABLES: Record<ViewDbTableName, TableConfig> = {
  User: {
    label: "User",
    orderBy: { createdAt: "asc" },
    fields: [
      { name: "id", label: "ID", type: "string", readOnlyOnCreate: true, readOnlyOnEdit: true },
      { name: "email", label: "EMAIL", type: "string", required: true },
      { name: "name", label: "NAME", type: "string" },
      { name: "createdAt", label: "CREATEDAT", type: "datetime", readOnlyOnCreate: true, readOnlyOnEdit: true },
    ],
  },
  Note: {
    label: "Note",
    orderBy: { createdAt: "asc" },
    fields: [
      { name: "id", label: "ID", type: "string", readOnlyOnCreate: true, readOnlyOnEdit: true },
      { name: "content", label: "CONTENT", type: "string", required: true },
      { name: "ownerId", label: "OWNERID", type: "string", required: true },
      { name: "createdAt", label: "CREATEDAT", type: "datetime", readOnlyOnCreate: true, readOnlyOnEdit: true },
      { name: "updatedAt", label: "UPDATEDAT", type: "datetime", readOnlyOnCreate: true, readOnlyOnEdit: true },
    ],
  },
  Category: {
    label: "Category",
    orderBy: { category: "asc" },
    fields: [
      { name: "id", label: "ID", type: "string", readOnlyOnCreate: true, readOnlyOnEdit: true },
      { name: "category", label: "CATEGORY", type: "string", required: true },
    ],
  },
  Recipe: {
    label: "Recipe",
    orderBy: { createdAt: "desc" },
    fields: [
      { name: "id", label: "ID", type: "string", readOnlyOnCreate: true, readOnlyOnEdit: true },
      { name: "title", label: "TITLE", type: "string", required: true },
      { name: "content", label: "CONTENT", type: "string", required: true },
      { name: "description", label: "DESCRIPTION", type: "string" },
      { name: "visibility", label: "VISIBILITY", type: "enum", enumValues: ["PRIVATE", "PUBLIC"], required: true },
      { name: "ownerId", label: "OWNERID", type: "string", required: true },
      { name: "categoryId", label: "CATEGORYID", type: "string", required: true },
      { name: "createdAt", label: "CREATEDAT", type: "datetime", readOnlyOnCreate: true, readOnlyOnEdit: true },
      { name: "updatedAt", label: "UPDATEDAT", type: "datetime", readOnlyOnCreate: true, readOnlyOnEdit: true },
      { name: "publishedAt", label: "PUBLISHEDAT", type: "datetime" },
    ],
  },
  Tag: {
    label: "Tag",
    orderBy: { name: "asc" },
    fields: [
      { name: "id", label: "ID", type: "string", readOnlyOnCreate: true, readOnlyOnEdit: true },
      { name: "name", label: "NAME", type: "string", required: true },
      {
        name: "createdAt",
        label: "CREATED AT",
        type: "datetime",
        readOnlyOnCreate: true,
        readOnlyOnEdit: true,
        displayFormat: "ru-datetime",
      },
    ],
  },
  Vote: {
    label: "Vote",
    orderBy: { createdAt: "asc" },
    fields: [
      { name: "id", label: "ID", type: "string", readOnlyOnCreate: true, readOnlyOnEdit: true },
      { name: "userId", label: "USERID", type: "string", required: true },
      { name: "recipeId", label: "RECIPEID", type: "string", required: true },
      { name: "value", label: "VALUE", type: "number", required: true },
      { name: "createdAt", label: "CREATEDAT", type: "datetime", readOnlyOnCreate: true, readOnlyOnEdit: true },
    ],
  },
};

export function isViewDbTableName(name: string): name is ViewDbTableName {
  return VIEW_DB_TABLE_NAMES.includes(name as ViewDbTableName);
}

type ModelDelegate = {
  findMany: (args: {
    skip: number;
    take: number;
    orderBy: Record<string, "asc" | "desc">;
  }) => Promise<Record<string, unknown>[]>;
  count: () => Promise<number>;
  findUnique: (args: {
    where: { id: string };
  }) => Promise<Record<string, unknown> | null>;
  create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<Record<string, unknown>>;
  delete: (args: { where: { id: string } }) => Promise<Record<string, unknown>>;
};

export function getModelDelegate(
  prisma: PrismaClient,
  tableName: ViewDbTableName,
): ModelDelegate {
  const delegates: Record<ViewDbTableName, ModelDelegate> = {
    User: prisma.user as unknown as ModelDelegate,
    Note: prisma.note as unknown as ModelDelegate,
    Category: prisma.category as unknown as ModelDelegate,
    Recipe: prisma.recipe as unknown as ModelDelegate,
    Tag: prisma.tag as unknown as ModelDelegate,
    Vote: prisma.vote as unknown as ModelDelegate,
  };

  return delegates[tableName];
}
