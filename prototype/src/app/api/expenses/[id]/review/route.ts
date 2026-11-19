import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  if (!["APPROVED", "REJECTED"].includes(body.status)) return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  try {
    const expense = await prisma.expense.findUnique({ where: { id }, include: { group: { include: { members: true } } } });
    if (!expense) return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    if (expense.status !== "PENDING") return NextResponse.json({ error: "This expense has already been reviewed." }, { status: 409 });
    // Demo-only reviewer: local identity is Alex Morgan; production authorization is not implemented.
    const reviewer = await prisma.user.findUnique({ where: { email: "alex@splitsmart.demo" } });
    const membership = reviewer && expense.group.members.find((member) => member.userId === reviewer.id);
    if (!membership || membership.role !== "ADMIN") return NextResponse.json({ error: "Only a group admin can review this expense." }, { status: 403 });
    await prisma.expense.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update the review status." }, { status: 500 });
  }
}
