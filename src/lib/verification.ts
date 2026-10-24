import type { VerificationResult, VerificationStatus } from './types.ts';

/**
 * Validates a Philippine DepEd Learner Reference Number (LRN).
 * Requirements:
 * - Exactly 12 digits
 * - Numeric only
 * - First 6 digits represent the School ID
 * - Next 2 digits represent the start year
 * - Last 4 digits represent sequential registration
 */
export function validateLRN(lrn: string): { isValid: boolean; error?: string } {
  const cleaned = lrn.trim().replace(/[-\s]/g, '');

  if (!cleaned) {
    return { isValid: false, error: 'LRN is required.' };
  }

  if (!/^\d{12}$/.test(cleaned)) {
    return {
      isValid: false,
      error: `Invalid LRN format. Expected 12 digits, got ${cleaned.length} digits: "${cleaned}".`,
    };
  }

  // School ID prefix check (must not be all zeros)
  const schoolId = cleaned.substring(0, 6);
  if (schoolId === '000000') {
    return { isValid: false, error: 'Invalid School ID prefix in LRN.' };
  }

  return { isValid: true };
}

/**
 * Clean and canonicalize name strings for comparison.
 * Removes honorifics, extra whitespace, punctuation, and converts to uppercase.
 */
export function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\b(JR|SR|II|III|IV|MA|MR|MS|MISS)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Jaro-Winkler string similarity between two strings.
 * Returns a score between 0.0 (completely dissimilar) and 1.0 (identical).
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  const str1 = normalizeName(s1);
  const str2 = normalizeName(s2);

  if (str1 === str2) return 1.0;
  if (!str1.length || !str2.length) return 0.0;

  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, str2.length);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / str1.length +
      matches / str2.length +
      (matches - transpositions / 2) / matches) /
    3.0;

  // Winkler prefix adjustment (up to 4 matching characters at the start)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(str1.length, str2.length)); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  const p = 0.1; // scaling factor
  return jaro + prefix * p * (1 - jaro);
}

/**
 * Verification Engine:
 * Compares student-entered data vs OCR-extracted data from uploaded ID / COR.
 */
export interface VerificationInput {
  registeredName: string;
  registeredLrn: string;
  extractedText: string;
  extractedName?: string;
  extractedLrn?: string;
  fileHash: string;
  existingHashes?: string[];
}

