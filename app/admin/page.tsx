import { AdminExperience } from "@/components/admin/admin-experience";
import { getDashboardData } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const data = await getDashboardData();

  return <AdminExperience data={data} />;
}
