import React, { useState, useEffect, useMemo } from 'react';
import { useStore, useAuth } from '../store';
import { getNudges, createNudge } from '../api';
import { PIPELINE_STAGES } from '../constants';
import CustomerSidebar from './CustomerSidebar';
import Badge from './Badge';

const PRIORITY_LABEL = { high: '高', medium: '中', low: '低' };
const PRIORITY_COLOR = { high: 'red', medium: 'orange', low: 'blue' };

const COLUMNS = [
  { key: 'name', label: '客户名称' },
  { key: 'industry', label: '行业' },
  { key: 'status', label: '阶段' },
  { key: 'amount', label: '商机金额' },
  { key: 'received_amount', label: '已回款' },
  { key: 'priority', label: '优先级' },
  { key: 'assigned_to', label: '负责人' },
  { key: 'expected_close_date', label: '预计成交' },
  { key: 'updated_at', label: '更新时间' },
];

export default function CustomersPage() {
  const store = useStore();
  const { user } = useAuth();
  const { filteredCustomers, team, searchTerm, setSearchTerm } = store;

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sortKey, setSortKey] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');
  const [nudgedSet, setNudgedSet] = useState(new Set());

  useEffect(() => {
    getNudges()
      .then(nudges => setNudgedSet(new Set(nudges.map(n => n.customer_id))))
      .catch(console.error);
  }, []);

  const handleNudge = async (e, customerId) => {
    e.stopPropagation();
    try {
      await createNudge(customerId);
      setNudgedSet(prev => new Set([...prev, customerId]));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedCustomers = useMemo(() => {
    const list = [...filteredCustomers];
    list.sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];

      // Handle numbers
      if (sortKey === 'amount' || sortKey === 'received_amount') {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
        return sortDir === 'asc' ? va - vb : vb - va;
      }

      // Handle strings
      va = va || '';
      vb = vb || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();

      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredCustomers, sortKey, sortDir]);

  const getAssigneeName = (assignedTo) => {
    const member = team.find((m) => m.id === assignedTo);
    return member ? (member.name || member.username) : '-';
  };

  const getStageName = (status) => {
    const stage = PIPELINE_STAGES.find((s) => s.id === status);
    return stage ? stage.name : status || '-';
  };

  const getStageColor = (status) => {
    if (status === 'won') return 'green';
    if (status === 'lost') return 'red';
    return 'blue';
  };

  // Keep selected customer in sync
  const currentCustomer = selectedCustomer
    ? store.customers.find((c) => c.id === selectedCustomer.id) || selectedCustomer
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative w-80">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索客户名称、联系人..."
            className="pl-9 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <svg className={`w-3.5 h-3.5 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {sortedCustomers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {customer.name}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {customer.industry || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge color={getStageColor(customer.status)}>{getStageName(customer.status)}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">
                  {customer.amount ? `${(Number(customer.amount) / 10000).toFixed(1)}万` : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {customer.received_amount ? (
                    <span className="text-emerald-600 dark:text-emerald-400">{(Number(customer.received_amount) / 10000).toFixed(1)}万</span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {customer.priority ? (
                    <Badge color={PRIORITY_COLOR[customer.priority]}>{PRIORITY_LABEL[customer.priority]}</Badge>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    {getAssigneeName(customer.assigned_to)}
                    {customer.assigned_to && customer.assigned_to !== user?.id && (
                      <button
                        onClick={(e) => !nudgedSet.has(customer.id) && handleNudge(e, customer.id)}
                        disabled={nudgedSet.has(customer.id)}
                        className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                          nudgedSet.has(customer.id)
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700'
                        }`}
                      >
                        {nudgedSet.has(customer.id) ? '已催促' : '催促'}
                      </button>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {customer.expected_close_date ? customer.expected_close_date.slice(0, 10) : '-'}
                </td>
                <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap text-xs">
                  {customer.updated_at ? customer.updated_at.slice(0, 10) : '-'}
                </td>
              </tr>
            ))}
            {sortedCustomers.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                  暂无客户数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sidebar */}
      {currentCustomer && (
        <CustomerSidebar customer={currentCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </div>
  );
}
