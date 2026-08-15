import React from 'react';

const FilterDropdown = ({ label, options, value, onChange, placeholder = "All" }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light ml-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey rounded-2xl px-3.5 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all cursor-pointer text-brand-black dark:text-brand-white"
      >
        <option value="">{placeholder} {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterDropdown;