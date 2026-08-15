import React from "react";

const Mtitle = ({ title, subtitle, middlecontent, rightcontent, className = "" }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-beige/50 dark:border-brand-dark-grey/50 ${className}`}>
      {/* Title & Subtitle Group */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-brand-black dark:text-brand-white flex items-center gap-2">
            {title}
          </h2>

          {middlecontent && (
            <div className="flex items-center text-xs font-semibold">
              {middlecontent}
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-xs sm:text-sm font-medium text-brand-dark-grey dark:text-brand-gold-light">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Content / Actions */}
      {rightcontent && (
        <div className="flex items-center gap-3 shrink-0">
          {rightcontent}
        </div>
      )}
    </div>
  );
};

export default Mtitle;
