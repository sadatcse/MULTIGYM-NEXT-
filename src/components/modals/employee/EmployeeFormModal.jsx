"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiUser, FiPhone, FiBriefcase, FiAlertTriangle, FiMapPin } from "react-icons/fi";
import PhotoUpload from "@/components/Comon/PhotoUpload";
import EmployeeHrFields from "@/components/hr/EmployeeHrFields";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/employee/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function EmployeeFormModal({ activeTab, availablePositions, branches, departments, divisions, editingEmployee, formData, formError, handleCloseModal, handleDepartmentChange, handleSubmit, isModalOpen, isResignedOrTerminated, isSubmitting, permanentAreas, permanentDistricts, presentAreas, presentDistricts, roleOptions, setActiveTab, setFormData, shifts, permissions = FULL_ACCESS }) {
  const allowed = editingEmployee ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl relative my-8 max-h-[calc(100dvh-2rem)] overflow-y-auto"
            >
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="absolute top-5 right-5 p-2 text-brand-dark-grey hover:text-brand-red rounded-full transition-colors cursor-pointer"
              >
                <FiX className="text-xl" />
              </button>

              <h3 className="text-xl font-extrabold text-brand-black dark:text-brand-white mb-1">
                {editingEmployee ? "Edit Employee HR Document" : "Add New HR Employee Record"}
              </h3>
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-4">
                Fill in structured personal info, sub-branch addresses, emergency contacts, and work assignments.
              </p>

              {/* Form Tabs */}
              <div className="flex items-center gap-2 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 pb-3 mb-5 overflow-x-auto">
                {[
                  { id: "personal", label: "Personal Info", icon: FiUser },
                  { id: "contact", label: "Contact & Location", icon: FiPhone },
                  { id: "work", label: "Work & Role", icon: FiBriefcase },
                  ...(isResignedOrTerminated
                    ? [{ id: "offboarding", label: "Resignation / Exit", icon: FiAlertTriangle }]
                    : []),
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${activeTab === tab.id
                        ? "bg-brand-red text-white shadow-md shadow-brand-red/20"
                        : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
                        }`}
                    >
                      <Icon className="text-sm" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-2xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="space-y-4">
{!allowed && <ReadOnlyNotice />}
                {/* TAB 1: PERSONAL INFO */}
                {activeTab === "personal" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Employee ID *
                        </label>
                        <input
                          type="text"
                          value={formData.employeeId}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          placeholder="EMP-0001"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. John Doe"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Gender
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Blood Group
                        </label>
                        <select
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Nationality
                        </label>
                        <input
                          type="text"
                          value={formData.nationality}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          placeholder="Bangladeshi"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          NID / Passport Number
                        </label>
                        <input
                          type="text"
                          value={formData.nidPassport}
                          onChange={(e) => setFormData({ ...formData, nidPassport: e.target.value })}
                          placeholder="1234567890"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                        />
                      </div>

                    </div>

                    <PhotoUpload
                      value={formData.photo}
                      onChange={(url) => setFormData({ ...formData, photo: url })}
                      name={formData.name}
                    />
                  </div>
                )}

                {/* TAB 2: CONTACT & DYNAMIC LOCATION SELECTS */}
                {activeTab === "contact" && (
                  <div className="space-y-5">
                    {/* Basic Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="employee@company.com"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Mobile Number
                        </label>
                        <input
                          type="text"
                          value={formData.mobileNumber}
                          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                          placeholder="+8801700000000"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey space-y-3">
                      <h4 className="text-xs font-extrabold uppercase text-brand-gold tracking-wider flex items-center gap-1.5">
                        <FiPhone className="text-brand-red" /> Emergency Contact
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Contact Name
                          </label>
                          <input
                            type="text"
                            value={formData.emergencyContact.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                              })
                            }
                            placeholder="Relative Name"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Relation
                          </label>
                          <input
                            type="text"
                            value={formData.emergencyContact.relation}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyContact: { ...formData.emergencyContact, relation: e.target.value },
                              })
                            }
                            placeholder="Father / Spouse / Brother"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Mobile Number
                          </label>
                          <input
                            type="text"
                            value={formData.emergencyContact.mobileNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyContact: { ...formData.emergencyContact, mobileNumber: e.target.value },
                              })
                            }
                            placeholder="+8801..."
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Present Address Cascading Dropdowns */}
                    <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey space-y-3">
                      <h4 className="text-xs font-extrabold uppercase text-brand-gold tracking-wider flex items-center gap-1.5">
                        <FiMapPin className="text-brand-gold" /> Present Address (Division / City / Area Selects)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Division Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Division
                          </label>
                          <select
                            value={formData.presentAddress.division}
                            onChange={(e) => {
                              const newDiv = e.target.value;
                              setFormData({
                                ...formData,
                                presentAddress: {
                                  ...formData.presentAddress,
                                  division: newDiv,
                                  city: "",
                                  area: "",
                                },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                          >
                            <option value="">Select Division</option>
                            {divisions.map((div) => (
                              <option key={div} value={div}>
                                {div}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* City / District Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            City / District
                          </label>
                          <select
                            value={formData.presentAddress.city}
                            disabled={!formData.presentAddress.division}
                            onChange={(e) => {
                              const newCity = e.target.value;
                              setFormData({
                                ...formData,
                                presentAddress: {
                                  ...formData.presentAddress,
                                  city: newCity,
                                  area: "",
                                },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Select City / District</option>
                            {presentDistricts.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Area Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Area / Upazila
                          </label>
                          <select
                            value={formData.presentAddress.area}
                            disabled={!formData.presentAddress.city}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                presentAddress: {
                                  ...formData.presentAddress,
                                  area: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Select Area / Upazila</option>
                            {presentAreas.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Address Line 1
                          </label>
                          <input
                            type="text"
                            value={formData.presentAddress.addressLine1}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                presentAddress: { ...formData.presentAddress, addressLine1: e.target.value },
                              })
                            }
                            placeholder="House / Flat / Holding No."
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            value={formData.presentAddress.addressLine2}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                presentAddress: { ...formData.presentAddress, addressLine2: e.target.value },
                              })
                            }
                            placeholder="Road / Block / Sector"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Permanent Address Cascading Dropdowns */}
                    <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey space-y-3">
                      <h4 className="text-xs font-extrabold uppercase text-brand-gold tracking-wider flex items-center gap-1.5">
                        <FiMapPin className="text-emerald-500" /> Permanent Address (Division / City / Area Selects)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Division Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Division
                          </label>
                          <select
                            value={formData.permanentAddress.division}
                            onChange={(e) => {
                              const newDiv = e.target.value;
                              setFormData({
                                ...formData,
                                permanentAddress: {
                                  ...formData.permanentAddress,
                                  division: newDiv,
                                  city: "",
                                  area: "",
                                },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer"
                          >
                            <option value="">Select Division</option>
                            {divisions.map((div) => (
                              <option key={div} value={div}>
                                {div}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* City / District Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            City / District
                          </label>
                          <select
                            value={formData.permanentAddress.city}
                            disabled={!formData.permanentAddress.division}
                            onChange={(e) => {
                              const newCity = e.target.value;
                              setFormData({
                                ...formData,
                                permanentAddress: {
                                  ...formData.permanentAddress,
                                  city: newCity,
                                  area: "",
                                },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Select City / District</option>
                            {permanentDistricts.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Area Select */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Area / Upazila
                          </label>
                          <select
                            value={formData.permanentAddress.area}
                            disabled={!formData.permanentAddress.city}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permanentAddress: {
                                  ...formData.permanentAddress,
                                  area: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Select Area / Upazila</option>
                            {permanentAreas.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Address Line 1
                          </label>
                          <input
                            type="text"
                            value={formData.permanentAddress.addressLine1}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permanentAddress: { ...formData.permanentAddress, addressLine1: e.target.value },
                              })
                            }
                            placeholder="Village / House No."
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            value={formData.permanentAddress.addressLine2}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permanentAddress: { ...formData.permanentAddress, addressLine2: e.target.value },
                              })
                            }
                            placeholder="Post Office / Thana"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: WORK & ROLE */}
                {activeTab === "work" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Employment Status *
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="active">Active</option>
                          <option value="probation">Probation</option>
                          <option value="suspended">Suspended</option>
                          <option value="resigned">Resigned</option>
                          <option value="terminated">Terminated</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Employee Type
                        </label>
                        <select
                          value={formData.employeeType}
                          onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          System Access Role
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer capitalize"
                        >
                          <option value="">Select System Access Role</option>
                          {roleOptions && roleOptions.length > 0 ? (
                            roleOptions.map((r) => {
                              const val = (r.slug || r.roleName || r.name || "").toLowerCase();
                              const label = r.displayName || r.roleName || r.name || val;
                              return (
                                <option key={r._id || val} value={val}>
                                  {label}
                                </option>
                              );
                            })
                          ) : (
                            <>
                              <option value="user">User / Staff</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Super Admin</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Department
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) => handleDepartmentChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="">Select Department</option>
                          {departments.map((d) => (
                            <option key={d._id} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Position
                        </label>
                        <select
                          value={formData.jobPosition}
                          onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                          disabled={!formData.department}
                          className={`w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer ${
                            !formData.department ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        >
                          <option value="">
                            {!formData.department
                              ? "Select Department first"
                              : availablePositions.length === 0
                              ? "No positions found for this department"
                              : "Select Position"}
                          </option>
                          {formData.jobPosition &&
                            !availablePositions.some(
                              (jp) => (jp.title || jp.name) === formData.jobPosition
                            ) && (
                              <option value={formData.jobPosition}>
                                {formData.jobPosition} (Current)
                              </option>
                            )}
                          {availablePositions.map((jp) => (
                            <option key={jp._id} value={jp.title || jp.name}>
                              {jp.title || jp.name}
                            </option>
                          ))}
                        </select>
                        {!formData.department ? (
                          <p className="text-[10px] text-brand-dark-grey/70 dark:text-brand-gold-light/60 mt-1 font-medium">
                            Please select a department first to view its available positions.
                          </p>
                        ) : availablePositions.length === 0 ? (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                            No positions found under &quot;{formData.department}&quot;. Add positions in Settings &gt; Job Positions.
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1.5">
                        Branch(es) <span className="font-medium normal-case text-brand-dark-grey/70">— an employee can belong to more than one</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {branches.map((b) => {
                          const selected = formData.branches.includes(b.name);
                          return (
                            <button
                              key={b._id}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  branches: selected
                                    ? formData.branches.filter((name) => name !== b.name)
                                    : [...formData.branches, b.name],
                                })
                              }
                              className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                                selected
                                  ? "bg-brand-red text-white border-brand-red shadow-sm"
                                  : "bg-brand-offwhite dark:bg-brand-midnight text-brand-black dark:text-brand-white border-brand-beige dark:border-brand-dark-grey hover:border-brand-red/50"
                              }`}
                            >
                              {b.name}
                            </button>
                          );
                        })}
                        {branches.length === 0 && (
                          <p className="text-[10px] text-brand-dark-grey/70 dark:text-brand-gold-light/60 font-medium">
                            No branches configured yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Work Shift
                        </label>
                        <select
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        >
                          <option value="">Select Shift</option>
                          {shifts.map((s) => (
                            <option key={s._id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Joining Date
                        </label>
                        <input
                          type="date"
                          value={formData.joiningDate}
                          onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <EmployeeHrFields formData={formData} setFormData={setFormData} editingId={editingEmployee?._id} />

                    {!editingEmployee && (
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-dark-grey dark:text-brand-gold-light mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-gold/50 outline-none"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: CONDITIONAL OFFBOARDING INFO */}
                {activeTab === "offboarding" && isResignedOrTerminated && (
                  <div className="space-y-4 p-4 rounded-2xl bg-brand-red/10 border border-brand-red/30">
                    <div className="flex items-center gap-2 text-brand-red font-bold text-xs">
                      <FiAlertTriangle className="text-base" />
                      <span>Employee Resignation / Termination Tracking</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-red mb-1">
                          Resignation Date
                        </label>
                        <input
                          type="date"
                          value={formData.resignationDate}
                          onChange={(e) =>
                            setFormData({ ...formData, resignationDate: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-midnight border border-brand-red/40 text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-red outline-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-brand-red mb-1">
                          Last Working Date
                        </label>
                        <input
                          type="date"
                          value={formData.lastWorkingDate}
                          onChange={(e) =>
                            setFormData({ ...formData, lastWorkingDate: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-midnight border border-brand-red/40 text-xs font-bold text-brand-black dark:text-brand-white focus:ring-2 focus:ring-brand-red outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-brand-beige/50 dark:border-brand-dark-grey/50">
                  <div className="flex items-center gap-2">
                    {activeTab !== "personal" && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            activeTab === "offboarding"
                              ? "work"
                              : activeTab === "work"
                                ? "contact"
                                : "personal"
                          )
                        }
                        className="px-4 py-2 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white hover:bg-brand-offwhite dark:hover:bg-brand-midnight transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                    {activeTab !== "work" && activeTab !== "offboarding" && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(activeTab === "personal" ? "contact" : "work")
                        }
                        className="px-4 py-2 rounded-2xl bg-brand-gold text-brand-midnight text-xs font-black hover:bg-brand-gold-light transition-colors cursor-pointer"
                      >
                        Next
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-2xl border border-brand-beige dark:border-brand-dark-grey text-xs font-bold text-brand-black dark:text-brand-white hover:bg-brand-offwhite dark:hover:bg-brand-midnight transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit" hidden={!allowed}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-lg shadow-brand-red/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>{editingEmployee ? "Update Record" : "Save Record"}</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
