import React, { useState } from 'react';
import { useStore } from '../store';
import PipelineCard from './PipelineCard';

export default function PipelineColumn({ stage, customers, onCardClick }) {
  const store = useStore();
  const [dragOver, setDragOver] = useState(false);

  const totalAmount = customers.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalWan = (totalAmount / 10000).toFixed(1);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only handle if leaving the column itself, not child elements
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const customerId = e.dataTransfer.getData('customerId');
    if (customerId) {
      try {
        await store.moveCustomer(Number(customerId), stage.id);
      } catch (err) {
        console.error('Failed to move customer:', err);
      }
    }
  };

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-xl border transition-colors ${
        dragOver
          ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
          <span className={`text-sm font-medium ${stage.textColor}`}>
            {stage.name}
          </span>
          <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
            {customers.length}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {totalWan}万
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin min-h-[120px]">
        {customers.map((customer) => (
          <PipelineCard
            key={customer.id}
            customer={customer}
            onClick={onCardClick}
          />
        ))}
        {customers.length === 0 && (
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-8">
            拖拽客户到此阶段
          </div>
        )}
      </div>
    </div>
  );
}
