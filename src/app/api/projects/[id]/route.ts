import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value || '';
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const match = url.pathname.match(/\/api\/projects\/(.+)$/);
  const pid = typeof id === 'string' && id ? id : (match ? match[1] : '');
  const project = await prisma.project.findUnique({ where: { id: pid } });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (project.userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(project);
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value || '';
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const match = url.pathname.match(/\/api\/projects\/(.+)$/);
  const pid = typeof id === 'string' && id ? id : (match ? match[1] : '');
  const body = await req.json().catch(() => ({} as any));
  const name = typeof body?.name === 'string' ? body.name : undefined;
  const stateObj = typeof body?.state === 'object' && body.state !== null ? body.state : undefined;
  const nodes = Array.isArray(body?.nodes) ? body.nodes : undefined;
  const edges = Array.isArray(body?.edges) ? body.edges : undefined;
  const title = typeof body?.title === 'string' ? body.title : undefined;
  const state = stateObj ? JSON.stringify(stateObj) : nodes && edges ? JSON.stringify({ title, nodes, edges }) : undefined;
  const found = await prisma.project.findUnique({ where: { id: pid } });
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (found.userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const updated = await prisma.project.update({ where: { id: pid }, data: { name, state } });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value || '';
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const match = url.pathname.match(/\/api\/projects\/(.+)$/);
  const pid = typeof id === 'string' && id ? id : (match ? match[1] : '');
  const found = await prisma.project.findUnique({ where: { id: pid } });
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (found.userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.project.delete({ where: { id: pid } });
  return NextResponse.json({ ok: true });
}
