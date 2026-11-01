"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertTriangle, FiArrowRight, FiMove, FiPlus, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { Select } from "@/components/hr/HrUi";
import { NODE_H, NODE_W, buildChain, childrenOf, connectorPath, isBelow, isSuperAdminRole, layoutTree, placeRole, removeRole, roleKey, sameRole } from "./roleTree";

const PAD = 28;

// Drag-and-drop editor for one approval tree.
//  - Drag a role from the palette onto a role → it goes under that role.
//  - Drag onto empty canvas → it becomes a top level.
//  - Drag a placed role (its whole branch moves with it).
//  - Or click a role to select it, then tap palette roles to add them below
//    it, or use "Move under…" / "Remove" (works on touch and keyboard).
export default function RoleTreeEditor({ tree, onChange, roles = [], staffByRole = {}, editable = true, words, onSuggest }) {
  const [dragRole, setDragRole] = useState(null);
  const [dropOn, setDropOn] = useState(null); // role key | "__top__"
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState("");
  const canvasRef = useRef(null);

  // A tree wider than the screen (phones) opens centred on its top level.
  useEffect(() => {
    const el = canvasRef.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  const layout = useMemo(() => layoutTree(tree), [tree]);
  const inTree = (r) => tree.some((n) => sameRole(n.role, r));
  const unplaced = roles.filter((r) => !inTree(r) && !isSuperAdminRole(r));
  const knownRole = (r) => roles.some((x) => sameRole(x, r));
  const tops = tree.filter((n) => !n.parent);
  const selectedNode = selected ? tree.find((n) => roleKey(n.role) === selected) : null;

  // The selected role's route, highlighted on the canvas.
  const routeKeys = useMemo(() => {
    if (!selectedNode) return new Set();
    const keys = new Set([roleKey(selectedNode.role)]);
    for (const s of buildChain(tree, selectedNode.role)) if (!s.peer) s.roles.forEach((r) => keys.add(roleKey(r)));
    return keys;
  }, [tree, selectedNode]);

  const levelOf = (n) => (!n.parent ? "top" : childrenOf(tree, n.role).length ? "middle" : "bottom");
  const count = (r) => staffByRole[roleKey(r)] || 0;

  const update = (next) => {
    if (next !== tree) onChange(next);
  };
  const canDropOn = (target) => dragRole && !sameRole(dragRole, target) && !isBelow(tree, target, dragRole);

  const dragProps = (role) =>
    editable
      ? {
          draggable: true,
          onDragStart: (e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", role);
            setDragRole(role);
          },
          onDragEnd: () => {
            setDragRole(null);
            setDropOn(null);
          },
        }
      : {};

  const edges = tree
    .filter((n) => n.parent && layout.pos[roleKey(n.parent)])
    .map((n) => {
      const p = layout.pos[roleKey(n.parent)];
      const c = layout.pos[roleKey(n.role)];
      return { key: `${roleKey(n.parent)}>${roleKey(n.role)}`, d: connectorPath(p, c), lit: routeKeys.has(roleKey(n.role)) && routeKeys.has(roleKey(n.parent)) };
    });

  const previewChain = preview ? buildChain(tree, preview) : [];
  const nobodyAtTop = tops.filter((t) => count(t.role) === 0);
  const moveOptions = selectedNode
    ? [{ value: "__top__", label: "Top level" }, ...tree.filter((n) => !sameRole(n.role, selectedNode.role) && !isBelow(tree, n.role, selectedNode.role)).map((n) => ({ value: n.role, label: n.role }))]
    : [];

  return (
    <div className="space-y-4">
      {/* Palette */}
      {editable && (
        <div>
          <p className="text-[12px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">
            {selectedNode ? (
              <>
                Tap a role to add it under <b className="text-brand-black dark:text-brand-white">{selectedNode.role}</b>, or drag it onto the tree.
              </>
            ) : (
              "Drag roles onto the tree — onto a role to put them under it, or onto empty space for a new top level."
            )}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {unplaced.map((r) => (
              <button
                key={r}
                type="button"
                {...dragProps(r)}
                onClick={() => update(placeRole(tree, r, selectedNode?.role || null))}
                className="group inline-flex items-center gap-2 rounded-xl border border-brand-beige/70 bg-brand-white px-3 py-1.5 text-xs font-bold text-brand-black shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-md active:cursor-grabbing dark:border-brand-dark-grey dark:bg-brand-charcoal dark:text-brand-white cursor-grab"
                title="Drag onto the tree, or tap to add"
              >
                <FiMove className="text-brand-dark-grey/50 group-hover:text-brand-gold" />
                {r}
                <span className="rounded-md bg-brand-offwhite px-1.5 text-[10px] font-semibold text-brand-dark-grey dark:bg-brand-midnight dark:text-brand-gold-light">{count(r)}</span>
              </button>
            ))}
            {!unplaced.length && <span className="text-xs font-semibold text-brand-dark-grey dark:text-brand-gold-light">Every role is in the tree.</span>}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`relative overflow-auto rounded-2xl border-2 border-dashed transition-colors ${
          dropOn === "__top__" ? "border-brand-gold bg-brand-gold/5" : "border-brand-beige/60 dark:border-brand-dark-grey"
        }`}
        style={{ backgroundImage: "radial-gradient(rgba(161,161,170,0.25) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
        onDragOver={(e) => {
          if (!dragRole) return;
          e.preventDefault();
          setDropOn("__top__");
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDropOn(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragRole) update(placeRole(tree, dragRole, null));
          setDragRole(null);
          setDropOn(null);
        }}
        onClick={() => setSelected(null)}
      >
        {tree.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gold/10 text-xl text-brand-gold">
              <FiPlus />
            </span>
            <p className="max-w-sm text-xs font-semibold text-brand-dark-grey dark:text-brand-gold-light">
              Drag roles here to start the tree. Until a tree is saved, {words.requests} keep using the fixed stages.
            </p>
            {editable && onSuggest && (
              <button type="button" onClick={onSuggest} className="rounded-xl bg-brand-gold px-4 py-2 text-xs font-bold text-brand-midnight transition-colors hover:bg-brand-gold-light cursor-pointer">
                Start from a suggested tree
              </button>
            )}
          </div>
        ) : (
          <div className="relative mx-auto" style={{ width: layout.width + PAD * 2, height: layout.height + PAD * 2 }}>
            <svg className="pointer-events-none absolute inset-0 overflow-visible" width={layout.width + PAD * 2} height={layout.height + PAD * 2} aria-hidden>
              <g transform={`translate(${PAD} ${PAD})`}>
                <AnimatePresence initial={false}>
                  {edges.map((e) => (
                    <motion.path
                      key={e.key}
                      d={e.d}
                      fill="none"
                      strokeLinecap="round"
                      className={e.lit ? "stroke-brand-gold" : "stroke-zinc-300 dark:stroke-white/20"}
                      strokeWidth={e.lit ? 2.5 : 1.75}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ pathLength: { duration: 0.5, ease: "easeOut" }, opacity: { duration: 0.2 } }}
                    />
                  ))}
                </AnimatePresence>
              </g>
            </svg>

            {tree.map((n) => {
              const k = roleKey(n.role);
              const p = layout.pos[k];
              if (!p) return null;
              const level = levelOf(n);
              const isSel = selected === k;
              const lit = routeKeys.has(k);
              const target = dropOn === k;
              const people = count(n.role);
              return (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  style={{ position: "absolute", left: PAD + p.x, top: PAD + p.y, width: NODE_W, height: NODE_H }}
                >
                  {/* Plain element: framer-motion reserves onDragStart/End for its own gestures. */}
                  <div
                    {...dragProps(n.role)}
                    onDragOver={(e) => {
                      if (!canDropOn(n.role)) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setDropOn(k);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (canDropOn(n.role)) update(placeRole(tree, dragRole, n.role));
                      setDragRole(null);
                      setDropOn(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(isSel ? null : k);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(isSel ? null : k);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSel}
                    aria-label={`${n.role}${n.parent ? `, under ${n.parent}` : ", top level"}`}
                    className={`group flex h-full w-full flex-col justify-between rounded-2xl border px-3 py-2 text-left shadow-sm transition-[box-shadow,border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                      editable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                    } ${
                      target
                        ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/20 dark:bg-emerald-500/10"
                        : isSel
                          ? "border-brand-gold bg-brand-white ring-4 ring-brand-gold/25 dark:bg-brand-charcoal"
                          : lit
                            ? "border-brand-gold bg-brand-white dark:bg-brand-charcoal"
                            : level === "top"
                              ? "border-brand-gold/60 bg-gradient-to-b from-brand-gold/10 to-brand-white dark:from-brand-gold/15 dark:to-brand-charcoal"
                              : "border-brand-beige/70 bg-brand-white dark:border-brand-dark-grey dark:bg-brand-charcoal"
                    } ${knownRole(n.role) ? "" : "border-dashed"}`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="truncate text-[13px] font-black leading-tight text-brand-black dark:text-brand-white" title={n.role}>
                        {n.role}
                      </span>
                      {editable && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selected === k) setSelected(null);
                            update(removeRole(tree, n.role));
                          }}
                          className="-mr-1 -mt-0.5 shrink-0 rounded-md p-0.5 text-brand-dark-grey/50 opacity-0 transition-opacity hover:bg-brand-red/10 hover:text-brand-red group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
                          aria-label={`Remove ${n.role}`}
                          title="Remove from tree"
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          level === "top" ? "bg-brand-gold/20 text-amber-800 dark:text-brand-gold" : level === "middle" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        {level === "top" ? words.top : level === "middle" ? words.middle : words.bottom}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${people ? "text-brand-dark-grey dark:text-brand-gold-light" : "text-amber-600 dark:text-amber-400"}`} title={knownRole(n.role) ? `${people} staff with this role` : "Not in Roles settings"}>
                        <FiUsers /> {knownRole(n.role) ? (people ? people : "Nobody") : "Unknown role"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected role toolbar */}
      <AnimatePresence initial={false}>
        {editable && selectedNode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-gold/40 bg-brand-gold/5 p-3">
              <span className="text-xs font-bold text-brand-black dark:text-brand-white">{selectedNode.role}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">Move under</span>
                <Select
                  value={selectedNode.parent || "__top__"}
                  onChange={(v) => update(placeRole(tree, selectedNode.role, v === "__top__" ? null : v))}
                  options={moveOptions}
                  className="!w-48 !py-1.5"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  update(removeRole(tree, selectedNode.role));
                  setSelected(null);
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-brand-red transition-colors hover:bg-brand-red/10 cursor-pointer"
              >
                <FiTrash2 /> Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Route preview */}
      <div className="rounded-2xl bg-brand-offwhite p-4 dark:bg-brand-midnight">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-brand-black dark:text-brand-white">Check a route:</span>
          <Select value={preview} onChange={setPreview} placeholder="Choose a role" options={roles.filter((r) => !isSuperAdminRole(r))} className="!w-auto max-w-full !py-1.5" />
        </div>
        {preview && (
          <motion.ol key={`${preview}-${previewChain.map((s) => s.label).join(">")}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <li className="rounded-xl bg-brand-white px-3 py-1.5 font-bold text-brand-black shadow-sm dark:bg-brand-charcoal dark:text-brand-white">{preview} raises it</li>
            {previewChain.length === 0 ? (
              <li className="font-semibold text-brand-dark-grey dark:text-brand-gold-light">— no tree yet, the fixed stages apply.</li>
            ) : (
              previewChain.map((s, i) => {
                const final = i === previewChain.length - 1;
                return (
                  <li key={i} className="flex items-center gap-2">
                    <FiArrowRight className="text-brand-gold" />
                    <span className={`rounded-xl px-3 py-1.5 font-bold shadow-sm ${final ? "bg-brand-gold text-brand-midnight" : "bg-brand-white text-brand-black dark:bg-brand-charcoal dark:text-brand-white"}`}>
                      {s.peer ? `another ${s.label}` : s.label} · {final ? words.top.toLowerCase() : words.middle.toLowerCase()}
                    </span>
                  </li>
                );
              })
            )}
          </motion.ol>
        )}
      </div>

      {/* Warnings */}
      {tree.length > 0 && (unplaced.length > 0 || nobodyAtTop.length > 0) && (
        <div className="space-y-2 text-[12px] font-semibold">
          {unplaced.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
              <FiAlertTriangle className="mt-0.5 shrink-0" />
              <span>
                Not in the tree: {unplaced.join(", ")}. Their {words.requests} go straight to {tops.map((t) => t.role).join(" / ") || "the top"}.
              </span>
            </p>
          )}
          {nobodyAtTop.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-red-700 dark:text-red-300">
              <FiAlertTriangle className="mt-0.5 shrink-0" />
              <span>
                Nobody has the {nobodyAtTop.map((t) => t.role).join(" / ")} role, so {words.requests} that reach the top can only be decided by a Super Admin.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
