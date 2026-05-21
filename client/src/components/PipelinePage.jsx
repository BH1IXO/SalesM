import React, { useState } from 'react';
import { useStore } from '../store';
import { PIPELINE_STAGES } from '../constants';
import PipelineColumn from './PipelineColumn';
import CustomerSidebar from './CustomerSidebar';
import NewCustomerForm from './NewCustomerForm';

export default function PipelinePage() {
  const store = useStore();
  const { filteredCustomers, team, filterAssignee, setFilterAssignee, filterPriority, setFilterPriority, searchTerm, setSearchTerm } = store;

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleCardClick = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleSidebarClose = () => {
    setSelectedCustomer(null);
  };

  // Keep selected customer in sync with store data
  const currentCustomer = selectedCustomer
    ? store.customers.find((c) => c.id === selectedCustomer.id) || selectedCustomer
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索客户..."
            className="pl-9 pr-4 py-2 w-56 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        {/* Assignee filter */}
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部负责人</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>{m.name || m.username}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部优先级</option>
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>

        {/* New customer button */}
        <button
          onClick={() => setShowNewForm(true)}
          className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新建客户
        </button>
      </div>

      {/* Pipeline columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-h-full pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageCustomers = filteredCustomers.filter((c) => c.status === stage.id);
            return (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                customers={stageCustomers}
                onCardClick={handleCardClick}
              />
            );
          })}
        </div>
      </div>

      {/* Customer sidebar */}
      {currentCustomer && (
        <CustomerSidebar customer={currentCustomer} onClose={handleSidebarClose} />
      )}

      {/* New customer form */}
      <NewCustomerForm open={showNewForm} onClose={() => setShowNewForm(false)} />
    </div>
  );
}
