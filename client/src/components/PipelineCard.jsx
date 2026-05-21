import React from 'react';
import { useStore } from '../store';

const PRIORITY_BORDER = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-blue-400',
};

function isOverdue(lastFollowUp) {
  if (!lastFollowUp) return false;
  const last = new Date(lastFollowUp);
  const now = new Date();
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);
  return diffDays > 7;
}

export default function PipelineCard({ customer, onClick }) {
  const { team } = useStore();

  const assignee = team.find((m) => m.id === customer.assigned_to);
  const borderColor = PRIORITY_BORDER[customer.priority] || PRIORITY_BORDER.low;
  const overdue = isOverdue(customer.last_follow_up);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('customerId', String(customer.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const amountWan = customer.amount ? (customer.amount / 10000).toFixed(1) : '0';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick?.(customer)}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 ${borderColor} p-3 cursor-pointer hover:shadow-md transition-shadow ${
        overdue ? 'ring-2 ring-red-400 dark:ring-red-500' : ''
      }`}
    >
      {/* Customer name */}
      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
        {customer.name}
      </div>

      {/* Contact + Industry */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
        {customer.contact && <span>{customer.contact}</span>}
        {customer.contact && customer.industry && <span> · </span>}
        {customer.industry && <span>{customer.industry}</span>}
      </div>

      {/* Amount + Date row */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {amountWan}万
        </span>
        {customer.expected_close_date && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {customer.expected_close_date.slice(0, 10)}
          </span>
        )}
      </div>

      {/* Assignee */}
      {assignee && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-medium flex-shrink-0">
            {(assignee.name || assignee.username || '?')[0]}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {assignee.name || assignee.username}
          </span>
        </div>
      )}
    </div>
  );
}
