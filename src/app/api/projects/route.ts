import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

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
  const body = await req.json().catch(() => ({} as any));
  const name = typeof body?.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : 'Projet';
  const initialState = { title: 'Titre', nodes: [], edges: [] };
  const created = await prisma.project.create({ data: { userId: uid, name, state: JSON.stringify(initialState) } });
  return NextResponse.json(created, { status: 201 });
}
