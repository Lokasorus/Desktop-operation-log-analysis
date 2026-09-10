/**
 * Data loader for parsing events.jsonl and ground truth files
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';

export class SessionLoader {
  constructor(sessionPath) {
    this.sessionPath = sessionPath;
    this.sessionId = path.basename(sessionPath);
  }

  async loadEvents() {
    const events = [];
    const chunkDirs = fs.readdirSync(this.sessionPath)
      .filter(name => name.startsWith('chunk_'))
      .sort();

    for (const chunkDir of chunkDirs) {
      const eventsFile = path.join(this.sessionPath, chunkDir, 'events.jsonl');
      if (!fs.existsSync(eventsFile)) continue;

      const fileStream = fs.createReadStream(eventsFile);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        if (line.trim()) {
          events.push(JSON.parse(line));
        }
      }
    }

    return events.sort((a, b) => a.timestamp_ms - b.timestamp_ms);
  }

  async loadGroundTruth() {
    const gtFile = path.join(this.sessionPath, 'gt.jsonl');
    if (!fs.existsSync(gtFile)) return [];

    const events = [];
    const fileStream = fs.createReadStream(gtFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim()) {
        events.push(JSON.parse(line));
      }
    }

    return events;
  }

  loadGroundTruthManifest() {
    const manifestFile = path.join(this.sessionPath, 'gt_manifest.json');
    if (!fs.existsSync(manifestFile)) return null;
    return JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
  }
}

export class DatasetLoader {
  constructor(datasetPath) {
    this.datasetPath = datasetPath;
  }

  listSessions() {
    return fs.readdirSync(this.datasetPath)
      .filter(name => name.startsWith('ses_'))
      .map(name => path.join(this.datasetPath, name))
      .sort();
  }

  loadSession(sessionPath) {
    return new SessionLoader(sessionPath);
  }
}
