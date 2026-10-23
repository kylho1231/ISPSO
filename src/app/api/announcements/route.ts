import { NextRequest, NextResponse } from 'next/server';
import { mockAnnouncements } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const program = searchParams.get('program');

  let results = mockAnnouncements;
  if (program && program !== 'ALL') {
    results = results.filter(
      (a) => a.targetPrograms.includes('ALL') || a.targetPrograms.includes(program)
    );
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
  });
}
