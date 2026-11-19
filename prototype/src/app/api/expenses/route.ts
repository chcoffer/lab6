import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allocateShares } from "@/lib/finance";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const amountCents = Math.round(amount * 100);
    const description = String(body.description ?? "").trim();
    const groupId = String(body.groupId ?? "");
    const payerId = String(body.payerId ?? "");
    const participants = Array.isArray(body.participants) ? body.participants.map(String) : [];
    const splitType = "EQUAL";
    if (!description || description.length > 100) return NextResponse.json({ error: "Add a description up to 100 characters." }, { status: 400 });
    if (!Number.isFinite(amount) || amountCents < 1 || amountCents > 100000000) return NextResponse.json({ error: "Enter an amount between $0.01 and $1,000,000." }, { status: 400 });
    if (!participants.length || new Set(participants).size !== participants.length) return NextResponse.json({ error: "Choose at least one participant." }, { status: 400 });
    const group = await prisma.group.findUnique({ where: { id: groupId }, include: { members: true } });
    if (!group) return NextResponse.json({ error: "Choose a valid group." }, { status: 400 });
    const memberIds = new Set(group.members.map((member) => member.userId));
    if (!memberIds.has(payerId) || participants.some((id: string) => !memberIds.has(id))) return NextResponse.json({ error: "Payer and participants must belong to this group." }, { status: 400 });
    const submitter = await prisma.user.findUnique({ where: { email: "alex@splitsmart.demo" } });
    if (!submitter || !memberIds.has(submitter.id)) return NextResponse.json({ error: "The demo account must be a member of this group." }, { status: 400 });
    const shares = allocateShares(amountCents, participants.map(() => 1));
    const date = new Date(body.date + "T12:00:00");
    if (!body.date || Number.isNaN(date.getTime())) return NextResponse.json({ error: "Choose a valid date." }, { status: 400 });
    const expense = await prisma.expense.create({
      data: { groupId, payerId, submitterId: submitter.id, description, amountCents, date, splitType, status: "APPROVED", shares: { create: participants.map((userId: string, index: number) => ({ userId, shareCents: shares[index] })) } },
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save this expense. Please try again." }, { status: 500 });
  }
}
