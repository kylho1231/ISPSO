import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateLRN,
  normalizeName,
  jaroWinklerSimilarity,
  performDocumentVerification,
  validatePassword,
  detectAiGeneratedDocument,
  verifyStudentRegistrationDocuments,
} from '../src/lib/verification.ts';

test('DepEd 12-digit LRN Validation', async (t) => {
  await t.test('accepts valid 12-digit LRN with standard format', () => {
    const result = validateLRN('115201140091');
    assert.equal(result.isValid, true);
    assert.equal(result.error, undefined);
  });

  await t.test('accepts valid LRN with dashes and whitespace', () => {
    const result = validateLRN(' 115201-140091 ');
    assert.equal(result.isValid, true);
  });

  await t.test('rejects LRN with less than 12 digits', () => {
    const result = validateLRN('1234567890');
    assert.equal(result.isValid, false);
    assert.match(result.error || '', /Expected 12 digits/);
  });

  await t.test('rejects LRN with non-numeric characters', () => {
    const result = validateLRN('11520114009A');
    assert.equal(result.isValid, false);
    assert.match(result.error || '', /Expected 12 digits/);
  });

  await t.test('rejects empty or whitespace LRN', () => {
    const result = validateLRN('');
    assert.equal(result.isValid, false);
    assert.equal(result.error, 'LRN is required.');
  });

  await t.test('rejects all-zero school ID prefix', () => {
    const result = validateLRN('000000140091');
    assert.equal(result.isValid, false);
    assert.match(result.error || '', /Invalid School ID/);
  });
});

test('Name Normalization and String Similarity', async (t) => {
  await t.test('normalizes punctuation, titles, and casing', () => {
    const normalized = normalizeName('Mr. Juan Miguel Dela Cruz, Jr.');
    assert.equal(normalized, 'JUAN MIGUEL DELA CRUZ');
  });

  await t.test('calculates 1.0 similarity for exact names', () => {
    const sim = jaroWinklerSimilarity('Juan Dela Cruz', 'Juan Dela Cruz');
    assert.equal(sim, 1.0);
  });

  await t.test('calculates high similarity for middle initial variation', () => {
    const sim = jaroWinklerSimilarity('Ana Marie Francisco', 'Ana M Francisco');
    assert.ok(sim >= 0.80, `Expected similarity >= 0.80, got ${sim}`);
  });

  await t.test('calculates low similarity for completely different names', () => {
    const sim = jaroWinklerSimilarity('Mark Villanueva', 'Juan Miguel Dela Cruz');
    assert.ok(sim < 0.65, `Expected similarity < 0.65, got ${sim}`);
  });
});

test('Document Verification Engine Heuristics', async (t) => {
  await t.test('marks perfect match as VERIFIED with high confidence', () => {
    const result = performDocumentVerification({
      registeredName: 'Juan Miguel Dela Cruz',
      registeredLrn: '115201140091',
      extractedText: 'ST. ANTHONY COLLEGE\nNAME: JUAN MIGUEL DELA CRUZ\nLRN: 115201140091',
      extractedName: 'JUAN MIGUEL DELA CRUZ',
      extractedLrn: '115201140091',
      fileHash: 'unique-hash-001',
    });

    assert.equal(result.status, 'VERIFIED');
    assert.ok(result.confidenceScore >= 90);
    assert.equal(result.lrnValid, true);
    assert.equal(result.isDuplicateImage, false);
    assert.equal(result.issues.length, 0);
  });

  await t.test('flags slight name discrepancy for manual review', () => {
    const result = performDocumentVerification({
      registeredName: 'Ana Marie Francisco',
      registeredLrn: '115201150034',
      extractedText: 'ST. ANTHONY COLLEGE\nNAME: Anna Maria Francisca\nLRN: 115201150034',
      extractedName: 'Anna Maria Francisca',
      extractedLrn: '115201150034',
      fileHash: 'unique-hash-002',
    });

    assert.equal(result.status, 'NEEDS_MANUAL_REVIEW');
    assert.ok(result.issues.some((issue) => issue.includes('Slight Name Discrepancy')));
  });

  await t.test('detects and flags severe NAME_MISMATCH when uploading someone else’s ID', () => {
    const result = performDocumentVerification({
      registeredName: 'Mark Villanueva',
      registeredLrn: '115201140552',
      extractedText: 'ST. ANTHONY COLLEGE\nNAME: JUAN MIGUEL DELA CRUZ\nLRN: 115201140091',
      extractedName: 'JUAN MIGUEL DELA CRUZ',
      extractedLrn: '115201140091',
      fileHash: 'unique-hash-003',
    });

    assert.equal(result.status, 'NAME_MISMATCH');
    assert.ok(result.confidenceScore < 60);
    assert.ok(result.issues.some((issue) => issue.includes('Name Mismatch')));
  });

  await t.test('detects DUPLICATE_FLAGGED if identical image hash already exists', () => {
    const existingHashes = ['shared-image-hash-12345'];

    const result = performDocumentVerification({
      registeredName: 'Mark Villanueva',
      registeredLrn: '115201140552',
      extractedText: 'ST. ANTHONY COLLEGE\nNAME: MARK VILLANUEVA',
      extractedName: 'MARK VILLANUEVA',
      fileHash: 'shared-image-hash-12345',
      existingHashes,
    });

    assert.equal(result.status, 'DUPLICATE_FLAGGED');
    assert.equal(result.isDuplicateImage, true);
    assert.ok(result.issues.some((issue) => issue.includes('Duplicate Document Alert')));
  });

  await t.test('flags INVALID_LRN if student profile has malformed LRN', () => {
    const result = performDocumentVerification({
      registeredName: 'Pedro Penduko',
      registeredLrn: '12345', // invalid length
      extractedText: 'ST. ANTHONY COLLEGE\nNAME: PEDRO PENDUKO',
      fileHash: 'unique-hash-004',
    });

    assert.equal(result.status, 'INVALID_LRN');
    assert.equal(result.lrnValid, false);
  });
});

