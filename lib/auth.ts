import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth.config';
import { prisma } from './prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user as { 
    id: string; 
    role: string;
    name?: string | null; 
    email?: string | null; 
    image?: string | null;
  } | null;
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
};

export const checkTeamAccess = async (teamId: string) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const team = await prisma.teamUser.findFirst({
    where: {
      userId: user.id,
      teamId,
    },
  });

  if (!team) {
    throw new Error('Not authorized to access this team');
  }

  return { user, team };
};