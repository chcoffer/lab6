"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type User = { id: string; name: string; email: string; initials: string; color: string };
type Share = { userId: string; shareCents: number; user: User };
type Activity = { id: string; type: string; groupId: string; group: string; description: string; amountCents: number; date: string; status: string; payer: string; payerId: string };
type Group = { id: string; name: string; emoji: string; color: string; members: { userId: string; role: string; user: User }[]; expenses: { id: string; description: string; amountCents: number; date: string; status: string; payer: User; payerId: string; shares: Share[] }[]; payments: { id: string; amountCents: number; date: string; sender: User; recipient: User }[]; balances: { fromId: string; toId: string; amountCents: number }[]; memberBalances: { userId: string; balanceCents: number }[] };
type Data = { users: User[]; groups: Group[]; activity: Activity[] };
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n / 100);
const dateFmt = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));

function Avatar({ user, small = false }: { user?: User; small?: boolean }) {
  return <span className={"avatar" + (small ? " small" : "")} style={{ background: user?.color || "#e7eddf" }}>{user?.initials || "?"}</span>;
}
function ActivityTable({ rows, users }: { rows: Activity[]; users: User[] }) {
  if (!rows.length) return <div className="empty-inline">No activity in this period yet.</div>;
  return <div className="table-wrap"><table><thead><tr><th>DESCRIPTION</th><th>GROUP</th><th>DATE</th><th>STATUS</th><th className="right">AMOUNT</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><span className="table-description"><Avatar small user={users.find((u) => u.id === row.payerId)} />{row.description}</span></td><td>{row.group}</td><td>{dateFmt(row.date)}</td><td><span className={"status " + (row.status === "PENDING" ? "pending" : row.type === "payment" ? "paid" : "approved")}>{row.status === "PENDING" ? "Pending" : row.type === "payment" ? "Payment" : "Approved"}</span></td><td className="right amount-cell">{fmt(row.amountCents)}</td></tr>)}</tbody></table></div>;
}

