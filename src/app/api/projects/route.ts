import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getUserSubscriptionPlan } from '@/utils/subscription';

export async function GET() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value || '';
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const projects = await prisma.project.findMany({ where: { userId: uid }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value || '';
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
      text: "# Bienvenue sur Fraym ! 👋\n\nVoici comment utiliser votre board :\n\n- **Double-clic sur le fond** : Créer un nouveau groupe\n- **Double-clic sur un groupe** : Ajouter une note (ou demander à l'IA)\n- **Clic droit + Glisser** : Dessiner librement\n- **Glisser un fichier** : Importer un PDF ou une image\n\nAmusez-vous bien !" 
    },
    width: 400,
    height: 300,
  };
  const initialState = { title: 'Nouveau Projet', nodes: [helpNode], edges: [] };
  const created = await prisma.project.create({ data: { userId: uid, name, state: JSON.stringify(initialState) } });
  return NextResponse.json(created, { status: 201 });
}
