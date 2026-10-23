import { NextRequest, NextResponse } from 'next/server';
import { mockSmsMessages } from '@/lib/mockData';
import { SmsMessage } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const mobile = searchParams.get('mobile');

  let results = mockSmsMessages;
  if (studentId) {
    results = results.filter((s) => s.studentId === studentId);
  } else if (mobile) {
    results = results.filter((s) => s.mobileNumber === mobile);
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, mobileNumber, message, sender = 'ISPSO Staff Desk' } = body;

    if (!mobileNumber || !message) {
      return NextResponse.json(
        { error: 'mobileNumber and message are required fields.' },
        { status: 400 }
      );
    }

    const newSms: SmsMessage = {
      id: `sms-${Date.now()}`,
      studentId: studentId || 'stud-unknown',
      studentName: 'Student Recipient',
      studentNumber: 'N/A',
      mobileNumber,
      message,
      sender,
      direction: 'OUTBOUND',
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `SMS successfully queued and dispatched to ${mobileNumber}`,
      data: newSms,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SMS dispatch failed', details: error.message },
      { status: 500 }
    );
  }
}
