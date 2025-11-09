import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'spec.yml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error loading spec:', error);
    return NextResponse.json(
      { error: 'Failed to load spec file' },
      { status: 500 }
    );
  }
}

