import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { updateCompetitor, deleteCompetitor as apiDeleteCompetitor, getCompetitorFiles, uploadCompetitorFile, deleteCompetitorFile, downloadCompetitorFile } from '../api';
import Modal from './Modal';
import Badge from './Badge';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function CompetitorFileSection({ competitorId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const loadFiles = useCallback(async () => {
    try {
      const data = await getCompetitorFiles(competitorId);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load competitor files:', err);
    }
  }, [competitorId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadCompetitorFile(competitorId, formData, (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      });
      loadFiles();
    } catch (err) {
      alert(err.response?.data?.error || '上传失败');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await downloadCompetitorFile(competitorId, file.id);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('下载失败');
    }
  };

  const handleDelete = async (file) => {
    if (!confirm(`确定删除文件 "${file.original_name}"？`)) return;
    try {
      await deleteCompetitorFile(competitorId, file.id);
      loadFiles();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">资料文件</span>
        <label className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
          {uploading ? `上传中 ${progress}%` : '上传文件'}
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {files.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">暂无文件</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2 group">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{f.original_name}</p>
                  <p className="text-xs text-gray-400">{formatSize(f.size)} · {f.uploader_name || ''} · {(f.created_at || '').split(' ')[0]}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDownload(f)} className="p-1 text-gray-400 hover:text-blue-600" title="下载">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(f)} className="p-1 text-gray-400 hover:text-red-600" title="删除">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompetitorFormModal({ open, onClose, competitor, onSaved }) {
  const store = useStore();
  const isEdit = !!competitor;
  const [form, setForm] = useState({ name: '', strengths: '', weaknesses: '', pricing: '', tactics: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && competitor) {
      setForm({
        name: competitor.name || '',
        strengths: competitor.strengths || '',
        weaknesses: competitor.weaknesses || '',
        pricing: competitor.pricing || '',
        tactics: competitor.tactics || '',
      });
    } else if (open) {
      setForm({ name: '', strengths: '', weaknesses: '', pricing: '', tactics: '' });
    }
    setError('');
  }, [open, competitor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('竞争对手名称不能为空'); return; }
    setError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCompetitor(competitor.id, form);
      } else {
        await store.addCompetitor(form);
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
    <Modal open={open} onClose={onClose} title={isEdit ? '编辑竞争对手' : '添加竞争对手'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称 <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">优势</label>
          <textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} rows={2}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">劣势</label>
          <textarea value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} rows={2}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">定价策略</label>
          <textarea value={form.pricing} onChange={(e) => setForm({ ...form, pricing: e.target.value })} rows={2}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">竞争策略</label>
          <textarea value={form.tactics} onChange={(e) => setForm({ ...form, tactics: e.target.value })} rows={2}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition">
            {submitting ? (isEdit ? '保存中...' : '添加中...') : (isEdit ? '保存修改' : '添加')}
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

export default function CompetitorsPage() {
  const store = useStore();
  const { competitors, customers, loadCompetitors } = store;

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const handleDelete = async (comp) => {
    if (!confirm(`确定删除竞争对手"${comp.name}"？关联数据也会被清除。`)) return;
    try {
      await apiDeleteCompetitor(comp.id);
      loadCompetitors();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const lostCustomers = customers.filter((c) => c.status === 'lost');

  const getCompetitorStats = (competitorId) => {
    const lossCount = lostCustomers.filter((c) => c.loss_competitor === competitorId).length;
    const linkedCount = customers.filter((c) => c.loss_competitor === competitorId).length;
    return { lossCount, linkedCount };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">共 {competitors.length} 个竞争对手</p>
        <button onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          添加竞争对手
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {competitors.map((comp) => {
          const stats = getCompetitorStats(comp.id);
          const isExpanded = expandedId === comp.id;
          return (
            <div key={comp.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <h3
                  className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                >
                  {comp.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge color="blue">{stats.linkedCount} 关联</Badge>
                  {stats.lossCount > 0 && <Badge color="red">{stats.lossCount} 输单</Badge>}
                  <button onClick={() => { setEditTarget(comp); setShowForm(true); }}
                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="编辑">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(comp)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="删除">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {comp.strengths && (
                  <div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 block mb-1">优势</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">{comp.strengths}</p>
                  </div>
                )}
                {comp.weaknesses && (
                  <div>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 block mb-1">劣势</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{comp.weaknesses}</p>
                  </div>
                )}
                {comp.pricing && (
                  <div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">定价策略</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">{comp.pricing}</p>
                  </div>
                )}
                {comp.tactics && (
                  <div>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 block mb-1">竞争策略</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">{comp.tactics}</p>
                  </div>
                )}
                {!comp.strengths && !comp.weaknesses && !comp.pricing && !comp.tactics && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">暂无详细信息</p>
                )}
              </div>

              {isExpanded && <CompetitorFileSection competitorId={comp.id} />}
              {!isExpanded && (
                <button
                  onClick={() => setExpandedId(comp.id)}
                  className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  查看资料文件
                </button>
              )}
            </div>
          );
        })}
        {competitors.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400 dark:text-gray-500">暂无竞争对手数据</div>
        )}
      </div>

      {lostCustomers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            输单记录 <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({lostCustomers.length} 笔)</span>
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
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.amount ? `${(Number(c.amount) / 10000).toFixed(1)}万` : '-'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.loss_reason || '-'}</td>
                      <td className="px-4 py-3">{winComp ? <Badge color="red">{winComp.name}</Badge> : <span className="text-gray-400">-</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CompetitorFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        competitor={editTarget}
        onSaved={loadCompetitors}
      />
    </div>
  );
}
