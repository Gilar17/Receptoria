"use client";

import { signOutAction } from "@/app/dashboard/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction} className="w-full">
      <button
        type="submit"
        className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        Выйти
      </button>
    </form>
  );
}
