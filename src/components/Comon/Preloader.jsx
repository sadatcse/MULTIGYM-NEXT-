import React from "react";

const Preloader = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="relative flex flex-col items-center mt-10">
        <div className="w-16 h-16 border-4 border-brand-gold/30 border-t-brand-red rounded-full animate-spin shadow-lg shadow-brand-red/10" />
        <p className="mt-4 text-sm font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
          Please Wait Loading Data...
        </p>
      </div>
    </div>
  );
};

export default Preloader;
