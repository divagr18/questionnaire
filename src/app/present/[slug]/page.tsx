import { notFound } from "next/navigation";

import { PresentationDeck } from "@/components/presentation-deck";
import { getPackBySlug } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function PresentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = getPackBySlug(slug);
  if (!pack) notFound();
  return <PresentationDeck pack={pack} />;
}
