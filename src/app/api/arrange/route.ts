import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSubscriptionPlan } from '@/utils/subscription';
import { AutoTokenizer, AutoModelForSequenceClassification, env } from '@xenova/transformers';
import { getUid } from '@/lib/auth';

// Configure cache location to avoid re-downloading models in dev
env.cacheDir = './.cache';

// Singleton pattern for model and tokenizer
let tokenizerInstance: any = null;
let modelInstance: any = null;

async function getModelAndTokenizer() {
  if (!tokenizerInstance || !modelInstance) {
    // Utilisation du modèle converti pour Transformers.js (Xenova)
    const modelName = "Xenova/distilbert-base-uncased-mnli";
    tokenizerInstance = await AutoTokenizer.from_pretrained(modelName);
    modelInstance = await AutoModelForSequenceClassification.from_pretrained(modelName);
  }
  return { tokenizer: tokenizerInstance, model: modelInstance };
}

async function classifyRelation(mainText: string, otherText: string) {
  const { tokenizer, model } = await getModelAndTokenizer();
  
  // Using text_pair for NLI task with truncation to avoid "BroadcastIterator" errors
  // if input length > model max length (typically 512 for BERT)
  const inputs = await tokenizer(mainText, { 
    text_pair: otherText,
    padding: true,
    truncation: true,
    max_length: 512
  });
  const { logits } = await model(inputs);
  
  // Logits to probabilities (Softmax)
  // This is a simplified softmax for 3 classes (contradiction, entailment, neutral)
  // We can just look at the logits directly to find the max
  // Labels for mnli: 0: contradiction, 1: neutral, 2: entailment (usually, check model config)
  // But for typeform/distilbert-base-uncased-mnli, it might be different.
  // Usually: 0: entailment, 1: neutral, 2: contradiction ?
  // Let's assume standard MNLI: 0: entailment, 1: neutral, 2: contradiction or similar.
  // Actually, let's just return the raw logits or the predicted label index for now.
  
  // Find max logit index
  let maxIndex = 0;
  let maxVal = logits.data[0];
  for (let i = 1; i < logits.data.length; i++) {
    if (logits.data[i] > maxVal) {
      maxVal = logits.data[i];
      maxIndex = i;
    }
  }
  
  // Map index to label (standard MNLI mapping usually)
  // id2label: {0: "entailment", 1: "neutral", 2: "contradiction"}
  const labels = ["entailment", "neutral", "contradiction"];
  return labels[maxIndex];
}

