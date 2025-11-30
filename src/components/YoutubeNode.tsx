import React, { memo } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { Youtube, Search } from 'lucide-react';

export const YoutubeNode = memo(({ id, data }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/youtube/search?query=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      
      if (result.videoId) {
        setNodes((nodes: any[]) =>
          nodes.map((n) =>
            n.id === id
              ? { ...n, data: { ...n.data, videoId: result.videoId, title: result.title } }
              : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to search YouTube:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <NodeResizer minWidth={200} minHeight={150} />
      <Handle type="target" position={Position.Left} />
      
      {data.videoId ? (
        <>
          <div className="drag-handle" style={{ 
            height: '20px', 
            background: '#f0f0f0', 
            width: '100%', 
            cursor: 'move', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Youtube size={12} color="red" />
          </div>
          <div style={{ flex: 1, width: '100%', position: 'relative' }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${data.videoId}`}
              title={data.title || "YouTube video player"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </>
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '10px'
        }}>
          <Youtube size={32} style={{ color: '#ff0000', marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '4px', width: '90%' }}>
            <input
              type="text"
              placeholder="Search YouTube..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              style={{
                padding: '4px 8px',
                background: '#ff0000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Search size={14} />
            </button>
          </div>
        </div>
      )}
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
