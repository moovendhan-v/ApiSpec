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
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      avatarUrl: user.image,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
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

    const { name } = await request.json();
    
    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    // Update the user
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { name },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error updating specification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}