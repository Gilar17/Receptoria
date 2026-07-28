import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Стабильный id из таблицы User — используйте для ownerId / userId */
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    id: string;
  }
}

export {};
