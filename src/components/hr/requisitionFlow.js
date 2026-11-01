// Progress of a requisition: its own route from the management tree (each
// level verifies, the top approves), or the original admin -> management
// stages for requisitions raised before a tree was saved.
export function requisitionSteps(r) {
  const chain = r.approvalChain || [];
  const last = chain.length - 1;
  const route = chain.length
    ? chain.map((s, i) => ({ key: `step${i}`, label: `${s.label} ${i === last ? "Approval" : "Verification"}`, kind: i === last ? "approve" : "verify" }))
    : [
        { key: "verified", label: "Admin Verification", kind: "verify" },
        { key: "approved", label: "Management Approval", kind: "approve" },
      ];
  const steps = [{ key: "submitted", label: "Requisition", kind: "request" }, ...route, { key: "purchased", label: "Purchase", kind: "purchase" }, { key: "received", label: "Received", kind: "receive" }];
  const n = route.length;
  const reached = {
    submitted: chain.length ? r.currentStep || 0 : 0,
    verified: chain.length ? r.currentStep || 0 : 1,
    approved: n,
    purchased: n + 1,
    received: n + 2,
  };
  const idx = reached[r.status] ?? -1;
  const bad = r.status === "rejected" || r.status === "cancelled";
  return { steps, route, idx, bad, next: bad ? null : steps[idx + 1] || null };
}
