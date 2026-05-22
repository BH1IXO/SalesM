import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { getReportPerformance } from '../api';
import Badge from './Badge';

const ROLE_LABELS = {
  admin: '管理员',
  executive: '高层领导',
  sales: '销售',
  marketing: '市场',
  product: '产品',
  dev: '研发',
  ops: '运营',
  partner: '合作伙伴',
};

const ROLE_COLORS = {
  admin: 'purple',
  executive: 'red',
  sales: 'blue',
  marketing: 'pink',
  product: 'indigo',
  dev: 'green',
  ops: 'orange',
  partner: 'teal',
};

function isOverdue(lastFollowUp) {
  if (!lastFollowUp) return false;
  const last = new Date(lastFollowUp);
  const now = new Date();
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);
  return diffDays > 7;
}

export default function TeamPage() {
  const store = useStore();
  const { team, customers } = store;

  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerformance = async () => {
      setLoading(true);
      try {
        const data = await getReportPerformance();
        setPerformance(Array.isArray(data) ? data : data.performance || []);
      } catch (err) {
        console.error('Failed to load performance:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPerformance();
  }, []);

  const getMemberStats = (memberId) => {
    const perfData = performance.find((p) => p.id === memberId);
    if (perfData) {
      return {
        customerCount: perfData.total_customers || 0,
        wonCount: perfData.won_count || 0,
        pipelineAmount: perfData.pipeline_amount || 0,
        activityCount: perfData.activity_count || 0,
      };
    }

    const memberCustomers = customers.filter((c) => c.assigned_to === memberId);
    return {
      customerCount: memberCustomers.length,
      wonCount: memberCustomers.filter((c) => c.status === 'won').length,
      pipelineAmount: memberCustomers.reduce((s, c) => s + (Number(c.amount) || 0), 0),
      activityCount: 0,
    };
  };

  const getOverdueCustomers = (memberId) => {
    return customers.filter(
      (c) => c.assigned_to === memberId && c.status !== 'won' && c.status !== 'lost' && isOverdue(c.last_follow_up)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">共 {team.length} 位团队成员</p>
      </div>

      {/* Team member grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => {
          const stats = getMemberStats(member.id);
          const overdueList = getOverdueCustomers(member.id);

          return (
            <div
              key={member.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-semibold flex-shrink-0">
                  {(member.name || member.username || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {member.name || member.username}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge color={ROLE_COLORS[member.role] || 'gray'}>
                      {ROLE_LABELS[member.role] || member.role}
                    </Badge>
                    {member.team && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{member.team}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.customerCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">客户数</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.wonCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">赢单数</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {(stats.pipelineAmount / 10000).toFixed(1)}万
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">管道金额</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.activityCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">活动数</p>
                </div>
              </div>

              {/* Overdue warning */}
              {overdueList.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      {overdueList.length} 个客户超过7天未跟进
                    </span>
                  </div>
                  <div className="space-y-1">
                    {overdueList.slice(0, 3).map((c) => (
                      <p key={c.id} className="text-xs text-red-500 dark:text-red-400 truncate">
                        {c.name} - 上次跟进: {c.last_follow_up ? c.last_follow_up.slice(0, 10) : '从未'}
                      </p>
                    ))}
                    {overdueList.length > 3 && (
                      <p className="text-xs text-red-400">...还有 {overdueList.length - 3} 个</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {team.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400 dark:text-gray-500">
            暂无团队成员数据
          </div>
        )}
      </div>
    </div>
  );
}
