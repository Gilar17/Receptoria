"use client";

import { useState } from "react";
import { RecipeDialog } from "@/app/dashboard/_components/recipe-dialog";

type RecipeCreateButtonProps = {
  children: React.ReactNode;
};

export function RecipeCreateButton({ children }: RecipeCreateButtonProps) {
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
      <RecipeDialog open={open} onOpenChange={setOpen} mode="create" />
    </>
  );
}
