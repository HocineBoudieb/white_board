import React, { memo } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';
import { Handle, Position } from 'reactflow';

export interface FileNodeData {
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'indexing' | 'ready' | 'error';
  progress: number;
  chunks?: number;
  embeddings?: Float32Array[];
  textChunks?: string[];
  error?: string;
}

const FileNode = ({ data }: { data: FileNodeData }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'uploading': return '#3182ce';
      case 'indexing': return '#f59e0b';
      case 'ready': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case 'uploading': return 'Uploading...';
      case 'indexing': return 'Indexing...';
      case 'ready': return 'Ready';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <NodeResizer minWidth={200} minHeight={100} />
      <Handle type="target" position={Position.Left} />
      <div
        style={{
          padding: 16,
          border: '2px solid ' + getStatusColor(),
          borderRadius: 8,
          background: '#fff',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 24 }}>📄</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 600, 
              fontSize: 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {data.fileName}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              {formatFileSize(data.fileSize)}
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4 
          }}>
            <span style={{ 
              fontSize: 12, 
              fontWeight: 500,
              color: getStatusColor()
            }}>
              {getStatusText()}
            </span>
            {(data.status === 'uploading' || data.status === 'indexing') && (
              <span style={{ fontSize: 11, color: '#6b7280' }}>
                {Math.round(data.progress)}%
              </span>
            )}
          </div>
          
          {/* Progress bar */}
          {(data.status === 'uploading' || data.status === 'indexing') && (
            <div style={{ 
              width: '100%', 
              height: 6, 
              background: '#e5e7eb', 
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div
                style={{
                  width: `${data.progress}%`,
                  height: '100%',
                  background: getStatusColor(),
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        {data.status === 'ready' && data.chunks && (
          <div style={{ 
            padding: 8,
            background: '#f0fdf4',
            borderRadius: 4,
            display: 'flex',
            justifyContent: 'space-around',
            gap: 8
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                {data.chunks}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>chunks</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                {data.embeddings?.length || 0}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>vectors</div>
            </div>
          </div>
        )}

        {/* Error */}
        {data.status === 'error' && data.error && (
          <div style={{ 
            padding: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 4,
            fontSize: 11,
            color: '#991b1b'
          }}>
            {data.error}
          </div>
        )}

        {/* Icon indicator */}
        <div style={{ 
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#6b7280'
        }}>
          <span>🔍</span>
          <span>Vector DB</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};

export default memo(FileNode);