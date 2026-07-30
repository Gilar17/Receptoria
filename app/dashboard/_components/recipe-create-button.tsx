"use client";

import { useState } from "react";
import { RecipeDialog } from "@/app/dashboard/_components/recipe-dialog";
import type { CategoryOption } from "@/lib/recipes/queries";

type RecipeCreateButtonProps = {
  children: React.ReactNode;
  categories: CategoryOption[];
};

export function RecipeCreateButton({
  children,
  categories,
}: RecipeCreateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="inline-flex"
      >
        {children}
      </div>
      <RecipeDialog
        open={open}
        onOpenChange={setOpen}
        mode="create"
        categories={categories}
      />
    </>
  );
}
