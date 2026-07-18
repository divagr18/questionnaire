import { NextResponse } from "next/server";
import { createSubmission, getPackBySlug } from "@/lib/repository";
import { submissionInputSchema } from "@/lib/validation";

export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const pack = getPackBySlug(slug);
  if (!pack?.isPublished) return NextResponse.json({ error: "This form is not available." }, { status: 404 });
  const parsed = submissionInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter your name and a question." }, { status: 400 });
  const result = createSubmission(pack.id, parsed.data.submissionToken, parsed.data.name, parsed.data.question);
  return NextResponse.json({ receiptCode: result.submission.receiptCode, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
}
