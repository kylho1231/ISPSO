import test from 'node:test';
import assert from 'node:assert/strict';
import { generateScholaResponse } from '../src/lib/scholaBrain.ts';
import {
  mockCurrentUser,
  mockScholarshipPrograms,
  mockApplications,
  mockPayoutBatches,
} from '../src/lib/mockData.ts';

const testContext = {
  student: mockCurrentUser,
  applications: mockApplications,
  programs: mockScholarshipPrograms,
  payoutBatches: mockPayoutBatches,
};

test('Schola AI Assistant Intelligence Engine', async (t) => {
  await t.test('knows student personal information and 12-digit LRN', () => {
    const response = generateScholaResponse('Tell me my info and LRN', testContext);
    assert.match(response.text, /Jhon Kylho Estrabo/);
    assert.match(response.text, /115201140091/);
    assert.match(response.text, /STUDENT-JH-2026/);
    assert.match(response.text, /BS Information Technology/);
  });

  await t.test('lists available scholarships when asked what scholarships are available', () => {
    const response = generateScholaResponse('What are the available scholarships in SAC?', testContext);
    assert.match(response.text, /UniFAST Tertiary Education Subsidy/);
    assert.match(response.text, /Tulong Dunong Program/);
    assert.match(response.text, /College-Assisted Students/);
    assert.match(response.text, /Dean's List/);
    assert.match(response.text, /APESP/);
    assert.ok(response.cards && response.cards.length >= 5);
  });

  await t.test('evaluates eligibility based on student GWA', () => {
    const response = generateScholaResponse('Am I eligible for scholarships with my GWA?', testContext);
    assert.match(response.text, /Dean's List/);
    assert.match(response.text, /1.45/);
    assert.match(response.text, /Tulong Dunong Program/);
  });

  await t.test('provides precise payout dates, gym venue, and requirements', () => {
    const response = generateScholaResponse('When is my payout schedule at the gym?', testContext);
    assert.match(response.text, /2026-11-14/);
    assert.match(response.text, /SAC Gymnasium/);
    assert.match(response.text, /7,500/);
    assert.match(response.text, /Validated SAC Student ID/);
  });

  await t.test('explains application process and required documents', () => {
    const response = generateScholaResponse('How to apply and what are the requirements?', testContext);
    assert.match(response.text, /Certificate of Registration/);
    assert.match(response.text, /Validated SAC Student ID/);
    assert.match(response.text, /DepEd LRN/);
  });
});
