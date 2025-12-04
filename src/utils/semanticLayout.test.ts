import { SemanticLayoutEngine, LayoutType } from './semanticLayout';
import { Node, Edge } from 'reactflow';

const createNode = (id: string, type: string, x: number, y: number, width?: number, height?: number): Node => ({
  id,
  type,
  position: { x, y },
  data: { label: id },
  width: width || 100,
  height: height || 50,
  style: { width: width || 100, height: height || 50 },
});

const createEdge = (source: string, target: string): Edge => ({
  id: `e${source}-${target}`,
  source,
  target,
});

describe('SemanticLayoutEngine', () => {
  const nodes: Node[] = [
    createNode('1', 'text', 0, 0),
    createNode('2', 'image', 0, 0),
    createNode('3', 'text', 0, 0),
    createNode('4', 'image', 0, 0),
    createNode('5', 'group', 0, 0),
  ];

  const edges: Edge[] = [
    createEdge('1', '2'),
    createEdge('2', '3'),
  ];

  test('Grid layout should organize by type', () => {
    const result = SemanticLayoutEngine.calculateLayout(nodes, edges, 'grid', { spacing: 20 });
    expect(result).toHaveLength(5);
    // Basic check: positions should be different than 0,0 for most
    const nonZero = result.filter(n => n.position.x !== 0 || n.position.y !== 0);
    expect(nonZero.length).toBeGreaterThan(0);
  });

  test('Radial layout should place center node at 0,0', () => {
    // Node 2 has 2 connections, others have 1 or 0. Node 2 should be center.
    const result = SemanticLayoutEngine.calculateLayout(nodes, edges, 'radial', { spacing: 20 });
    const node2 = result.find(n => n.id === '2');
    expect(node2?.position.x).toBe(0);
    expect(node2?.position.y).toBe(0);
    
    const node1 = result.find(n => n.id === '1');
    expect(node1?.position.x).not.toBe(0); // Should be in orbit
  });

  test('Hierarchy layout should respect levels', () => {
    // 1 -> 2 -> 3
    // Level 0: 1
    // Level 1: 2
    // Level 2: 3
    const result = SemanticLayoutEngine.calculateLayout(nodes, edges, 'hierarchy', { spacing: 20 });
    const n1 = result.find(n => n.id === '1');
    const n2 = result.find(n => n.id === '2');
    const n3 = result.find(n => n.id === '3');

    // Check Y positions (assuming TB layout)
    expect(n2!.position.y).toBeGreaterThan(n1!.position.y);
    expect(n3!.position.y).toBeGreaterThan(n2!.position.y);
  });

  test('Organic layout should move nodes', () => {
    const result = SemanticLayoutEngine.calculateLayout(nodes, edges, 'organic', { spacing: 20 });
    expect(result).toHaveLength(5);
    // Hard to test deterministic positions, but they should change from initial 0,0
    const moved = result.some(n => n.position.x !== 0 || n.position.y !== 0);
    expect(moved).toBe(true);
  });
});
