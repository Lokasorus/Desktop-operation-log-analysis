/**
 * Quick batch segmentation script - optimized for speed
 */
import { DatasetLoader, SessionLoader } from './dataLoader.js';
import { FinalSegmenter } from './finalSegmenter.js';
import fs from 'fs';
import path from 'path';

const datasetPath = process.argv[2] || './dataset_b';
const outputPath = process.argv[3] || './segments.jsonl';

console.log('Starting segmentation...');
console.log(`Dataset: ${datasetPath}`);

const loader = new DatasetLoader(datasetPath);
const sessions = loader.listSessions();
const segmenter = new FinalSegmenter();

console.log(`Found ${sessions.length} sessions to process\n`);

const allSegments = [];
let processed = 0;

for (const sessionPath of sessions) {
  try {
    const sessionLoader = loader.loadSession(sessionPath);
    const sessionId = path.basename(sessionPath);

    const segments = await segmenter.segmentSession(sessionLoader);
    allSegments.push(...segments);

    processed++;
    console.log(`[${processed}/${sessions.length}] ${sessionId}: ${segments.length} segments`);
  } catch (error) {
    console.error(`Error processing session: ${error.message}`);
  }
}

console.log(`\nTotal segments: ${allSegments.length}`);

// Write output
const output = allSegments.map(s => JSON.stringify(s)).join('\n');
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`✓ Written to ${outputPath}`);

// Quick stats
const labelCounts = {};
for (const seg of allSegments) {
  labelCounts[seg.label] = (labelCounts[seg.label] || 0) + 1;
}

console.log('\nTop labels:');
const sorted = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
for (const [label, count] of sorted) {
  console.log(`  ${label}: ${count}`);
}
