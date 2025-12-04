import { Node, Edge, Position } from 'reactflow';

export type LayoutType = 'grid' | 'radial' | 'hierarchy' | 'organic';

export interface LayoutOptions {
  spacing: number;
  direction?: 'TB' | 'LR'; // For hierarchy
  sortBy?: 'type' | 'name' | 'date';
}

interface NodeDimensions {
  width: number;
  height: number;
}

const DEFAULT_WIDTH = 220;
const DEFAULT_HEIGHT = 200;

const getNodeDimensions = (node: Node): NodeDimensions => {
  return {
    width: (node.style?.width as number) || node.width || DEFAULT_WIDTH,
    height: (node.style?.height as number) || node.height || DEFAULT_HEIGHT,
  };
};

/**
 * Semantic Layout Engine
 * Rearranges nodes based on semantic rules and topology.
 */
export class SemanticLayoutEngine {
  /**
   * Main entry point to calculate new positions.
   * Returns an array of nodes with updated positions.
   */
  static calculateLayout(
    nodes: Node[],
    edges: Edge[],
    type: LayoutType,
    options: LayoutOptions
  ): Node[] {
    // Filter nodes to only include those we want to rearrange (e.g., siblings)
    // This function assumes 'nodes' passed in are the ones to be rearranged.
    // If they are children of a group, they should be passed as such.

    if (nodes.length === 0) return [];

    const clonedNodes = nodes.map((n) => ({ ...n, position: { ...n.position } }));

    switch (type) {
      case 'grid':
        return this.gridLayout(clonedNodes, options);
      case 'radial':
        return this.radialLayout(clonedNodes, edges, options);
      case 'hierarchy':
        return this.hierarchyLayout(clonedNodes, edges, options);
      case 'organic':
        return this.organicLayout(clonedNodes, edges, options);
      default:
        return clonedNodes;
    }
  }

  /**
   * Grid Layout: Uses a "Masonry" packing algorithm to create a compact "Bento-style" grid.
   * Semantic aspect: Nodes of the same type are kept together.
   */
  private static gridLayout(nodes: Node[], options: LayoutOptions): Node[] {
    const { spacing } = options;
    const nodesByType: Record<string, Node[]> = {};

    let totalArea = 0;
    // Group by type and calc area
    nodes.forEach((node) => {
      const type = node.type || 'default';
      if (!nodesByType[type]) nodesByType[type] = [];
      nodesByType[type].push(node);
      const dim = getNodeDimensions(node);
      totalArea += (dim.width + spacing) * (dim.height + spacing);
    });

    // Ideal container width (target roughly square or 4:3 ratio)
    const idealContainerWidth = Math.sqrt(totalArea) * 1.5; // 1.5 factor for landscape bias
    const minColWidth = 250; // Minimum column width
    
    // Calculate number of columns based on ideal width
    const numCols = Math.max(1, Math.floor(idealContainerWidth / minColWidth));
    const colWidth = Math.max(minColWidth, idealContainerWidth / numCols);

    const types = Object.keys(nodesByType).sort();
    let currentYOffset = 0;

    types.forEach((type) => {
      const typeNodes = nodesByType[type];
      // Sort nodes within type (largest first usually packs better)
      typeNodes.sort((a, b) => {
        const dimA = getNodeDimensions(a);
        const dimB = getNodeDimensions(b);
        // Sort by height descending for better packing, or name if preferred
        return (dimB.height - dimA.height) || (a.data?.label || '').localeCompare(b.data?.label || '');
      });

      // Initialize columns for this section
      const columnHeights = new Array(numCols).fill(currentYOffset);

      typeNodes.forEach((node) => {
        const dim = getNodeDimensions(node);
        
        // Find the shortest column
        let minColIndex = 0;
        for (let i = 1; i < numCols; i++) {
          if (columnHeights[i] < columnHeights[minColIndex]) {
            minColIndex = i;
          }
        }

        // Place node in the shortest column
        node.position = {
          x: minColIndex * (colWidth + spacing),
          y: columnHeights[minColIndex]
        };

        // Update column height
        columnHeights[minColIndex] += dim.height + spacing;
      });

      // Update global Y offset for next section (start after the tallest column of this section)
      currentYOffset = Math.max(...columnHeights) + spacing * 2;
    });

    return nodes.flat();
  }

