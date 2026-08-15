import React, { useState, useRef, useEffect } from 'react';

const ModernDropdown = ({ options, value, onChange, placeholder = "Select an option" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full md:min-w-[240px]" ref={dropdownRef}>
      {/* Dropdown Header/Trigger */}
      <div
        className="flex items-center justify-between border border-brand-beige/60 dark:border-brand-dark-grey/60 rounded-2xl p-2.5 bg-brand-white dark:bg-brand-charcoal cursor-pointer hover:border-brand-gold transition-colors shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-xs truncate pr-4 ${value ? 'text-brand-black dark:text-brand-white font-bold' : 'text-brand-dark-grey dark:text-brand-gold-light'}`}>
          {value || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-brand-gold transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey/60 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          <ul className="py-1">
            {/* Default "All" option */}
            <li
              className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors ${!value ? 'bg-brand-red/10 text-brand-red' : 'text-brand-black dark:text-brand-white hover:bg-brand-gold/10'}`}
              onClick={() => { onChange(''); setIsOpen(false); }}
            >
              {placeholder}
            </li>

            {/* Options */}
            {options.map((opt) => (
              <li
                key={opt.id || opt.name}
                className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors border-t border-brand-beige/30 dark:border-brand-dark-grey/30 ${
                  value === opt.name ? 'bg-brand-red/10 text-brand-red' : 'text-brand-black dark:text-brand-white hover:bg-brand-gold/10'
                }`}
                onClick={() => { onChange(opt.name); setIsOpen(false); }}
              >
                {opt.name}
              </li>
            ))}

            {/* Empty State */}
            {options.length === 0 && (
              <li className="px-4 py-3 text-xs text-brand-dark-grey dark:text-brand-gold-light text-center italic">
                Loading data...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModernDropdown;