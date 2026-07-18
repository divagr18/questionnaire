import { NextResponse } from "next/server";
import { deleteSubmission, updateSubmission } from "@/lib/repository";
import { submissionEditSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const parsed = submissionEditSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a name and question." }, { status: 400 });
  const item = updateSubmission(id, parsed.data); return item ? NextResponse.json(item) : NextResponse.json({ error: "Submission not found." }, { status: 404 });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; return deleteSubmission(id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Submission not found." }, { status: 404 });
}
