import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, createUser, updateUser, resetUserPassword, deleteUser, getApplications, approveApplication, rejectApplication, getOperationLogs } from '../api';
import Modal from './Modal';

const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'executive', label: '高层领导' },
  { value: 'sales', label: '销售' },
  { value: 'marketing', label: '市场' },
  { value: 'product', label: '产品' },
  { value: 'dev', label: '研发' },
  { value: 'ops', label: '运营' },
  { value: 'partner', label: '合作伙伴' },
];

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  executive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  sales: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  marketing: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  product: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  dev: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  ops: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  partner: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
};

function CreateUserModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'sales', team: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createUser(form);
      setForm({ username: '', password: '', name: '', role: 'sales', team: '' });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="新建用户">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">用户名</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="登录用户名（英文）"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">初始密码</label>
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="至少6位，用户首次登录需修改"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">姓名</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">角色</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">团队</label>
            <input
              type="text"
              value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="如 A, B, tech"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
        >
          {submitting ? '创建中...' : '创建用户'}
        </button>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ open, onClose, user, onDone }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await resetUserPassword(user.id, password);
      setPassword('');
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || '重置失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`重置密码 - ${user?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          重置后用户下次登录需要修改密码
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">新密码</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="至少6位"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
        >
          {submitting ? '重置中...' : '确认重置'}
        </button>
      </form>
    </Modal>
  );
}

function DeleteUserModal({ open, onClose, user, allUsers, onDone }) {
  const [transferTo, setTransferTo] = useState('');
  const [customerCount, setCustomerCount] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('init');

  useEffect(() => {
    if (!open || !user) return;
    setError('');
    setStep('init');
    setTransferTo('');
    setCustomerCount(0);
    // Try delete without transferTo to check if user has customers
    deleteUser(user.id, null).then(() => {
      // Deleted successfully (no customers)
      onDone();
      onClose();
    }).catch((err) => {
      const data = err.response?.data;
      if (data?.customerCount) {
        setCustomerCount(data.customerCount);
        setStep('transfer');
      } else {
        setError(data?.error || '删除失败');
        setStep('error');
      }
    });
  }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = async () => {
    if (!transferTo) {
      setError('请选择客户转移目标');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await deleteUser(user.id, parseInt(transferTo));
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || '删除失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const otherUsers = allUsers.filter((u) => u.id !== user.id && u.active);

  if (step === 'init') {
    return (
      <Modal open={open} onClose={onClose} title="删除用户">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">检查中...</span>
        </div>
      </Modal>
    );
  }

  if (step === 'error') {
    return (
      <Modal open={open} onClose={onClose} title="删除用户">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`删除用户 - ${user.name}`}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            该用户名下有 {customerCount} 个客户
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            删除前需要将客户转移给其他用户
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">转移客户给</label>
          <select
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">请选择用户</option>
            {otherUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleConfirm}
          disabled={submitting || !transferTo}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
        >
          {submitting ? '删除中...' : '确认删除并转移客户'}
        </button>
      </div>
    </Modal>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appRoles, setAppRoles] = useState({});
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [approvedInfo, setApprovedInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      const data = await getApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  }, []);

  const loadLogs = useCallback(async (page = 1) => {
    try {
      const data = await getOperationLogs(page);
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
      setLogsPage(data.page || 1);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }, []);

  useEffect(() => { loadUsers(); loadApplications(); loadLogs(); }, [loadUsers, loadApplications, loadLogs]);

  const handleToggleActive = async (user) => {
    try {
      await updateUser(user.id, { active: user.active ? 0 : 1 });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleApprove = async (app) => {
    const role = appRoles[app.id] || 'sales';
    try {
      const res = await approveApplication(app.id, role);
      setApprovedInfo({ username: res.username, name: res.name, password: res.password });
      setCopied(false);
      loadApplications();
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async (app) => {
    try {
      await rejectApplication(app.id);
      loadApplications();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">用户管理 - 共 {users.length} 个用户</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新建用户
        </button>
      </div>

      {/* Applications Section */}
      {applications.length > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">
            待审批账号申请 ({applications.length})
          </h2>
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-amber-100 dark:border-gray-700">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({app.username})</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-3">{(app.created_at || '').split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={appRoles[app.id] || 'sales'}
                    onChange={(e) => setAppRoles({ ...appRoles, [app.id]: e.target.value })}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {ROLE_OPTIONS.filter((r) => r.value !== 'admin').map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleApprove(app)}
                    className="px-3 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => handleReject(app)}
                    className="px-3 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-4 py-3">用户名</th>
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">角色</th>
              <th className="px-4 py-3">团队</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">需改密</th>
              <th className="px-4 py-3">创建时间</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{u.username}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{u.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_OPTIONS.find((r) => r.value === u.role)?.label || u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{u.team || '-'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer transition ${u.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}
                  >
                    {u.active ? '启用' : '禁用'}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {u.must_change_password ? (
                    <span className="text-amber-600 dark:text-amber-400">是</span>
                  ) : (
                    <span className="text-gray-400">否</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{(u.created_at || '').split(' ')[0]}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setResetTarget(u)}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      重置密码
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:underline"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Operation Logs */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">操作日志</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">用户</th>
                <th className="px-4 py-3">操作</th>
                <th className="px-4 py-3">对象</th>
                <th className="px-4 py-3">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">暂无操作日志</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{log.created_at}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{log.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.target || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{log.detail || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {logsTotal > 50 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                共 {logsTotal} 条，第 {logsPage} / {Math.ceil(logsTotal / 50)} 页
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => loadLogs(logsPage - 1)}
                  disabled={logsPage <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                >
                  上一页
                </button>
                <button
                  onClick={() => loadLogs(logsPage + 1)}
                  disabled={logsPage >= Math.ceil(logsTotal / 50)}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadUsers} />
      {resetTarget && (
        <ResetPasswordModal open={!!resetTarget} onClose={() => setResetTarget(null)} user={resetTarget} onDone={loadUsers} />
      )}
      {deleteTarget && (
        <DeleteUserModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} user={deleteTarget} allUsers={users} onDone={loadUsers} />
      )}
      {approvedInfo && (
        <Modal open={!!approvedInfo} onClose={() => setApprovedInfo(null)} title="审批通过">
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                用户 {approvedInfo.name} 已创建成功
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">登录账号</span>
                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{approvedInfo.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">初始密码</span>
                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{approvedInfo.password}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">用户首次登录后需修改密码</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`登录账号：${approvedInfo.username}\n初始密码：${approvedInfo.password}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className={`w-full py-2.5 font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制账号密码
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
