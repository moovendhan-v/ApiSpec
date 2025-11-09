// app/api/documents/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title, content, isPublic, password } = await req.json();

    // Here you would typically save to a database
    // For now, we'll just return a success response
    return NextResponse.json({ 
      success: true,
      id: Math.random().toString(36).substring(2, 9),
      title,
      isPublic,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET() {
  try {
    // Here you would typically fetch documents from a database
    // For now, we'll return an empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}