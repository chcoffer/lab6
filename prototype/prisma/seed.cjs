// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const day = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(12, 0, 0, 0);
  return date;
};

async function main() {
  const people = [
    ["alex@splitsmart.demo", "Alex Morgan", "AM", "#dcebd9"],
    ["jamie@splitsmart.demo", "Jamie Chen", "JC", "#f2dfd5"],
    ["sam@splitsmart.demo", "Sam Rivera", "SR", "#dce7f1"],
    ["taylor@splitsmart.demo", "Taylor Brooks", "TB", "#f0e5c8"],
  ];
  const users = {};
  for (const [email, name, initials, color] of people) {
    users[email] = await prisma.user.upsert({
      where: { email }, update: { name, initials, color }, create: { email, name, initials, color },
    });
  }
  const groups = [
    { id: "seed-flatmates", name: "The Flatmates", emoji: "🏡", color: "#e6eee1", members: [0, 1, 2], expenses: [
      { id: "seed-groceries", description: "Weekly groceries", amountCents: 8460, ago: 1, payer: 1, shares: [2820, 2820, 2820], status: "APPROVED" },
      { id: "seed-internet", description: "Monthly internet", amountCents: 7200, ago: 4, payer: 0, shares: [2400, 2400, 2400], status: "APPROVED" },
      { id: "seed-houseplants", description: "A few houseplants", amountCents: 3850, ago: 0, payer: 0, shares: [1284, 1283, 1283], status: "PENDING" },
    ] },
    { id: "seed-weekend", name: "Weekend in Hudson", emoji: "🌿", color: "#e8e8f3", members: [0, 1, 2, 3], expenses: [
      { id: "seed-cabin", description: "Cabin for the weekend", amountCents: 36000, ago: 8, payer: 3, shares: [9000, 9000, 9000, 9000], status: "APPROVED" },
      { id: "seed-dinner", description: "Dinner at Rivertown Lodge", amountCents: 18400, ago: 7, payer: 0, shares: [4600, 4600, 4600, 4600], status: "APPROVED" },
    ] },
    { id: "seed-supper", name: "Sunday supper club", emoji: "🍝", color: "#f4e7db", members: [0, 1, 3], expenses: [
      { id: "seed-pasta", description: "Pasta night ingredients", amountCents: 6750, ago: 3, payer: 1, shares: [2250, 2250, 2250], status: "APPROVED" },
    ] },
  ];
  for (const groupDef of groups) {
    const group = await prisma.group.upsert({
      where: { id: groupDef.id },
      update: { name: groupDef.name, emoji: groupDef.emoji, color: groupDef.color },
      create: { id: groupDef.id, name: groupDef.name, emoji: groupDef.emoji, color: groupDef.color },
    });
    for (const index of groupDef.members) {
      const user = users[people[index][0]];
      await prisma.membership.upsert({
        where: { userId_groupId: { userId: user.id, groupId: group.id } },
        update: { role: index === 0 ? "ADMIN" : "MEMBER" },
        create: { userId: user.id, groupId: group.id, role: index === 0 ? "ADMIN" : "MEMBER" },
      });
    }
    for (const definition of groupDef.expenses) {
      const itemDate = day(-definition.ago);
      const expense = await prisma.expense.upsert({
        where: { id: definition.id },
        update: { groupId: group.id, description: definition.description, amountCents: definition.amountCents, date: itemDate, payerId: users[people[definition.payer][0]].id, submitterId: users[people[definition.payer][0]].id, status: definition.status, splitType: "EQUAL" },
        create: { id: definition.id, groupId: group.id, description: definition.description, amountCents: definition.amountCents, date: itemDate, payerId: users[people[definition.payer][0]].id, submitterId: users[people[definition.payer][0]].id, status: definition.status, splitType: "EQUAL" },
      });
      for (let index = 0; index < groupDef.members.length; index++) {
        const user = users[people[groupDef.members[index]][0]];
        await prisma.expenseShare.upsert({
          where: { expenseId_userId: { expenseId: expense.id, userId: user.id } },
          update: { shareCents: definition.shares[index] },
          create: { expenseId: expense.id, userId: user.id, shareCents: definition.shares[index] },
        });
      }
    }
  }
  await prisma.payment.upsert({
    where: { id: "seed-hudson-payment" },
    update: { amountCents: 3000, date: day(-5) },
    create: { id: "seed-hudson-payment", groupId: "seed-weekend", senderId: users[people[0][0]].id, recipientId: users[people[3][0]].id, amountCents: 3000, date: day(-5), note: "Coffee stop · demo payment" },
  });
  console.log("SplitSmart demo data is ready.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());

