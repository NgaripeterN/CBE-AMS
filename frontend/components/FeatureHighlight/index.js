import React from 'react';

const FeatureHighlight = ({ title, description }) => {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-3 w-3 mt-1 rounded-full bg-indigo-600" />
      <div>
        <div className="text-sm font-medium text-slate-900 dark:text-white">{title}</div>
        <div className="text-xs text-slate-600 dark:text-slate-300">{description}</div>
      </div>
    </div>
  );
};

export default FeatureHighlight;
