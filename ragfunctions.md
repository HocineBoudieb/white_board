# 🔧 Guide d'intégration RAG - Étapes détaillées

## 📦 Étape 1 : Installation des dépendances

```bash
npm install @xenova/transformers
```

## 📁 Étape 2 : Créer les nouveaux fichiers

### 2.1 Créer `src/components/FileNode.tsx`
Copier le contenu de l'artifact "FileNode Component"

### 2.2 Créer `src/utils/pdfIndexer.ts`
Copier le contenu de l'artifact "PDF Indexer Utility"

## 🔄 Étape 3 : Modifier `src/components/Whiteboard.tsx`

### 3.1 Ajouter les imports
En haut du fichier, après les imports existants :
```typescript
import FileNode from './FileNode';
import { indexPDF, searchChunks, Chunk } from '@/utils/pdfIndexer';
```

### 3.2 Ajouter FileNode aux nodeTypes
Dans l'objet `nodeTypes` :
```typescript
const nodeTypes = {
  text: AiNode,
  group: GroupNode,
  markdown: MarkdownNode,
  image: ImageNode,
  todo: TodoNode,
  drawing: DrawingNode,
  mermaid: MermaidNode,
  flashcard: FlashcardNode,
  quiz: QuizNode,
  timeline: TimelineNode,
  definition: DefinitionCardNode,
  formula: FormulaNode,
  comparison: ComparisonTableNode,
  progress: ProgressTrackerNode,
  file: FileNode, // ← AJOUTER CETTE LIGNE
};
```

### 3.3 Ajouter un state pour le drag over
Dans le composant, après les autres useState :
```typescript
const [draggedOverGroup, setDraggedOverGroup] = useState<string | null>(null);
```

### 3.4 Ajouter les handlers de drag & drop
Après `onConnect`, ajouter :

```typescript
// Gérer le drag & drop de fichiers
const onDragOver = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';

  const position = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });

  const groupNode = getNodes().find(
    (node) =>
      node.type === 'group' &&
      position.x >= node.position.x &&
      position.x <= node.position.x + (node.width || 0) &&
      position.y >= node.position.y &&
      position.y <= node.position.y + (node.height || 0)
  );

  setDraggedOverGroup(groupNode ? groupNode.id : null);
}, [screenToFlowPosition, getNodes]);

const onDrop = useCallback(
  async (event: React.DragEvent) => {
    event.preventDefault();
    setDraggedOverGroup(null);

    const files = Array.from(event.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      alert('Veuillez déposer un fichier PDF');
      return;
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const groupNode = getNodes().find(
      (node) =>
        node.type === 'group' &&
        position.x >= node.position.x &&
        position.x <= node.position.x + (node.width || 0) &&
        position.y >= node.position.y &&
        position.y <= node.position.y + (node.height || 0)
    );

    if (!groupNode) {
      alert('Veuillez déposer le fichier dans un groupe');
      return;
    }

    for (const file of pdfFiles) {
      const newId = `file-${nodeId + 1}`;
      setNodeId((prev) => prev + 1);

      const fileNode: Node = {
        id: newId,
        type: 'file',
        position: {
          x: position.x - groupNode.position.x,
          y: position.y - groupNode.position.y,
        },
        data: {
          fileName: file.name,
          status: 'indexing',
          fileSize: file.size,
        },
        parentNode: groupNode.id,
        extent: 'parent',
      };

      setNodes((nodes) => nodes.concat(fileNode));

      indexPDF(file, (progress, status) => {
        console.log(`${file.name}: ${progress}% - ${status}`);
      })
        .then((chunks) => {
          setNodes((nodes) =>
            nodes.map((node) =>
              node.id === newId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: 'ready',
                      chunks,
                      pageCount: Math.ceil(chunks.length / 10),
                    },
                  }
                : node
            )
          );
        })
        .catch((error) => {
          setNodes((nodes) =>
            nodes.map((node) =>
              node.id === newId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: 'error',
                      error: error.message,
                    },
                  }
                : node
            )
          );
        });
    }
  },
  [nodeId, screenToFlowPosition, getNodes, setNodes]
);
```

### 3.5 Modifier handleAiNodeSubmit
Au DÉBUT de la fonction `handleAiNodeSubmit`, AVANT la création du loadingNode, ajouter :

```typescript
// Chercher les FileNodes dans le même groupe parent
let ragContext = '';
if (originNode.parentNode) {
  const fileNodes = getNodes().filter(
    (node) =>
      node.type === 'file' &&
      node.parentNode === originNode.parentNode &&
      node.data.status === 'ready' &&
      node.data.chunks
  );

  if (fileNodes.length > 0) {
    const allChunks: Chunk[] = [];
    fileNodes.forEach((fileNode) => {
      if (fileNode.data.chunks) {
        allChunks.push(...fileNode.data.chunks);
      }
    });

    if (allChunks.length > 0) {
      try {
        const relevantChunks = await searchChunks(text, allChunks, 3);
        ragContext = '\n\n📚 Contexte du document:\n' + 
          relevantChunks.map((chunk, i) => 
            `[Extrait ${i + 1}]: ${chunk.text.substring(0, 500)}...`
          ).join('\n\n');
      } catch (error) {
        console.error('Error searching chunks:', error);
      }
    }
  }
}
```

Puis, juste avant l'appel `fetch('/api/groq'...)`, remplacer :
```typescript
const fullContext = [context, ragContext].filter(Boolean).join('\n\n');
```

Et dans le body du fetch, remplacer la ligne :
```typescript
content: `${context ? `${context}\n\n` : ''}${text}
```
par :
```typescript
content: `${fullContext ? `${fullContext}\n\n` : ''}${text}
```

### 3.6 Ajouter les props au div principal
Dans le `return`, modifier la div principale :

```typescript
<div 
  style={{ width: '100vw', height: '100vh' }}
  onDragOver={onDragOver}  // ← AJOUTER
  onDrop={onDrop}          // ← AJOUTER
  onMouseDown={onMouseDown}
  onMouseMove={onMouseMove}
  onMouseUp={onMouseUp}
  onContextMenu={(e) => e.preventDefault()}
>
```

### 3.7 Ajouter le style pour le drag over
Dans le `<style>` existant, ajouter :

```css
.react-flow__node-group.drag-over {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
  background: rgba(59, 130, 246, 0.05) !important;
}
```

## ✅ Étape 4 : Tester

1. Démarrer l'application : `npm run dev`
2. Double-cliquer pour créer un groupe
3. Glisser un PDF dans le groupe
4. Attendre l'indexation (vérifier la console)
5. Double-cliquer dans le groupe pour créer un AI node
6. Poser une question sur le contenu du PDF

## 🎉 C'est terminé !

Votre whiteboard supporte maintenant le RAG avec des PDFs. Les AI nodes dans un groupe utiliseront automatiquement le contexte des PDFs indexés.

## 📝 Notes importantes

- La première utilisation téléchargera le modèle d'embedding (~25MB)
- L'indexation se fait entièrement côté client
- Les embeddings restent en mémoire (pas de persistance)
- Fonctionne avec plusieurs PDFs simultanément