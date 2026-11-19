import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBalances } from "@/lib/finance";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amountCents = Math.round(Number(body.amount) * 100);
    if (!Number.isSafeInteger(amountCents) || amountCents < 1) return NextResponse.json({ error: "Enter a payment greater than $0.00." }, { status: 400 });
    if (body.senderId === body.recipientId) return NextResponse.json({ error: "Choose two different people." }, { status: 400 });
    const group = await prisma.group.findUnique({ where: { id: String(body.groupId) }, include: { members: true, expenses: { include: { shares: true } }, payments: true } });
    if (!group) return NextResponse.json({ error: "Choose a valid group." }, { status: 400 });
    const members = new Set(group.members.map((member) => member.userId));
    if (!members.has(body.senderId) || !members.has(body.recipientId)) return NextResponse.json({ error: "Both people must belong to this group." }, { status: 400 });
    const outstanding = getBalances(group.expenses, group.payments).find((pair) => pair.fromId === body.senderId && pair.toId === body.recipientId)?.amountCents ?? 0;
    if (amountCents > outstanding) return NextResponse.json({ error: "That is more than the outstanding " + new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(outstanding / 100) + " balance." }, { status: 400 });
    const date = new Date(body.date + "T12:00:00");
    if (!body.date || Number.isNaN(date.getTime())) return NextResponse.json({ error: "Choose a valid date." }, { status: 400 });
    await prisma.payment.create({ data: { groupId: group.id, senderId: body.senderId, recipientId: body.recipientId, amountCents, date, note: String(body.note ?? "").slice(0, 100) } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not record this payment." }, { status: 500 });
  }
}
