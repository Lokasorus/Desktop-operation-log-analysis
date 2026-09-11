/**
 * Revised analysis with business context
 * Automated ROI selected wrong candidate - need human judgment
 */
import fs from 'fs';

console.log('='.repeat(80));
console.log('REVISED ANALYSIS - BUSINESS CONTEXT APPLIED');
console.log('='.repeat(80));

// Load segments
const segments = fs.readFileSync('./segments.jsonl', 'utf-8')
  .split('\n')
  .filter(line => line.trim())
  .map(line => JSON.parse(line));

// Calculate durations
for (const seg of segments) {
  const start = new Date(seg.start);
  const end = new Date(seg.end);
  seg.duration = (end - start) / 1000;
}

// Group by label
const byLabel = {};
for (const seg of segments) {
  if (!byLabel[seg.label]) {
    byLabel[seg.label] = { count: 0, totalDuration: 0, sessions: new Set(), durations: [] };
  }
  byLabel[seg.label].count++;
  byLabel[seg.label].totalDuration += seg.duration;
  byLabel[seg.label].sessions.add(seg.session_id);
  byLabel[seg.label].durations.push(seg.duration);
}

console.log('\n🔍 PROBLEM IDENTIFIED:');
console.log('Automated ROI scoring selected "microsoft_edge_openwith" (1 occurrence, 0.7 min)');
console.log('This is clearly wrong - too small to matter!\n');

console.log('Re-evaluating with business lens...\n');

// Realistic prioritization
const candidates = [
  {
    label: 'microsoft_edge_microsoft_word',
    occurrences: byLabel['microsoft_edge_microsoft_word'].count,
    totalMinutes: (byLabel['microsoft_edge_microsoft_word'].totalDuration / 60).toFixed(1),
    workers: byLabel['microsoft_edge_microsoft_word'].sessions.size,
    assessment: {
      impact: 'HIGH - 67.7% of total time, affects 14/15 workers',
      feasibility: 'MEDIUM - High variability (CV=1.03) suggests different document types',
      risk: 'MEDIUM - Document processing errors could affect workflow',
      reasoning: 'Highest volume and impact. Variability indicates complexity but also opportunity.'
    }
  },
  {
    label: 'spreadsheet_processing',
    occurrences: byLabel['spreadsheet_processing'].count,
    totalMinutes: (byLabel['spreadsheet_processing'].totalDuration / 60).toFixed(1),
    workers: byLabel['spreadsheet_processing'].sessions.size,
    assessment: {
      impact: 'MEDIUM-HIGH - 27.8% of total time, 8 workers',
      feasibility: 'MEDIUM - High variability, likely involves different data sources',
      risk: 'HIGH - Data accuracy critical in spreadsheet work',
      reasoning: 'Significant impact but higher risk. Defer to phase 2.'
    }
  }
];

console.log('='.repeat(80));
console.log('CANDIDATE COMPARISON');
console.log('='.repeat(80));

for (let i = 0; i < candidates.length; i++) {
  const c = candidates[i];
  console.log(`\n${i + 1}. ${c.label}`);
  console.log(`   Volume: ${c.occurrences} occurrences × ${c.totalMinutes} min`);
  console.log(`   Workers: ${c.workers}`);
  console.log(`   Impact: ${c.assessment.impact}`);
  console.log(`   Feasibility: ${c.assessment.feasibility}`);
  console.log(`   Risk: ${c.assessment.risk}`);
  console.log(`   → ${c.assessment.reasoning}`);
}

console.log('\n' + '='.repeat(80));
console.log('FINAL DECISION');
console.log('='.repeat(80));

console.log('\n✓ SELECTED: microsoft_edge_microsoft_word (Document Processing Workflow)');
console.log('\nReasoning:');
console.log('1. IMPACT: 114 minutes total, 34 executions - clear ROI');
console.log('2. SCOPE: Affects 93% of workers (14/15) - broad benefit');
console.log('3. FEASIBILITY: Despite variability, document workflows are automatable');
console.log('4. PROTOTYPE SCOPE: Can target most common document type first');
console.log('5. EXPANSION PATH: Success here enables automation of other document types');

console.log('\nVariability Analysis:');
const durations = byLabel['microsoft_edge_microsoft_word'].durations;
durations.sort((a, b) => a - b);
const p25 = durations[Math.floor(durations.length * 0.25)];
const p50 = durations[Math.floor(durations.length * 0.5)];
const p75 = durations[Math.floor(durations.length * 0.75)];

console.log(`  25th percentile: ${p25.toFixed(0)}s`);
console.log(`  Median: ${p50.toFixed(0)}s`);
console.log(`  75th percentile: ${p75.toFixed(0)}s`);
console.log(`  → Most executions cluster around ${p50.toFixed(0)}s (targetable pattern)`);

console.log('\n' + '='.repeat(80));
console.log('PROTOTYPE STRATEGY');
console.log('='.repeat(80));

console.log('\nTarget the median use case (~3.5 min duration):');
console.log('• Open document in Edge/Word');
console.log('• Extract key metadata (title, author, date)');
console.log('• Perform standard validation checks');
console.log('• Post to approval channel / update tracking');
console.log('• Mark status in system');

console.log('\nOut of scope for prototype:');
console.log('• Complex document types (outliers)');
console.log('• Documents requiring manual judgment');
console.log('• Error recovery beyond simple retry');

console.log('\nExpected automation rate: 60-70% of cases');
console.log('Expected time savings: ~68 minutes (60% × 114 min)');
console.log('Manual work remaining: ~40% of cases (complex/exception handling)');

const decision = {
  selectedProcess: 'microsoft_edge_microsoft_word',
  reason: 'Highest impact despite complexity',
  prototypeScope: 'Standard document processing workflow',
  expectedAutomationRate: '60-70%',
  timeSavingsPotential: '~68 minutes per period',
  manualWorkRemaining: 'Complex cases, exceptions, review',
  expansionPath: 'Other document types after validation'
};

fs.writeFileSync('automation_decision.json', JSON.stringify(decision, null, 2));
console.log('\n✓ Decision documented in automation_decision.json');
