import React, { memo, useState } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from 'reactflow';

export type GroupNodeProps = {
  data: {
    onFileDrop: (file: File, parentNodeId: string) => void;
    setNodes?: any;
    name?: string;
  };
  id: string;
};

const GroupNode = ({ id, data }: GroupNodeProps) => {
  const { getNodes, setNodes, setEdges } = useReactFlow();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState<string>(data?.name || '');

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf' && data.onFileDrop) {
        data.onFileDrop(file, id);
      }
      event.dataTransfer.clearData();
    }
  };

  const handleArrange = async () => {
    // Debug logs
    console.log('Arrange button clicked');
    console.log('Group ID:', id);
    
    setIsLoading(true);
    try {
      const allNodes = getNodes();
      console.log('All nodes count:', allNodes.length);
      
      // Filter nodes that are strictly inside this group
      // A node is inside if its parentNode is this group's id
      const childNodes = allNodes.filter((n: any) => n.parentNode === id);
      console.log('Child nodes found:', childNodes.length, childNodes);
      
      if (childNodes.length === 0) {
        alert('Ce groupe est vide (aucun nœud avec parentNode = ' + id + ')');
        setIsLoading(false);
        return;
      }

      // Ensure nodes have label/text for classification
      const validNodes = childNodes.filter((n: any) => 
        n.data?.label || n.data?.text || n.data?.content
      ).map((n: any) => ({
        ...n,
        data: {
          ...n.data,
          // Normalize label for the API
          label: n.data.label || n.data.text || n.data.content || ''
        }
      }));
      
      if (validNodes.length < 2) {
        alert('Il faut au moins 2 nœuds avec du texte pour réorganiser.');
        setIsLoading(false);
        return;
      }
      
      console.log('Sending to API:', validNodes.length, 'nodes');

      const response = await fetch('/api/arrange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: validNodes })
      });
      
      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error('API Error:', errText);
        throw new Error('Failed to arrange nodes: ' + errText);
      }
      
      const result = await response.json();
      console.log('API Result:', result);
      const { positions, edges: newEdges } = result;
      
      if (!positions || positions.length === 0) {
        console.warn('No positions returned from API');
      }

      // Update nodes with new positions relative to the group
      if (setNodes) {
        setNodes((nds: any[]) => {
          // Create a map of new positions
          const posMap = new Map(positions.map((p: any) => [p.id, p.position]));
          
          return nds.map(n => {
            if (posMap.has(n.id)) {
              console.log(`Updating node ${n.id} to`, posMap.get(n.id));
              return { ...n, position: posMap.get(n.id) };
            }
            return n;
          });
        });
      }
      
      // Add new edges
      if (setEdges && newEdges && newEdges.length > 0) {
        console.log('Adding edges:', newEdges.length);
        setEdges((eds: any[]) => {
          // Avoid duplicates?
          const existingIds = new Set(eds.map(e => e.id));
          const uniqueNewEdges = newEdges.filter((e: any) => !existingIds.has(e.id));
          return [...eds, ...uniqueNewEdges];
        });
      }
      
    } catch (error) {
      console.error('Arrangement failed:', error);
      alert('Erreur lors du réarrangement (voir console)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NodeResizer minWidth={100} minHeight={50} />
      <div
        className="group"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `3px dashed ${isDragOver ? '#3182ce' : '#000'}`,
          borderRadius: '0px',
          width: '100%',
          height: '100%',
          backgroundColor: isDragOver
            ? 'rgba(49, 130, 206, 0.1)'
            : 'rgba(0,0,0,0.05)',
          transition: 'border-color 0.2s, background-color 0.2s',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <button
          onClick={handleArrange}
          disabled={isLoading}
          style={{
            position: 'absolute',
            top: -40,
            right: 0,
            padding: '4px 8px',
            background: '#000',
            color: '#fff',
            border: 'none',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: 0.8,
            zIndex: 10
          }}
        >
          {isLoading ? '...' : 'ARRANGE'}
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (data.setNodes) {
              const trimmed = (name || '').trim();
              data.setNodes((nds: any[]) =>
                nds.map((n: any) =>
                  n.id === id ? { ...n, data: { ...n.data, name: trimmed } } : n
                )
              );
            }
          }}
          placeholder="Nom du groupe"
          style={{
            position: 'absolute',
            top: -56,
            left: '0',
            padding: '8px 16px',
            borderRadius: 0,
            background: '#fff',
            fontSize: 24,
            fontWeight: 900,
            maxWidth: '100%',
            textAlign: 'left',
            outline: 'none',
            border: '3px solid #000',
            boxShadow: '4px 4px 0px 0px #000',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
          }}
        />
        {isDragOver && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#3182ce',
              fontWeight: 'bold',
            }}
          >
            Drop PDF here
          </div>
        )}
      </div>
    </>
  );
};

export default memo(GroupNode);