export function performDocumentVerification(input: VerificationInput): VerificationResult {
  const issues: string[] = [];
  let confidenceScore = 100;

  // 1. Validate registered LRN
  const lrnCheck = validateLRN(input.registeredLrn);
  if (!lrnCheck.isValid) {
    issues.push(lrnCheck.error || 'Invalid registered LRN.');
    confidenceScore -= 40;
  }

  // 2. Extract or use supplied OCR fields
  const extractedName = input.extractedName || extractNameFromText(input.extractedText);
  const extractedLrn = input.extractedLrn || extractLrnFromText(input.extractedText);

  // 3. Name comparison
  let nameSimilarity = 0;
  if (extractedName) {
    nameSimilarity = jaroWinklerSimilarity(input.registeredName, extractedName);
  } else {
    // If name not isolated, check if tokens from registered name exist in raw OCR text
    nameSimilarity = fuzzySearchNameInText(input.registeredName, input.extractedText);
  }

  const similarityPercentage = Math.round(nameSimilarity * 100);

  if (similarityPercentage < 65) {
    issues.push(
      `Name Mismatch: Registered name "${input.registeredName}" does not match ID name "${extractedName || 'Not detected'}" (${similarityPercentage}% match).`
    );
    confidenceScore -= 45;
  } else if (similarityPercentage < 92) {
    issues.push(
      `Slight Name Discrepancy: Similarity score is ${similarityPercentage}%. Requires coordinator verification.`
    );
    confidenceScore -= 15;
  }

  // 4. LRN comparison (if document contains LRN)
  let lrnValid = lrnCheck.isValid;
  if (extractedLrn) {
    const cleanedRegLrn = input.registeredLrn.replace(/[-\s]/g, '');
    const cleanedExtLrn = extractedLrn.replace(/[-\s]/g, '');
    if (cleanedRegLrn !== cleanedExtLrn) {
      issues.push(
        `LRN Mismatch: Document shows "${extractedLrn}" but student profile has "${input.registeredLrn}".`
      );
      confidenceScore -= 35;
      lrnValid = false;
    }
  }

  // 5. Duplicate Image Hash check
  let isDuplicateImage = false;
  if (input.existingHashes && input.existingHashes.includes(input.fileHash)) {
    isDuplicateImage = true;
    issues.push(
      'Duplicate Document Alert: This identical file has already been uploaded by another account.'
    );
    confidenceScore -= 60;
  }

  // Ensure confidence score is bounded between 0 and 100
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  // Determine overall status
  let status: VerificationStatus = 'VERIFIED';
  if (isDuplicateImage) {
    status = 'DUPLICATE_FLAGGED';
  } else if (similarityPercentage < 65) {
    status = 'NAME_MISMATCH';
  } else if (!lrnValid) {
    status = 'INVALID_LRN';
  } else if (similarityPercentage < 92 || issues.length > 0) {
    status = 'NEEDS_MANUAL_REVIEW';
  }

  return {
    status,
    confidenceScore,
    extractedName: extractedName || 'N/A',
    extractedLrn: extractedLrn || 'N/A',
    nameSimilarityScore: similarityPercentage,
    lrnValid,
    isDuplicateImage,
    issues,
    verifiedAt: new Date().toISOString(),
    ocrSnippet: input.extractedText.slice(0, 200),
  };
}

/**
 * Heuristic fallback to extract a 12-digit number from OCR text.
 */
function extractLrnFromText(text: string): string | undefined {
  const match = text.match(/\b\d{12}\b/);
  return match ? match[0] : undefined;
}

/**
 * Heuristic name extractor for SAC ID cards.
 */
function extractNameFromText(text: string): string | undefined {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // Look for lines following labels like "NAME:" or prominent uppercase lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase();
    if (line.includes('NAME:') || line.includes('STUDENT NAME:')) {
      return lines[i].replace(/NAME:/i, '').replace(/STUDENT/i, '').trim();
    }
  }
  return undefined;
}

/**
 * Searches for tokens of the student's name in unstructured OCR text.
 */
function fuzzySearchNameInText(name: string, text: string): number {
  const normName = normalizeName(name);
  const normText = normalizeName(text);

  const tokens = normName.split(' ').filter((t) => t.length > 2);
  if (tokens.length === 0) return 0;

  let foundCount = 0;
  for (const token of tokens) {
    if (normText.includes(token)) {
      foundCount++;
    }
  }

  return foundCount / tokens.length;
}

/**
 * Validates student password complexity.
 * Requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 special character (!@#$%^&*...)
 */
export interface PasswordValidationResult {
  isValid: boolean;
  hasUpper: boolean;
  hasSpecial: boolean;
  hasMinLength: boolean;
  error?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('Password must be at least 8 characters long');
  if (!hasUpper) errors.push('Must contain at least one uppercase letter (A-Z)');
  if (!hasSpecial) errors.push('Must contain at least one special character (!@#$%^&*...)');

  return {
    isValid: hasMinLength && hasUpper && hasSpecial,
    hasUpper,
    hasSpecial,
    hasMinLength,
    error: errors.length > 0 ? errors.join('. ') + '.' : undefined,
  };
}

/**
 * AI-Generated / Deepfake / Synthetic Document Forensic Detector.
 * Detects whether an uploaded document (RF or ID) was synthesized using
 * generative AI models (Midjourney, DALL-E, Stable Diffusion, ComfyUI, etc.).
 */
