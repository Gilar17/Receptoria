import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authPrisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

/**
 * Полная конфигурация Auth.js (NextAuth v5) для server-side.
 *
 * - PrismaAdapter: пользователь создаётся в БД при первом входе через Google.
 * - session.strategy = "jwt": cookie-сессия для middleware (Edge) + user.id в token.
 * - session.user.id: стабильный User.id для ownerId рецептов.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(authPrisma),
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
