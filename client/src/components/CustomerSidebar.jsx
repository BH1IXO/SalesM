import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { getActivities, createActivity, updateActivity, deleteActivity, getExpenses, createExpense, getPayments, createPayment, deletePayment, getCustomerCompetitors, createCustomerCompetitor, updateCustomer as apiUpdateCustomer, getCollaborators, addCollaborator, removeCollaborator } from '../api';
import { PIPELINE_STAGES, ACTIVITY_TYPES, EXPENSE_TYPES, PAYMENT_METHODS, LOSS_REASONS } from '../constants';
import Badge from './Badge';
import StatCard from './StatCard';
import Modal from './Modal';
import DocumentSection from './DocumentSection';

// ─── Baseline Section ──────────────────────────────────────────────────────

function BaselineSection({ label, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || '');

  useEffect(() => { setText(value || ''); }, [value]);

  const handleSave = () => {
    onSave(text);
    setEditing(false);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            编辑
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="flex gap-2 mt-1">
            <button onClick={handleSave} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存</button>
            <button onClick={() => { setEditing(false); setText(value || ''); }} className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">取消</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 min-h-[40px]">
          {value || '暂无内容'}
        </p>
      )}
    </div>
  );
}

// ─── Activity Form ─────────────────────────────────────────────────────────

