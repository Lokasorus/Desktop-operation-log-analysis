/**
 * Optimized segmentation algorithm based on ground truth analysis
 *
 * Key insights from analysis:
 * - Process boundaries typically have gaps of 6-38s (p25-p75)
 * - Non-process gaps are typically 3-9s (p25-p75)
 * - Optimal threshold: ~20s balances precision and recall
 * - Minimum process duration: ~21s (80% of processes)
 */
import { DatasetLoader, SessionLoader } from './dataLoader.js';
import fs from 'fs';
import path from 'path';

class OptimizedSegmenter {
  constructor(options = {}) {
    // Data-driven parameters from ground truth analysis
    this.minGapSeconds = options.minGapSeconds || 6.0; // p25 of process gaps
    this.minSegmentDuration = options.minSegmentDuration || 20.0; // 80% of processes
    this.highConfidenceGap = options.highConfidenceGap || 15.0; // Between p50-p75
  }

  async segmentSession(sessionLoader) {
    const events = await sessionLoader.loadEvents();
    if (events.length === 0) return [];

    const features = this.extractFeatures(events);
    const boundaries = this.identifyBoundaries(events, features);
    const segments = this.createSegments(events, boundaries);
    const labeled = this.labelSegments(segments);

    return labeled;
  }

  extractFeatures(events) {
    const features = {
      timeGaps: [],
      appSwitches: [],
      appSequences: [],
      clipboardOps: []
    };

    // Time gaps
    for (let i = 1; i < events.length; i++) {
      const gap = (events[i].timestamp_ms - events[i - 1].timestamp_ms) / 1000;
      features.timeGaps.push({ index: i, gap });
    }

    // App switches
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.event_type === 'app_switch') {
        const newApp = event.payload?.new_app?.app_name;
        features.appSwitches.push({ index: i, app: newApp });
      }
      if (event.event_type === 'clipboard_change') {
        features.clipboardOps.push({ index: i });
      }
    }

    return features;
  }

  identifyBoundaries(events, features) {
    const boundaries = [0];
    const candidates = new Map();

    // Score each potential boundary
    for (const { index, gap } of features.timeGaps) {
      let score = 0;

      // High confidence: gap >= 15s
      if (gap >= this.highConfidenceGap) {
        score = 3;
      }
      // Medium confidence: gap >= 6s
      else if (gap >= this.minGapSeconds) {
        score = 1;
      }

      // Boost score if there's an app switch at this point
      const hasAppSwitch = features.appSwitches.some(s => Math.abs(s.index - index) <= 2);
      if (hasAppSwitch && score > 0) {
        score += 1;
      }

      if (score >= 1) {
        candidates.set(index, score);
      }
    }

    // Sort candidates by score and position
    const sortedCandidates = Array.from(candidates.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]; // Higher score first
        return a[0] - b[0]; // Earlier position if tied
      })
      .map(([idx]) => idx);

    // Add boundaries respecting minimum duration
    for (const candidate of sortedCandidates) {
      const lastBoundary = boundaries[boundaries.length - 1];
      const timeSinceLastBoundary = (events[candidate].timestamp_ms - events[lastBoundary].timestamp_ms) / 1000;

      if (timeSinceLastBoundary >= this.minSegmentDuration) {
        boundaries.push(candidate);
      }
    }

    return boundaries.sort((a, b) => a - b);
  }

  createSegments(events, boundaries) {
    const segments = [];

    for (let i = 0; i < boundaries.length; i++) {
      const startIdx = boundaries[i];
      const endIdx = i < boundaries.length - 1 ? boundaries[i + 1] - 1 : events.length - 1;

      const startEvent = events[startIdx];
      const endEvent = events[endIdx];
      const segmentEvents = events.slice(startIdx, endIdx + 1);

      segments.push({
        startIndex: startIdx,
        endIndex: endIdx,
        startTime: startEvent.timestamp_iso,
        endTime: endEvent.timestamp_iso,
        duration: (endEvent.timestamp_ms - startEvent.timestamp_ms) / 1000,
        events: segmentEvents,
        sessionId: startEvent.session_id
      });
    }

    return segments;
  }

  labelSegments(segments) {
    const labeled = [];

    for (const segment of segments) {
      const label = this.inferLabel(segment);

      labeled.push({
        session_id: segment.sessionId,
        start: segment.startTime,
        end: segment.endTime,
        label: label
      });
    }

    return labeled;
  }

  inferLabel(segment) {
    const apps = new Set();
    let clipboardOps = 0;
    let keystrokeCount = 0;
    let browserNavCount = 0;

    for (const event of segment.events) {
      const appName = event.context?.active_app?.app_name;
      if (appName) {
        apps.add(appName.toLowerCase().replace(/[^a-z0-9]/g, '_'));
      }

      if (event.event_type === 'clipboard_change') clipboardOps++;
      if (event.event_type === 'keystroke') keystrokeCount++;
      if (event.event_type === 'browser_navigation') browserNavCount++;
    }

    const appArray = Array.from(apps).sort();
    const hasExcel = appArray.some(a => a.includes('excel'));
    const hasChrome = appArray.some(a => a.includes('chrome'));
    const hasNotepad = appArray.some(a => a.includes('notepad'));
    const hasOutlook = appArray.some(a => a.includes('outlook'));
    const hasOneNote = appArray.some(a => a.includes('onenote'));
    const hasTeams = appArray.some(a => a.includes('teams'));

    // Pattern-based classification
    if (hasChrome && hasExcel && hasNotepad) {
      if (clipboardOps >= 2) {
        return 'data_verification_task'; // Typical HR/Finance process
      }
      return 'data_entry_task';
    }

    if (hasChrome && hasNotepad && hasOneNote) {
      return 'documentation_review'; // Approval/review workflows
    }

    if (hasChrome && hasNotepad && hasTeams) {
      return 'communication_workflow'; // Collaborative tasks
    }

    if (hasChrome && hasExcel && hasOutlook) {
      return 'payment_processing'; // Finance workflows
    }

    if (hasChrome && browserNavCount >= 3) {
      return 'web_portal_navigation';
    }

    // Fallback
    return appArray.slice(0, 3).join('_') || 'unknown_process';
  }

  validateSegmentation(predicted, groundTruth) {
    const gtBoundaries = groundTruth
      .filter(e => e.event === 'process_started')
      .map(e => new Date(e.ts_utc).getTime());

    const predBoundaries = predicted.map(s => new Date(s.start).getTime());

    const tolerance = 5000; // 5 seconds
    let matches = 0;

    for (const gtBoundary of gtBoundaries) {
      const hasMatch = predBoundaries.some(pb => Math.abs(pb - gtBoundary) <= tolerance);
      if (hasMatch) matches++;
    }

    const precision = predBoundaries.length > 0 ? matches / predBoundaries.length : 0;
    const recall = gtBoundaries.length > 0 ? matches / gtBoundaries.length : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      predicted: predBoundaries.length,
      groundTruth: gtBoundaries.length,
      matches,
      precision: precision.toFixed(3),
      recall: recall.toFixed(3),
      f1: f1.toFixed(3)
    };
  }
}

