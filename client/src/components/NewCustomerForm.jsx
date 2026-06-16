import React, { useState } from 'react';
import { useStore } from '../store';
import { PIPELINE_STAGES } from '../constants';
import Modal from './Modal';

export default function NewCustomerForm({ open, onClose }) {
  const store = useStore();

  const [form, setForm] = useState({
    name: '',
    industry: '',
    size: '',
    contact: '',
    phone: '',
    email: '',
    status: 'leads',
    assigned_to: '',
    amount_onetime: '',
    amount_monthly: '',
    amount_months: '1',
    budget: '',
    expected_close_date: '',
    priority: 'medium',
    pain_points: '',
    channel_id: '',
    commission_rate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('客户名称不能为空');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        amount_onetime: form.amount_onetime ? Number(form.amount_onetime) : 0,
        amount_monthly: form.amount_monthly ? Number(form.amount_monthly) : 0,
        amount_months: form.amount_months ? Number(form.amount_months) : 1,
        budget: form.budget ? Number(form.budget) : 0,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
        channel_id: form.channel_id ? Number(form.channel_id) : null,
        commission_rate: form.commission_rate ? Number(form.commission_rate) : 0,
      };
      await store.addCustomer(payload);
      setForm({
        name: '',
        industry: '',
        size: '',
        contact: '',
        phone: '',
        email: '',
        status: 'leads',
        assigned_to: '',
        amount_onetime: '',
        amount_monthly: '',
        amount_months: '1',
        budget: '',
        expected_close_date: '',
        priority: 'medium',
        pain_points: '',
        channel_id: '',
        commission_rate: '',
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || '创建失败');
      console.error('Failed to create customer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const salesTeam = store.team.filter((m) => m.role !== 'admin');
  const activeChannels = store.channels.filter((ch) => ch.status === 'active');

  const handleChannelChange = (channelId) => {
    const ch = activeChannels.find((c) => c.id === Number(channelId));
    setForm((prev) => ({
      ...prev,
      channel_id: channelId,
      commission_rate: ch ? String(ch.commission_rate) : '',
    }));
  };

  return (
    <Modal open={open} onClose={onClose} title="新建客户" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              客户名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="请输入客户名称"
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">行业</label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              placeholder="如：互联网、金融"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">规模</label>
            <input
              type="text"
              value={form.size}
              onChange={(e) => handleChange('size', e.target.value)}
              placeholder="如：100-500人"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">联系人</label>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              placeholder="联系人姓名"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">电话</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="联系电话"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="电子邮箱"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">阶段</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Assigned to */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">负责人</label>
            <select
              value={form.assigned_to}
              onChange={(e) => handleChange('assigned_to', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">未分配</option>
              {salesTeam.map((m) => (
                <option key={m.id} value={m.id}>{m.name || m.username}</option>
              ))}
            </select>
          </div>

          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">渠道来源</label>
            <select
              value={form.channel_id}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">无渠道</option>
              {activeChannels.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.name}{ch.commission_rate ? ` (${ch.commission_rate}%)` : ''}</option>
              ))}
            </select>
          </div>

          {/* Commission Rate */}
          {form.channel_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">居间费率 (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.commission_rate}
                onChange={(e) => handleChange('commission_rate', e.target.value)}
                placeholder="使用渠道默认费率"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Amount breakdown */}
          <div className="col-span-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">商机金额</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">一次性服务费 (元)</label>
                <input
                  type="number"
                  value={form.amount_onetime}
                  onChange={(e) => handleChange('amount_onetime', e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">月服务费 (元)</label>
                <input
                  type="number"
                  value={form.amount_monthly}
                  onChange={(e) => handleChange('amount_monthly', e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">服务月数</label>
                <input
                  type="number"
                  min="1"
                  value={form.amount_months}
                  onChange={(e) => handleChange('amount_months', e.target.value)}
                  placeholder="1"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              总金额：<span className="font-medium text-gray-900 dark:text-white">
                ¥{((Number(form.amount_onetime) || 0) + (Number(form.amount_monthly) || 0) * (Number(form.amount_months) || 1)).toLocaleString()}
              </span>
            </p>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">预算 (元)</label>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              placeholder="0"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Expected close date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">预计成交日期</label>
            <input
              type="date"
              value={form.expected_close_date}
              onChange={(e) => handleChange('expected_close_date', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">优先级</label>
            <select
              value={form.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          {/* Pain points */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户痛点</label>
            <textarea
              value={form.pain_points}
              onChange={(e) => handleChange('pain_points', e.target.value)}
              rows={3}
              placeholder="描述客户的核心痛点..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition"
          >
            {submitting ? '创建中...' : '创建客户'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition"
          >
            取消
          </button>
        </div>
      </form>
    </Modal>
  );
}
