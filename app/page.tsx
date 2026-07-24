import { fetchPortalStats } from "@/lib/mockApi";
import { HomePageClient } from "@/components/HomePageClient";

export const revalidate = 0; // Fresh real-time stats on every page request

export default async function HomePage() {
  const stats = await fetchPortalStats();
  return <HomePageClient initialStats={stats} />;
}
