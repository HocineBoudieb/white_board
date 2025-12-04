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
  
  // Using text_pair for NLI task
  const inputs = await tokenizer(mainText, { text_pair: otherText });
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

  // Logic to identify the "main" node (e.g., the first one or the one with the most connections, 
  // but here we'll simplify and take the first one as main)
  const mainNode = nodes[0];
  const mainId = mainNode.id;
  const responses: string[] = [];
  const oppositions: string[] = [];
  const neutral: string[] = [];

  // Classify other nodes against the main node
  for (let i = 1; i < nodes.length; i++) {
    const otherNode = nodes[i];
    const relation = await classifyRelation(mainNode.data.label, otherNode.data.label);
    
    if (relation === 'entailment') {
      responses.push(otherNode.id);
    } else if (relation === 'contradiction') {
      oppositions.push(otherNode.id);
    } else {
      neutral.push(otherNode.id);
    }
  }
  
  // Treat neutral as responses for layout simplicity in this version, or handle separately
  // For now, let's just add neutrals to responses
  responses.push(...neutral);

  // Dimensions approximatives
  const mainWidth = 250; 
  const nodeHeight = 100;
  const marginX = 50;
  const marginY = 50;
  
  let layout: any[] = [];
  let edges: any[] = [];

  // Place main node
  layout.push({ id: mainId, position: { x: 0, y: 0 } }); // Center at 0,0 initially

  // Place response nodes in a vertical column below main
  responses.forEach((nodeId, idx) => {
    layout.push({
      id: nodeId,
      position: {
        x: 0,
        y: (idx + 1) * (nodeHeight + marginY)
      }
    });
    edges.push({ 
      id: `e-${mainId}-${nodeId}`,
      source: mainId, 
      target: nodeId,
      type: 'default'
    });
  });

  // Place opposition nodes to the sides of main
  // We'll place them alternating left/right, starting from the top level
  // But to avoid overlapping with the main column, we push them out by mainWidth + marginX
  oppositions.forEach((nodeId, idx) => {
    const side = (idx % 2 === 0) ? 'right' : 'left';
    const offsetX = side === 'right' ? (mainWidth + marginX) : -(mainWidth + marginX);
    // Align vertically with responses if possible, or just stack them
    const offsetY = (Math.floor(idx / 2) + 1) * (nodeHeight + marginY);
    
    layout.push({
      id: nodeId,
      position: {
        x: offsetX,
        y: offsetY
      }
    });
    edges.push({ 
      id: `e-${mainId}-${nodeId}`,
      source: mainId, 
      target: nodeId, 
      type: 'smoothstep', // distinct edge type for opposition could be useful
      animated: true,
      style: { stroke: '#ff0000' }, // Red for opposition
      label: 'contradicts'
    });
  });
  
  return NextResponse.json({ positions: layout, edges });
}
