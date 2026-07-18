import { NextResponse } from "next/server";

import { createPack, listPacks } from "@/lib/repository";
import { packInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ packs: listPacks() });
}

export async function POST(request: Request) {
  const parsed = packInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the pack details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(createPack(parsed.data), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "That pack URL is already in use." }, { status: 409 });
    }
    throw error;
  }
}
