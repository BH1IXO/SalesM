import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { useAuth } from '../store';
import { getChannel, updateChannel, deleteChannel as apiDeleteChannel, getChannelCustomers, getChannelCommissions, createChannelCommission, deleteChannelCommission, createChannel as apiCreateChannel } from '../api';
import { COMMISSION_STATUS, PAYMENT_METHODS } from '../constants';
import Modal from './Modal';
import Badge from './Badge';

function ChannelFormModal({ open, onClose, channel, onSaved }) {
  const store = useStore();
  const isEdit = !!channel;
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', company: '', commission_rate: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && channel) {
      setForm({
        name: channel.name || '',
        contact: channel.contact || '',
        phone: channel.phone || '',
        email: channel.email || '',
        company: channel.company || '',
        commission_rate: channel.commission_rate || '',
        notes: channel.notes || '',
      });
    } else if (open) {
      setForm({ name: '', contact: '', phone: '', email: '', company: '', commission_rate: '', notes: '' });
    }
    setError('');
  }, [open, channel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('渠道名称不能为空'); return; }
    setError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateChannel(channel.id, form);
      } else {
        await apiCreateChannel(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || (isEdit ? '修改失败' : '添加失败'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? '编辑渠道' : '新建渠道'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">渠道名称 <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">联系人</label>
            <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">电话</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所属公司</label>
            <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">默认居间费率 (%)</label>
            <input type="number" step="0.1" min="0" max="100" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
              placeholder="如：5"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition">
            {submitting ? (isEdit ? '保存中...' : '创建中...') : (isEdit ? '保存修改' : '创建渠道')}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition">
            取消
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ChannelDetail({ channelId, onBack }) {
  const { user } = useAuth();
  const store = useStore();
  const isExecutive = user?.role === 'admin' || user?.role === 'executive';
  const isAdmin = user?.role === 'admin';

  const [channel, setChannel] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [showCommForm, setShowCommForm] = useState(false);
  const [commForm, setCommForm] = useState({ customer_id: '', amount: '', commission_rate: '', status: 'pending', payment_date: '', payment_method: 'transfer', reference_number: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const ch = await getChannel(channelId);
      setChannel(ch);
      if (isExecutive) {
        const custs = await getChannelCustomers(channelId);
        setCustomers(custs);
        const comms = await getChannelCommissions(channelId);
        setCommissions(comms);
      }
    } catch (err) {
      console.error('Failed to load channel detail:', err);
    }
  }, [channelId, isExecutive]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSelectCustomer = (customerId) => {
    const cust = customers.find(c => c.id === Number(customerId));
    if (cust) {
      const rate = cust.commission_rate || channel?.commission_rate || 0;
      const amount = ((cust.amount || 0) * rate / 100).toFixed(2);
      setCommForm(prev => ({ ...prev, customer_id: customerId, commission_rate: String(rate), amount }));
    }
  };

  const handleAddCommission = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createChannelCommission(channelId, {
        ...commForm,
        customer_id: Number(commForm.customer_id),
        amount: Number(commForm.amount),
        commission_rate: Number(commForm.commission_rate),
      });
      setShowCommForm(false);
      setCommForm({ customer_id: '', amount: '', commission_rate: '', status: 'pending', payment_date: '', payment_method: 'transfer', reference_number: '', notes: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCommission = async (commId) => {
    if (!confirm('确定删除该居间费用记录？')) return;
    try {
      await deleteChannelCommission(channelId, commId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  if (!channel) return <div className="text-center py-12 text-gray-400">加载中...</div>;

  const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
  const paidCommission = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingCommission = totalCommission - paidCommission;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{channel.name}</h2>
        <Badge color={channel.status === 'active' ? 'green' : 'gray'}>{channel.status === 'active' ? '活跃' : '停用'}</Badge>
      </div>

      {/* Channel info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">关联客户</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{customers.length}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">默认费率</p>
            <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{channel.commission_rate}%</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">已付居间费</p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{(paidCommission / 10000).toFixed(1)}万</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">待付居间费</p>
            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{(pendingCommission / 10000).toFixed(1)}万</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {channel.contact && <div><span className="text-gray-500 dark:text-gray-400">联系人：</span><span className="text-gray-900 dark:text-white">{channel.contact}</span></div>}
          {channel.phone && <div><span className="text-gray-500 dark:text-gray-400">电话：</span><span className="text-gray-900 dark:text-white">{channel.phone}</span></div>}
          {channel.email && <div><span className="text-gray-500 dark:text-gray-400">邮箱：</span><span className="text-gray-900 dark:text-white">{channel.email}</span></div>}
          {channel.company && <div><span className="text-gray-500 dark:text-gray-400">公司：</span><span className="text-gray-900 dark:text-white">{channel.company}</span></div>}
          {channel.notes && <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">备注：</span><span className="text-gray-900 dark:text-white">{channel.notes}</span></div>}
        </div>
      </div>

      {/* Associated customers */}
      {isExecutive && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">关联客户 ({customers.length})</h3>
          {customers.length === 0 ? (
            <p className="text-sm text-gray-400">暂无关联客户</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">客户名称</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">阶段</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">商机金额</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">已回款</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">居间费率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{c.name}</td>
                      <td className="px-4 py-3"><Badge>{c.status}</Badge></td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.amount ? `¥${Number(c.amount).toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{c.received_amount ? `¥${Number(c.received_amount).toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.commission_rate || channel.commission_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Commissions */}
      {isExecutive && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">居间费用记录 ({commissions.length})</h3>
            <button onClick={() => setShowCommForm(!showCommForm)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition">
              {showCommForm ? '取消' : '添加记录'}
            </button>
          </div>

          {showCommForm && (
            <form onSubmit={handleAddCommission} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">关联客户</label>
                  <select value={commForm.customer_id} onChange={(e) => handleSelectCustomer(e.target.value)} required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">选择客户...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">费率 (%)</label>
                  <input type="number" step="0.1" min="0" value={commForm.commission_rate} onChange={(e) => setCommForm({ ...commForm, commission_rate: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">金额 (元)</label>
                  <input type="number" step="0.01" min="0" value={commForm.amount} onChange={(e) => setCommForm({ ...commForm, amount: e.target.value })} required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">状态</label>
                  <select value={commForm.status} onChange={(e) => setCommForm({ ...commForm, status: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                    {COMMISSION_STATUS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">支付日期</label>
                  <input type="date" value={commForm.payment_date} onChange={(e) => setCommForm({ ...commForm, payment_date: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">支付方式</label>
                  <select value={commForm.payment_method} onChange={(e) => setCommForm({ ...commForm, payment_method: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                    {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">流水号</label>
                  <input type="text" value={commForm.reference_number} onChange={(e) => setCommForm({ ...commForm, reference_number: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">备注</label>
                  <input type="text" value={commForm.notes} onChange={(e) => setCommForm({ ...commForm, notes: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition">
                {submitting ? '提交中...' : '提交'}
              </button>
            </form>
          )}

          {commissions.length === 0 ? (
            <p className="text-sm text-gray-400">暂无居间费用记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">客户</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">金额</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">费率</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">状态</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">支付日期</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{c.customer_name || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">¥{Number(c.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.commission_rate}%</td>
                      <td className="px-4 py-3">
                        <Badge color={c.status === 'paid' ? 'green' : 'orange'}>
                          {c.status === 'paid' ? '已支付' : '待支付'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.payment_date || '-'}</td>
                      <td className="px-4 py-3">
                        {isAdmin && (
                          <button onClick={() => handleDeleteCommission(c.id)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline">删除</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChannelsPage() {
  const store = useStore();
  const { user } = useAuth();
  const { channels, loadChannels } = store;
  const isExecutive = user?.role === 'admin' || user?.role === 'executive';
  const isAdmin = user?.role === 'admin';

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const handleDelete = async (ch) => {
    if (!confirm(`确定删除渠道"${ch.name}"？`)) return;
    try {
      await apiDeleteChannel(ch.id);
      loadChannels();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  if (detailId && isExecutive) {
    return <ChannelDetail channelId={detailId} onBack={() => setDetailId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">共 {channels.length} 个渠道</p>
        <button onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新建渠道
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">渠道名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">联系人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">电话</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">公司</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">费率</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">状态</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">关联客户</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">居间费用</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {channels.map((ch) => (
                <tr key={ch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    {isExecutive ? (
                      <button onClick={() => setDetailId(ch.id)} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">{ch.name}</button>
                    ) : (
                      <span className="text-gray-900 dark:text-white font-medium">{ch.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ch.contact || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ch.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ch.company || '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{ch.commission_rate}%</td>
                  <td className="px-4 py-3">
                    <Badge color={ch.status === 'active' ? 'green' : 'gray'}>
                      {ch.status === 'active' ? '活跃' : '停用'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{ch.customer_count}</td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{ch.total_commission ? `¥${Number(ch.total_commission).toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isExecutive && (
                        <button onClick={() => { setEditTarget(ch); setShowForm(true); }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline">编辑</button>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleDelete(ch)}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline">删除</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {channels.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">暂无渠道数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ChannelFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        channel={editTarget}
        onSaved={loadChannels}
      />
    </div>
  );
}
