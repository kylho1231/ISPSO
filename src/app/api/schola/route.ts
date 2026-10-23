import { NextRequest, NextResponse } from 'next/server';
import { generateScholaResponse } from '@/lib/scholaBrain';
import {
  mockCurrentUser,
  mockApplications,
  mockScholarshipPrograms,
  mockPayoutBatches,
} from '@/lib/mockData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, studentId } = body;

    if (!query) {
      return NextResponse.json({ error: 'query parameter is required.' }, { status: 400 });
    }

    const context = {
      student: mockCurrentUser,
      applications: mockApplications,
      programs: mockScholarshipPrograms,
      payoutBatches: mockPayoutBatches,
    };

    const response = generateScholaResponse(query, context);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process Schola query', details: error.message },
      { status: 500 }
    );
  }
}