test('Student Account Creation Password Policy', async (t) => {
  await t.test('accepts strong password with uppercase and special character', () => {
    const result = validatePassword('Anthonian@2026');
    assert.equal(result.isValid, true);
    assert.equal(result.hasUpper, true);
    assert.equal(result.hasSpecial, true);
    assert.equal(result.hasMinLength, true);
    assert.equal(result.error, undefined);
  });

  await t.test('rejects password lacking uppercase character', () => {
    const result = validatePassword('anthonian@2026');
    assert.equal(result.isValid, false);
    assert.equal(result.hasUpper, false);
    assert.ok(result.error?.includes('uppercase'));
  });

  await t.test('rejects password lacking special character', () => {
    const result = validatePassword('Anthonian2026');
    assert.equal(result.isValid, false);
    assert.equal(result.hasSpecial, false);
    assert.ok(result.error?.includes('special character'));
  });

  await t.test('rejects password shorter than 8 characters', () => {
    const result = validatePassword('Sac@1');
    assert.equal(result.isValid, false);
    assert.equal(result.hasMinLength, false);
    assert.ok(result.error?.includes('8 characters'));
  });
});

test('AI-Generated Document Forensic Detection', async (t) => {
  await t.test('detects AI-generated document from generator filename keywords', () => {
    const result = detectAiGeneratedDocument({
      name: 'Midjourney_Registration_Form_SAC.png',
      size: 1048576,
      type: 'image/png',
    });
    assert.equal(result.isAiGenerated, true);
    assert.ok(result.confidenceScore >= 80);
    assert.ok(result.reason?.includes('AI generator signature detected'));
  });

  await t.test('detects AI-generated document with DALL-E or Stable Diffusion naming', () => {
    const result = detectAiGeneratedDocument({
      name: 'dalle_student_id_card.jpg',
      size: 512000,
      type: 'image/jpeg',
    });
    assert.equal(result.isAiGenerated, true);
  });

  await t.test('detects AI generative payload in image headers', () => {
    const result = detectAiGeneratedDocument({
      name: 'student_id.png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...parameters:masterpiece, prompt: sac student id...workflow',
    });
    assert.equal(result.isAiGenerated, true);
    assert.ok(result.indicators.some((i) => i.includes('Generative AI metadata')));
  });

  await t.test('detects AI watermark in document OCR text', () => {
    const result = detectAiGeneratedDocument({
      name: 'scanned_id.jpg',
      extractedText: 'ST. ANTHONY COLLEGE\nSTUDENT ID\nCreated with Bing Image Creator\nNAME: JUAN DELA CRUZ',
    });
    assert.equal(result.isAiGenerated, true);
    assert.ok(result.indicators.some((i) => i.includes('Generative AI model watermark')));
  });

  await t.test('passes genuine scanned or camera-captured documents', () => {
    const result = detectAiGeneratedDocument({
      name: 'SAC_ID_Maria_Santos.jpg',
      size: 2048500,
      type: 'image/jpeg',
      dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL...',
      extractedText: 'ST. ANTHONY COLLEGE\nCOLLEGE OF COMPUTER STUDIES\nNAME: MARIA SANTOS DELA CRUZ\nLRN: 115201140001',
    });
    assert.equal(result.isAiGenerated, false);
    assert.equal(result.confidenceScore, 0);
  });
});

