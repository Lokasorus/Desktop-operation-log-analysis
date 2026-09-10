/**
 * Process Segmentation Algorithm
 *
 * Approach:
 * 1. Identify candidate boundaries using time gaps, app switches, and activity patterns
 * 2. Cluster similar process executions based on app sequences and behavior
 * 3. Label segments with consistent names
 * 4. Validate against ground truth (Dataset A only)
 */
import { DatasetLoader } from './dataLoader.js';
import fs from 'fs';
import path from 'path';

class ProcessSegmenter {
  constructor(options = {}) {
    this.minGapSeconds = options.minGapSeconds || 5.0;
    this.minSegmentDuration = options.minSegmentDuration || 10.0;
    this.mergeThreshold = options.mergeThreshold || 3.0;
  }

  /**
   * Segment a session into process executions
   */
  async segmentSession(sessionLoader) {
    const events = await sessionLoader.loadEvents();
    if (events.length === 0) return [];

    // Extract features
    const features = this.extractFeatures(events);

    // Identify boundaries
    const boundaries = this.identifyBoundaries(events, features);

    // Create segments
    const segments = this.createSegments(events, boundaries);

    // Label segments
    const labeledSegments = this.labelSegments(segments, features);

    return labeledSegments;
  }

  /**
   * Extract features from events
   */
  extractFeatures(events) {
    const features = {
      timeGaps: [],
      appSwitches: [],
      appSequences: [],
      windowTitles: [],
      keyboardBursts: [],
      clipboardActivities: []
    };

    // Time gaps
    for (let i = 1; i < events.length; i++) {
      const gap = (events[i].timestamp_ms - events[i - 1].timestamp_ms) / 1000;
      features.timeGaps.push({ index: i, gap, timestamp: events[i].timestamp_iso });
    }

    // App switches and sequences
    let currentApp = null;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.event_type === 'app_switch') {
        const newApp = event.payload?.new_app?.app_name;
        const prevApp = event.payload?.previous_app?.app_name;

        features.appSwitches.push({
          index: i,
          from: prevApp,
          to: newApp,
          timestamp: event.timestamp_iso
        });

        if (newApp && newApp !== currentApp) {
          features.appSequences.push({ index: i, app: newApp });
          currentApp = newApp;
        }
      }

      // Window titles
      if (event.context?.active_app?.window_title) {
        features.windowTitles.push({
          index: i,
          app: event.context.active_app.app_name,
          title: event.context.active_app.window_title,
          timestamp: event.timestamp_iso
        });
      }

