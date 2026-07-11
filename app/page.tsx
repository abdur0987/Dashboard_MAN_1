import { DashboardExperience } from "@/components/dashboard/dashboard-experience";
import { getDashboardData } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const data = await getDashboardData();

  return <DashboardExperience data={data} />;
}
