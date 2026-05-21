import React from 'react';

export default function StatCard({ label, value, sub, icon, trend }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 relative overflow-hidden">
      {/* Icon top-right */}
      {icon && (
        <div className="absolute top-4 right-4 text-2xl opacity-60">
          {icon}
        </div>
      )}

      {/* Label */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>

      {/* Value */}
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>

      {/* Sub text */}
      {sub && (
        <p className={`text-sm mt-1 ${
          trend === 'up'
            ? 'text-green-600 dark:text-green-400'
            : trend === 'down'
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {trend === 'up' && (
            <svg className="w-4 h-4 inline-block mr-0.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
          {trend === 'down' && (
            <svg className="w-4 h-4 inline-block mr-0.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {sub}
        </p>
      )}
    </div>
  );
}
