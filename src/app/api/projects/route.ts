import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSubscriptionPlan } from '@/utils/subscription';
import { getUid } from '@/lib/auth';

export async function GET() {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const projects = await prisma.project.findMany({ where: { userId: uid }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const projectCount = await prisma.project.count({ where: { userId: uid } });
  const plan = getUserSubscriptionPlan(user);

  if (projectCount >= plan.quota) {
    return NextResponse.json({ error: 'Project limit reached. Upgrade your plan.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as any));
  const name = typeof body?.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : 'Projet';
  const helpNode = {
    id: 'help-1',
    type: 'markdown',
    position: { x: 100, y: 100 },
    data: { 
      text: "# Bienvenue sur Fraym ! 👋\n\nVotre espace de travail créatif et intelligent. Voici comment le maîtriser :\n\n### 🛠️ Barre d'outils (en bas)\n* **Curseur** : Pour sélectionner et déplacer les éléments.\n* **Texte / Markdown** : Ajoutez du texte riche.\n* **Image & YouTube** : Intégrez vos médias.\n* **Post-it** : Pour vos idées rapides.\n* **Stylo, Surligneur, Gomme** : Dessinez librement.\n\n### 🖱️ Interactions Rapides\n* **Double-clic (Fond)** : Crée un nouveau groupe.\n* **Double-clic (Groupe)** : Ajoute une note dans le groupe.\n* **Clic Droit (Élément)** : ✨ **Modifier avec l'IA** (Reformuler, résumer, traduire...).\n* **Glisser-Déposer** : Importez directement vos PDF ou images.\n\n### 🚀 Astuces\n* Utilisez la barre du haut pour **naviguer entre les groupes**.\n* Sauvegardez votre travail avec le bouton en haut à droite.\n\nAmusez-vous bien !" 
    },
    width: 400,
    height: 300,
  };
  const initialState = { title: 'Nouveau Projet', nodes: [helpNode], edges: [] };
  const created = await prisma.project.create({ data: { userId: uid, name, state: JSON.stringify(initialState) } });
  return NextResponse.json(created, { status: 201 });
}