// Test on single session
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  console.log('Testing optimized segmentation...\n');

  const sessionPath = path.join(process.cwd(), 'dataset_a', 'ses_20260630-121953-LAPTOP-R36BQBTE');
  const sessionLoader = new SessionLoader(sessionPath);
  const segmenter = new OptimizedSegmenter();

  const segments = await segmenter.segmentSession(sessionLoader);
  const gtEvents = await sessionLoader.loadGroundTruth();
  const validation = segmenter.validateSegmentation(segments, gtEvents);

  console.log('Single session test:');
  console.log(`  Predicted: ${validation.predicted}`);
  console.log(`  Ground truth: ${validation.groundTruth}`);
  console.log(`  Matches: ${validation.matches}`);
  console.log(`  Precision: ${validation.precision}`);
  console.log(`  Recall: ${validation.recall}`);
  console.log(`  F1: ${validation.f1}`);

  console.log('\nFirst 10 segments:');
  for (let i = 0; i < Math.min(10, segments.length); i++) {
    const seg = segments[i];
    console.log(`  ${seg.start.substr(11, 8)} → ${seg.end.substr(11, 8)} (${((new Date(seg.end) - new Date(seg.start)) / 1000).toFixed(0)}s) [${seg.label}]`);
  }
}

export { OptimizedSegmenter };
