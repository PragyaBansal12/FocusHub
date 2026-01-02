import React from 'react';

export default function StatCard({ icon: Icon, title, value, subtitle, color = 'bg-accent' }) {
  return (
    <div className="bg-white dark:bg-[#121318] rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}