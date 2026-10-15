"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { FiX, FiBriefcase, FiUser, FiMail, FiPhone } from "react-icons/fi";
import EmployeeLettersSection from "@/components/letters/EmployeeLettersSection";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/employee/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// is passed for consistency (this modal has no submit form).
export default function EmployeeViewModal({ EmployeeAssetsSection, formatAddressStr, formatDate, isViewModalOpen, router, setIsViewModalOpen, viewingEmployee, permissions = FULL_ACCESS }) {
  return (
    <>
<AnimatePresence>
        {isViewModalOpen && viewingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey overflow-hidden shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto"
            >
              <div className="p-6 bg-brand-offwhite dark:bg-brand-midnight border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={viewingEmployee.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
                    alt={viewingEmployee.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-gold shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-brand-black dark:text-brand-white">
                        {viewingEmployee.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-gold/10 text-brand-gold border border-brand-gold/30">
                        {viewingEmployee.employeeId || "EMP"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                      {viewingEmployee.jobPosition || "Staff"} • {viewingEmployee.department || "General"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light">
                      {viewingEmployee.reportingAuthorityName && <span>Reports to: {viewingEmployee.reportingAuthorityName}</span>}
                      {viewingEmployee.deviceUserId && <span>Device ID: {viewingEmployee.deviceUserId}</span>}
                      {viewingEmployee.documents?.length > 0 && (
                        <span className="flex flex-wrap gap-1.5">
                          {viewingEmployee.documents.map((d, i) => (
                            <a key={i} href={d.url} target="_blank" rel="noreferrer" className="underline hover:text-brand-gold">{d.title}</a>
                          ))}
                        </span>
                      )}
                      <Link href={`/dashboard/employee/history?employee=${viewingEmployee._id}`} className="text-brand-gold hover:underline">Career history →</Link>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-brand-white dark:bg-brand-charcoal hover:bg-brand-red hover:text-white flex items-center justify-center text-brand-dark-grey transition-all cursor-pointer"
                >
                  <FiX className="text-base" />
                </button>
              </div>

              <div className="p-6 max-h-[78vh] overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                    <FiBriefcase /> Employment Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Branch(es)</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">
                        {viewingEmployee.branches?.length > 0 ? viewingEmployee.branches.join(", ") : viewingEmployee.branch || "—"}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Shift</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.shift || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Employee Type</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.employeeType || "Full-time"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Joining Date</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.joiningDate ? formatDate(viewingEmployee.joiningDate) : "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Role</span>
                      <span className="font-bold uppercase text-brand-black dark:text-brand-white">{viewingEmployee.role || "user"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Status</span>
                      <span className={`font-bold capitalize ${viewingEmployee.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>{viewingEmployee.status || 'active'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                    <FiUser /> Personal Information
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Date of Birth</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.dateOfBirth ? formatDate(viewingEmployee.dateOfBirth) : "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Gender</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.gender || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Blood Group</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.bloodGroup || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Nationality</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.nationality || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">NID / Passport</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.nidPassport || "—"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                    <FiMail /> Contact & Location
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Email Address</span>
                      <span className="font-bold text-brand-black dark:text-brand-white break-all">{viewingEmployee.email}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Mobile Number</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.mobileNumber || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Present Address</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{formatAddressStr(viewingEmployee.presentAddress) || "—"}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight">
                      <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Permanent Address</span>
                      <span className="font-bold text-brand-black dark:text-brand-white">{formatAddressStr(viewingEmployee.permanentAddress) || "—"}</span>
                    </div>
                  </div>
                </div>

                {viewingEmployee.emergencyContact && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                      <FiPhone /> Emergency Contact
                    </h4>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Contact Person</span>
                        <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.emergencyContact.name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Relation</span>
                        <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.emergencyContact.relation || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-brand-dark-grey block">Mobile Number</span>
                        <span className="font-bold text-brand-black dark:text-brand-white">{viewingEmployee.emergencyContact.mobileNumber || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                <EmployeeAssetsSection employeeId={viewingEmployee._id} formatDate={formatDate} onViewAll={() => router.push("/dashboard/assets")} />

                <EmployeeLettersSection employeeId={viewingEmployee._id} employeeData={viewingEmployee} />
              </div>

              <div className="p-4 bg-brand-offwhite dark:bg-brand-midnight border-t border-brand-beige/50 dark:border-brand-dark-grey/50 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-2.5 rounded-2xl bg-brand-charcoal text-white dark:bg-brand-white dark:text-brand-midnight font-black text-xs hover:opacity-90 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
