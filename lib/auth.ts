import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Server-side: текущая сессия или null.
 */
export async function getSession() {
  return auth();
}

/**
 * Server-side: профиль текущего пользователя из сессии или null.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Server-side: требовать авторизацию; иначе редирект на /login.
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

/**
 * Server-side: id текущего пользователя или null.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Server-side: проверка, что пользователь — владелец ресурса.
 */
export function isOwner(ownerId: string, userId: string): boolean {
  return ownerId === userId;
}
