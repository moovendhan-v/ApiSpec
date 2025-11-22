import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET - Get user preferences
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Create default preferences if they don't exist
    if (!user.preferences) {
      const preferences = await prisma.userPreferences.create({
        data: {
          userId: user.id,
        },
      });
      return NextResponse.json({ preferences });
    }

    return NextResponse.json({ preferences: user.preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH - Update user preferences
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const data = await req.json();

    let preferences;
    if (user.preferences) {
      // Update existing preferences
      preferences = await prisma.userPreferences.update({
        where: { userId: user.id },
        data: {
          ...(data.theme !== undefined && { theme: data.theme }),
          ...(data.language !== undefined && { language: data.language }),
          ...(data.emailNotifications !== undefined && { emailNotifications: data.emailNotifications }),
          ...(data.pushNotifications !== undefined && { pushNotifications: data.pushNotifications }),
          ...(data.weeklyDigest !== undefined && { weeklyDigest: data.weeklyDigest }),
          ...(data.editorTheme !== undefined && { editorTheme: data.editorTheme }),
          ...(data.fontSize !== undefined && { fontSize: data.fontSize }),
          ...(data.tabSize !== undefined && { tabSize: data.tabSize }),
          ...(data.wordWrap !== undefined && { wordWrap: data.wordWrap }),
          ...(data.profileVisibility !== undefined && { profileVisibility: data.profileVisibility }),
          ...(data.showEmail !== undefined && { showEmail: data.showEmail }),
          ...(data.showActivity !== undefined && { showActivity: data.showActivity }),
        },
      });
    } else {
      // Create new preferences
      preferences = await prisma.userPreferences.create({
        data: {
          userId: user.id,
          ...data,
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