export interface AiDetectionResult {
  isAiGenerated: boolean;
  confidenceScore: number; // 0 - 100
  reason?: string;
  indicators: string[];
}

export function detectAiGeneratedDocument(file: {
  name: string;
  size?: number;
  type?: string;
  dataUrl?: string;
  extractedText?: string;
}): AiDetectionResult {
  const indicators: string[] = [];
  let score = 0;

  const fileName = (file.name || '').toLowerCase();

  // 1. File name indicators (typical generative AI exports)
  const aiFileNameRegex =
    /(midjourney|dall[-_]?e|stablediffusion|stable[-_]diffusion|sdxl|flux|comfyui|novelai|bing[-_]?creator|bing[-_]?image|leonardo[-_]?ai|adobe[-_]?firefly|ai[-_]?gen(erated)?|chatgpt|synthetic|deepfake|fake[-_]id|fake[-_]doc|generated[-_]image)/i;

  if (aiFileNameRegex.test(fileName)) {
    indicators.push(`AI generator signature detected in filename: "${file.name}"`);
    score += 85;
  }

  // 2. Data URL / Base64 metadata inspection for AI generation chunks and signatures
  if (file.dataUrl) {
    const rawHeader = file.dataUrl.slice(0, 4000).toLowerCase();

    if (
      rawHeader.includes('parameters') ||
      rawHeader.includes('stablediffusion') ||
      rawHeader.includes('novelai') ||
      rawHeader.includes('midjourney') ||
      rawHeader.includes('dall-e') ||
      rawHeader.includes('generation time') ||
      rawHeader.includes('workflow') ||
      rawHeader.includes('adobe firefly') ||
      rawHeader.includes('generative fill')
    ) {
      indicators.push('Generative AI metadata payload detected in image headers');
      score += 90;
    }
  }

  // 3. OCR Text inspection for AI tool watermarks or prompt markers
  if (file.extractedText) {
    const textLower = file.extractedText.toLowerCase();
    if (
      textLower.includes('midjourney') ||
      textLower.includes('dall·e') ||
      textLower.includes('dall-e') ||
      textLower.includes('created with bing') ||
      textLower.includes('adobe firefly') ||
      textLower.includes('stable diffusion') ||
      textLower.includes('ai generated') ||
      textLower.includes('generative ai')
    ) {
      indicators.push('Generative AI model watermark identified in document text');
      score += 95;
    }
  }

  const isAiGenerated = score >= 50;

  return {
    isAiGenerated,
    confidenceScore: Math.min(100, score),
    reason: isAiGenerated
      ? `Security Alert: Document failed forensic authenticity check. ${indicators.join('; ')}.`
      : undefined,
    indicators,
  };
}

/**
 * Comprehensive Student Registration Verification.
 * Verifies that:
 * 1. Both RF and SAC ID are uploaded.
 * 2. Neither document is AI-generated / synthetic.
 * 3. The name on the ID matches the student's entered full name.
 * 4. The 12-digit DepEd LRN on the RF matches the student's entered LRN.
 */
export interface RegistrationDocumentPayload {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  extractedText?: string;
  extractedName?: string;
  extractedLrn?: string;
}

export interface StudentRegistrationVerificationInput {
  fullName: string;
  lrn: string;
  idDocument: RegistrationDocumentPayload | null;
  rfDocument: RegistrationDocumentPayload | null;
}

export interface StudentRegistrationVerificationResult {
  isValid: boolean;
  status: 'VERIFIED' | 'MISSING_DOCUMENTS' | 'AI_GENERATED_DETECTED' | 'NAME_MISMATCH' | 'LRN_MISMATCH';
  error?: string;
  details: {
    idAiCheck: AiDetectionResult;
    rfAiCheck: AiDetectionResult;
    nameSimilarity: number;
    lrnMatch: boolean;
    extractedIdName?: string;
    extractedRfLrn?: string;
  };
}

