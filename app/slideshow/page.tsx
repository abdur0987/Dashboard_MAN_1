import { SlideShowExperience } from "@/components/slideshow/slideshow-experience";
import { getDashboardData } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SlideShowPage() {
  const data = await getDashboardData();

  return <SlideShowExperience data={data} />;
}