export default function Home() {
  const [data, setData] = useState<Data>({ users: [], groups: [], activity: [] });
  const [section, setSection] = useState("overview");
  const [selected, setSelected] = useState("");
  const [modal, setModal] = useState("");
  const [selectedForForm, setSelectedForForm] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [range, setRange] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load your workspace.");
      setData(json);
      if (!selected && json.groups[0]) setSelected(json.groups[0].id);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load your workspace."); }
    finally { setLoading(false); }
  }, [selected]);
  useEffect(() => { void refresh(); }, [refresh]);

  const alex = data.users.find((u) => u.email === "alex@splitsmart.demo");
  const group = data.groups.find((g) => g.id === selected) || data.groups[0];
  const mine = data.groups.flatMap((g) => g.balances.map((b) => ({ ...b, group: g })));
  const owed = mine.filter((b) => b.toId === alex?.id).reduce((s, b) => s + b.amountCents, 0);
  const owe = mine.filter((b) => b.fromId === alex?.id).reduce((s, b) => s + b.amountCents, 0);
  const pending = data.groups.flatMap((g) => g.expenses.filter((e) => e.status === "PENDING").map((e) => ({ ...e, group: g })));
  const reportRows = data.activity.filter((a) => {
    let start = from; let end = to;
    if (range !== "custom") {
      const now = new Date(); const beginning = new Date();
      if (range === "week") beginning.setDate(now.getDate() - 7);
      if (range === "month") beginning.setDate(1);
      if (range === "year") beginning.setMonth(0, 1);
      start = beginning.toISOString().slice(0, 10); end = now.toISOString().slice(0, 10);
    }
    return (!start || a.date.slice(0, 10) >= start) && (!end || a.date.slice(0, 10) <= end);
  });
  const reportExp = reportRows.filter((a) => a.type === "expense" && a.status === "APPROVED");
  const reportPay = reportRows.filter((a) => a.type === "payment");

  function open(kind: string, groupId = group?.id || "") {
    setModal(kind); setSelectedForForm(groupId); setError("");
    const selectedGroup = data.groups.find((g) => g.id === groupId);
    setParticipants(selectedGroup?.members.map((m) => m.userId) || []);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const expense = modal === "expense";
    const groupCreation = modal === "group";
    const memberAddition = modal === "member";
    const body = groupCreation ? { name: form.get("name"), emoji: form.get("emoji") } : memberAddition ? { name: form.get("name"), email: form.get("email") } : expense ? {
      groupId: form.get("groupId"), description: form.get("description"), amount: form.get("amount"), date: form.get("date"), payerId: form.get("payerId"), participants,
    } : { groupId: form.get("groupId"), senderId: form.get("senderId"), recipientId: form.get("recipientId"), amount: form.get("amount"), date: form.get("date"), note: form.get("note") };
    try {
      const url = groupCreation ? "/api/groups" : memberAddition ? "/api/groups/" + selectedForForm + "/members" : expense ? "/api/expenses" : "/api/payments";
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not save this item.");
      if (groupCreation) { setSelected(result.group.id); setSection("groups"); }
      setModal(""); setNotice(groupCreation ? "Group created." : memberAddition ? "Member added to the group." : expense ? "Expense recorded. Balances are updated." : "Payment recorded. Balances have been updated.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save this item."); }
    finally { setBusy(false); }
  }

  async function review(id: string, status: string) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/expenses/" + id + "/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not update review.");
      setNotice(status === "APPROVED" ? "Approved — balances are updated." : "Expense rejected.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update review."); }
    finally { setBusy(false); }
  }

  const title = section === "overview" ? "Good morning, Alex" : section === "groups" ? "Your groups" : "Reports";
  const members = data.groups.find((g) => g.id === selectedForForm)?.members || [];
  const nav = (toSection: string) => { setSection(toSection); };
  return <main className="shell">
    <aside className="sidebar">
      <a className="brand"><span className="brand-symbol">s<span>.</span></span><span>splitsmart<small>LESS SETTLING. MORE LIVING.</small></span></a>
      <div className="label">WORKSPACE</div>
      <nav>
        <button className={section === "overview" ? "nav active" : "nav"} onClick={() => nav("overview")}><span>⌂</span>Overview</button>
        <button className={section === "groups" ? "nav active" : "nav"} onClick={() => nav("groups")}><span>▦</span>Groups <i>{data.groups.length}</i></button>
        <button className={section === "reports" ? "nav active" : "nav"} onClick={() => nav("reports")}><span>▤</span>Reports</button>
      </nav>
      <div className="side-groups"><div className="side-title">YOUR GROUPS <button onClick={() => open("group")}>＋</button></div>
        {data.groups.map((g) => <button key={g.id} className={"group-link" + (selected === g.id ? " chosen" : "")} onClick={() => { setSelected(g.id); setSection("groups"); }}><span style={{ background: g.color }}>{g.emoji}</span>{g.name}<b /></button>)}
      </div>
      <div className="side-bottom"><div className="demo-chip"><span /> DEMO MODE <i>·</i> saved locally</div><div className="profile"><Avatar user={alex} /><span><strong>Alex Morgan</strong><small>Demo account</small></span><b>···</b></div></div>
    </aside>

    <section className="main">
      <header className="topbar"><div className="crumb">Workspace <b>/</b> <strong>{section === "groups" && group ? group.name : title}</strong></div><div className="topright"><span className="prototype"><i />Prototype</span><button className="bell" title="Demo notifications">♧<i>{pending.length}</i></button><Avatar user={alex} small /></div></header>
      <div className="content">
        {error && <div className="alert error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
        {notice && <div className="alert success" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
        {loading && !data.groups.length ? <div className="loading"><span />Loading your groups…</div> : !data.groups.length ? <div className="empty-state"><h2>Welcome to SplitSmart</h2><p>Create your first group to start sharing expenses.</p><button className="primary" onClick={() => open("group")}>＋ Create a group</button></div> : <>
          {section === "overview" && <>
            <div className="page-heading"><div><div className="eyebrow">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</div><h1>{title} <span>✳</span></h1><p>Here’s how things are looking across your groups.</p></div><button className="primary" onClick={() => open("expense")}>＋ <span>Add an expense</span></button></div>
            <div className="stats">
              <article className="stat feature"><div className="stat-label">YOUR NET BALANCE <span className="stat-icon">↗</span></div><strong>{fmt(owed - owe)}</strong><div className="balance-caption"><b>↑ {fmt(owed)} owed to you</b><i /><span>{fmt(owe)} you owe</span></div><span className="sparkle">✳</span></article>
              <article className="stat"><div className="stat-label">YOU ARE OWED <span className="stat-icon yellow">↙</span></div><strong>{fmt(owed)}</strong><small>Across {mine.filter((b) => b.toId === alex?.id).length} open balances</small></article>
              <article className="stat"><div className="stat-label">YOU OWE <span className="stat-icon pink">↗</span></div><strong>{fmt(owe)}</strong><small>{owe ? "Time to settle up?" : "You’re all settled up"}</small></article>
            </div>
            <div className="dashboard-grid">
              <section className="panel"><div className="panel-head"><div><h2>Recent activity</h2><p>The latest from all your groups</p></div><button className="link-button" onClick={() => nav("groups")}>See all →</button></div>
                {data.activity.length ? <div className="activity">{data.activity.slice(0, 5).map((a) => <div className="activity-row" key={a.id}><span className={"activity-icon " + (a.type === "payment" ? "paid-icon" : "")}>{a.type === "payment" ? "↗" : data.groups.find((g) => g.id === a.groupId)?.emoji}</span><Avatar user={data.users.find((u) => u.id === a.payerId)} small /><div className="activity-text"><strong>{a.description}</strong><small>{a.group} <i>·</i> {dateFmt(a.date)}</small></div><div className="activity-value"><b>{fmt(a.amountCents)}</b>{a.status === "PENDING" && <span className="status pending">Pending</span>}</div></div>)}</div> : <div className="empty-inline">Your group activity will show up here.</div>}
              </section>
              <section className="panel"><div className="panel-head"><div><h2>Your groups</h2><p>{data.groups.length} active spaces</p></div><button className="plain-more" onClick={() => nav("groups")}>···</button></div>
                <div className="group-cards">{data.groups.map((g) => { const net = g.balances.filter((b) => b.fromId === alex?.id || b.toId === alex?.id).reduce((s, b) => s + (b.toId === alex?.id ? b.amountCents : -b.amountCents), 0); return <button className="group-card" key={g.id} onClick={() => { setSelected(g.id); nav("groups"); }}><span className="group-emoji" style={{ background: g.color }}>{g.emoji}</span><span className="group-card-copy"><b>{g.name}</b><small>{g.members.length} members <i>·</i> {g.expenses.length} expenses</small></span><strong className={net >= 0 ? "positive" : "negative"}>{net >= 0 ? "+" : "−"}{fmt(Math.abs(net))}</strong><span className="arrow">›</span></button>; })}</div>
              </section>
            </div>
            <div className="bottom-grid"><section className="panel"><div className="panel-head"><div><h2>Needs your attention <span className="counter">{pending.length}</span></h2><p>Expenses waiting for your review</p></div><span className="attention">✳</span></div>
              {pending.length ? <div className="pending-list">{pending.slice(0, 4).map((e) => <div className="pending-row" key={e.id}><span className="pending-symbol">⌁</span><div><b>{e.description}</b><small>{e.payer.name} · {e.group.name} · {dateFmt(e.date)}</small></div><strong>{fmt(e.amountCents)}</strong><div className="review-buttons"><button disabled={busy} onClick={() => void review(e.id, "APPROVED")}>Approve</button><button disabled={busy} title="Reject" onClick={() => void review(e.id, "REJECTED")}>×</button></div></div>)}</div> : <div className="empty-inline">All caught up — nothing to review.</div>}
            </section><section className="panel quick"><div className="panel-head"><div><h2>Quick actions</h2><p>Keep the good times in balance</p></div></div><button onClick={() => open("expense")}><span className="quick-icon">＋</span><span><b>Add an expense</b><small>Split something shared</small></span><i>→</i></button><button onClick={() => open("payment")}><span className="quick-icon settle">↗</span><span><b>Settle up</b><small>Record an offline payment</small></span><i>→</i></button></section></div>
          </>}

          {section === "groups" && group && <>
            <div className="page-heading"><div><div className="eyebrow">YOUR GROUPS / GROUP OVERVIEW</div><h1><span className="heading-emoji" style={{ background: group.color }}>{group.emoji}</span>{group.name}</h1><p>{group.members.length} members <i>·</i> Shared expenses & balances</p></div><div className="heading-actions"><button className="secondary" onClick={() => open("member", group.id)}>＋ Add member</button><button className="secondary" onClick={() => open("group")}>＋ New group</button><button className="secondary" onClick={() => open("payment", group.id)}>↗ Record payment</button><button className="primary" onClick={() => open("expense", group.id)}>＋ <span>Add expense</span></button></div></div>
            <div className="detail-grid"><section className="panel"><div className="panel-head"><div><h2>Balances</h2><p>Who owes whom in {group.name}</p></div><span className="live">LIVE</span></div>
              {group.balances.length ? group.balances.map((b, i) => { const payer = data.users.find((u) => u.id === b.fromId); const receiver = data.users.find((u) => u.id === b.toId); return <div className="settle-row" key={i}><Avatar user={payer} small /><b>{payer?.name.split(" ")[0]}</b><span>owes</span><Avatar user={receiver} small /><b>{receiver?.name.split(" ")[0]}</b><strong>{fmt(b.amountCents)}</strong><button onClick={() => open("payment", group.id)}>Settle</button></div>; }) : <div className="empty-inline">Everyone is settled up in this group.</div>}
            </section><section className="panel"><div className="panel-head"><div><h2>Members</h2><p>{group.members.length} people in this group</p></div><button className="secondary invite" onClick={() => open("member", group.id)}>＋ Add</button></div><div className="members">{group.members.map((m) => { const net = group.memberBalances.find((balance) => balance.userId === m.userId)?.balanceCents ?? 0; return <div className="member-row" key={m.userId}><Avatar user={m.user} /><span><b>{m.user.name}</b><small>{m.role === "ADMIN" ? "Group admin" : "Member"}</small></span><strong className={net > 0 ? "positive" : net < 0 ? "negative" : "member-even"}>{net > 0 ? "+" : net < 0 ? "−" : ""}{fmt(Math.abs(net))}</strong>{m.role === "ADMIN" && <i>ADMIN</i>}</div>; })}</div></section></div>
            <section className="panel group-activity"><div className="panel-head"><div><h2>Group activity</h2><p>Expenses and payments, all in one place</p></div><button className="link-button" onClick={() => nav("reports")}>View report →</button></div><ActivityTable rows={data.activity.filter((a) => a.groupId === group.id)} users={data.users} /></section>
          </>}

          {section === "reports" && <>
            <div className="page-heading"><div><div className="eyebrow">YOUR MONEY, MADE CLEAR</div><h1>Reports</h1><p>A simple breakdown of shared expenses and settlements.</p></div><button className="secondary" onClick={() => window.print()}>⇩ Export report</button></div>
            <section className="panel filter-panel"><div><h2>Date range</h2><p>Choose the time period you want to review</p></div><div className="filter-controls"><select value={range} onChange={(e) => setRange(e.target.value)}><option value="week">Last 7 days</option><option value="month">This month</option><option value="year">This year</option><option value="custom">Custom range</option></select>{range === "custom" && <><input type="date" aria-label="Start date" value={from} onChange={(e) => setFrom(e.target.value)} /><span>to</span><input type="date" aria-label="End date" value={to} onChange={(e) => setTo(e.target.value)} /></>}</div></section>
            <div className="report-stats"><article className="stat"><div className="stat-label">APPROVED EXPENSES</div><strong>{fmt(reportExp.reduce((s, a) => s + a.amountCents, 0))}</strong><small>{reportExp.length} shared expenses</small></article><article className="stat"><div className="stat-label">PAYMENTS RECORDED</div><strong>{fmt(reportPay.reduce((s, a) => s + a.amountCents, 0))}</strong><small>{reportPay.length} settlements</small></article><article className="stat"><div className="stat-label">PENDING REVIEW</div><strong>{pending.length}</strong><small>Awaiting approval across groups</small></article></div>
            <section className="panel group-activity"><div className="panel-head"><div><h2>Activity in this period</h2><p>Filtered to your selected dates</p></div></div><ActivityTable rows={reportRows} users={data.users} /></section>
          </>}
        </>}
      </div>
      <footer className="footnote">✳ SplitSmart prototype · Payments and notifications are demo-only. No external services are connected.</footer>
    </section>

    {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(""); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><div className="eyebrow">{modal === "expense" ? "SHARE A COST" : modal === "group" ? "START A SHARED SPACE" : modal === "member" ? "GROW YOUR GROUP" : "CLOSE THE LOOP"}</div><h2 id="modal-title">{modal === "expense" ? "Add an expense" : modal === "group" ? "Create a group" : modal === "member" ? "Add a member" : "Record a payment"}</h2></div><button className="close" onClick={() => setModal("")} aria-label="Close">×</button></div><p>{modal === "expense" ? "Share the details and we’ll take care of the math." : modal === "group" ? "Give your people a place to split shared costs." : modal === "member" ? "Add someone so they can be included in group expenses." : "Record an offline payment between group members."}</p>
      <form onSubmit={submit}>
        {modal === "group" ? <>
          <label>Group name<input name="name" required minLength={2} maxLength={50} placeholder="e.g. Cabin crew" autoFocus /></label>
          <label>Group emoji <span className="optional">(optional)</span><input name="emoji" maxLength={8} defaultValue="🏡" aria-label="Group emoji" /></label>
          <div className="form-note">You’ll be added as the group admin. Add the rest of your group next.</div>
        </> : modal === "member" ? <>
          <label>Member name<input name="name" required minLength={2} maxLength={60} placeholder="e.g. Charlie Wilson" autoFocus /></label>
          <label>Email <span className="optional">(optional, for identification)</span><input name="email" type="email" placeholder="charlie@example.com" /></label>
          <div className="form-note">They’ll be added to this group and available to include in expenses.</div>
        </> : modal === "expense" ? <>
          <label>Description<input name="description" required maxLength={100} placeholder="e.g. Sunday farmers market" /></label>
          <div className="form-row"><label>Amount<input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label><label>Date<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label></div>
          <label>Group<select name="groupId" value={selectedForForm} onChange={(e) => { setSelectedForForm(e.target.value); setParticipants(data.groups.find((g) => g.id === e.target.value)?.members.map((m) => m.userId) || []); }}>{data.groups.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}</select></label>
          <label>Paid by<select name="payerId" defaultValue={alex?.id}>{members.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}</select></label>
          <div className="split-head"><strong>Split equally between</strong><span>{participants.length} selected</span></div>
          <div className="participants">{members.map((m) => <label className="participant" key={m.userId}><input type="checkbox" checked={participants.includes(m.userId)} onChange={(e) => setParticipants((old) => e.target.checked ? [...old, m.userId] : old.filter((id) => id !== m.userId))} /><Avatar user={m.user} small /><span>{m.user.name}</span></label>)}</div>
          <div className="form-note">The amount is divided equally among the selected members. Any leftover cent goes to the final person in the list.</div>
        </> : <>
          <label>Group<select name="groupId" value={selectedForForm} onChange={(e) => setSelectedForForm(e.target.value)}>{data.groups.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}</select></label>
          <div className="form-row"><label>Paid by<select name="senderId" required>{members.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}</select></label><label>Paid to<select name="recipientId" required>{members.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}</select></label></div>
          <div className="form-row"><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" /></label><label>Date<input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label></div>
          <label>Note <span className="optional">(optional)</span><input name="note" maxLength={100} placeholder="e.g. dinner split" /></label>
          <div className="form-note">Prototype only: this records a payment, but no money moves.</div>
        </>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="secondary" onClick={() => setModal("")}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Saving…" : modal === "expense" ? "Record expense →" : modal === "group" ? "Create group →" : modal === "member" ? "Add member →" : "Record payment →"}</button></div>
      </form>
    </section></div>}
  </main>;
}

