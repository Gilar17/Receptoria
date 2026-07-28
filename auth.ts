import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

/**
 * Полная конфигурация Auth.js (NextAuth v5) для server-side.
 *
 * - PrismaAdapter: пользователь создаётся в БД при первом входе через Google.
 * - session.strategy = "database": server-side сессии в таблице Session.
 * - session.user.id: стабильный User.id для ownerId рецептов.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
