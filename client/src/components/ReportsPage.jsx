import React, { useState, useEffect } from 'react';
import { getReportOverview, getReportPipeline, getReportPerformance, getReportExpenseBreakdown } from '../api';
import StatCard from './StatCard';
import { PIPELINE_STAGES, EXPENSE_TYPES } from '../constants';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [overview, setOverview] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [ov, pl, perf, exp] = await Promise.all([
          getReportOverview(),
          getReportPipeline(),
          getReportPerformance(),
          getReportExpenseBreakdown(),
        ]);
        setOverview(ov);
        setPipeline(Array.isArray(pl) ? pl : pl.pipeline || []);
        setPerformance(Array.isArray(perf) ? perf : perf.performance || []);
        setExpenses(Array.isArray(exp) ? exp : exp.breakdown || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pipelineTotal = overview?.totalPipeline || 0;
  const wonAmount = overview?.wonAmount || 0;
  const winRate = overview?.winRate || 0;
  const totalExpenses = overview?.totalExpenses || 0;
  const totalReceived = overview?.totalReceived || 0;
  const collectionRate = overview?.collectionRate || 0;

  // Prepare pipeline chart data
  const pipelineChartData = pipeline.map((item) => {
    const stage = PIPELINE_STAGES.find((s) => s.id === item.status);
    return {
      name: stage?.name || item.status,
      count: item.count || 0,
      amount: ((item.total_amount || 0) / 10000),
    };
  });

  // Prepare expense chart data
  const expenseChartData = expenses.map((item) => {
    const typeObj = EXPENSE_TYPES.find((t) => t.id === item.type);
    return {
      name: typeObj?.name || item.type || item.name,
      value: Number(item.total || 0),
    };
  }).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="管道总额"
          value={`${(pipelineTotal / 10000).toFixed(1)}万`}
          icon="💰"
          sub={`${pipeline.reduce((s, p) => s + (p.count || 0), 0)} 个商机`}
        />
        <StatCard
          label="赢单金额"
          value={`${(wonAmount / 10000).toFixed(1)}万`}
          icon="🏆"
          trend="up"
          sub="已成交"
        />
        <StatCard
          label="已回款"
          value={`${(totalReceived / 10000).toFixed(1)}万`}
          icon="💵"
          sub={`回款率 ${collectionRate}%`}
        />
        <StatCard
          label="赢单率"
          value={`${winRate}%`}
          icon="📊"
          trend={Number(winRate) >= 30 ? 'up' : 'down'}
          sub={Number(winRate) >= 30 ? '表现良好' : '需要提升'}
        />
        <StatCard
          label="总费用"
          value={`${(totalExpenses / 10000).toFixed(1)}万`}
          icon="💳"
          sub="累计支出"
        />
        <StatCard
          label="待回款"
          value={`${(Math.max(wonAmount - totalReceived, 0) / 10000).toFixed(1)}万`}
          icon="📋"
          sub="尚未收回"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">管道分布</h3>
          {pipelineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value, name) => {
                    if (name === 'amount') return [`${value.toFixed(1)}万`, '金额'];
                    return [value, '数量'];
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" name="数量" radius={[4, 4, 0, 0]} />
                <Bar dataKey="amount" fill="#10b981" name="金额(万)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">暂无数据</div>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">费用构成</h3>
          {expenseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseChartData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value) => [`¥${Number(value).toLocaleString()}`, '金额']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">暂无数据</div>
          )}
        </div>
      </div>

      {/* Sales performance table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">销售业绩排名</h3>
        {performance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">排名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">销售人员</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">赢单金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">已回款</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">管道金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">活动数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">客户数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">赢单数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {performance.map((p, idx) => {
                  const MEDALS = ['bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200', 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'];
                  const MEDAL_LABELS = ['🥇', '🥈', '🥉'];
                  return (
                    <tr key={p.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        {idx < 3 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${MEDALS[idx]}`}>
                            {MEDAL_LABELS[idx]}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 font-medium ml-1.5">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{p.name || '-'}</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">
                        {((p.won_amount || 0) / 10000).toFixed(1)}万
                      </td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                        {((p.received_amount || 0) / 10000).toFixed(1)}万
                      </td>
                      <td className="px-4 py-3 text-blue-600 dark:text-blue-400">
                        {((p.pipeline_amount || 0) / 10000).toFixed(1)}万
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.activity_count || 0}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.total_customers || 0}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.won_count || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">暂无数据</div>
        )}
      </div>
    </div>
  );
}
