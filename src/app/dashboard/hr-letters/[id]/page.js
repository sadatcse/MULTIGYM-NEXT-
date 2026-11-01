"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FiAlertTriangle, FiArrowLeft, FiClock, FiEdit3, FiFileText, FiLayers, FiRefreshCw, FiSend, FiSlash } from "react-icons/fi";
import { useHrLetterActions } from "@/hooks/useHrLetterApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import { errMsg, fmtDate, fmtDateTime } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmptyState, Loading, PageHeader, pageCls } from "@/components/hr/HrUi";
import LetterViewer from "@/components/letters/LetterViewer";
import ReissueLetterModal from "@/components/modals/letters/ReissueLetterModal";
import CancelLetterModal from "@/components/modals/letters/CancelLetterModal";
import { auditActionMeta, isIssued, letterStatusMeta, letterTypeMeta } from "@/components/letters/letterConstants";

function MetaRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-brand-beige/30 dark:border-brand-dark-grey/30 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light shrink-0">{label}</span>
      <span className="text-xs font-bold text-brand-black dark:text-brand-white text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

export default function LetterDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { can } = useUserPermissions();
  const actions = useHrLetterActions();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reissueOpen, setReissueOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(
    async (logView = false) => {
      setError("");
      try {
        const res = await actions.getLetterById(id);
        setData(res);
        if (logView) actions.logClientAction(id, "viewed");
      } catch (e) {
        setError(errMsg(e, "Could not load this letter"));
      } finally {
        setLoading(false);
      }
    },
    [actions, id],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(true);
  }, [load]);

  if (loading) return <Loading rows={8} />;
  if (error || !data?.letter) {
    return (
      <div className={pageCls}>
        <PageHeader title="HR letter" />
        <EmptyState icon={<FiFileText />} title="Letter not available" text={error || "It may have been deleted."} action={<Link href="/dashboard/hr-letters"><Btn variant="ghost"><FiArrowLeft /> All letters</Btn></Link>} />
      </div>
    );
  }

  const { letter, versions = [], auditLogs = [] } = data;
  const type = letterTypeMeta(letter.letterType);
  const status = letterStatusMeta(letter.status);
  const latest = versions.length ? versions[versions.length - 1] : null;

  const issueDraft = async () => {
    const ok = await Swal.fire({ title: "Issue this letter?", text: "A permanent memo number will be assigned.", icon: "question", showCancelButton: true, confirmButtonText: "Issue letter", confirmButtonColor: "#FF1818" });
    if (!ok.isConfirmed) return;
    setIssuing(true);
    try {
      const res = await actions.issueDraft(letter._id);
      toast.success(res?.message || "Letter issued");
      await load();
    } catch (e) {
      toast.error(errMsg(e, "Could not issue the letter"));
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className={pageCls}>
      <PageHeader
        title={`${type.titleEnglish} — ${letter.employeeName}`}
        subtitle={`${letter.contentSnapshot?.letterMeta?.titleBangla || type.titleBangla} · ${letter.status === "draft" ? "Draft (no memo number yet)" : letter.letterNumber}`}
        actions={
          <>
            <Btn variant="ghost" onClick={() => router.push("/dashboard/hr-letters")}>
              <FiArrowLeft /> All letters
            </Btn>
            {letter.status === "draft" && can("hr-letters", "edit") && (
              <Link href={`/dashboard/hr-letters/create?draftId=${letter._id}`}>
                <Btn variant="ghost">
                  <FiEdit3 /> Continue editing
                </Btn>
              </Link>
            )}
            {letter.status === "draft" && can("hr-letters", "add") && (
              <Btn onClick={issueDraft} loading={issuing}>
                <FiSend /> Issue letter
              </Btn>
            )}
            {isIssued(letter.status) && can("hr-letters", "edit") && (
              <>
                <Btn variant="ghost" onClick={() => setCancelOpen(true)}>
                  <FiSlash /> Cancel
                </Btn>
                <Btn onClick={() => setReissueOpen(true)} className="!bg-amber-500 hover:!bg-amber-600 !shadow-amber-500/20">
                  <FiRefreshCw /> Reissue
                </Btn>
              </>
            )}
          </>
        }
      />

      {/* Status banners */}
      {letter.status === "reissued" && latest && latest._id !== letter._id && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold">
          <span className="flex items-center gap-2">
            <FiLayers /> This is an older version (v{letter.version}). It was replaced by v{latest.version}.
          </span>
          <Link href={`/dashboard/hr-letters/${latest._id}`} className="underline">
            Open the current version
          </Link>
        </div>
      )}
      {letter.status === "cancelled" && (
        <div className="flex items-start gap-2 p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs">
          <FiAlertTriangle className="mt-0.5 shrink-0" />
          <span>
            <b>Cancelled</b> {letter.cancelledAt ? `on ${fmtDateTime(letter.cancelledAt)}` : ""} {letter.cancelledBy?.name ? `by ${letter.cancelledBy.name}` : ""}.
            {letter.cancelReason ? ` Reason: ${letter.cancelReason}` : ""} Copies print with a CANCELLED watermark.
          </span>
        </div>
      )}
      {letter.status === "draft" && (
        <div className="flex items-start gap-2 p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
          <FiAlertTriangle className="mt-0.5 shrink-0" />
          <span>This is a draft. Printed copies carry a DRAFT watermark. Issue it to assign the official memo number.</span>
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <Card bodyClassName="p-3 sm:p-5">
          <LetterViewer snapshot={letter.contentSnapshot} status={letter.status} version={letter.version} fileName={letter.fileName} onAction={(a) => actions.logClientAction(letter._id, a)} />
        </Card>

        <div className="space-y-5">
          <Card title="Letter details">
            <div className="flex items-center gap-3 pb-3 mb-1 border-b border-brand-beige/40 dark:border-brand-dark-grey/40">
              <Avatar name={letter.employeeName} photo={letter.employeePhoto} size={44} />
              <div className="min-w-0">
                <div className="text-sm font-black text-brand-black dark:text-brand-white truncate">{letter.employeeName}</div>
                <div className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light truncate">{[letter.employeeCode, letter.designation].filter(Boolean).join(" · ")}</div>
              </div>
            </div>
            <MetaRow label="Status">
              <Badge tone={status.tone}>
                {status.label}
                {letter.version > 1 ? ` · v${letter.version}` : ""}
              </Badge>
            </MetaRow>
            <MetaRow label="Memo no.">
              <span className="font-mono">{letter.status === "draft" ? "Assigned on issue" : letter.letterNumber}</span>
            </MetaRow>
            <MetaRow label="Letter date">{fmtDate(letter.letterDate)}</MetaRow>
            <MetaRow label="Effective">{fmtDate(letter.effectiveDate)}</MetaRow>
            <MetaRow label="Branch">{letter.branch || "—"}</MetaRow>
            <MetaRow label="Department">{letter.department || "—"}</MetaRow>
            <MetaRow label="Prepared by">
              {letter.generatedBy?.name || "—"}
              <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">{fmtDateTime(letter.generatedAt || letter.createdAt)}</span>
            </MetaRow>
            {letter.issuedAt && <MetaRow label="Issued">{fmtDateTime(letter.issuedAt)}</MetaRow>}
            {letter.reissueReason && <MetaRow label="Reissue reason">{letter.reissueReason}</MetaRow>}
            {letter.remarks && <MetaRow label="Internal note">{letter.remarks}</MetaRow>}
          </Card>

          {versions.length > 1 && (
            <Card title={`Versions (${versions.length})`}>
              <div className="space-y-2">
                {versions.map((v) => {
                  const m = letterStatusMeta(v.status);
                  const current = v._id === letter._id;
                  return (
                    <Link
                      key={v._id}
                      href={`/dashboard/hr-letters/${v._id}`}
                      className={`block p-3 rounded-2xl border transition-all ${current ? "border-brand-gold bg-brand-gold/10" : "border-brand-beige/50 dark:border-brand-dark-grey/50 hover:border-brand-gold/60"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-brand-black dark:text-brand-white">Version {v.version}</span>
                        <Badge tone={current ? "gold" : m.tone}>{current ? "Viewing" : m.label}</Badge>
                      </div>
                      <p className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light mt-1">
                        {fmtDate(v.letterDate)} · {v.generatedBy?.name || "HR"}
                      </p>
                      {v.reissueReason && <p className="text-[10px] italic text-brand-dark-grey dark:text-brand-gold-light/80 mt-0.5 line-clamp-2">“{v.reissueReason}”</p>}
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}

          <Card title={<span className="flex items-center gap-2"><FiClock className="text-brand-gold" /> Activity</span>} subtitle="Who created, printed or changed this letter">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">No activity recorded.</p>
            ) : (
              <ol className="relative border-l-2 border-brand-gold/30 ml-2 space-y-3 max-h-80 overflow-y-auto pr-1">
                {auditLogs.map((log) => {
                  const m = auditActionMeta(log.action);
                  return (
                    <li key={log._id} className="ml-4">
                      <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-brand-gold border-2 border-brand-white dark:border-brand-charcoal" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={m.tone}>{m.label}</Badge>
                        <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light">{fmtDateTime(log.createdAt)}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-brand-black dark:text-brand-white mt-0.5">
                        {log.performedBy?.name || "System"}
                        {log.performedBy?.role ? <span className="text-brand-dark-grey dark:text-brand-gold-light font-normal"> · {log.performedBy.role}</span> : null}
                      </p>
                      {log.metadata?.reason && <p className="text-[10px] italic text-brand-dark-grey dark:text-brand-gold-light/80">“{log.metadata.reason}”</p>}
                      {log.metadata?.reissueReason && <p className="text-[10px] italic text-brand-dark-grey dark:text-brand-gold-light/80">“{log.metadata.reissueReason}”</p>}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <ReissueLetterModal
        isOpen={reissueOpen}
        onClose={() => setReissueOpen(false)}
        letter={letter}
        onDone={(l) => {
          toast.success(`Version ${l?.version || ""} issued`);
          if (l?._id) router.push(`/dashboard/hr-letters/${l._id}`);
        }}
      />
      <CancelLetterModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        letter={letter}
        onDone={() => {
          toast.success("Letter cancelled");
          load();
        }}
      />
    </div>
  );
}
