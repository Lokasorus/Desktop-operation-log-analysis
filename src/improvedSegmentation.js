/**
 * Improved segmentation with parameter tuning and smarter merging
 */
import { ProcessSegmenter } from './segmentation.js';
import { SessionLoader, DatasetLoader } from './dataLoader.js';
import path from 'path';

class ImprovedSegmenter extends ProcessSegmenter {
  constructor(options = {}) {
    super(options);
    // Tuned parameters
    this.minGapSeconds = options.minGapSeconds || 8.0; // Increased from 5
    this.minSegmentDuration = options.minSegmentDuration || 15.0; // Increased from 10
    this.appSwitchGapThreshold = options.appSwitchGapThreshold || 3.0; // Increased from 2
  }

  /**
   * Enhanced boundary identification with context awareness
   */
  identifyBoundaries(events, features) {
    const boundaries = [0];
    const candidates = new Map(); // Use Map to store candidate with score

    // Large time gaps (primary signal)
    for (const { index, gap } of features.timeGaps) {
      if (gap >= this.minGapSeconds) {
        candidates.set(index, (candidates.get(index) || 0) + 2); // High weight
      }
    }

    // App switch with significant gap (secondary signal)
    for (const { index } of features.appSwitches) {
      const gapInfo = features.timeGaps.find(g => g.index === index);
      if (gapInfo && gapInfo.gap >= this.appSwitchGapThreshold) {
        candidates.set(index, (candidates.get(index) || 0) + 1);
      }
    }

    // Only keep candidates with score >= 2 (high confidence)
    const highConfidenceCandidates = Array.from(candidates.entries())
      .filter(([idx, score]) => score >= 2)
      .map(([idx]) => idx)
      .sort((a, b) => a - b);

    // Add boundaries respecting minimum segment duration
    for (const candidate of highConfidenceCandidates) {
      const lastBoundary = boundaries[boundaries.length - 1];
      const timeSinceLastBoundary = (events[candidate].timestamp_ms - events[lastBoundary].timestamp_ms) / 1000;

      if (timeSinceLastBoundary >= this.minSegmentDuration) {
        boundaries.push(candidate);
      }
    }

    return boundaries;
  }

  /**
   * Improved labeling with process signature detection
   */
  inferLabel(segment) {
    // Collect app usage and interaction patterns
    const apps = new Set();
    const windowTitles = new Set();
    let clipboardOps = 0;
    let keystrokeCount = 0;
    let browserNav = 0;

    for (const event of segment.events) {
      if (event.context?.active_app?.app_name) {
        const appName = event.context.active_app.app_name.toLowerCase();
        apps.add(appName);

        // Collect window title keywords
        const title = event.context.active_app.window_title;
        if (title) {
          windowTitles.add(title.toLowerCase());
        }
      }

      // Count interaction types
      if (event.event_type === 'clipboard_change') clipboardOps++;
      if (event.event_type === 'keystroke') keystrokeCount++;
      if (event.event_type === 'browser_navigation') browserNav++;
    }

    const appArray = Array.from(apps).sort();
    const hasExcel = appArray.includes('microsoft excel');
    const hasChrome = appArray.includes('google chrome');
    const hasNotepad = appArray.some(a => a.includes('notepad'));
    const hasOutlook = appArray.includes('microsoft outlook');
    const hasWord = appArray.includes('microsoft word');

    // Classify based on app combination and interaction pattern
    if (hasChrome && hasExcel && clipboardOps >= 2) {
      return 'data_entry_verification'; // HR/Finance data tasks
    } else if (hasChrome && (hasNotepad || hasWord) && !hasExcel) {
      return 'documentation_review'; // Review/approval tasks
    } else if (hasOutlook) {
      return 'communication_task'; // Email-based processes
    } else if (hasChrome && browserNav >= 2) {
      return 'web_workflow'; // Portal navigation
    } else if (hasExcel && keystrokeCount >= 20) {
      return 'spreadsheet_processing'; // Heavy Excel work
    } else {
      // Fallback: use app signature
      const sig = appArray.join('_').replace(/[^a-z0-9_]/gi, '_');
      return sig || 'unknown_process';
    }
  }
}

// Test the improved segmenter
console.log('Testing improved segmentation...\n');

const sessionPath = path.join(process.cwd(), 'dataset_a', 'ses_20260630-121953-LAPTOP-R36BQBTE');
const sessionLoader = new SessionLoader(sessionPath);

const improvedSegmenter = new ImprovedSegmenter({
  minGapSeconds: 8.0,
  minSegmentDuration: 15.0,
  appSwitchGapThreshold: 3.0
});

const segments = await improvedSegmenter.segmentSession(sessionLoader);
const gtEvents = await sessionLoader.loadGroundTruth();
const validation = improvedSegmenter.validateSegmentation(segments, gtEvents);

console.log('Results:');
console.log(`  Segments: ${segments.length}`);
console.log(`  Ground truth: ${gtEvents.filter(e => e.event === 'process_started').length}`);
console.log(`  Precision: ${validation.precision}`);
console.log(`  Recall: ${validation.recall}`);
console.log(`  F1 Score: ${validation.f1}`);

console.log('\nFirst 10 segments:');
for (let i = 0; i < Math.min(10, segments.length); i++) {
  const seg = segments[i];
  console.log(`  ${i + 1}. ${seg.start.substr(11, 8)} - ${seg.end.substr(11, 8)} (${seg.duration.toFixed(1)}s) [${seg.label}]`);
}

export { ImprovedSegmenter };