function ActivityForm({ customerId, onCreated, editTarget, onCancelEdit }) {
  const isEdit = !!editTarget;
  const [form, setForm] = useState({ type: 'call', description: '', date: new Date().toISOString().slice(0, 10), next_follow_up: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editTarget) {
      setForm({
        type: editTarget.type || 'call',
        description: editTarget.description || '',
        date: editTarget.date ? editTarget.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        next_follow_up: editTarget.next_follow_up ? editTarget.next_follow_up.slice(0, 10) : '',
      });
    }
  }, [editTarget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateActivity(customerId, editTarget.id, form);
      } else {
        await createActivity(customerId, form);
        setForm({ type: 'call', description: '', date: new Date().toISOString().slice(0, 10), next_follow_up: '' });
      }
      onCreated();
    } catch (err) {
      console.error('Failed to save activity:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">活动类型</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">日期</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">描述</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="活动内容描述..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">下次跟进日期</label>
        <input
          type="date"
          value={form.next_follow_up}
          onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition"
        >
          {submitting ? (isEdit ? '保存中...' : '添加中...') : (isEdit ? '保存修改' : '添加活动')}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Expense Form ──────────────────────────────────────────────────────────

function ExpenseForm({ customerId, onCreated }) {
  const [form, setForm] = useState({ type: 'travel', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createExpense(customerId, { ...form, amount: Number(form.amount) });
      setForm({ type: 'travel', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
      onCreated();
    } catch (err) {
      console.error('Failed to create expense:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">费用类型</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EXPENSE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">金额 (元)</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">描述</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="费用说明..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">日期</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !form.amount}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition"
      >
        {submitting ? '添加中...' : '添加费用'}
      </button>
    </form>
  );
}

// ─── Competitor Form ───────────────────────────────────────────────────────

function PaymentForm({ customerId, onCreated }) {
  const [form, setForm] = useState({ amount: '', payment_date: new Date().toISOString().slice(0, 10), payment_method: 'transfer', reference_number: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPayment(customerId, { ...form, amount: Number(form.amount) });
      setForm({ amount: '', payment_date: new Date().toISOString().slice(0, 10), payment_method: 'transfer', reference_number: '', notes: '' });
      onCreated();
    } catch (err) {
      console.error('Failed to create payment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">回款金额 (元)</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
            required
            min="0.01"
            step="0.01"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">到账日期</label>
          <input
            type="date"
            value={form.payment_date}
            onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">付款方式</label>
          <select
            value={form.payment_method}
            onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">参考单号</label>
          <input
            type="text"
            value={form.reference_number}
            onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
            placeholder="流水号/发票号"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">备注</label>
        <input
          type="text"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="回款说明..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !form.amount}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition"
      >
        {submitting ? '添加中...' : '添加回款'}
      </button>
    </form>
  );
}

// ─── Competitor Form (original) ──────────────────────────────────────────

function CompetitorForm({ customerId, onCreated }) {
  const { competitors } = useStore();
  const [form, setForm] = useState({ competitor_id: '', customer_feedback: '', our_advantage: '', our_disadvantage: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCustomerCompetitor(customerId, { ...form, competitor_id: Number(form.competitor_id) });
      setForm({ competitor_id: '', customer_feedback: '', our_advantage: '', our_disadvantage: '' });
      onCreated();
    } catch (err) {
      console.error('Failed to create customer competitor:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-3">
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">竞争对手</label>
        <select
          value={form.competitor_id}
          onChange={(e) => setForm({ ...form, competitor_id: e.target.value })}
          required
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">选择竞争对手</option>
          {competitors.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">客户反馈</label>
        <textarea
          value={form.customer_feedback}
          onChange={(e) => setForm({ ...form, customer_feedback: e.target.value })}
          rows={2}
          placeholder="客户对竞品的评价..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">我方优势</label>
        <textarea
          value={form.our_advantage}
          onChange={(e) => setForm({ ...form, our_advantage: e.target.value })}
          rows={2}
          placeholder="相对该竞品的优势..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">我方劣势</label>
        <textarea
          value={form.our_disadvantage}
          onChange={(e) => setForm({ ...form, our_disadvantage: e.target.value })}
          rows={2}
          placeholder="相对该竞品的劣势..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !form.competitor_id}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition"
      >
        {submitting ? '添加中...' : '添加竞品关联'}
      </button>
    </form>
  );
}

// ─── Loss Modal ────────────────────────────────────────────────────────────

function LossModal({ open, onClose, onConfirm }) {
  const { competitors } = useStore();
  const [lossReason, setLossReason] = useState('');
  const [lossCompetitor, setLossCompetitor] = useState('');

  const handleConfirm = () => {
    onConfirm({ loss_reason: lossReason, loss_competitor: lossCompetitor ? Number(lossCompetitor) : null });
  };

  return (
    <Modal open={open} onClose={onClose} title="标记为输单">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">输单原因</label>
          <select
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">选择原因</option>
            {LOSS_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">赢得的竞争对手</label>
          <select
            value={lossCompetitor}
            onChange={(e) => setLossCompetitor(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">选择竞争对手（可选）</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleConfirm}
            disabled={!lossReason}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg text-sm transition"
          >
            确认输单
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition"
          >
            取消
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Field Row ─────────────────────────────────────────────────────────────

function FieldRow({ label, value }) {
  return (
    <div className="flex items-start py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white flex-1">{value || '-'}</span>
    </div>
  );
}

// ─── Main Sidebar ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'info', name: '基本信息' },
  { id: 'baseline', name: '打单基线' },
  { id: 'activities', name: '跟进记录' },
  { id: 'expenses', name: '费用记录' },
  { id: 'payments', name: '回款记录' },
  { id: 'competitors', name: '竞品关联' },
];

const PRIORITY_LABEL = { high: '高', medium: '中', low: '低' };
const PRIORITY_COLOR = { high: 'red', medium: 'orange', low: 'blue' };

export default function CustomerSidebar({ customer, onClose }) {
  const store = useStore();
  const { team, competitors } = store;

  const [tab, setTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activities, setActivities] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [custCompetitors, setCustCompetitors] = useState([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCompetitorForm, setShowCompetitorForm] = useState(false);
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  // Load tab data
  const loadActivities = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await getActivities(customer.id);
      setActivities(Array.isArray(data) ? data : data.activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  }, [customer]);

  const loadExpenses = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await getExpenses(customer.id);
      setExpenses(Array.isArray(data) ? data : data.expenses || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  }, [customer]);

  const loadPayments = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await getPayments(customer.id);
      setPayments(Array.isArray(data) ? data : data.payments || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    }
  }, [customer]);

  const loadCustCompetitors = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await getCustomerCompetitors(customer.id);
      setCustCompetitors(Array.isArray(data) ? data : data.customer_competitors || []);
    } catch (err) {
      console.error('Failed to load customer competitors:', err);
    }
  }, [customer]);

  const loadCollaborators = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await getCollaborators(customer.id);
      setCollaborators(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load collaborators:', err);
    }
  }, [customer]);

  const handleAddCollaborator = async (userId) => {
    try {
      await addCollaborator(customer.id, userId);
      setShowAddCollaborator(false);
      loadCollaborators();
    } catch (err) {
      alert(err.response?.data?.error || '添加协作者失败');
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      await removeCollaborator(customer.id, userId);
      loadCollaborators();
    } catch (err) {
      alert(err.response?.data?.error || '移除协作者失败');
    }
  };

  useEffect(() => {
    if (!customer) return;
    setTab('info');
    setEditing(false);
    setShowActivityForm(false);
    setShowExpenseForm(false);
    setShowPaymentForm(false);
    setShowCompetitorForm(false);
    setShowAddCollaborator(false);
    loadActivities();
    loadExpenses();
    loadPayments();
    loadCustCompetitors();
    loadCollaborators();
  }, [customer, loadActivities, loadExpenses, loadPayments, loadCustCompetitors, loadCollaborators]);

  useEffect(() => {
    if (tab === 'activities') loadActivities();
    else if (tab === 'expenses') loadExpenses();
    else if (tab === 'payments') loadPayments();
    else if (tab === 'competitors') loadCustCompetitors();
  }, [tab, loadActivities, loadExpenses, loadPayments, loadCustCompetitors]);

  if (!customer) return null;

  const assignee = team.find((m) => m.id === customer.assigned_to);
  const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalPayment = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const roi = totalExpense > 0 ? ((Number(customer.amount) || 0) / totalExpense).toFixed(1) : '-';

  // Edit mode form
  const startEdit = () => {
    setEditForm({
      name: customer.name || '',
      industry: customer.industry || '',
      size: customer.size || '',
      contact: customer.contact || '',
      phone: customer.phone || '',
      email: customer.email || '',
      amount_onetime: customer.amount_onetime || '',
      amount_monthly: customer.amount_monthly || '',
      amount_months: customer.amount_months || '1',
      budget: customer.budget || '',
      expected_close_date: customer.expected_close_date ? customer.expected_close_date.slice(0, 10) : '',
      priority: customer.priority || 'medium',
      assigned_to: customer.assigned_to || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await store.updateCustomer(customer.id, {
        ...editForm,
        amount_onetime: Number(editForm.amount_onetime) || 0,
        amount_monthly: Number(editForm.amount_monthly) || 0,
        amount_months: Number(editForm.amount_months) || 1,
        budget: Number(editForm.budget) || 0,
      });
      setEditing(false);
    } catch (err) {
      console.error('Failed to update customer:', err);
    }
  };

  // Baseline save
  const saveBaseline = async (field, value) => {
    try {
      await store.updateCustomer(customer.id, { [field]: value });
    } catch (err) {
      console.error('Failed to update baseline:', err);
    }
  };

  // Status change
  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'lost') {
      setPendingStatus(newStatus);
      setLossModalOpen(true);
      return;
    }
    try {
      await store.moveCustomer(customer.id, newStatus);
      await store.loadCustomers();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const confirmLoss = async ({ loss_reason, loss_competitor }) => {
    try {
      await apiUpdateCustomer(customer.id, { status: 'lost', loss_reason, loss_competitor });
      await store.loadCustomers();
      setLossModalOpen(false);
      setPendingStatus(null);
    } catch (err) {
      console.error('Failed to mark as lost:', err);
    }
  };

  // Quick follow up
  const handleQuickFollowUp = async () => {
    try {
      await apiUpdateCustomer(customer.id, { last_follow_up: new Date().toISOString() });
      await store.loadCustomers();
    } catch (err) {
      console.error('Failed to update follow up:', err);
    }
  };

  const activityCreated = async () => {
    setShowActivityForm(false);
    setEditingActivity(null);
    await loadActivities();
    await store.loadCustomers();
  };

  const handleDeleteActivity = async (activity) => {
    if (!confirm(`确定删除这条${ACTIVITY_TYPES.find(t => t.id === activity.type)?.name || ''}记录？`)) return;
    try {
      await deleteActivity(customer.id, activity.id);
      await loadActivities();
    } catch (err) {
      alert('删除失败');
    }
  };

  const expenseCreated = async () => {
    setShowExpenseForm(false);
    await loadExpenses();
    await store.loadCustomers();
  };

  const paymentCreated = async () => {
    setShowPaymentForm(false);
    await loadPayments();
    await store.loadCustomers();
  };

  const handleDeletePayment = async (payment) => {
    if (!confirm(`确定删除这笔 ¥${Number(payment.amount).toLocaleString()} 的回款记录？`)) return;
    try {
      await deletePayment(customer.id, payment.id);
      await loadPayments();
      await store.loadCustomers();
    } catch (err) {
      alert('删除失败');
    }
  };

  const competitorCreated = async () => {
    setShowCompetitorForm(false);
    await loadCustCompetitors();
    await store.loadCustomers();
  };

  const stageObj = PIPELINE_STAGES.find((s) => s.id === customer.status);

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-[520px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 flex flex-col fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{customer.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {stageObj && <Badge color={customer.status === 'won' ? 'green' : customer.status === 'lost' ? 'red' : 'blue'}>{stageObj.name}</Badge>}
              {customer.priority && <Badge color={PRIORITY_COLOR[customer.priority]}>{PRIORITY_LABEL[customer.priority]}优先级</Badge>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-5 overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">

          {/* ── Tab: Info ── */}
          {tab === 'info' && (
            <div>
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatCard label="商机金额" value={`${((customer.amount || 0) / 10000).toFixed(1)}万`} icon="💰" />
                <StatCard label="已回款" value={`${(totalPayment / 10000).toFixed(1)}万`} icon="💵" />
                <StatCard label="总费用" value={`${(totalExpense / 10000).toFixed(1)}万`} icon="💳" />
                <StatCard label="ROI" value={`${roi}x`} icon="📈" />
              </div>

              {!editing ? (
                <div>
                  <div className="flex justify-end mb-2">
                    <button onClick={startEdit} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">编辑</button>
                  </div>
                  <FieldRow label="客户名称" value={customer.name} />
                  <FieldRow label="行业" value={customer.industry} />
                  <FieldRow label="规模" value={customer.size} />
                  <FieldRow label="联系人" value={customer.contact} />
                  <FieldRow label="联系人职位" value={customer.contact_title} />
                  <FieldRow label="电话" value={customer.phone} />
                  <FieldRow label="邮箱" value={customer.email} />
                  <FieldRow label="公司领导" value={customer.leader_name} />
                  <FieldRow label="领导职位" value={customer.leader_title} />
                  <FieldRow label="领导电话" value={customer.leader_phone} />
                  <FieldRow label="商机金额" value={customer.amount ? `¥${Number(customer.amount).toLocaleString()}${customer.amount_monthly ? ` (一次性¥${Number(customer.amount_onetime || 0).toLocaleString()} + ¥${Number(customer.amount_monthly).toLocaleString()}/月×${customer.amount_months || 1}月)` : ''}` : '-'} />
                  <FieldRow label="预算" value={customer.budget ? `¥${Number(customer.budget).toLocaleString()}` : '-'} />
                  <FieldRow label="预计成交" value={customer.expected_close_date ? customer.expected_close_date.slice(0, 10) : '-'} />
                  <FieldRow label="优先级" value={PRIORITY_LABEL[customer.priority] || '-'} />
                  <FieldRow label="负责人" value={assignee ? (assignee.name || assignee.username) : '-'} />

                  {/* Collaborators */}
                  <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">协作者</span>
                      <button
                        onClick={() => setShowAddCollaborator(!showAddCollaborator)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {showAddCollaborator ? '取消' : '+ 添加'}
                      </button>
                    </div>
                    {showAddCollaborator && (
                      <div className="mb-2">
                        <select
                          onChange={(e) => { if (e.target.value) handleAddCollaborator(Number(e.target.value)); }}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                          defaultValue=""
                        >
                          <option value="" disabled>选择团队成员...</option>
                          {team
                            .filter((m) => m.id !== customer.assigned_to && !collaborators.some((c) => c.user_id === m.id))
                            .map((m) => (
                              <option key={m.id} value={m.id}>{m.name || m.username}</option>
                            ))}
                        </select>
                      </div>
                    )}
                    {collaborators.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {collaborators.map((c) => (
                          <div key={c.user_id} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full pl-1 pr-2 py-0.5">
                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                              {(c.name || c.username || '?')[0]}
                            </div>
                            <span className="text-xs text-gray-700 dark:text-gray-300">{c.name || c.username}</span>
                            <button
                              onClick={() => handleRemoveCollaborator(c.user_id)}
                              className="text-gray-400 hover:text-red-500 text-xs ml-0.5"
                              title="移除协作者"
                            >&times;</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">暂无协作者</span>
                    )}
                  </div>

                  <FieldRow label="最后跟进" value={customer.last_follow_up ? customer.last_follow_up.slice(0, 10) : '-'} />
                  {customer.status === 'lost' && (
                    <>
                      <FieldRow label="输单原因" value={customer.loss_reason} />
                      <FieldRow label="赢单竞品" value={competitors.find((c) => c.id === customer.loss_competitor)?.name || '-'} />
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { key: 'name', label: '客户名称', type: 'text' },
                    { key: 'industry', label: '行业', type: 'text' },
                    { key: 'size', label: '规模', type: 'text' },
                    { key: 'contact', label: '联系人', type: 'text' },
                    { key: 'contact_title', label: '联系人职位', type: 'text' },
                    { key: 'phone', label: '电话', type: 'text' },
                    { key: 'email', label: '邮箱', type: 'email' },
                    { key: 'leader_name', label: '公司领导', type: 'text' },
                    { key: 'leader_title', label: '领导职位', type: 'text' },
                    { key: 'leader_phone', label: '领导电话', type: 'text' },
                    { key: 'budget', label: '预算', type: 'number' },
                    { key: 'expected_close_date', label: '预计成交日期', type: 'date' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        value={editForm[f.key] || ''}
                        onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">商机金额</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-0.5">一次性费用</label>
                        <input type="number" value={editForm.amount_onetime || ''} onChange={(e) => setEditForm({ ...editForm, amount_onetime: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-0.5">月服务费</label>
                        <input type="number" value={editForm.amount_monthly || ''} onChange={(e) => setEditForm({ ...editForm, amount_monthly: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-0.5">月数</label>
                        <input type="number" min="1" value={editForm.amount_months || ''} onChange={(e) => setEditForm({ ...editForm, amount_months: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">总额：¥{((Number(editForm.amount_onetime) || 0) + (Number(editForm.amount_monthly) || 0) * (Number(editForm.amount_months) || 1)).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">优先级</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">负责人</label>
                    <select
                      value={editForm.assigned_to || ''}
                      onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value ? Number(e.target.value) : '' })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">未分配</option>
                      {team.filter((m) => m.role !== 'admin').map((m) => (
                        <option key={m.id} value={m.id}>{m.name || m.username}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveEdit} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">保存</button>
                    <button onClick={() => setEditing(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition">取消</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Baseline ── */}
          {tab === 'baseline' && (
            <div>
              <BaselineSection label="客户痛点" value={customer.pain_points} onSave={(v) => saveBaseline('pain_points', v)} />
              <BaselineSection label="解决方案" value={customer.solution} onSave={(v) => saveBaseline('solution', v)} />
              <BaselineSection label="决策链" value={customer.decision_chain} onSave={(v) => saveBaseline('decision_chain', v)} />

              <div className="border-t border-gray-200 dark:border-gray-700 my-5 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">文档资料</h3>
                <DocumentSection customerId={customer.id} />
              </div>
            </div>
          )}

          {/* ── Tab: Activities ── */}
          {tab === 'activities' && (
            <div>
              <button
                onClick={() => { setShowActivityForm(!showActivityForm); setEditingActivity(null); }}
                className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                添加活动
              </button>
              {showActivityForm && !editingActivity && <ActivityForm customerId={customer.id} onCreated={activityCreated} />}

              {/* Timeline */}
              <div className="relative">
                {activities.length > 1 && (
                  <div className="absolute left-[19px] top-8 bottom-4 w-px bg-gray-200 dark:bg-gray-700" />
                )}
                <div className="space-y-0">
                  {activities.map((a, idx) => {
                    const typeObj = ACTIVITY_TYPES.find((t) => t.id === a.type);
                    if (editingActivity?.id === a.id) {
                      return (
                        <div key={a.id} className="mb-3">
                          <ActivityForm
                            customerId={customer.id}
                            editTarget={a}
                            onCreated={activityCreated}
                            onCancelEdit={() => setEditingActivity(null)}
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={a.id} className="relative flex gap-3 pb-5 group">
                        <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-base shadow-sm">
                          {typeObj?.icon || '📋'}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{typeObj?.name || a.type}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{a.created_at ? a.created_at.slice(0, 19).replace('T', ' ') : (a.date ? a.date.slice(0, 10) : '')}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={() => { setEditingActivity(a); setShowActivityForm(false); }}
                                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                title="编辑"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(a)}
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                title="删除"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {a.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap leading-relaxed">{a.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                            {a.creator_name && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {a.creator_name}
                              </span>
                            )}
                            {a.next_follow_up && (
                              <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                下次跟进 {a.next_follow_up.slice(0, 10)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {activities.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">暂无跟进记录</p>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Expenses ── */}
          {tab === 'expenses' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  添加费用
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  总计: <span className="text-blue-600 dark:text-blue-400">¥{totalExpense.toLocaleString()}</span>
                </span>
              </div>
              {showExpenseForm && <ExpenseForm customerId={customer.id} onCreated={expenseCreated} />}
              <div className="space-y-3">
                {expenses.map((exp) => {
                  const typeObj = EXPENSE_TYPES.find((t) => t.id === exp.type);
                  return (
                    <div key={exp.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-xl flex-shrink-0">{typeObj?.icon || '📋'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{typeObj?.name || exp.type}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{exp.date ? exp.date.slice(0, 10) : ''}</span>
                        </div>
                        {exp.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{exp.description}</p>}
                        {exp.creator_name && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">由 {exp.creator_name}</p>}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                        ¥{Number(exp.amount).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                {expenses.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">暂无费用记录</p>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Payments ── */}
          {tab === 'payments' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  添加回款
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  已收: <span className="text-emerald-600 dark:text-emerald-400">¥{totalPayment.toLocaleString()}</span>
                </span>
              </div>

              {/* Progress bar */}
              {customer.amount > 0 && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>回款进度</span>
                    <span>{customer.amount > 0 ? ((totalPayment / customer.amount) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((totalPayment / customer.amount) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>已收 ¥{totalPayment.toLocaleString()}</span>
                    <span>总额 ¥{Number(customer.amount).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {showPaymentForm && <PaymentForm customerId={customer.id} onCreated={paymentCreated} />}
              <div className="space-y-3">
                {payments.map((p) => {
                  const methodObj = PAYMENT_METHODS.find((m) => m.id === p.payment_method);
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg group">
                      <div className="text-xl flex-shrink-0">💵</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{methodObj?.name || p.payment_method || '回款'}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{p.payment_date ? p.payment_date.slice(0, 10) : ''}</span>
                        </div>
                        {p.reference_number && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">单号: {p.reference_number}</p>}
                        {p.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.notes}</p>}
                        {p.creator_name && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">由 {p.creator_name}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          +¥{Number(p.amount).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDeletePayment(p)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="删除"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {payments.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">暂无回款记录</p>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Competitors ── */}
          {tab === 'competitors' && (
            <div>
              <button
                onClick={() => setShowCompetitorForm(!showCompetitorForm)}
                className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                添加竞品关联
              </button>
              {showCompetitorForm && <CompetitorForm customerId={customer.id} onCreated={competitorCreated} />}
              <div className="space-y-3">
                {custCompetitors.map((cc) => {
                  const comp = competitors.find((c) => c.id === cc.competitor_id);
                  return (
                    <div key={cc.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">{comp?.name || '未知竞品'}</div>
                      {cc.customer_feedback && (
                        <div className="mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">客户反馈: </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{cc.customer_feedback}</span>
                        </div>
                      )}
                      {cc.our_advantage && (
                        <div className="mb-1">
                          <span className="text-xs text-green-600 dark:text-green-400">我方优势: </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{cc.our_advantage}</span>
                        </div>
                      )}
                      {cc.our_disadvantage && (
                        <div>
                          <span className="text-xs text-red-600 dark:text-red-400">我方劣势: </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{cc.our_disadvantage}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {custCompetitors.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">暂无竞品关联</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <select
            value={customer.status || ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={handleQuickFollowUp}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition whitespace-nowrap"
          >
            标记跟进
          </button>
        </div>
      </div>

      {/* Loss modal */}
      <LossModal
        open={lossModalOpen}
        onClose={() => { setLossModalOpen(false); setPendingStatus(null); }}
        onConfirm={confirmLoss}
      />

      {/* Overlay for closing */}
      <div className="fixed inset-0 z-30" onClick={onClose} />
    </>
  );
}
