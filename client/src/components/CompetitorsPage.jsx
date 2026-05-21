import React, { useState } from 'react';
import { useStore } from '../store';
import Modal from './Modal';
import Badge from './Badge';

export default function CompetitorsPage() {
  const store = useStore();
  const { competitors, customers } = store;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    strengths: '',
    weaknesses: '',
    pricing: '',
    tactics: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('竞争对手名称不能为空');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await store.addCompetitor(form);
      setForm({ name: '', strengths: '', weaknesses: '', pricing: '', tactics: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || '添加失败');
      console.error('Failed to add competitor:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Lost customers
  const lostCustomers = customers.filter((c) => c.status === 'lost');

  // Count how many customers are linked to each competitor (via loss_competitor)
  const getCompetitorStats = (competitorId) => {
    const lossCount = lostCustomers.filter((c) => c.loss_competitor === competitorId).length;
    const linkedCount = customers.filter(
      (c) => c.loss_competitor === competitorId
    ).length;
    return { lossCount, linkedCount };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            共 {competitors.length} 个竞争对手
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          添加竞争对手
        </button>
      </div>

      {/* Competitor cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {competitors.map((comp) => {
          const stats = getCompetitorStats(comp.id);
          return (
            <div
              key={comp.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{comp.name}</h3>
                <div className="flex gap-2">
                  <Badge color="blue">{stats.linkedCount} 关联</Badge>
                  {stats.lossCount > 0 && <Badge color="red">{stats.lossCount} 输单</Badge>}
                </div>
              </div>

              <div className="space-y-3">
                {comp.strengths && (
                  <div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 block mb-1">优势</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      {comp.strengths}
                    </p>
                  </div>
                )}
                {comp.weaknesses && (
                  <div>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 block mb-1">劣势</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      {comp.weaknesses}
                    </p>
                  </div>
                )}
                {comp.pricing && (
                  <div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">定价策略</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      {comp.pricing}
                    </p>
                  </div>
                )}
                {comp.tactics && (
                  <div>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 block mb-1">竞争策略</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      {comp.tactics}
                    </p>
                  </div>
                )}
                {!comp.strengths && !comp.weaknesses && !comp.pricing && !comp.tactics && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">暂无详细信息</p>
                )}
              </div>
            </div>
          );
        })}
        {competitors.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400 dark:text-gray-500">
            暂无竞争对手数据
          </div>
        )}
      </div>

      {/* Lost deals section */}
      {lostCustomers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            输单记录
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({lostCustomers.length} 笔)
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">客户名称</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">商机金额</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">输单原因</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">赢得竞品</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {lostCustomers.map((c) => {
                  const winComp = competitors.find((comp) => comp.id === c.loss_competitor);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {c.amount ? `${(Number(c.amount) / 10000).toFixed(1)}万` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.loss_reason || '-'}</td>
                      <td className="px-4 py-3">
                        {winComp ? <Badge color="red">{winComp.name}</Badge> : <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add competitor modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="添加竞争对手">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="竞争对手名称"
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">优势</label>
            <textarea
              value={form.strengths}
              onChange={(e) => setForm({ ...form, strengths: e.target.value })}
              rows={2}
              placeholder="竞品的主要优势..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">劣势</label>
            <textarea
              value={form.weaknesses}
              onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
              rows={2}
              placeholder="竞品的主要劣势..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">定价策略</label>
            <textarea
              value={form.pricing}
              onChange={(e) => setForm({ ...form, pricing: e.target.value })}
              rows={2}
              placeholder="竞品的定价模式..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">竞争策略</label>
            <textarea
              value={form.tactics}
              onChange={(e) => setForm({ ...form, tactics: e.target.value })}
              rows={2}
              placeholder="竞品常用的竞争策略..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition"
            >
              {submitting ? '添加中...' : '添加'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition"
            >
              取消
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
