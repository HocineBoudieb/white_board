import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ClientBoard from './ClientBoard';
import { cookies } from 'next/headers';
import { getUserSubscriptionPlan } from '@/utils/subscription';

export default async function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    notFound();
  }
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    notFound();
  }

  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value;
  let userStatus = null;

  if (uid) {
    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (user) {
      const projectCount = await prisma.project.count({
        where: { userId: uid },
      });
      const plan = getUserSubscriptionPlan(user);
      
      userStatus = {
        plan: {
          name: plan.name,
          slug: plan.slug,
          quota: plan.quota,
          aiTokens: plan.aiTokens,
        },
        usage: {
          projects: projectCount,
          aiTokens: user.aiTokensUsed,
        },
      };
    }
  }

  let initialTitle = 'Titre';
  let initialNodes: any[] = [];
  let initialEdges: any[] = [];
  if (project?.state) {
    try {
      const st = JSON.parse(project.state);
      initialTitle = typeof st?.title === 'string' ? st.title : 'Titre';
      initialNodes = Array.isArray(st?.nodes) ? st.nodes : [];
      initialEdges = Array.isArray(st?.edges) ? st.edges : [];
    } catch {}
  }
  return <ClientBoard id={id} initialTitle={initialTitle} initialNodes={initialNodes as any} initialEdges={initialEdges as any} userStatus={userStatus} />;
}
