import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

// GET: Fetch a specific specification by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;

    // Find the document by ID for the authenticated user
    const spec = await prisma.document.findFirst({
      where: {
        id,
        User: { email: session.user.email },
      },
    });

    if (!spec) {
      return new NextResponse('Specification not found', { status: 404 });
    }

    return NextResponse.json({
      id: spec.id,
      content: spec.content,
      updatedAt: spec.updatedAt
    });
  } catch (error) {
    console.error('Error fetching specification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
