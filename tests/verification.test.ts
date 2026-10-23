import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateLRN,
  normalizeName,
  jaroWinklerSimilarity,
  performDocumentVerification,
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
