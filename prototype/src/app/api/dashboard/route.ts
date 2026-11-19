import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBalances, getMemberBalances } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const selectedGroup = searchParams.get("groupId");
    const dateWhere = from || to ? { date: { ...(from ? { gte: new Date(from + "T00:00:00") } : {}), ...(to ? { lte: new Date(to + "T23:59:59.999") } : {}) } } : {};
    const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
    const groups = await prisma.group.findMany({
      where: selectedGroup ? { id: selectedGroup } : {},
      include: {
        members: { include: { user: true } },
        expenses: { where: dateWhere, include: { payer: true, submitter: true, shares: { include: { user: true } } }, orderBy: { date: "desc" } },
        payments: { where: dateWhere, include: { sender: true, recipient: true }, orderBy: { date: "desc" } },
      }, orderBy: { name: "asc" },
    });
    const activity = groups.flatMap((group) => [
      ...group.expenses.map((expense) => ({ id: expense.id, type: "expense", groupId: group.id, group: group.name, description: expense.description, amountCents: expense.amountCents, date: expense.date, status: expense.status, payer: expense.payer.name, payerId: expense.payerId, submitter: expense.submitter.name })),
      ...group.payments.map((payment) => ({ id: payment.id, type: "payment", groupId: group.id, group: group.name, description: payment.sender.name + " paid " + payment.recipient.name, amountCents: payment.amountCents, date: payment.date, status: "APPROVED", payer: payment.sender.name, payerId: payment.senderId, submitter: payment.sender.name })),
    ]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json({ users, groups: groups.map((group) => {
      const balances = getBalances(group.expenses, group.payments);
      return { ...group, balances, memberBalances: getMemberBalances(group.members.map((member) => member.userId), balances) };
    }), activity });
  } catch {
    return NextResponse.json({ error: "Database is not ready. Run the seed command from the README." }, { status: 503 });
  }
}
