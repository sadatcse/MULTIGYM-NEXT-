"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiBox, FiX, FiPackage, FiLayers, FiSliders, FiPlus, FiTrash2, FiZap, FiLoader } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/assets/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function AssetFormModal({ activeAssetTypes, editingAsset, formData, formErrors, handleAddAttributeRow, handleAddPresetAttribute, handleAddVariantRow, handleAttributeChange, handleAutoGenerateVariants, handleRemoveAttributeRow, handleRemoveVariantRow, handleSubmit, handleVariantChange, isModalOpen, isSubmitting, setFormData, setIsModalOpen, permissions = FULL_ACCESS }) {
  const allowed = editingAsset ? permissions.canEdit : permissions.canAdd;
  return (
    <>
<AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-white dark:bg-brand-charcoal w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                    <FiBox className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">{editingAsset ? "Edit Asset" : "Add New Asset"}</h3>
                    <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light font-medium">Configure code, specs, dynamic attributes & variant combinations</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white">
                  <FiX className="text-lg" />
                </button>
              </div>

              <form onSubmit={allowed ? handleSubmit : (e) => e.preventDefault()} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
{!allowed && <ReadOnlyNotice />}
                {/* Product Type Selector */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-gold mb-1.5">
                    Product / Asset Structure Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, productType: "simple", useAttributes: false, useVariants: false }))}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        formData.productType === "simple" && !formData.useVariants
                          ? "bg-brand-gold/15 border-brand-gold text-brand-black dark:text-brand-white ring-2 ring-brand-gold/30 shadow-sm"
                          : "bg-brand-offwhite dark:bg-brand-midnight border-brand-beige/60 dark:border-brand-dark-grey opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black text-xs">
                        <FiPackage className="text-brand-gold text-base" /> Simple Product
                      </div>
                      <p className="text-[10px] text-brand-dark-grey mt-1 font-medium leading-tight">
                        Single SKU item (e.g. Defibrillator, Laptop, Master Key)
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, productType: "variable", useAttributes: true, useVariants: true }))}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        formData.productType === "variable" || formData.useVariants
                          ? "bg-brand-gold/15 border-brand-gold text-brand-black dark:text-brand-white ring-2 ring-brand-gold/30 shadow-sm"
                          : "bg-brand-offwhite dark:bg-brand-midnight border-brand-beige/60 dark:border-brand-dark-grey opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black text-xs">
                        <FiLayers className="text-brand-gold text-base" /> Variable Product
                      </div>
                      <p className="text-[10px] text-brand-dark-grey mt-1 font-medium leading-tight">
                        Multi-variant matrix (e.g. Sizes S, M, L, XL, XXL & 2 Colors)
                      </p>
                    </button>
                  </div>
                </div>

                {/* Asset Type */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Asset Category / Type *</label>
                  <select
                    value={formData.assetType}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedType = activeAssetTypes.find((t) => t._id === selectedId);
                      setFormData((f) => ({
                        ...f,
                        assetType: selectedId,
                        returnable: selectedType ? selectedType.returnable !== false : true,
                      }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${formErrors.assetType ? "border-brand-red" : "border-brand-beige/60 dark:border-brand-dark-grey"} text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer`}
                  >
                    <option value="">Select Asset Type</option>
                    {activeAssetTypes.map((t) => (
                      <option key={t._id} value={t._id}>{t.name} ({t.category})</option>
                    ))}
                  </select>
                  {formErrors.assetType && <p className="text-brand-red text-[11px] mt-1 font-bold">{formErrors.assetType}</p>}
                </div>

                {/* Returnable Status Toggle */}
                <div className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-brand-black dark:text-brand-white block">
                      Item Returnable Status
                    </span>
                    <span className="text-[10px] text-brand-dark-grey font-medium">
                      {formData.returnable
                        ? "Returnable Asset (Must be returned during employee exit clearance)"
                        : "One-Time Issue Item (Permanent giveaway/uniform, never returned)"}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.returnable}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData((f) => ({ ...f, returnable: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-brand-beige/60 peer-focus:outline-none rounded-full peer dark:bg-brand-dark-grey peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
                  </label>
                </div>

                {/* Core Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Asset Code *</label>
                    <input type="text" value={formData.assetCode} disabled={isSubmitting} onChange={(e) => setFormData((f) => ({ ...f, assetCode: e.target.value }))} placeholder="e.g. UNIFORM-001 or LAP-5420" className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border ${formErrors.assetCode ? "border-brand-red" : "border-brand-beige/60 dark:border-brand-dark-grey"} text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50`} />
                    {formErrors.assetCode && <p className="text-brand-red text-[11px] mt-1 font-bold">{formErrors.assetCode}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Quantity (Total Stock)</label>
                    <input type="number" min={1} value={formData.quantityTotal} disabled={isSubmitting || formData.useVariants} onChange={(e) => setFormData((f) => ({ ...f, quantityTotal: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60" />
                    {formData.useVariants && <p className="text-[10px] text-brand-gold font-bold mt-1">Calculated automatically from variants sum below.</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Serial Number (optional)</label>
                    <input type="text" value={formData.serialNumber} disabled={isSubmitting} onChange={(e) => setFormData((f) => ({ ...f, serialNumber: e.target.value }))} placeholder="e.g. SN-984210" className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Low Stock Alert Level</label>
                    <input type="number" min={0} value={formData.minStockThreshold} disabled={isSubmitting} onChange={(e) => setFormData((f) => ({ ...f, minStockThreshold: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Purchase Date</label>
                    <input type="date" value={formData.purchaseDate} disabled={isSubmitting} onChange={(e) => setFormData((f) => ({ ...f, purchaseDate: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Condition</label>
                    <input type="text" value={formData.condition} disabled={isSubmitting} onChange={(e) => setFormData((f) => ({ ...f, condition: e.target.value }))} placeholder="New / Good / Used" className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50" />
                  </div>
                </div>

                {/* DYNAMIC ATTRIBUTES MANAGER WITH TICK MARK CHECKBOX */}
                <div className="p-4 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.useAttributes}
                        onChange={(e) => setFormData((f) => ({ ...f, useAttributes: e.target.checked }))}
                        className="w-4 h-4 accent-brand-gold cursor-pointer"
                      />
                      <span className="text-xs font-black text-brand-black dark:text-brand-white flex items-center gap-1.5">
                        <FiSliders className="text-brand-gold text-sm" /> Add Dynamic Asset Attributes (Size, Color, Made In, Capacity, Specs)
                      </span>
                    </label>

                    {formData.useAttributes && (
                      <button
                        type="button"
                        onClick={handleAddAttributeRow}
                        className="px-3 py-1 rounded-xl bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-brand-midnight font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <FiPlus /> Add Custom Attribute
                      </button>
                    )}
                  </div>

                  {formData.useAttributes && (
                    <>
                      {/* Preset Attribute Quick Shortcuts */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-extrabold uppercase text-brand-dark-grey block">Quick Preset Shortcuts:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleAddPresetAttribute("Size (Letter)", "S, M, L, XL, XXL")}
                            className="px-2.5 py-1 rounded-lg bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-[10px] font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors cursor-pointer"
                          >
                            + Size (S, M, L)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPresetAttribute("Capacity (Liter)", "1L, 2L, 5L, 10L")}
                            className="px-2.5 py-1 rounded-lg bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-[10px] font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors cursor-pointer"
                          >
                            + Capacity (Liters)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPresetAttribute("Dimension (Inches)", '14", 15.6", 24", 32"')}
                            className="px-2.5 py-1 rounded-lg bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-[10px] font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors cursor-pointer"
                          >
                            + Dimension (Inches)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPresetAttribute("Color", "Red, Black, Navy Blue, White")}
                            className="px-2.5 py-1 rounded-lg bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-[10px] font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors cursor-pointer"
                          >
                            + Color
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPresetAttribute("Made In", "Made in BD, USA, China, Imported")}
                            className="px-2.5 py-1 rounded-lg bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-[10px] font-bold text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors cursor-pointer"
                          >
                            + Made In
                          </button>
                        </div>
                      </div>

                      {/* Attributes Input List */}
                      <div className="space-y-2 pt-1">
                        {formData.attributes.map((attr, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={attr.name}
                              onChange={(e) => handleAttributeChange(index, "name", e.target.value)}
                              placeholder="Attribute Name (e.g. Size, Capacity, Made In)"
                              className="w-1/2 px-3 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                            />
                            <input
                              type="text"
                              value={attr.value}
                              onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                              placeholder="Values (comma-separated: S, M, L or 1L, 2L)"
                              className="w-1/2 px-3 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none"
                            />
                            {formData.attributes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAttributeRow(index)}
                                className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                title="Remove attribute"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Auto-Generate Combination Matrix Button */}
                      <div className="pt-2 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAutoGenerateVariants}
                          className="px-4 py-2 rounded-xl bg-purple-600 text-white font-black text-[11px] hover:bg-purple-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                        >
                          <FiZap className="text-sm" /> Auto-Generate Variant Matrix from Attributes
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* DYNAMIC VARIANT MATRIX BREAKDOWN */}
                <div className="p-4 rounded-2xl bg-brand-gold/5 border border-brand-gold/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.useVariants}
                        onChange={(e) => setFormData((f) => ({ ...f, useVariants: e.target.checked, productType: e.target.checked ? "variable" : "simple" }))}
                        className="w-4 h-4 accent-brand-gold cursor-pointer"
                      />
                      <span className="text-xs font-black text-brand-black dark:text-brand-white flex items-center gap-1.5">
                        <FiLayers className="text-brand-gold text-sm" /> Multi-Variant Stock Matrix (Size / Color / Custom Combinations)
                      </span>
                    </label>

                    {formData.useVariants && (
                      <button
                        type="button"
                        onClick={handleAddVariantRow}
                        className="px-3 py-1 rounded-xl bg-brand-gold text-brand-midnight font-black text-[10px] shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <FiPlus /> Add Custom Variant Row
                      </button>
                    )}
                  </div>

                  {formData.useVariants && (
                    <div className="space-y-2 pt-2 border-t border-brand-gold/20">
                      <p className="text-[10px] text-brand-dark-grey">
                        Enter variant names (e.g. <code>XXL - Red</code>, <code>5L - Stainless Steel</code>, <code>15.6&quot; - 16GB RAM</code>) and stock quantities.
                      </p>
                      {formData.sizeVariants.map((varItem, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                          <input
                            type="text"
                            value={varItem.size || varItem.variantName}
                            onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                            placeholder="Variant Name / Spec"
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-gold/30 text-brand-black dark:text-brand-white outline-none"
                          />
                          <input
                            type="number"
                            min={1}
                            value={varItem.quantityTotal}
                            onChange={(e) => handleVariantChange(index, "quantityTotal", e.target.value)}
                            placeholder="Qty Stock"
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-gold/30 text-brand-black dark:text-brand-white outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={varItem.minStockThreshold}
                              onChange={(e) => handleVariantChange(index, "minStockThreshold", e.target.value)}
                              placeholder="Low Alert"
                              className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-brand-white dark:bg-brand-charcoal border border-brand-gold/30 text-brand-black dark:text-brand-white outline-none"
                            />
                            {formData.sizeVariants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantRow(index)}
                                className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Description</label>
                  <textarea rows={2} value={formData.description} disabled={isSubmitting} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} placeholder="Provide details, item specifications, or SKU description..." className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Status</label>
                  <select value={formData.status} disabled={isSubmitting} onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer capitalize">
                    {["available", "assigned", "damaged", "lost", "repair", "disposed"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey mb-1">Notes</label>
                  <textarea rows={2} value={formData.notes} disabled={isSubmitting} onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none" />
                </div>

                <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/30 dark:bg-brand-midnight cursor-pointer">Cancel</button>
                  <button type="submit" hidden={!allowed} disabled={isSubmitting} className="px-6 py-2 rounded-2xl font-bold bg-brand-red text-white cursor-pointer disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <FiLoader className="animate-spin" /> : editingAsset ? "Update Asset" : "Create Asset"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
