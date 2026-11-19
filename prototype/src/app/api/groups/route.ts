import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const emoji = String(body.emoji ?? "👥").trim().slice(0, 8) || "👥";
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: "Group name must be between 2 and 50 characters." }, { status: 400 });
    }
    const creator = await prisma.user.findUnique({ where: { email: "alex@splitsmart.demo" } });
    if (!creator) return NextResponse.json({ error: "Run the demo seed before creating groups." }, { status: 503 });
    const group = await prisma.group.create({
      data: { name, emoji, members: { create: { userId: creator.id, role: "ADMIN" } } },
      include: { members: { include: { user: true } } },
    });
    return NextResponse.json({ group }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create this group." }, { status: 500 });
  }
}