test('Student Registration Identity and Document Verification', async (t) => {
  const genuineId = {
    name: 'SAC_ID_Maria_Santos.jpg',
    size: 1500000,
    type: 'image/jpeg',
    extractedText: 'ST. ANTHONY COLLEGE SAN JOSE ANTIQUE\nNAME: MARIA SANTOS DELA CRUZ\nSTUDENT ID: SAC-2026-00412',
    extractedName: 'MARIA SANTOS DELA CRUZ',
  };

  const genuineRf = {
    name: 'Certificate_Of_Registration_2026.pdf',
    size: 2100000,
    type: 'application/pdf',
    extractedText: 'ST. ANTHONY COLLEGE REGISTRAR\nREGISTRATION FORM\nNAME: MARIA SANTOS DELA CRUZ\nDEPED LRN: 115201140001\nCOURSE: BSIT 1',
    extractedLrn: '115201140001',
  };

  await t.test('successfully verifies matching genuine ID and RF', () => {
    const result = verifyStudentRegistrationDocuments({
      fullName: 'Maria Santos Dela Cruz',
      lrn: '115201140001',
      idDocument: genuineId,
      rfDocument: genuineRf,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.status, 'VERIFIED');
    assert.equal(result.details.lrnMatch, true);
    assert.ok(result.details.nameSimilarity >= 90);
  });

  await t.test('fails when required documents are missing', () => {
    const result = verifyStudentRegistrationDocuments({
      fullName: 'Maria Santos Dela Cruz',
      lrn: '115201140001',
      idDocument: genuineId,
      rfDocument: null,
    });

    assert.equal(result.isValid, false);
    assert.equal(result.status, 'MISSING_DOCUMENTS');
  });

  await t.test('fails and errors when uploaded ID is AI-generated', () => {
    const fakeId = {
      name: 'Midjourney_Fake_SAC_ID.png',
      size: 1200000,
      type: 'image/png',
      extractedText: 'NAME: MARIA SANTOS DELA CRUZ',
    };

    const result = verifyStudentRegistrationDocuments({
      fullName: 'Maria Santos Dela Cruz',
      lrn: '115201140001',
      idDocument: fakeId,
      rfDocument: genuineRf,
    });

    assert.equal(result.isValid, false);
    assert.equal(result.status, 'AI_GENERATED_DETECTED');
    assert.ok(result.error?.includes('AI-generated or synthetic'));
  });

  await t.test('fails when name on ID does not match registered name', () => {
    const mismatchedId = {
      name: 'SAC_ID_Juan_Reyes.jpg',
      size: 1500000,
      type: 'image/jpeg',
      extractedText: 'ST. ANTHONY COLLEGE\nNAME: JUAN CARLOS REYES',
      extractedName: 'JUAN CARLOS REYES',
    };

    const result = verifyStudentRegistrationDocuments({
      fullName: 'Maria Santos Dela Cruz',
      lrn: '115201140001',
      idDocument: mismatchedId,
      rfDocument: genuineRf,
    });

    assert.equal(result.isValid, false);
    assert.equal(result.status, 'NAME_MISMATCH');
    assert.ok(result.error?.includes('Name Mismatch'));
  });

  await t.test('fails when LRN on RF does not match entered LRN', () => {
    const mismatchedRf = {
      name: 'Registration_Form_Other.pdf',
      size: 2000000,
      type: 'application/pdf',
      extractedText: 'REGISTRATION FORM\nNAME: MARIA SANTOS DELA CRUZ\nLRN: 115201999999',
      extractedLrn: '115201999999',
    };

    const result = verifyStudentRegistrationDocuments({
      fullName: 'Maria Santos Dela Cruz',
      lrn: '115201140001',
      idDocument: genuineId,
      rfDocument: mismatchedRf,
    });

    assert.equal(result.isValid, false);
    assert.equal(result.status, 'LRN_MISMATCH');
    assert.ok(result.error?.includes('LRN Mismatch'));
  });
});
