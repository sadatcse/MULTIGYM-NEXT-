"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiPrinter,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiClock,
  FiUser,
  FiLayers,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import Mtitle from "@/components/Comon/Mtitle";
import useHrLetterApi from "@/hooks/useHrLetterApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import LetterDocumentView from "@/components/letters/LetterDocumentView";
import ReissueLetterModal from "@/components/letters/ReissueLetterModal";
import Swal from "sweetalert2";

export default function LetterDetailPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const letterId = resolvedParams?.id;

  const { can } = useUserPermissions();
  const { getLetterById, reissueLetter, logClientAction } = useHrLetterApi();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReissueOpen, setIsReissueOpen] = useState(false);

  const loadData = async () => {
    if (!letterId) return;
    setLoading(true);
    try {
      const res = await getLetterById(letterId);
      setData(res);
      logClientAction(letterId, "viewed");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load letter details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [letterId]);

  const handleConfirmReissue = async (id, payload) => {
    try {
      const res = await reissueLetter(id, payload);
      Swal.fire({
        icon: "success",
        title: "Reissued Successfully",
        text: `Version ${res?.data?.version || 2} created.`,
      });
      router.push(`/dashboard/hr-letters/${res?.data?._id || id}`);
    } catch (err) {
      Swal.fire("Error", "Failed to reissue letter", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-xs text-brand-dark-grey">
        <FiLoader className="animate-spin text-base mr-2" /> Loading document details...
      </div>
    );
  }

  if (!data?.letter) {
    return (
      <div className="p-12 text-center text-xs text-brand-dark-grey">
        Letter document not found.
      </div>
    );
  }

  const { letter, versions = [], auditLogs = [] } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/dashboard/hr-letters")}
            className="text-xs font-bold text-brand-primary flex items-center gap-1 mb-1.5 hover:underline cursor-pointer"
          >
            <FiArrowLeft /> Back to All Letters
          </button>
          <Mtitle
            title={`${letter.contentSnapshot?.letterMeta?.titleBangla || "HR Letter"} (${letter.letterNumber})`}
            subtitle={`Issued for ${letter.employeeName} (${letter.employeeCode || "EMP"}) on ${letter.letterDate}`}
          />
        </div>

        <div className="flex items-center gap-2">
          {can("hr-letters", "edit") && (
            <button
              onClick={() => setIsReissueOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FiRefreshCw />
              <span>Reissue Letter</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Document View (3 cols) */}
        <div className="lg:col-span-3">
          <div className="p-4 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-brand-beige/60 dark:border-brand-dark-grey flex justify-center shadow-inner">
            <LetterDocumentView snapshot={letter.contentSnapshot} showActions={true} />
          </div>
        </div>

        {/* Right Side: Version History & Metadata (1 col) */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm space-y-3 text-xs">
            <h4 className="font-black uppercase text-[11px] text-brand-gold tracking-wider flex items-center gap-1.5">
              <FiFileText /> Letter Metadata
            </h4>
            <div className="space-y-2 pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey block">Letter Memo No.</span>
                <span className="font-mono font-bold text-brand-black dark:text-brand-white">{letter.letterNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey block">Current Status</span>
                <span className={`font-bold capitalize ${letter.status === 'reissued' ? 'text-blue-500' : 'text-emerald-500'}`}>
                  {letter.status} (v{letter.version})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey block">Issue Date</span>
                <span className="font-semibold text-brand-black dark:text-brand-white">{letter.letterDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-dark-grey block">Generated By</span>
                <span className="font-semibold text-brand-black dark:text-brand-white">{letter.generatedBy?.name || "HR Admin"}</span>
              </div>
              {letter.reissueReason && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200">
                  <span className="text-[10px] uppercase font-black block">Reissue Reason:</span>
                  <span className="italic">{letter.reissueReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Versions Timeline Card */}
          <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm space-y-3 text-xs">
            <h4 className="font-black uppercase text-[11px] text-brand-gold tracking-wider flex items-center gap-1.5">
              <FiLayers /> Version History ({versions.length})
            </h4>
            <div className="space-y-2.5 pt-1">
              {versions.map((v) => (
                <div
                  key={v._id}
                  onClick={() => router.push(`/dashboard/hr-letters/${v._id}`)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    v._id === letter._id
                      ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-xs"
                      : "border-brand-beige/60 dark:border-brand-dark-grey hover:border-brand-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs text-brand-black dark:text-brand-white">
                      Version {v.version}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      v._id === letter._id ? "bg-brand-primary text-white" : "bg-brand-beige/50 text-brand-dark-grey"
                    }`}>
                      {v._id === letter._id ? "Active View" : v.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-dark-grey">
                    {v.letterDate} • {v.generatedBy?.name || "HR"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail Card */}
          <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm space-y-3 text-xs">
            <h4 className="font-black uppercase text-[11px] text-brand-gold tracking-wider flex items-center gap-1.5">
              <FiClock /> Audit Trail ({auditLogs.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log._id} className="p-2.5 rounded-xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[10px] text-brand-primary">{log.action}</span>
                    <span className="text-[9px] text-brand-dark-grey">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-brand-dark-grey dark:text-brand-sage">
                    By: {log.performedBy?.name || "System"} ({log.performedBy?.role})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reissue Modal */}
      {isReissueOpen && (
        <ReissueLetterModal
          isOpen={isReissueOpen}
          onClose={() => setIsReissueOpen(false)}
          letter={letter}
          onReissueSubmit={handleConfirmReissue}
        />
      )}
    </div>
  );
}
