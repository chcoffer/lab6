import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const palette = ["#dce7f1", "#f2dfd5", "#f0e5c8", "#e6e1f2", "#dcebd9"];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await context.params;
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
    const suppliedEmail = String(body.email ?? "").trim().toLowerCase();
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "Member name must be between 2 and 60 characters." }, { status: 400 });
    }
    if (suppliedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suppliedEmail)) {
      return NextResponse.json({ error: "Enter a valid email address or leave it blank." }, { status: 400 });
    }
    const group = await prisma.group.findUnique({ where: { id: groupId }, include: { members: true } });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });
    const alex = await prisma.user.findUnique({ where: { email: "alex@splitsmart.demo" } });
    if (!alex || !group.members.some((member) => member.userId === alex.id && member.role === "ADMIN")) {
      return NextResponse.json({ error: "Only a group admin can add members." }, { status: 403 });
    }

    const email = suppliedEmail || name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "") + "." + randomUUID().slice(0, 8) + "@splitsmart.demo";
    let user = await prisma.user.findUnique({ where: { email } });
    if (user && group.members.some((member) => member.userId === user?.id)) {
      return NextResponse.json({ error: "That person is already in this group." }, { status: 409 });
    }
    if (!user) {
      user = await prisma.user.create({
        data: { name, email, initials: initials(name) || "?", color: palette[group.members.length % palette.length] },
      });
    }
    const membership = await prisma.membership.create({
      data: { groupId, userId: user.id, role: "MEMBER" },
      include: { user: true },
    });
    return NextResponse.json({ member: membership }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A member with that email is already in this group." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not add this member." }, { status: 500 });
  }
}
