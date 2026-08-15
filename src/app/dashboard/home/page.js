"use client";

import React from "react";

const HomePage = () => {
  return (
    <div className="p-4 sm:p-8 min-h-[80vh] flex flex-col items-center justify-center bg-brand-offwhite dark:bg-brand-charcoal text-brand-charcoal dark:text-brand-offwhite font-sans animate-fade-in text-center">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-3xl font-black tracking-tight text-brand-black dark:text-brand-offwhite">
          Dashboard Home
        </h1>
        <p className="text-sm font-medium text-brand-sage leading-relaxed">
          Welcome to the dashboard. Select a module from the sidebar navigation to get started.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
