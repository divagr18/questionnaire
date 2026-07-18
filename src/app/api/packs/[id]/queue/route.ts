import { NextResponse } from "next/server";
import { setQueue } from "@/lib/repository";
import { queueInputSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const parsed = queueInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid queue." }, { status: 400 });
  const pack = setQueue(id, parsed.data.submissionIds);
  return pack ? NextResponse.json(pack) : NextResponse.json({ error: "Pack not found." }, { status: 404 });
}
