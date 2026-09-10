/**
 * Analyze ground truth patterns to optimize segmentation parameters
 */
import { DatasetLoader } from './dataLoader.js';
import path from 'path';

console.log('Analyzing ground truth patterns across Dataset A...\n');

const loader = new DatasetLoader(path.join(process.cwd(), 'dataset_a'));
const sessions = loader.listSessions().slice(0, 10); // Analyze first 10 sessions

const stats = {
  totalProcesses: 0,
  processGaps: [],
  processDurations: [],
  nonProcessGaps: [],
  appPatternsPerProcess: {}
};

for (const sessionPath of sessions) {
  const sessionLoader = loader.loadSession(sessionPath);
  const events = await sessionLoader.loadEvents();
  const gtEvents = await sessionLoader.loadGroundTruth();
  const gtManifest = sessionLoader.loadGroundTruthManifest();

  if (!gtManifest) continue;

  // Analyze each process execution
  for (const proc of gtManifest.processes) {
    for (const exec of proc.executions) {
      if (!exec.end_ts) continue;

      const start = new Date(exec.start_ts);
      const end = new Date(exec.end_ts);
      const duration = (end - start) / 1000;

      stats.totalProcesses++;
      stats.processDurations.push(duration);

      // Track app patterns
      const appKey = exec.apps.sort().join('_');
      if (!stats.appPatternsPerProcess[appKey]) {
        stats.appPatternsPerProcess[appKey] = {
          count: 0,
          processes: new Set(),
          durations: []
        };
      }
      stats.appPatternsPerProcess[appKey].count++;
      stats.appPatternsPerProcess[appKey].processes.add(proc.code);
      stats.appPatternsPerProcess[appKey].durations.push(duration);
    }
  }

  // Analyze gaps between processes
  const processStarts = gtEvents
    .filter(e => e.event === 'process_started')
    .map(e => new Date(e.ts_utc).getTime())
    .sort((a, b) => a - b);

  for (let i = 1; i < processStarts.length; i++) {
    const gap = (processStarts[i] - processStarts[i - 1]) / 1000;
    stats.processGaps.push(gap);
  }

  // Analyze time gaps in event stream
  for (let i = 1; i < events.length; i++) {
    const gap = (events[i].timestamp_ms - events[i - 1].timestamp_ms) / 1000;

    // Check if this gap is near a process boundary
    const eventTime = events[i].timestamp_ms;
    const nearBoundary = processStarts.some(ps => Math.abs(eventTime - ps) <= 5000);

    if (gap >= 3.0) {
      if (nearBoundary) {
        stats.processGaps.push(gap);
      } else {
        stats.nonProcessGaps.push(gap);
      }
    }
  }
}

// Compute statistics
const percentile = (arr, p) => {
  const sorted = arr.sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * p);
  return sorted[idx];
};

console.log('='.repeat(80));
console.log('GROUND TRUTH ANALYSIS');
console.log('='.repeat(80));

console.log(`\nTotal processes analyzed: ${stats.totalProcesses}`);

console.log('\nProcess duration statistics:');
console.log(`  Min: ${Math.min(...stats.processDurations).toFixed(1)}s`);
console.log(`  p25: ${percentile(stats.processDurations, 0.25).toFixed(1)}s`);
console.log(`  Median: ${percentile(stats.processDurations, 0.5).toFixed(1)}s`);
console.log(`  p75: ${percentile(stats.processDurations, 0.75).toFixed(1)}s`);
console.log(`  Max: ${Math.max(...stats.processDurations).toFixed(1)}s`);

console.log('\nGap statistics at process boundaries:');
console.log(`  Count: ${stats.processGaps.length}`);
console.log(`  Min: ${Math.min(...stats.processGaps).toFixed(1)}s`);
console.log(`  p25: ${percentile(stats.processGaps, 0.25).toFixed(1)}s`);
console.log(`  Median: ${percentile(stats.processGaps, 0.5).toFixed(1)}s`);
console.log(`  p75: ${percentile(stats.processGaps, 0.75).toFixed(1)}s`);
console.log(`  Max: ${Math.max(...stats.processGaps).toFixed(1)}s`);

console.log('\nGap statistics NOT at process boundaries:');
console.log(`  Count: ${stats.nonProcessGaps.length}`);
if (stats.nonProcessGaps.length > 0) {
  console.log(`  Min: ${Math.min(...stats.nonProcessGaps).toFixed(1)}s`);
  console.log(`  p25: ${percentile(stats.nonProcessGaps, 0.25).toFixed(1)}s`);
  console.log(`  Median: ${percentile(stats.nonProcessGaps, 0.5).toFixed(1)}s`);
  console.log(`  p75: ${percentile(stats.nonProcessGaps, 0.75).toFixed(1)}s`);
  console.log(`  Max: ${Math.max(...stats.nonProcessGaps).toFixed(1)}s`);
}

console.log('\nTop app patterns:');
const sortedPatterns = Object.entries(stats.appPatternsPerProcess)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 10);

for (const [pattern, data] of sortedPatterns) {
  const avgDuration = data.durations.reduce((a, b) => a + b, 0) / data.durations.length;
  console.log(`  ${pattern}: ${data.count} times, avg ${avgDuration.toFixed(1)}s, ${data.processes.size} distinct processes`);
}

console.log('\n' + '='.repeat(80));
console.log('RECOMMENDED PARAMETERS');
console.log('='.repeat(80));

// Find optimal threshold: maximize separation between process and non-process gaps
const processGapMedian = percentile(stats.processGaps, 0.5);
const nonProcessGapP75 = stats.nonProcessGaps.length > 0 ? percentile(stats.nonProcessGaps, 0.75) : 0;
const recommendedGap = Math.max(processGapMedian * 0.8, nonProcessGapP75 * 1.2);

console.log(`\nMinimum gap threshold: ${recommendedGap.toFixed(1)}s`);
console.log(`  (balances process boundary detection with false positive reduction)`);

const recommendedMinDuration = percentile(stats.processDurations, 0.25) * 0.8;
console.log(`\nMinimum segment duration: ${recommendedMinDuration.toFixed(1)}s`);
console.log(`  (captures 80% of actual process durations)`);
