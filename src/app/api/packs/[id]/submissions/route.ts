import { NextResponse } from "next/server";
import { listSubmissions } from "@/lib/repository";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; return NextResponse.json({ submissions: listSubmissions(id) });
}
