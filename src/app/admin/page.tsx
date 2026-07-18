import { AdminStudio } from "@/components/admin-studio";
import { getStudioStats, listPacks, listSubmissions } from "@/lib/repository";
export const dynamic = "force-dynamic";
export default function AdminPage() {
  const packs = listPacks(); const first = packs[0];
  return <AdminStudio initialPacks={packs} initialSubmissions={first ? listSubmissions(first.id) : []} initialStats={getStudioStats()} />;
}
