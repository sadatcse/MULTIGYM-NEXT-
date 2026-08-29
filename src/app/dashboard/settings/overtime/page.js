"use client";

import React, { useState } from "react";
import useOvertimeApi from "@/hooks/useOvertimeApi";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import Mtitle from "@/components/Comon/Mtitle";
import Swal from "sweetalert2";
import {
  FiClock,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiFileText,
  FiX,
} from "react-icons/fi";

export default function OvertimePage() {
  const { formatDate } = useSystemTimeZone();
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission("/dashboard/settings/overtime", "view");
  const canAdd = hasPermission("/dashboard/settings/overtime", "add");
  const canEdit = hasPermission("/dashboard/settings/overtime", "edit");
  const canDelete = hasPermission("/dashboard/settings/overtime", "delete");

  const { employees } = useEmployeeApi(100);
  const {
    policies,
    records,
    policyStats,
    recordStats,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    createPolicy,
    updatePolicy,
    deletePolicy,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useOvertimeApi(50);

  const [activeTab, setActiveTab] = useState("policies");

  // Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policyForm, setPolicyForm] = useState({
    policyName: "",
    ratePerHour: 1.5,
    maxHoursPerMonth: 40,
    minOvertimeMinutes: 30,
    status: "active",
  });

  // Record Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordForm, setRecordForm] = useState({
    employeeName: "",
    employeeId: "",
    recordDate: new Date().toISOString().split("T")[0],
    overtimeHours: 2,
    overtimeMinutes: 0,
    status: "approved",
    remarks: "",
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Policy Add/Edit
  const handleOpenAddPolicy = () => {
    if (!canAdd) return;
    setEditingPolicy(null);
    setPolicyForm({ policyName: "", ratePerHour: 1.5, maxHoursPerMonth: 40, minOvertimeMinutes: 30, status: "active" });
    setFormError("");
    setIsPolicyModalOpen(true);
  };

  const handleOpenEditPolicy = (p) => {
    if (!canEdit) return;
    setEditingPolicy(p);
    setPolicyForm({
      policyName: p.policyName || "",
      ratePerHour: p.ratePerHour !== undefined ? p.ratePerHour : 1.5,
      maxHoursPerMonth: p.maxHoursPerMonth !== undefined ? p.maxHoursPerMonth : 40,
      minOvertimeMinutes: p.minOvertimeMinutes !== undefined ? p.minOvertimeMinutes : 30,
      status: p.status || "active",
    });
    setFormError("");
    setIsPolicyModalOpen(true);
  };

  const handleSubmitPolicy = async (e) => {
    e.preventDefault();
    if (!policyForm.policyName.trim()) {
      setFormError("Policy name is required.");
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    try {
      if (editingPolicy) {
        await updatePolicy(editingPolicy._id, policyForm);
        Swal.fire("Policy Updated!", `"${policyForm.policyName}" updated successfully.`, "success");
      } else {
        await createPolicy(policyForm);
        Swal.fire("Policy Created!", `"${policyForm.policyName}" created successfully.`, "success");
      }
      setIsPolicyModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save policy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePolicy = (p) => {
    if (!canDelete) return;
    Swal.fire({
      title: "Delete Overtime Policy?",
      text: `Delete "${p.policyName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#6B7280",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await deletePolicy(p._id);
          Swal.fire("Deleted!", "Policy deleted.", "success");
        } catch (err) {
          Swal.fire("Error", err?.response?.data?.message || "Failed to delete.", "error");
        }
      }
    });
  };

  // Open Record Add/Edit
  const handleOpenAddRecord = () => {
    if (!canAdd) return;
    setEditingRecord(null);
    setRecordForm({ employeeName: "", employeeId: "", recordDate: new Date().toISOString().split("T")[0], overtimeHours: 2, overtimeMinutes: 0, status: "approved", remarks: "" });
    setFormError("");
    setIsRecordModalOpen(true);
  };

  const handleOpenEditRecord = (r) => {
    if (!canEdit) return;
    setEditingRecord(r);
    setRecordForm({
      employeeName: r.employeeName || "",
      employeeId: r.employeeId || "",
      recordDate: r.recordDate || new Date().toISOString().split("T")[0],
      overtimeHours: r.overtimeHours !== undefined ? r.overtimeHours : 2,
      overtimeMinutes: r.overtimeMinutes !== undefined ? r.overtimeMinutes : 0,
      status: r.status || "approved",
      remarks: r.remarks || "",
    });
    setFormError("");
    setIsRecordModalOpen(true);
  };

  const handleSelectRecordEmployee = (empName) => {
    const found = employees.find((e) => e.name === empName);
    setRecordForm((prev) => ({
      ...prev,
      employeeName: empName,
      employeeId: found ? found.employeeId : "",
    }));
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.employeeName.trim()) {
      setFormError("Employee name is required.");
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    try {
      if (editingRecord) {
        await updateRecord(editingRecord._id, recordForm);
        Swal.fire("Record Updated!", "Overtime record updated successfully.", "success");
      } else {
        await createRecord(recordForm);
        Swal.fire("Record Logged!", "Overtime record logged successfully.", "success");
      }
      setIsRecordModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = (r) => {
    if (!canDelete) return;
    Swal.fire({
      title: "Delete Overtime Record?",
      text: `Delete record for "${r.employeeName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF1818",
      cancelButtonColor: "#6B7280",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await deleteRecord(r._id);
          Swal.fire("Deleted!", "Record deleted.", "success");
        } catch (err) {
          Swal.fire("Error", err?.response?.data?.message || "Failed to delete.", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 font-sans">
      <Mtitle
        title="Overtime Policy & Record Management"
        subtitle="Manage overtime calculation policies (hourly multiplier rate, max monthly hours) and log employee overtime records."
      />

      {/* NAVIGATION TABS BAR */}
      <div className="flex items-center justify-between p-2 bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === "policies" ? "bg-brand-red text-white shadow-md shadow-brand-red/20" : "text-brand-dark-grey"}`}
          >
            Overtime Policies List ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === "records" ? "bg-brand-red text-white shadow-md shadow-brand-red/20" : "text-brand-dark-grey"}`}
          >
            Employee Overtime Log ({records.length})
          </button>
        </div>

        {canAdd && (
          <button
            onClick={activeTab === "policies" ? handleOpenAddPolicy : handleOpenAddRecord}
            className="px-5 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs shadow-md shadow-brand-red/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <FiPlus />
            <span>{activeTab === "policies" ? "Add Overtime Policy" : "Log Overtime Record"}</span>
          </button>
        )}
      </div>

      {/* POLICIES TAB */}
      {activeTab === "policies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((p) => (
            <div key={p._id} className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-black">
                    <FiClock />
                  </div>
                  <h4 className="text-sm font-black text-brand-black dark:text-brand-white">{p.policyName}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${p.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                    {p.status}
                  </span>
                  {canEdit && (
                    <button onClick={() => handleOpenEditPolicy(p)} className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all cursor-pointer">
                      <FiEdit />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDeletePolicy(p)} className="p-2 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-all cursor-pointer">
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                  <span className="text-[10px] text-brand-dark-grey block">Rate Per Hour</span>
                  <span className="text-emerald-500 font-black">{p.ratePerHour}x Multiplier</span>
                </div>
                <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                  <span className="text-[10px] text-brand-dark-grey block">Max Hours / Mo</span>
                  <span>{p.maxHoursPerMonth} Hours</span>
                </div>
                <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight col-span-2">
                  <span className="text-[10px] text-brand-dark-grey block">Min Overtime Threshold</span>
                  <span>{p.minOvertimeMinutes} Minutes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECORDS TAB */}
      {activeTab === "records" && (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-offwhite dark:bg-brand-midnight/60 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 text-[11px] font-black uppercase text-brand-dark-grey dark:text-brand-gold-light tracking-wider">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Employee Name</th>
                  <th className="py-3.5 px-4">Record Date</th>
                  <th className="py-3.5 px-4">Overtime Hours</th>
                  <th className="py-3.5 px-4">Overtime Minutes</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs font-bold">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-brand-dark-grey">
                      No overtime records logged. Click "Log Overtime Record" to create one.
                    </td>
                  </tr>
                ) : (
                  records.map((item, idx) => (
                    <tr key={item._id} className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/30 transition-colors">
                      <td className="py-3.5 px-4 text-brand-dark-grey">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-black text-brand-black dark:text-brand-white">
                        {item.employeeName}
                        {item.employeeId && <span className="block text-[10px] text-brand-dark-grey">({item.employeeId})</span>}
                      </td>
                      <td className="py-3.5 px-4 text-brand-black dark:text-brand-white">{item.recordDate ? formatDate(item.recordDate) : "—"}</td>
                      <td className="py-3.5 px-4 text-emerald-500 font-black">{item.overtimeHours} Hours</td>
                      <td className="py-3.5 px-4">{item.overtimeMinutes} Mins</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${item.status === "approved" ? "bg-emerald-500/10 text-emerald-500" : item.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-brand-dark-grey">{item.remarks || "N/A"}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {canEdit && (
                          <button onClick={() => handleOpenEditRecord(item)} className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all cursor-pointer">
                            <FiEdit />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDeleteRecord(item)} className="p-2 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-all cursor-pointer">
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POLICY MODAL */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                {editingPolicy ? "Edit Overtime Policy" : "Add Overtime Policy"}
              </h3>
              <button onClick={() => setIsPolicyModalOpen(false)} className="p-2 text-brand-dark-grey hover:text-brand-red cursor-pointer">
                <FiX />
              </button>
            </div>
            {formError && <div className="p-3 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold">{formError}</div>}
            <form onSubmit={handleSubmitPolicy} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Policy Name <span className="text-brand-red">*</span></label>
                <input
                  type="text"
                  value={policyForm.policyName}
                  onChange={(e) => setPolicyForm({ ...policyForm, policyName: e.target.value })}
                  placeholder="e.g. Standard Overtime Policy 1.5x"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Rate Per Hour (Multiplier)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={policyForm.ratePerHour}
                    onChange={(e) => setPolicyForm({ ...policyForm, ratePerHour: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Max Hours / Month</label>
                  <input
                    type="number"
                    value={policyForm.maxHoursPerMonth}
                    onChange={(e) => setPolicyForm({ ...policyForm, maxHoursPerMonth: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Min Overtime Threshold (Mins)</label>
                <input
                  type="number"
                  value={policyForm.minOvertimeMinutes}
                  onChange={(e) => setPolicyForm({ ...policyForm, minOvertimeMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Status</label>
                <select
                  value={policyForm.status}
                  onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsPolicyModalOpen(false)} className="px-5 py-2 rounded-2xl bg-brand-offwhite border text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl bg-brand-red text-white font-black text-xs">{isSubmitting ? "Saving..." : "Save Policy"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-beige/40 dark:border-brand-dark-grey/40 pb-3">
              <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                {editingRecord ? "Edit Overtime Record" : "Log Overtime Record"}
              </h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="p-2 text-brand-dark-grey hover:text-brand-red cursor-pointer">
                <FiX />
              </button>
            </div>
            {formError && <div className="p-3 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold">{formError}</div>}
            <form onSubmit={handleSubmitRecord} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Select Employee <span className="text-brand-red">*</span></label>
                <select
                  value={recordForm.employeeName}
                  onChange={(e) => handleSelectRecordEmployee(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border text-xs font-bold cursor-pointer"
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp.name}>{emp.name} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Record Date</label>
                  <input
                    type="date"
                    value={recordForm.recordDate}
                    onChange={(e) => setRecordForm({ ...recordForm, recordDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite border text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">OT Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={recordForm.overtimeHours}
                    onChange={(e) => setRecordForm({ ...recordForm, overtimeHours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite border text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">OT Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={recordForm.overtimeMinutes}
                    onChange={(e) => setRecordForm({ ...recordForm, overtimeMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite border text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Status</label>
                <select
                  value={recordForm.status}
                  onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite border text-xs font-bold cursor-pointer"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={recordForm.remarks}
                  onChange={(e) => setRecordForm({ ...recordForm, remarks: e.target.value })}
                  placeholder="Overtime reason..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite border text-xs font-bold resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="px-5 py-2 rounded-2xl bg-brand-offwhite border text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-2xl bg-brand-red text-white font-black text-xs">{isSubmitting ? "Saving..." : "Save Record"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
