import React, { useRef, useState } from 'react';
import { useStore } from '../store';

export default function SettingsPage() {
  const store = useStore();
  const { darkMode, setDarkMode, customers, competitors, team, exportData, importData, exportCSV } = store;

  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMsg('');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      setImportMsg('导入成功');
    } catch (err) {
      setImportMsg('导入失败: ' + (err.message || '文件格式错误'));
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportJSON = async () => {
    try {
      await exportData();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleExportCSV = () => {
    try {
      exportCSV();
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Dark mode */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">外观设置</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">深色模式</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">切换深色/浅色主题</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Data export */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">数据导出</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">导出CSV</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">导出客户数据为CSV文件</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
            >
              导出CSV
            </button>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">导出JSON备份</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">导出全部数据为JSON格式</p>
              </div>
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                导出JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data import */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">数据导入</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">导入JSON数据</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">从JSON备份文件恢复数据</p>
          </div>
          <div className="flex items-center gap-3">
            {importMsg && (
              <span className={`text-sm ${importMsg.includes('成功') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {importMsg}
              </span>
            )}
            <label className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition cursor-pointer">
              {importing ? '导入中...' : '选择文件'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">系统信息</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">客户数</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{competitors.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">竞争对手</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{team.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">团队成员</p>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
        SalesM v1.0.0
      </div>
    </div>
  );
}
