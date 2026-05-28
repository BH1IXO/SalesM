import React, { useState, useEffect, useMemo } from 'react';
import { getStandupData } from '../api';
import { ACTIVITY_TYPES, PIPELINE_STAGES } from '../constants';
import StatCard from './StatCard';
import Badge from './Badge';

const getActivityType = (typeId) => ACTIVITY_TYPES.find(t => t.id === typeId) || { icon: '📝', name: typeId };

const getStage = (statusId) => PIPELINE_STAGES.find(s => s.id === statusId);

const stageBadgeColor = (statusId) => {
  const map = { leads: 'gray', contact: 'blue', needs: 'blue', proposal: 'purple',
    negotiation: 'orange', contract: 'orange', won: 'green', lost: 'red' };
  return map[statusId] || 'gray';
};

const DAY_OPTIONS = [2, 3, 5, 7, 14, 30];

export default function StandupBoard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('byCustomer');
  const [days, setDays] = useState(2);

  useEffect(() => {
    setLoading(true);
    getStandupData(days)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  const { byPerson, byCustomer, inactiveMembers, uniqueCustomerCount, activeCount } = useMemo(() => {
    if (!data) return { byPerson: [], byCustomer: [], inactiveMembers: [], uniqueCustomerCount: 0, activeCount: 0 };

    const personMap = new Map();
    const customerMap = new Map();
    const activeUserIds = new Set();

    for (const a of data.activities) {
      activeUserIds.add(a.created_by);

      if (!personMap.has(a.created_by)) {
        personMap.set(a.created_by, { id: a.created_by, name: a.creator_name, team: a.creator_team, activities: [] });
      }
      personMap.get(a.created_by).activities.push(a);

      if (!customerMap.has(a.customer_id)) {
        customerMap.set(a.customer_id, { id: a.customer_id, name: a.customer_name, status: a.customer_status, activities: [] });
      }
      customerMap.get(a.customer_id).activities.push(a);
    }

    return {
      byPerson: [...personMap.values()].sort((a, b) => b.activities.length - a.activities.length),
      byCustomer: [...customerMap.values()].sort((a, b) => b.activities.length - a.activities.length),
      inactiveMembers: data.users.filter(u => !activeUserIds.has(u.id)),
      uniqueCustomerCount: customerMap.size,
      activeCount: activeUserIds.size,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-gray-500 dark:text-gray-400 py-20">加载失败</div>;
  }

  const toggleBtn = (mode, label) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        viewMode === mode
          ? 'bg-blue-600 text-white'
          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {new Date(data.dateRange.to).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} 早会看板
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            展示 {data.dateRange.from} 至 {data.dateRange.to} 的跟进记录
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {DAY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  days === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {d}天
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {toggleBtn('byPerson', '按人员')}
            {toggleBtn('byCustomer', '按客户')}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {data.activities.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">最近{days}天暂无跟进记录</div>
      )}

      {/* Main Content */}
      {viewMode === 'byPerson' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {byPerson.map(person => (
            <div key={person.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center text-lg font-medium">
                  {person.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{person.name}</h3>
                  {person.team && <span className="text-xs text-gray-500 dark:text-gray-400">{person.team}</span>}
                </div>
                <Badge color="blue">{person.activities.length} 条跟进</Badge>
              </div>
              <div className="space-y-3">
                {person.activities.map(a => {
                  const at = getActivityType(a.type);
                  const stage = getStage(a.customer_status);
                  return (
                    <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <span className="text-xl flex-shrink-0">{at.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{a.customer_name}</span>
                          {stage && <Badge color={stageBadgeColor(a.customer_status)}>{stage.name}</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{at.name}</p>
                        {a.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{a.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{a.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {byCustomer.map(customer => {
            const stage = getStage(customer.status);
            return (
              <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {stage && <Badge color={stageBadgeColor(customer.status)}>{stage.name}</Badge>}
                    </div>
                  </div>
                  <Badge color="blue">{customer.activities.length} 条跟进</Badge>
                </div>
                <div className="space-y-3">
                  {customer.activities.map(a => {
                    const at = getActivityType(a.type);
                    return (
                      <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <span className="text-xl flex-shrink-0">{at.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{a.creator_name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{at.name}</span>
                          </div>
                          {a.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{a.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{a.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stat Cards — moved to bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="跟进总数" value={data.activities.length} icon="📋" sub={`最近${days}天`} />
        <StatCard label="活跃成员" value={activeCount} icon="✅" sub={`共${data.users.length}人`} />
        <StatCard
          label="未跟进成员"
          value={inactiveMembers.length}
          icon="⚠️"
          trend={inactiveMembers.length > 0 ? 'down' : 'up'}
          sub={inactiveMembers.length > 0 ? '需要关注' : '全员活跃'}
        />
        <StatCard label="涉及客户" value={uniqueCustomerCount} icon="🏢" sub="被跟进客户数" />
      </div>
    </div>
  );
}
