import { NextResponse } from "next/server";
import { getPackBySlug } from "@/lib/repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const pack = getPackBySlug(slug);
  if (!pack) return NextResponse.json({ error: "Board not found." }, { status: 404 });
  return NextResponse.json(pack, { headers: { "Cache-Control": "no-store" } });
}