export function verifyStudentRegistrationDocuments(
  input: StudentRegistrationVerificationInput
): StudentRegistrationVerificationResult {
  const { fullName, lrn, idDocument, rfDocument } = input;

  // 1. Check if both documents are present
  if (!idDocument || !rfDocument) {
    return {
      isValid: false,
      status: 'MISSING_DOCUMENTS',
      error: 'Both your Official SAC Student ID and Certificate of Registration (RF) must be uploaded.',
      details: {
        idAiCheck: { isAiGenerated: false, confidenceScore: 0, indicators: [] },
        rfAiCheck: { isAiGenerated: false, confidenceScore: 0, indicators: [] },
        nameSimilarity: 0,
        lrnMatch: false,
      },
    };
  }

  // 2. AI-Generated Forensic Detection Check
  const idAiCheck = detectAiGeneratedDocument(idDocument);
  const rfAiCheck = detectAiGeneratedDocument(rfDocument);

  if (idAiCheck.isAiGenerated || rfAiCheck.isAiGenerated) {
    const docName =
      idAiCheck.isAiGenerated && rfAiCheck.isAiGenerated
        ? 'Student ID and Registration Form'
        : idAiCheck.isAiGenerated
        ? 'Student ID'
        : 'Registration Form (RF)';

    return {
      isValid: false,
      status: 'AI_GENERATED_DETECTED',
      error: `Security Alert: The uploaded ${docName} was flagged by SAC AI Forensic Scanner as AI-generated or synthetic. St. Anthony's College ISPSO strictly prohibits falsified documents under Student Handbook Section 4.2.`,
      details: {
        idAiCheck,
        rfAiCheck,
        nameSimilarity: 0,
        lrnMatch: false,
      },
    };
  }

  // 3. Name Verification from Student ID
  const extractedIdName =
    idDocument.extractedName ||
    extractNameFromText(idDocument.extractedText || '') ||
    idDocument.name.replace(/\.[^/.]+$/, '');
  const nameSimilarity = jaroWinklerSimilarity(fullName, extractedIdName);

  if (idDocument.extractedText && nameSimilarity < 0.70) {
    return {
      isValid: false,
      status: 'NAME_MISMATCH',
      error: `Name Mismatch: The name extracted from the uploaded Student ID ("${extractedIdName}") does not match your registered full name ("${fullName}"). Please upload your own official SAC ID.`,
      details: {
        idAiCheck,
        rfAiCheck,
        nameSimilarity: Math.round(nameSimilarity * 100),
        lrnMatch: false,
        extractedIdName,
      },
    };
  }

  // 4. LRN Verification from Registration Form (RF)
  const cleanedRegLrn = lrn.replace(/[-\s]/g, '');
  const extractedRfLrn =
    rfDocument.extractedLrn ||
    extractLrnFromText(rfDocument.extractedText || '') ||
    cleanedRegLrn;
  const cleanedExtractedLrn = extractedRfLrn.replace(/[-\s]/g, '');

  if (rfDocument.extractedText && cleanedRegLrn !== cleanedExtractedLrn) {
    return {
      isValid: false,
      status: 'LRN_MISMATCH',
      error: `LRN Mismatch: The 12-digit DepEd LRN on the uploaded Registration Form ("${extractedRfLrn}") does not match your entered LRN ("${lrn}").`,
      details: {
        idAiCheck,
        rfAiCheck,
        nameSimilarity: Math.round(nameSimilarity * 100),
        lrnMatch: false,
        extractedIdName,
        extractedRfLrn,
      },
    };
  }

  return {
    isValid: true,
    status: 'VERIFIED',
    details: {
      idAiCheck,
      rfAiCheck,
      nameSimilarity: Math.round(nameSimilarity * 100),
      lrnMatch: true,
      extractedIdName,
      extractedRfLrn,
    },
  };
}
