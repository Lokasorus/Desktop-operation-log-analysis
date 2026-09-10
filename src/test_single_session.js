/**
 * Test segmentation on a single session
 */
import { SessionLoader } from './dataLoader.js';
import { ProcessSegmenter } from './segmentation.js';
import path from 'path';

const sessionPath = path.join(process.cwd(), 'dataset_a', 'ses_20260630-121953-LAPTOP-R36BQBTE');

console.log('Testing segmentation on single session...');
console.log(`Session: ${path.basename(sessionPath)}\n`);

const sessionLoader = new SessionLoader(sessionPath);
const segmenter = new ProcessSegmenter({
  minGapSeconds: 5.0,
  minSegmentDuration: 10.0
});

console.log('Loading events...');
const events = await sessionLoader.loadEvents();
console.log(`Loaded ${events.length} events`);

console.log('\nLoading ground truth...');
const gtEvents = await sessionLoader.loadGroundTruth();
console.log(`Loaded ${gtEvents.length} ground truth events`);

const gtProcessStarts = gtEvents.filter(e => e.event === 'process_started');
console.log(`Ground truth process starts: ${gtProcessStarts.length}`);

console.log('\nSegmenting...');
const segments = await segmenter.segmentSession(sessionLoader);
console.log(`Generated ${segments.length} segments`);

console.log('\nFirst 5 segments:');
for (let i = 0; i < Math.min(5, segments.length); i++) {
  const seg = segments[i];
  console.log(`  ${i + 1}. ${seg.start.substr(11, 8)} - ${seg.end.substr(11, 8)} (${seg.duration.toFixed(1)}s) [${seg.label}]`);
}

console.log('\nValidating...');
const validation = segmenter.validateSegmentation(segments, gtEvents);
console.log('Validation results:', validation);

console.log('\n✓ Test complete');