export async function POST(req: Request) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  
  const plan = getUserSubscriptionPlan(user);
  if (plan.aiTokens === 0 || user.aiTokensUsed >= plan.aiTokens) {
    return NextResponse.json({ error: 'Plan AI épuisé' }, { status: 403 });
  }

  const { nodes } = await req.json();

  if (!nodes || nodes.length === 0) {
    return NextResponse.json({ positions: [], edges: [] });
  }

  // Helper to get node dimensions (defaulting if missing)
  const getNodeSize = (n: any) => {
    // ReactFlow nodes might have width/height in style, or measured property, or directly on node
    // We need to be flexible.
    const w = n.measured?.width || n.width || parseFloat(n.style?.width) || 250;
    const h = n.measured?.height || n.height || parseFloat(n.style?.height) || 100;
    return { width: w, height: h };
  };

  // Logic to identify the "main" node (first one)
  const mainNode = nodes[0];
  const mainId = mainNode.id;
  const mainSize = getNodeSize(mainNode);
  
  const responses: any[] = [];
  const oppositions: any[] = [];
  const neutral: any[] = [];

  // Classify other nodes against the main node
  for (let i = 1; i < nodes.length; i++) {
    const otherNode = nodes[i];
    const relation = await classifyRelation(mainNode.data.label, otherNode.data.label);
    
    if (relation === 'entailment') {
      responses.push(otherNode);
    } else if (relation === 'contradiction') {
      oppositions.push(otherNode);
    } else {
      neutral.push(otherNode);
    }
  }
  
  // Treat neutral as responses for layout simplicity
  responses.push(...neutral);

  const marginX = 50;
  const marginY = 50;
  
  let layout: any[] = [];
  let edges: any[] = [];

  // Layout strategy:
  // 1. Main node at top center (relative to group 0,0, we'll shift later)
  // 2. Responses in a column below Main.
  // 3. Oppositions on sides (alternating Left/Right), aligned vertically.
  
  // We need to track the bounding box of the central column to place oppositions correctly.
  // But oppositions also have width.
  
  // Let's build the central column first.
  // Start Main at (0, 0) - we will shift everything by padding later.
  let currentY = 0;
  
  // Place Main
  layout.push({ id: mainId, position: { x: 0, y: currentY } }); // Center X later? No, let's say Main center is X=0.
  // Actually, it's easier if we use top-left coordinates.
  // Let's assume X=0 is the left edge of the central column? No, center is better.
  // Let's stick to: X=0 is the center line.
  // So Main X = -mainWidth/2
  
  layout[0].position.x = -mainSize.width / 2;
  currentY += mainSize.height + marginY;
  
  // Place Responses
  // We need to know the max width of the central column to place side nodes safely.
  let maxCentralWidth = mainSize.width;
  
  responses.forEach((node) => {
    const size = getNodeSize(node);
    // Center this node at X=0
    const x = -size.width / 2;
    const y = currentY;
    
    layout.push({
      id: node.id,
      position: { x, y }
    });
    
    edges.push({ 
      id: `e-${mainId}-${node.id}`,
      source: mainId, 
      target: node.id,
      type: 'default'
    });
    
    if (size.width > maxCentralWidth) maxCentralWidth = size.width;
    currentY += size.height + marginY;
  });
  
  // Central column done. Bounding box of central column:
  // X range: [-maxCentralWidth/2, maxCentralWidth/2]
  // Y range: [0, currentY - marginY]
  
  // Place Oppositions
  // We'll place them starting from the top (below main? or aligned with main?).
  // Let's align them starting from the first response level (or main level).
  // Let's start from main level.
  
  let leftY = 0;
  let rightY = 0;
  const sideMargin = 100; // Extra margin between columns
  
  oppositions.forEach((node, idx) => {
    const size = getNodeSize(node);
    const side = (idx % 2 === 0) ? 'right' : 'left';
    
    let x, y;
    if (side === 'right') {
      x = (maxCentralWidth / 2) + sideMargin;
      y = rightY;
      rightY += size.height + marginY;
    } else {
      x = -(maxCentralWidth / 2) - sideMargin - size.width;
      y = leftY;
      leftY += size.height + marginY;
    }
    
    layout.push({
      id: node.id,
      position: { x, y }
    });
    
    edges.push({ 
      id: `e-${mainId}-${node.id}`,
      source: mainId, 
      target: node.id, 
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#ff0000' },
      label: 'contradicts'
    });
  });
  
  // Calculate final Bounding Box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  layout.forEach(item => {
    // We need dimensions again to find bottom-right
    const node = nodes.find((n: any) => n.id === item.id);
    const size = getNodeSize(node);
    
    if (item.position.x < minX) minX = item.position.x;
    if (item.position.y < minY) minY = item.position.y;
    if (item.position.x + size.width > maxX) maxX = item.position.x + size.width;
    if (item.position.y + size.height > maxY) maxY = item.position.y + size.height;
  });
  
  // Add padding for the group container
  const padding = 40;
  
  // Shift all nodes so that (minX, minY) becomes (padding, padding)
  // The new Top-Left of the content will be at (padding, padding) inside the group
  
  const finalLayout = layout.map(item => ({
    id: item.id,
    position: {
      x: item.position.x - minX + padding,
      y: item.position.y - minY + padding
    }
  }));
  
  const groupWidth = (maxX - minX) + (padding * 2);
  const groupHeight = (maxY - minY) + (padding * 2);
  
  return NextResponse.json({ 
    positions: finalLayout, 
    edges,
    groupSize: { width: groupWidth, height: groupHeight }
  });
}
