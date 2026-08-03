import { HomeHero } from "@/app/_components/home-hero";
import { HomeHeroAuth } from "@/app/_components/home-hero-auth";
import { HomeRecipeSections } from "@/app/_components/home-recipe-sections";
import { HomeRecipeSectionsSkeleton } from "@/app/_components/home-recipe-sections-skeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Suspense fallback={<HomeHero isAuthenticated={false} />}>
        <HomeHeroAuth />
      </Suspense>
      <Suspense fallback={<HomeRecipeSectionsSkeleton />}>
        <HomeRecipeSections />
      </Suspense>
    </div>
  );
}