  /**
   * Radial Layout: Places central node in middle, others in concentric rings (shells).
   * Semantic aspect: Centrality based on connections.
   */
  private static radialLayout(nodes: Node[], edges: Edge[], options: LayoutOptions): Node[] {
    const { spacing } = options;
    if (nodes.length === 0) return [];

    // 1. Calculate degree of each node
    const degrees = new Map<string, number>();
    nodes.forEach(n => degrees.set(n.id, 0));
    
    edges.forEach(e => {
      if (degrees.has(e.source)) degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
      if (degrees.has(e.target)) degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
    });

    // 2. Sort by degree (descending)
    const sortedNodes = [...nodes].sort((a, b) => (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0));
    
    // Center is the most connected
    const centerNode = sortedNodes[0];
    centerNode.position = { x: 0, y: 0 };
    
    const otherNodes = sortedNodes.slice(1);
    if (otherNodes.length === 0) return [centerNode];

    // 3. Distribute in Concentric Rings (Shells)
    // We place more nodes in outer rings.
    // Ring capacity roughly increases with circumference (2*pi*r).
    
    let currentRing = 1;
    let nodesInCurrentRing = 0;
    let nodesPlaced = 0;
    const baseRadius = Math.max(300, DEFAULT_WIDTH + spacing);

    // Heuristic: Ring capacity ~ currentRing * 6 (hexagonal packing idea) or similar
    // Or simply fill based on circumference.
    
    let ringNodes: Node[] = [];
    
    // We iterate and fill rings
    while (nodesPlaced < otherNodes.length) {
        // Determine capacity of current ring
        // Circumference = 2 * PI * (currentRing * baseRadius)
        // Item width approx = DEFAULT_WIDTH + spacing
        // Capacity = Circumference / ItemWidth
        const radius = currentRing * baseRadius;
        const circumference = 2 * Math.PI * radius;
        const capacity = Math.floor(circumference / (DEFAULT_WIDTH + spacing));
        
        const count = Math.min(capacity, otherNodes.length - nodesPlaced);
        const batch = otherNodes.slice(nodesPlaced, nodesPlaced + count);
        
        const angleStep = (2 * Math.PI) / count;
        
        batch.forEach((node, idx) => {
            const angle = idx * angleStep;
            node.position = {
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            };
        });
        
        nodesPlaced += count;
        currentRing++;
    }

    return nodes;
  }

