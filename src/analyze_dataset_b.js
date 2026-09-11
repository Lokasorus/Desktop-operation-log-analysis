/**
 * Comprehensive analysis of Dataset B segments
 * Identifies automation opportunities and prioritizes candidates
 */
import fs from 'fs';
import path from 'path';

console.log('='.repeat(80));
console.log('DATASET B ANALYSIS - AUTOMATION OPPORTUNITY IDENTIFICATION');
console.log('='.repeat(80));

// Load segments
const segmentsFile = './segments.jsonl';
const segments = fs.readFileSync(segmentsFile, 'utf-8')
  .split('\n')
  .filter(line => line.trim())
  .map(line => JSON.parse(line));

console.log(`\nTotal segments analyzed: ${segments.length}`);

// Calculate durations
for (const seg of segments) {
  const start = new Date(seg.start);
  const end = new Date(seg.end);
  seg.duration = (end - start) / 1000;
}

// Group by session
const bySession = {};
for (const seg of segments) {
  if (!bySession[seg.session_id]) {
    bySession[seg.session_id] = [];
  }
  bySession[seg.session_id].push(seg);
}

console.log(`Sessions: ${Object.keys(bySession).length}`);
console.log(`Average segments per session: ${(segments.length / Object.keys(bySession).length).toFixed(1)}`);

// Analyze by process label
console.log('\n' + '='.repeat(80));
console.log('PROCESS INVENTORY');
console.log('='.repeat(80));

const byLabel = {};
for (const seg of segments) {
  if (!byLabel[seg.label]) {
    byLabel[seg.label] = {
      count: 0,
      totalDuration: 0,
      sessions: new Set(),
      durations: []
    };
  }
  byLabel[seg.label].count++;
  byLabel[seg.label].totalDuration += seg.duration;
  byLabel[seg.label].sessions.add(seg.session_id);
  byLabel[seg.label].durations.push(seg.duration);
}

console.log('\nProcess types discovered:');
const sortedLabels = Object.entries(byLabel).sort((a, b) => b[1].totalDuration - a[1].totalDuration);

for (const [label, data] of sortedLabels) {
  const avgDuration = data.totalDuration / data.count;
  const totalMinutes = (data.totalDuration / 60).toFixed(1);
  const sessionsCount = data.sessions.size;

  console.log(`\n  ${label}:`);
  console.log(`    Occurrences: ${data.count}`);
  console.log(`    Total time: ${totalMinutes} minutes`);
  console.log(`    Avg duration: ${avgDuration.toFixed(1)}s`);
  console.log(`    Sessions: ${sessionsCount}/${Object.keys(bySession).length}`);
  console.log(`    % of total time: ${((data.totalDuration / segments.reduce((s, seg) => s + seg.duration, 0)) * 100).toFixed(1)}%`);
}

// Identify people/machines
console.log('\n' + '='.repeat(80));
console.log('WORKFORCE ANALYSIS');
console.log('='.repeat(80));

const machines = new Set();
for (const sessionId of Object.keys(bySession)) {
  const machine = sessionId.split('-').pop();
  machines.add(machine);
}

console.log(`\nDistinct machines: ${machines.size}`);
console.log(`Machines: ${Array.from(machines).join(', ')}`);

// Workload per machine
const workloadByMachine = {};
for (const [sessionId, segs] of Object.entries(bySession)) {
  const machine = sessionId.split('-').pop();
  if (!workloadByMachine[machine]) {
    workloadByMachine[machine] = { sessions: 0, segments: 0, totalTime: 0 };
  }
  workloadByMachine[machine].sessions++;
  workloadByMachine[machine].segments += segs.length;
  workloadByMachine[machine].totalTime += segs.reduce((s, seg) => s + seg.duration, 0);
}

console.log('\nWorkload distribution:');
for (const [machine, data] of Object.entries(workloadByMachine).sort((a, b) => b[1].totalTime - a[1].totalTime)) {
  console.log(`  ${machine}:`);
  console.log(`    Sessions: ${data.sessions}`);
  console.log(`    Segments: ${data.segments}`);
  console.log(`    Total time: ${(data.totalTime / 60).toFixed(1)} minutes`);
}

// Complexity analysis
console.log('\n' + '='.repeat(80));
console.log('COMPLEXITY INDICATORS');
console.log('='.repeat(80));

