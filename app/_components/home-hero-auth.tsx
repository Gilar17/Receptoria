import { getCurrentUserId } from "@/lib/auth";
import { HomeHero } from "@/app/_components/home-hero";

export async function HomeHeroAuth() {
  const currentUserId = await getCurrentUserId();
  return <HomeHero isAuthenticated={Boolean(currentUserId)} />;
}