  /**
   * Hierarchy Layout: Simple Tree layout.
   * Semantic aspect: Parent-Child relationships.
   */
  private static hierarchyLayout(nodes: Node[], edges: Edge[], options: LayoutOptions): Node[] {
    const { spacing } = options;
    
    // Build adjacency list
    const childrenMap = new Map<string, string[]>();
    const parentsMap = new Map<string, string[]>();
    
    nodes.forEach(n => {
      childrenMap.set(n.id, []);
      parentsMap.set(n.id, []);
    });

    edges.forEach(e => {
      // Only consider edges where both source and target are in the group
      if (childrenMap.has(e.source) && childrenMap.has(e.target)) {
        childrenMap.get(e.source)?.push(e.target);
        parentsMap.get(e.target)?.push(e.source);
      }
    });

    // Find roots (nodes with no incoming edges from within this set)
    const roots = nodes.filter(n => (parentsMap.get(n.id)?.length || 0) === 0);
    
    // If no roots (cycles), pick the first one
    const actualRoots = roots.length > 0 ? roots : [nodes[0]];

    // Level-based assignment (BFS)
    const levels: Map<string, number> = new Map();
    const queue: {id: string, level: number}[] = actualRoots.map(r => ({ id: r.id, level: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      levels.set(id, level);

      const children = childrenMap.get(id) || [];
      children.forEach(childId => {
        queue.push({ id: childId, level: level + 1 });
      });
    }

    // Assign positions based on levels
    const nodesByLevel: Map<number, Node[]> = new Map();
    nodes.forEach(n => {
      const level = levels.get(n.id) ?? 0;
      if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
      nodesByLevel.get(level)?.push(n);
    });

    let currentY = 0;
    const maxLevel = Math.max(...Array.from(nodesByLevel.keys()), 0);
    
    // Helper to calculate ideal width based on nodes count to ensure a square-ish aspect ratio
    const getIdealLevelWidth = (nodesInLevel: Node[]) => {
        let totalArea = 0;
        nodesInLevel.forEach(n => {
            const dim = getNodeDimensions(n);
            totalArea += (dim.width + spacing) * (dim.height + spacing);
        });
        // Try to make it a golden rectangle (width ~ 1.6 * height)
        // width * (width/1.6) = totalArea => width^2 = 1.6 * totalArea
        return Math.max(800, Math.sqrt(totalArea * 1.6));
    };

    for (let level = 0; level <= maxLevel; level++) {
      const levelNodes = nodesByLevel.get(level) || [];
      if (levelNodes.length === 0) continue;

      // Sort nodes by label for consistency
      levelNodes.sort((a, b) => (a.data?.label || '').localeCompare(b.data?.label || ''));

      let currentX = 0;
      let rowMaxHeight = 0;
      let levelStartY = currentY;
      
      // Dynamic max width for this specific level
      const maxLevelWidth = getIdealLevelWidth(levelNodes);

      let rows: Node[][] = [[]];
      let currentRowWidth = 0;

      levelNodes.forEach(n => {
        const dim = getNodeDimensions(n);
        if (currentRowWidth + dim.width > maxLevelWidth && rows[rows.length - 1].length > 0) {
            // New row
            rows.push([]);
            currentRowWidth = 0;
        }
        rows[rows.length - 1].push(n);
        currentRowWidth += dim.width + spacing;
      });

      // Layout rows
      rows.forEach((rowNodes) => {
          const rowWidth = rowNodes.reduce((acc, n) => acc + getNodeDimensions(n).width + spacing, 0) - spacing;
          currentX = -rowWidth / 2;
          let maxH = 0;

          rowNodes.forEach(n => {
            const dim = getNodeDimensions(n);
            n.position = { x: currentX, y: currentY };
            currentX += dim.width + spacing;
            maxH = Math.max(maxH, dim.height);
          });
          
          currentY += maxH + spacing;
      });

      // Add extra spacing between levels
      currentY += 50;
    }

    // Handle disconnected nodes (islands)
    const connectedIds = new Set(Array.from(levels.keys()));
    const disconnected = nodes.filter(n => !connectedIds.has(n.id));
    
    if (disconnected.length > 0) {
        // Place them below
        let islandX = 0;
        currentY += 100;
        disconnected.forEach(n => {
             const dim = getNodeDimensions(n);
             n.position = { x: islandX, y: currentY };
             islandX += dim.width + spacing;
        });
    }

    return nodes;
  }

  /**
   * Organic Layout: Pseudo-force-directed (simplified).
   * Semantic aspect: Clustered by connections.
   */
  private static organicLayout(nodes: Node[], edges: Edge[], options: LayoutOptions): Node[] {
    // A simple implementation of a force-directed layout simulation
    // Since we don't want to run a simulation loop in the renderer for too long,
    // we'll run a fixed number of iterations here.
    
    const iterations = 200; // Increased for convergence
    const { spacing } = options;
    
    // Tuning constants
    // k is the optimal distance between connected nodes
    const k = spacing + 100; 
    
    // Gravity (Attraction to center)
    const gravity = 0.05;

    // Initialize positions randomly if they are at 0,0 (or keep existing to preserve stability)
    // If all nodes are at 0,0, spread them out initially to avoid singularity
    const allAtZero = nodes.every(n => n.position.x === 0 && n.position.y === 0);
    
    const tempNodes = nodes.map((n, idx) => ({
        id: n.id,
        x: allAtZero ? Math.cos(idx) * idx * 10 : n.position.x,
        y: allAtZero ? Math.sin(idx) * idx * 10 : n.position.y,
        vx: 0,
        vy: 0,
        width: getNodeDimensions(n).width,
        height: getNodeDimensions(n).height
    }));
    
    // Center force to keep them together
    const cx = 0;
    const cy = 0;

    for (let i = 0; i < iterations; i++) {
        // 1. Repulsion (Coulomb's law)
        // Applied between ALL pairs of nodes to spread them out
        for (let a = 0; a < tempNodes.length; a++) {
            for (let b = a + 1; b < tempNodes.length; b++) {
                const u = tempNodes[a];
                const v = tempNodes[b];
                const dx = u.x - v.x;
                const dy = u.y - v.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq) || 1; // Avoid division by zero
                
                // Repulsive force proportional to 1/dist
                // Factor adjusted for better spread
                const repulsiveForce = (k * k) / dist;
                
                const fx = (dx / dist) * repulsiveForce;
                const fy = (dy / dist) * repulsiveForce;

                u.vx += fx;
                u.vy += fy;
                v.vx -= fx;
                v.vy -= fy;
            }
        }

        // 2. Attraction (Hooke's law)
        // Applied only between CONNECTED nodes (edges)
        edges.forEach(e => {
            const u = tempNodes.find(n => n.id === e.source);
            const v = tempNodes.find(n => n.id === e.target);
            
            // Only apply if both nodes are in the current layout set
            if (u && v) {
                const dx = u.x - v.x;
                const dy = u.y - v.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq) || 1;

                // Attractive force proportional to dist
                // (dist^2 / k)
                const attractiveForce = (dist * dist) / k;
                
                const fx = (dx / dist) * attractiveForce;
                const fy = (dy / dist) * attractiveForce;

                u.vx -= fx;
                u.vy -= fy;
                v.vx += fx;
                v.vy += fy;
            }
        });
        
        // 3. Gravity (Center force)
        // Pulls everything slightly towards (0,0) to prevent drifting too far
        tempNodes.forEach(n => {
            const dx = cx - n.x;
            const dy = cy - n.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            
            const f = gravity * dist; 
            n.vx += (dx/dist) * f;
            n.vy += (dy/dist) * f;
        });

        // 4. Collision Avoidance (Simple overlap removal)
        // Very important for visual clarity
        for (let a = 0; a < tempNodes.length; a++) {
            for (let b = a + 1; b < tempNodes.length; b++) {
                const u = tempNodes[a];
                const v = tempNodes[b];
                
                const dx = u.x - v.x;
                const dy = u.y - v.y;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                
                // Minimum distance required to not overlap
                // We use a circle approximation for simplicity (radius = max(w, h)/2)
                const r1 = Math.max(u.width, u.height) / 2;
                const r2 = Math.max(v.width, v.height) / 2;
                const minDist = r1 + r2 + spacing;

                if (dist < minDist) {
                    // Overlap detected, push apart forcefully
                    const overlap = minDist - dist;
                    const fx = (dx / dist) * overlap * 0.5; // Share the move
                    const fy = (dy / dist) * overlap * 0.5;
                    
                    // Move directly (position adjustment, not force) for stability
                    u.x += fx;
                    u.y += fy;
                    v.x -= fx;
                    v.y -= fy;
                }
            }
        }

        // 5. Apply Velocity & Temperature/Dampening
        // Reduce temperature over time to stabilize
        const temperature = (1 - i / iterations); // 1.0 -> 0.0
        
        tempNodes.forEach(n => {
            // Cap max velocity
            const vMag = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (vMag > 100) {
                n.vx = (n.vx / vMag) * 100;
                n.vy = (n.vy / vMag) * 100;
            }

            // Apply dampening
            n.vx *= 0.1; // High friction
            n.vy *= 0.1;
            
            // Update position with temperature factor
            // Note: In standard Fruchterman-Reingold, we limit displacement by temp
            // Here we just scale velocity for simplicity
            n.x += n.vx * temperature;
            n.y += n.vy * temperature;
        });
    }

    // Update original nodes
    tempNodes.forEach((tn, i) => {
        nodes[i].position = { x: tn.x, y: tn.y };
    });

    return nodes;
  }
}
