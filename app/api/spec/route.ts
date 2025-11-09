import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const filePath = path.join(process.cwd(), 'spec.yml');
    const fileContents = fs.readFileSync(filePath, 'utf8');

    // Get cookies header
    const cookieHeader = request.headers.get('cookie') || '';
    console.log('Raw cookies:', cookieHeader);

    // Parse manually
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...v] = c.trim().split('=');
        return [key, v.join('=')];
      })
    );

    const apiKey = cookies.apiKey;
    console.log('Parsed apiKey:', apiKey);

    // Validate
    // TODO: Replace with actual API key from env later
    if (apiKey !== 'demon') {
      console.log('Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error loading spec:', error);
    return NextResponse.json({ error: 'Failed to load spec file' }, { status: 500 });
  }
}
