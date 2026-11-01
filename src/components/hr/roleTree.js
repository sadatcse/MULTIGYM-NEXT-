// Helpers for the approval trees on the HR Workflow page. A tree is a flat
// list of { role, parent } (parent null = top). Route rules mirror the
// backend (Backend/src/modules/hr-config/approval-tree.ts): a request walks
// up from the applicant's role, every level above recommends, the top
// decides; roles not in the tree go straight to the top.

export const roleKey = (role) => String(role || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const sameRole = (a, b) => roleKey(a) === roleKey(b);
export const isSuperAdminRole = (role) => roleKey(role) === "SUPERADMIN";

const find = (tree, role) => tree.find((n) => sameRole(n.role, role));

export function buildChain(tree, role) {
  if (!tree?.length) return [];
  const me = find(tree, role);
  if (!me) {
    const tops = tree.filter((n) => !n.parent || !find(tree, n.parent));
    return tops.length ? [{ roles: tops.map((t) => t.role), label: tops.map((t) => t.role).join(" / ") }] : [];
  }
  const steps = [];
  const seen = new Set([roleKey(me.role)]);
  let p = me.parent ? find(tree, me.parent) : null;
  while (p && !seen.has(roleKey(p.role))) {
    seen.add(roleKey(p.role));
    steps.push({ roles: [p.role], label: p.role });
    p = p.parent ? find(tree, p.parent) : null;
  }
  if (!steps.length) steps.push({ roles: [me.role], label: me.role, peer: true });
  return steps;
}

export const childrenOf = (tree, role) => tree.filter((n) => n.parent && sameRole(n.parent, role)).map((n) => n.role);

// True when `role` sits somewhere below `ancestor`.
export function isBelow(tree, role, ancestor) {
  let p = find(tree, role)?.parent;
  const seen = new Set();
  while (p && !seen.has(roleKey(p))) {
    if (sameRole(p, ancestor)) return true;
    seen.add(roleKey(p));
    p = find(tree, p)?.parent;
  }
  return false;
}

/** Puts `role` under `parent` (null = top). Adds it if new; moves it (with its branch) if placed. */
export function placeRole(tree, role, parent) {
  if (parent && (sameRole(parent, role) || isBelow(tree, parent, role))) return tree; // would create a loop
  const existing = find(tree, role);
  if (existing) return tree.map((n) => (n === existing ? { ...n, parent: parent || null } : n));
  return [...tree, { role, parent: parent || null }];
}

/** Removes `role`; the roles under it move up to its parent so routes stay connected. */
export function removeRole(tree, role) {
  const node = find(tree, role);
  if (!node) return tree;
  return tree.filter((n) => n !== node).map((n) => (n.parent && sameRole(n.parent, role) ? { ...n, parent: node.parent } : n));
}

// Tidy top-down layout: every branch gets the width of its widest level.
export const NODE_W = 184;
export const NODE_H = 68;
const GAP_X = 20;
const GAP_Y = 60;

export function layoutTree(tree) {
  const kids = new Map(tree.map((n) => [roleKey(n.role), []]));
  const roots = [];
  for (const n of tree) {
    if (n.parent && kids.has(roleKey(n.parent))) kids.get(roleKey(n.parent)).push(n.role);
    else roots.push(n.role);
  }
  const widths = new Map();
  const width = (r) => {
    const k = roleKey(r);
    if (widths.has(k)) return widths.get(k);
    const ch = kids.get(k) || [];
    const sum = ch.reduce((s, c) => s + width(c), 0) + Math.max(0, ch.length - 1) * GAP_X;
    const w = Math.max(NODE_W, sum);
    widths.set(k, w);
    return w;
  };
  const pos = {};
  let depthMax = 0;
  const place = (r, left, depth) => {
    const w = width(r);
    pos[roleKey(r)] = { x: left + w / 2 - NODE_W / 2, y: depth * (NODE_H + GAP_Y), depth };
    depthMax = Math.max(depthMax, depth);
    const ch = kids.get(roleKey(r)) || [];
    const sum = ch.reduce((s, c) => s + width(c), 0) + Math.max(0, ch.length - 1) * GAP_X;
    let x = left + (w - sum) / 2;
    for (const c of ch) {
      place(c, x, depth + 1);
      x += width(c) + GAP_X;
    }
  };
  let x = 0;
  for (const r of roots) {
    place(r, x, 0);
    x += width(r) + GAP_X * 2;
  }
  return {
    pos,
    width: tree.length ? x - GAP_X * 2 : 0,
    height: tree.length ? (depthMax + 1) * NODE_H + depthMax * GAP_Y : 0,
  };
}

// Elbow connector from a parent's bottom to a child's top, rounded corners.
export function connectorPath(p, c) {
  const x1 = p.x + NODE_W / 2;
  const y1 = p.y + NODE_H;
  const x2 = c.x + NODE_W / 2;
  const y2 = c.y;
  const mid = y1 + (y2 - y1) / 2;
  if (Math.abs(x2 - x1) < 1) return `M ${x1} ${y1} V ${y2}`;
  const r = Math.min(10, Math.abs(x2 - x1) / 2, (y2 - y1) / 2);
  const dir = x2 > x1 ? 1 : -1;
  return `M ${x1} ${y1} V ${mid - r} Q ${x1} ${mid} ${x1 + dir * r} ${mid} H ${x2 - dir * r} Q ${x2} ${mid} ${x2} ${mid + r} V ${y2}`;
}

/**
 * Starting point built from the existing fixed-stage settings: each tier
 * (top first) sits under the first role of the tier above; any other role
 * goes under the last tier.
 */
export function suggestTree(roleNames, tiers) {
  const names = roleNames.filter((r) => !isSuperAdminRole(r));
  const placed = new Set();
  const nodes = [];
  let parent = null;
  for (const tier of tiers) {
    const members = names.filter((r) => !placed.has(roleKey(r)) && (tier || []).some((t) => sameRole(t, r)));
    if (!members.length) continue;
    for (const r of members) {
      nodes.push({ role: r, parent });
      placed.add(roleKey(r));
    }
    parent = members[0];
  }
  for (const r of names) if (!placed.has(roleKey(r))) nodes.push({ role: r, parent });
  return nodes;
}
