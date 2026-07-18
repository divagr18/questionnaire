import { NextResponse } from "next/server";

import { deletePack, updatePack } from "@/lib/repository";
import { packInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const parsed = packInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the pack details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const pack = updatePack(id, parsed.data);
    return pack
      ? NextResponse.json(pack)
      : NextResponse.json({ error: "Pack not found." }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "That pack URL is already in use." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_: Request, context: Context) {
  const { id } = await context.params;
  return deletePack(id)
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Pack not found." }, { status: 404 });
}
