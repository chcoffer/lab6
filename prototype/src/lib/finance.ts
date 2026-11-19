export function allocateShares(amountCents: number, weights: number[]) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let allocated = 0;
  return weights.map((weight, index) => {
    const cents = index === weights.length - 1 ? amountCents - allocated : Math.round((amountCents * weight) / total);
    allocated += cents;
    return cents;
  });
}

export function getBalances(expenses: { payerId: string; status: string; shares: { userId: string; shareCents: number }[] }[], payments: { senderId: string; recipientId: string; amountCents: number }[]) {
  const net = new Map<string, number>();
  for (const expense of expenses) {
    if (expense.status !== "APPROVED") continue;
    for (const share of expense.shares) {
      if (share.userId === expense.payerId) continue;
      const key = share.userId + ":" + expense.payerId;
      net.set(key, (net.get(key) ?? 0) + share.shareCents);
    }
  }
  for (const payment of payments) {
    const key = payment.senderId + ":" + payment.recipientId;
    net.set(key, (net.get(key) ?? 0) - payment.amountCents);
  }
  const pairs: { fromId: string; toId: string; amountCents: number }[] = [];
  for (const key of new Set(net.keys())) {
    const [a, b] = key.split(":");
    const amount = (net.get(key) ?? 0) - (net.get(b + ":" + a) ?? 0);
    if (amount > 0) pairs.push({ fromId: a, toId: b, amountCents: amount });
  }
  return pairs;
}

export function getMemberBalances(userIds: string[], pairs: { fromId: string; toId: string; amountCents: number }[]) {
  const balances = new Map(userIds.map((userId) => [userId, 0]));
  for (const pair of pairs) {
    balances.set(pair.fromId, (balances.get(pair.fromId) ?? 0) - pair.amountCents);
    balances.set(pair.toId, (balances.get(pair.toId) ?? 0) + pair.amountCents);
  }
  return userIds.map((userId) => ({ userId, balanceCents: balances.get(userId) ?? 0 }));
}