      // Clipboard activity
      if (event.event_type === 'clipboard_change') {
        features.clipboardActivities.push({
          index: i,
          timestamp: event.timestamp_iso
        });
      }
    }

    // Keyboard bursts
    features.keyboardBursts = this.extractKeyboardBursts(events);

    return features;
  }

  /**
   * Extract keyboard burst patterns
   */
  extractKeyboardBursts(events) {
    const bursts = [];
    let currentBurst = null;
    const burstGapMs = 2000; // 2 seconds

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.event_type === 'keystroke') {
        if (!currentBurst) {
          currentBurst = {
            startIndex: i,
            endIndex: i,
            startTime: event.timestamp_ms,
            endTime: event.timestamp_ms,
            count: 1
          };
        } else {
          const gap = event.timestamp_ms - currentBurst.endTime;
          if (gap <= burstGapMs) {
            currentBurst.endIndex = i;
            currentBurst.endTime = event.timestamp_ms;
            currentBurst.count++;
          } else {
            bursts.push(currentBurst);
            currentBurst = {
              startIndex: i,
              endIndex: i,
              startTime: event.timestamp_ms,
              endTime: event.timestamp_ms,
              count: 1
            };
          }
        }
      }
    }

    if (currentBurst) {
      bursts.push(currentBurst);
    }

    return bursts;
  }

  /**
   * Identify process boundaries
   */
  identifyBoundaries(events, features) {
    const boundaries = [0]; // Start with first event
    const candidates = new Set();

    // Large time gaps are strong indicators
    for (const { index, gap } of features.timeGaps) {
      if (gap >= this.minGapSeconds) {
        candidates.add(index);
      }
    }

    // App switch combined with moderate gap
    for (const { index } of features.appSwitches) {
      const gapInfo = features.timeGaps.find(g => g.index === index);
      if (gapInfo && gapInfo.gap >= 2.0) {
        candidates.add(index);
      }
    }

    // Convert to sorted array and merge close boundaries
    const sortedCandidates = Array.from(candidates).sort((a, b) => a - b);

    for (let i = 0; i < sortedCandidates.length; i++) {
      const candidate = sortedCandidates[i];
      const lastBoundary = boundaries[boundaries.length - 1];

      // Check minimum segment duration
      const timeSinceLastBoundary = (events[candidate].timestamp_ms - events[lastBoundary].timestamp_ms) / 1000;

      if (timeSinceLastBoundary >= this.minSegmentDuration) {
        boundaries.push(candidate);
      }
    }

    return boundaries;
  }

  /**
   * Create segments from boundaries
   */
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

  /**
   * Label segments based on patterns
   */
  labelSegments(segments, features) {
    const labeled = [];

    for (const segment of segments) {
      const label = this.inferLabel(segment);

      labeled.push({
        session_id: segment.sessionId,
        start: segment.startTime,
        end: segment.endTime,
        label: label,
        duration: segment.duration,
        _debug: {
          startIndex: segment.startIndex,
          endIndex: segment.endIndex,
          eventCount: segment.events.length
        }
      });
    }

    return labeled;
  }

  /**
   * Infer process label from segment characteristics
   */
  inferLabel(segment) {
    // Extract app usage pattern
    const apps = new Set();
    const eventTypes = {};

    for (const event of segment.events) {
      if (event.context?.active_app?.app_name) {
        apps.add(event.context.active_app.app_name);
      }
      eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
    }

    const appList = Array.from(apps).sort().join('_');

    // Simple heuristic: use app combination as process signature
    // In production, this would use ML clustering or pattern matching
    const signature = `${appList}_${Math.round(segment.duration / 10) * 10}s`;

    return this.normalizeLabel(signature);
  }

  /**
   * Normalize label to consistent format
   */
  normalizeLabel(signature) {
    // Map common patterns to descriptive labels
    const patterns = {
      'chrome_excel_notepad': 'data_processing',
      'chrome_notepad_onenote': 'documentation_review',
      'chrome_excel_notepad_outlook': 'communication_task',
      'chrome': 'web_workflow',
      'excel': 'spreadsheet_task',
      'notepad': 'note_taking'
    };

    for (const [pattern, label] of Object.entries(patterns)) {
      if (signature.includes(pattern)) {
        return label;
      }
    }

    // Default: use signature as-is
    return signature.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  }

  /**
   * Validate segmentation against ground truth
   */
  validateSegmentation(predicted, groundTruth) {
    const gtBoundaries = groundTruth
      .filter(e => e.event === 'process_started')
      .map(e => new Date(e.ts_utc).getTime());

    const predBoundaries = predicted.map(s => new Date(s.start).getTime());

    // Calculate boundary accuracy with tolerance
    const tolerance = 5000; // 5 seconds
    let matches = 0;

    for (const gtBoundary of gtBoundaries) {
      const hasMatch = predBoundaries.some(pb => Math.abs(pb - gtBoundary) <= tolerance);
      if (hasMatch) matches++;
    }

    const precision = matches / predBoundaries.length;
    const recall = matches / gtBoundaries.length;
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

export { ProcessSegmenter };

// CLI usage
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const datasetPath = process.argv[2] || './dataset_a';
  const outputPath = process.argv[3] || './segments.jsonl';

  console.log(`Segmenting dataset: ${datasetPath}`);
  console.log(`Output: ${outputPath}`);

  const loader = new DatasetLoader(datasetPath);
  const segmenter = new ProcessSegmenter({
    minGapSeconds: 5.0,
    minSegmentDuration: 10.0
  });

  const allSegments = [];
  let totalValidation = { predicted: 0, groundTruth: 0, matches: 0 };

  for (const sessionPath of loader.listSessions()) {
    const sessionLoader = loader.loadSession(sessionPath);
    const sessionId = path.basename(sessionPath);

    console.log(`\nProcessing: ${sessionId}`);

    const segments = await segmenter.segmentSession(sessionLoader);
    console.log(`  Segments: ${segments.length}`);

    // Validate if ground truth available
    const gtEvents = await sessionLoader.loadGroundTruth();
    if (gtEvents.length > 0) {
      const validation = segmenter.validateSegmentation(segments, gtEvents);
      console.log(`  Validation: P=${validation.precision} R=${validation.recall} F1=${validation.f1}`);

      totalValidation.predicted += validation.predicted;
      totalValidation.groundTruth += validation.groundTruth;
      totalValidation.matches += validation.matches;
    }

    allSegments.push(...segments);
  }

  // Overall validation
  if (totalValidation.groundTruth > 0) {
    const precision = totalValidation.matches / totalValidation.predicted;
    const recall = totalValidation.matches / totalValidation.groundTruth;
    const f1 = (2 * precision * recall) / (precision + recall);

    console.log('\n' + '='.repeat(80));
    console.log('OVERALL VALIDATION');
    console.log('='.repeat(80));
    console.log(`Predicted boundaries: ${totalValidation.predicted}`);
    console.log(`Ground truth boundaries: ${totalValidation.groundTruth}`);
    console.log(`Matches (±5s): ${totalValidation.matches}`);
    console.log(`Precision: ${precision.toFixed(3)}`);
    console.log(`Recall: ${recall.toFixed(3)}`);
    console.log(`F1 Score: ${f1.toFixed(3)}`);
  }

  // Write output
  const output = allSegments.map(s => ({
    session_id: s.session_id,
    start: s.start,
    end: s.end,
    label: s.label
  }));

  fs.writeFileSync(outputPath, output.map(s => JSON.stringify(s)).join('\n'));
  console.log(`\nWrote ${output.length} segments to ${outputPath}`);
}
