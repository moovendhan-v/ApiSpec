import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

// Disable static generation and always use dynamic rendering
export const dynamic = 'force-dynamic';

// GET: Fetch the latest specification
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find the most recent document for the user
    const spec = await prisma.document.findFirst({
      where: {
        User: { email: session.user.email },
        title: 'API Specification'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!spec) {
      return new NextResponse('No specification found', { status: 404 });
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

// PUT: Update the specification
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { content } = await request.json();
    
    if (!content) {
      return new NextResponse('Content is required', { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Update or create the specification
    const spec = await prisma.document.upsert({
      where: {
        id: 'api-spec', // Using a fixed ID for the API spec
      },
      update: {
        content,
        title: 'API Specification',
        description: 'Main API specification document',
        isPublic: false,
      },
      create: {
        id: 'api-spec',
        title: 'API Specification',
        description: 'Main API specification document',
        content,
        isPublic: false,
        userId: user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      id: spec.id,
      updatedAt: spec.updatedAt
    });
  } catch (error) {
    console.error('Error updating specification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}