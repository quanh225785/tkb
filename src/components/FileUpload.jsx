import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function FileUpload({ onFileLoaded, fileName, classCount, onClear }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ];
    const isValid =
      validTypes.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');

    if (!isValid) {
      setError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await onFileLoaded(file);
    } catch (err) {
      setError(err.message || 'Lỗi đọc file');
    } finally {
      setIsLoading(false);
    }
  }, [onFileLoaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0];
    handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="file-upload-section">
      <div className="section-label">
        <FileSpreadsheet size={18} />
        <span>Tải lên Thời khóa biểu dự kiến</span>
      </div>

      {fileName ? (
        <div className="file-success">
          <div className="file-info">
            <CheckCircle size={20} className="success-icon" />
            <div>
              <p className="file-name">{fileName}</p>
              <p className="file-meta">
                Đã tải <strong>{classCount}</strong> lớp học phần
              </p>
            </div>
          </div>
          <button className="btn-clear-file" onClick={onClear} title="Xóa file">
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          id="file-drop-zone"
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>Đang xử lý file...</span>
            </div>
          ) : (
            <>
              <Upload size={32} className="upload-icon" />
              <p className="drop-text">
                Kéo thả file vào đây hoặc{' '}
                <span className="drop-link">click để tải lên</span>
              </p>
              <p className="drop-hint">Hỗ trợ file .xlsx, .xls</p>
            </>
          )}
        </label>
      )}

      {error && (
        <div className="upload-error" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={15} />
            <span style={{ fontWeight: 600 }}>Lỗi đọc file</span>
          </div>
          <pre style={{
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            fontSize: 10, lineHeight: 1.5, maxHeight: 200,
            overflowY: 'auto', background: 'rgba(0,0,0,0.3)',
            padding: '8px 10px', borderRadius: 6, width: '100%',
            color: '#f87171', fontFamily: 'monospace',
          }}>{error}</pre>
        </div>
      )}

      <p className="file-source">
        Tải file Excel TKB tại{' '}
        <a
          href="https://eshust.hust.edu.vn"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          EsHUST
        </a>
      </p>
    </div>
  );
}
