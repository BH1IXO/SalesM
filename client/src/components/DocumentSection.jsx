import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getDocuments, uploadDocument, deleteDocument, downloadDocument, getDocumentCategories, createDocumentCategory } from '../api';
import Modal from './Modal';

const PREVIEW_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const PREVIEW_PDF_TYPE = 'application/pdf';

function getFileIcon(mimeType) {
  if (!mimeType) return '📎';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📈';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return '📦';
  return '📎';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function canPreview(mimeType) {
  return PREVIEW_IMAGE_TYPES.includes(mimeType) || mimeType === PREVIEW_PDF_TYPE;
}

function UploadForm({ customerId, categories, onCreated, onAddCategory }) {
  const [file, setFile] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (categoryId) formData.append('category_id', categoryId);
      if (notes.trim()) formData.append('notes', notes.trim());
      await uploadDocument(customerId, formData, (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      });
      setFile(null);
      setCategoryId('');
      setNotes('');
      setProgress(0);
      onCreated();
    } catch (err) {
      alert(err.response?.data?.error || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await onAddCategory(newCatName.trim());
      setNewCatName('');
      setShowNewCat(false);
    } catch (err) {
      alert(err.response?.data?.error || '添加分类失败');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>{getFileIcon(file.type)}</span>
            <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{file.name}</span>
            <span className="text-gray-500">({formatFileSize(file.size)})</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-red-500 hover:text-red-700 ml-1">✕</button>
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm">拖拽文件到此处，或点击选择文件</p>
            <p className="text-xs text-gray-400 mt-1">单个文件最大 200MB</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">分类</label>
          <div className="flex gap-1">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">未分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCat(!showNewCat)}
              className="px-2 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              title="添加新分类"
            >+</button>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">备注</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="文档备注（可选）"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {showNewCat && (
        <div className="mt-2 flex gap-1">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="新分类名称"
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
          />
          <button type="button" onClick={handleAddCategory} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">添加</button>
          <button type="button" onClick={() => { setShowNewCat(false); setNewCatName(''); }} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">取消</button>
        </div>
      )}

      {uploading && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">{progress}%</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || uploading}
        className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
      >
        {uploading ? '上传中...' : '上传文档'}
      </button>
    </form>
  );
}

function DocumentItem({ doc, customerId, onDelete, onPreview }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await downloadDocument(customerId, doc.id, false);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('下载失败');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定删除文档「${doc.original_name}」？`)) return;
    try {
      await deleteDocument(customerId, doc.id);
      onDelete();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 group">
      <span className="text-xl flex-shrink-0">{getFileIcon(doc.mime_type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={doc.original_name}>
          {doc.original_name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {doc.category_name && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">{doc.category_name}</span>
          )}
          <span>{formatFileSize(doc.size)}</span>
          <span>{doc.uploader_name}</span>
          <span>{(doc.created_at || '').split(' ')[0]}</span>
        </div>
        {doc.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.notes}</p>}
      </div>
      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canPreview(doc.mime_type) && (
          <button onClick={() => onPreview(doc)} className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700" title="预览">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
        <button onClick={handleDownload} disabled={downloading} className="p-1.5 text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700" title="下载">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>
        <button onClick={handleDelete} className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700" title="删除">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function DocumentSection({ customerId }) {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!customerId) return;
    try {
      const data = await getDocuments(customerId);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  }, [customerId]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getDocumentCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    loadCategories();
  }, [loadDocuments, loadCategories]);

  const handleAddCategory = async (name) => {
    await createDocumentCategory(name);
    await loadCategories();
  };

  const handlePreview = async (doc) => {
    setPreviewLoading(true);
    setPreviewDoc(doc);
    try {
      const response = await downloadDocument(customerId, doc.id, true);
      const url = URL.createObjectURL(response.data);
      setBlobUrl(url);
    } catch (err) {
      alert('预览加载失败');
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setPreviewDoc(null);
  };

  const filtered = filterCategory
    ? documents.filter((d) => String(d.category_id) === filterCategory)
    : documents;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          上传文档
        </button>
        {documents.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">全部分类 ({documents.length})</option>
            {categories.map((c) => {
              const count = documents.filter((d) => d.category_id === c.id).length;
              if (count === 0) return null;
              return <option key={c.id} value={c.id}>{c.name} ({count})</option>;
            })}
          </select>
        )}
      </div>

      {showUpload && (
        <UploadForm
          customerId={customerId}
          categories={categories}
          onCreated={() => { setShowUpload(false); loadDocuments(); }}
          onAddCategory={handleAddCategory}
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">暂无文档</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              customerId={customerId}
              onDelete={loadDocuments}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}

      <Modal open={!!previewDoc} onClose={closePreview} title={previewDoc?.original_name || '预览'} wide>
        {previewLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : blobUrl && previewDoc ? (
          PREVIEW_IMAGE_TYPES.includes(previewDoc.mime_type) ? (
            <img src={blobUrl} alt={previewDoc.original_name} className="max-w-full max-h-[70vh] object-contain mx-auto rounded" />
          ) : previewDoc.mime_type === PREVIEW_PDF_TYPE ? (
            <iframe src={blobUrl} className="w-full h-[70vh] rounded border border-gray-200 dark:border-gray-700" title={previewDoc.original_name} />
          ) : null
        ) : null}
      </Modal>
    </div>
  );
}
