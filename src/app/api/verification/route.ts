import { NextRequest, NextResponse } from 'next/server';
import { performDocumentVerification } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      registeredName,
      registeredLrn,
      extractedText = '',
      extractedName,
      extractedLrn,
      fileHash = `hash-${Date.now()}`,
      existingHashes = [],
    } = body;

    if (!registeredName || !registeredLrn) {
      return NextResponse.json(
        { error: 'registeredName and registeredLrn are required fields.' },
        { status: 400 }
      );
    }

    const verificationResult = performDocumentVerification({
      registeredName,
      registeredLrn,
      extractedText,
      extractedName,
      extractedLrn,
      fileHash,
      existingHashes,
    });

    return NextResponse.json({
      success: true,
      data: verificationResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Verification failed', details: error.message },
      { status: 500 }
    );
  }
}
