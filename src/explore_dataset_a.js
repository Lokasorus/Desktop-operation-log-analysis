/**
 * Initial exploration of Dataset A to understand patterns
 */
import { DatasetLoader } from './dataLoader.js';
import path from 'path';

const DATASET_A_PATH = path.join(process.cwd(), 'dataset_a');

console.log('='.repeat(80));
console.log('DATASET A EXPLORATION');
console.log('='.repeat(80));

const loader = new DatasetLoader(DATASET_A_PATH);
const sessions = loader.listSessions();

console.log(`\nTotal sessions: ${sessions.length}`);

// Analyze first session in detail
const firstSession = sessions[0];
console.log(`\nAnalyzing session: ${path.basename(firstSession)}`);

const sessionLoader = loader.loadSession(firstSession);

// Load all data
const events = await sessionLoader.loadEvents();
const gtEvents = await sessionLoader.loadGroundTruth();
const gtManifest = sessionLoader.loadGroundTruthManifest();

console.log(`  Events: ${events.length}`);
console.log(`  Ground truth events: ${gtEvents.length}`);

// Analyze ground truth structure
console.log('\n' + '='.repeat(80));
console.log('GROUND TRUTH ANALYSIS');
console.log('='.repeat(80));

if (gtManifest) {
  console.log(`\nSession duration: ${gtManifest.session.start_ts} to ${gtManifest.session.end_ts}`);
  console.log(`Number of processes: ${gtManifest.processes.length}`);

  console.log('\nProcesses in this session:');
  for (const proc of gtManifest.processes) {
    console.log(`  ${proc.code}: ${proc.family_name} (${proc.domain})`);
    console.log(`    Executions: ${proc.executions.length}`);

    for (const exec of proc.executions.slice(0, 2)) {
      const start = new Date(exec.start_ts);
      const end = new Date(exec.end_ts);
      const duration = (end - start) / 1000;
      console.log(`      - ${exec.case_id}: ${duration.toFixed(1)}s, apps=${exec.apps.join(',')}, variant=${exec.variant || 'N/A'}`);
    }
  }
}

// Analyze ground truth event types
console.log('\n' + '='.repeat(80));
console.log('GROUND TRUTH EVENT TYPES');
console.log('='.repeat(80));

const gtEventTypes = {};
for (const e of gtEvents) {
  gtEventTypes[e.event] = (gtEventTypes[e.event] || 0) + 1;
}

console.log('\nEvent type distribution:');
for (const [eventType, count] of Object.entries(gtEventTypes).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${eventType}: ${count}`);
}

// Analyze process boundaries
console.log('\n' + '='.repeat(80));
console.log('PROCESS BOUNDARY PATTERNS');
console.log('='.repeat(80));

const processStarts = gtEvents.filter(e => e.event === 'process_started');
const processEnds = gtEvents.filter(e => ['process_switched_out', 'process_suspended'].includes(e.event));

console.log(`\nProcess starts: ${processStarts.length}`);
console.log(`Process ends: ${processEnds.length}`);

if (processStarts.length > 0) {
  console.log('\nFirst 5 process transitions:');
  for (let i = 0; i < Math.min(5, processStarts.length); i++) {
    const start = processStarts[i];
    const time = new Date(start.ts_utc).toISOString().substr(11, 8);
    console.log(`  ${time} - START: ${start.process_code} (${start.process_name}) - ${start.case_id}`);
  }
}

// Analyze event types from raw events
console.log('\n' + '='.repeat(80));
console.log('EVENT TYPE ANALYSIS');
console.log('='.repeat(80));

const eventTypes = {};
const layerDist = {};

for (const e of events) {
  eventTypes[e.event_type] = (eventTypes[e.event_type] || 0) + 1;
  layerDist[e.layer] = (layerDist[e.layer] || 0) + 1;
}

console.log('\nMost common event types:');
const sortedEventTypes = Object.entries(eventTypes).sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [eventType, count] of sortedEventTypes) {
  console.log(`  ${eventType}: ${count}`);
}

console.log('\nEvent layers:');
for (const [layer, count] of Object.entries(layerDist)) {
  console.log(`  ${layer}: ${count}`);
}

// Analyze time gaps between events
console.log('\n' + '='.repeat(80));
console.log('TIME GAP ANALYSIS');
console.log('='.repeat(80));

const timeGaps = [];
for (let i = 1; i < events.length; i++) {
  const gap = (events[i].timestamp_ms - events[i-1].timestamp_ms) / 1000;
  timeGaps.push(gap);
}

const largeGaps = timeGaps.filter(g => g >= 5.0);
console.log(`\nTime gaps >= 5s: ${largeGaps.length}`);
if (largeGaps.length > 0) {
  console.log(`  Min: ${Math.min(...largeGaps).toFixed(1)}s`);
  console.log(`  Max: ${Math.max(...largeGaps).toFixed(1)}s`);
  console.log(`  Avg: ${(largeGaps.reduce((a, b) => a + b, 0) / largeGaps.length).toFixed(1)}s`);
}

// Analyze app switches
const appSwitches = events.filter(e => e.event_type === 'app_switch');
console.log(`\nApp switches: ${appSwitches.length}`);

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(80));
