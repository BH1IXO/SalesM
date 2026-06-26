import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { getCollaborators } from '../api';

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
  const [collabs, setCollabs] = useState([]);

  useEffect(() => {
    getCollaborators(customer.id).then((data) => setCollabs(Array.isArray(data) ? data : [])).catch(() => {});
  }, [customer.id]);

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
      className={`bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 border-l-[3px] ${borderColor} px-2.5 py-2 cursor-pointer hover:shadow-md transition-shadow ${
        overdue ? 'ring-2 ring-red-400 dark:ring-red-500' : ''
      }`}
    >
      {/* Customer name */}
      <div className="font-medium text-xs text-gray-900 dark:text-white truncate">
        {customer.name}
      </div>

      {/* Contact + Industry */}
      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
        {customer.contact && <span>{customer.contact}</span>}
        {customer.contact && customer.industry && <span> · </span>}
        {customer.industry && <span>{customer.industry}</span>}
      </div>

      {/* Amount + Date row */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {amountWan}万
        </span>
        {customer.expected_close_date && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {customer.expected_close_date.slice(5, 10)}
          </span>
        )}
      </div>

      {/* Payment progress for won deals */}
      {customer.status === 'won' && customer.amount > 0 && (
        <div className="mt-1">
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-emerald-600 dark:text-emerald-400">
              已回 {((customer.received_amount || 0) / 10000).toFixed(1)}万
            </span>
            <span className="text-gray-400">
              {((customer.received_amount || 0) / customer.amount * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div
              className="bg-emerald-500 h-1 rounded-full transition-all"
              style={{ width: `${Math.min(((customer.received_amount || 0) / customer.amount) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Assignee + Collaborators */}
      {(assignee || collabs.length > 0) && (
        <div className="flex items-center gap-0.5 mt-1">
          {assignee && (
            <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[9px] font-medium flex-shrink-0" title={assignee.name || assignee.username}>
              {(assignee.name || assignee.username || '?')[0]}
            </div>
          )}
          {collabs.slice(0, 3).map((c) => (
            <div key={c.user_id} className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center text-[9px] font-medium flex-shrink-0 -ml-0.5 ring-1 ring-white dark:ring-gray-800" title={c.name || c.username}>
              {(c.name || c.username || '?')[0]}
            </div>
          ))}
          {collabs.length > 3 && (
            <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center text-[9px] font-medium flex-shrink-0 -ml-0.5 ring-1 ring-white dark:ring-gray-800">
              +{collabs.length - 3}
            </div>
          )}
          {assignee && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate ml-0.5">
              {assignee.name || assignee.username}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
