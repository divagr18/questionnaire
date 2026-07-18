import { notFound } from "next/navigation";

import { FormExperience } from "@/components/form-experience";
import { getPackBySlug } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function FormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = getPackBySlug(slug);
  if (!pack?.isPublished) notFound();
  return <FormExperience pack={pack} />;
}