const complexityScores = {};
for (const [label, data] of Object.entries(byLabel)) {
  // Calculate complexity score based on:
  // - Frequency (how often it occurs)
  // - Duration variability (std dev)
  // - Number of workers involved

  const durations = data.durations;
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // Coefficient of variation

  complexityScores[label] = {
    frequency: data.count,
    avgDuration: mean,
    variability: cv,
    workers: data.sessions.size,
    totalTime: data.totalDuration
  };
}

console.log('\nProcess characteristics:');
for (const [label, score] of Object.entries(complexityScores).sort((a, b) => b[1].totalTime - a[1].totalTime).slice(0, 5)) {
  console.log(`\n  ${label}:`);
  console.log(`    Frequency: ${score.frequency} executions`);
  console.log(`    Avg duration: ${score.avgDuration.toFixed(1)}s`);
  console.log(`    Variability (CV): ${score.variability.toFixed(2)} ${score.variability < 0.3 ? '(low - predictable)' : score.variability < 0.6 ? '(medium)' : '(high - variable)'}`);
  console.log(`    Workers: ${score.workers}`);
  console.log(`    Impact: ${(score.totalTime / 60).toFixed(1)} min total`);
}

// Automation ROI calculation
console.log('\n' + '='.repeat(80));
console.log('AUTOMATION CANDIDATE PRIORITIZATION');
console.log('='.repeat(80));

const candidates = [];
for (const [label, data] of Object.entries(byLabel)) {
  const complexity = complexityScores[label];

  // Impact score (0-10): frequency × duration × workers
  const impactScore = Math.min(10, (
    (data.count / 10) * 3 +
    (data.totalDuration / 600) * 4 +
    (data.sessions.size / 3) * 3
  ));

  // Feasibility score (0-10): inverse of variability
  const feasibilityScore = Math.min(10, 10 * (1 - complexity.variability));

  // Risk score (0-10): based on process characteristics
  // Lower variability = lower risk, more workers = higher risk (harder rollout)
  const riskScore = Math.min(10,
    complexity.variability * 5 +
    (data.sessions.size / machines.size) * 5
  );

  // ROI = (Impact × Feasibility) / Risk
  const roiScore = (impactScore * feasibilityScore) / (riskScore + 1);

  candidates.push({
    label,
    impactScore: impactScore.toFixed(2),
    feasibilityScore: feasibilityScore.toFixed(2),
    riskScore: riskScore.toFixed(2),
    roiScore: roiScore.toFixed(2),
    occurrences: data.count,
    totalMinutes: (data.totalDuration / 60).toFixed(1),
    workers: data.sessions.size
  });
}

// Sort by ROI
candidates.sort((a, b) => parseFloat(b.roiScore) - parseFloat(a.roiScore));

console.log('\nTop automation candidates (by ROI):');
console.log('\n' + '-'.repeat(80));
for (let i = 0; i < Math.min(5, candidates.length); i++) {
  const c = candidates[i];
  console.log(`\n${i + 1}. ${c.label}`);
  console.log(`   ROI Score: ${c.roiScore}`);
  console.log(`   Impact: ${c.impactScore}/10 (${c.occurrences} occurrences, ${c.totalMinutes} min, ${c.workers} workers)`);
  console.log(`   Feasibility: ${c.feasibilityScore}/10`);
  console.log(`   Risk: ${c.riskScore}/10`);

  if (i === 0) {
    console.log('   >>> SELECTED FOR PROTOTYPE <<<');
  }
}

console.log('\n' + '='.repeat(80));
console.log('RECOMMENDATION');
console.log('='.repeat(80));

const top = candidates[0];
console.log(`\nProcess selected for automation prototype: ${top.label}`);
console.log(`\nJustification:`);
console.log(`- Highest ROI score (${top.roiScore})`);
console.log(`- Significant impact: ${top.occurrences} occurrences consuming ${top.totalMinutes} minutes`);
console.log(`- Good feasibility: ${top.feasibilityScore}/10 indicates predictable behavior`);
console.log(`- Manageable risk: ${top.riskScore}/10`);
console.log(`- Affects ${top.workers} worker(s) - clear value proposition`);

console.log('\n✓ Analysis complete');

// Write analysis report
const report = {
  summary: {
    totalSegments: segments.length,
    sessions: Object.keys(bySession).length,
    processes: Object.keys(byLabel).length,
    workers: machines.size
  },
  topCandidates: candidates.slice(0, 5),
  selectedForPrototype: top.label
};

fs.writeFileSync('dataset_b_analysis.json', JSON.stringify(report, null, 2));
console.log('\nReport written to dataset_b_analysis.json');
