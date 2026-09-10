"""
Initial exploratory analysis of Dataset A.
Goal: Understand patterns in events and ground truth to inform segmentation algorithm.
"""
import sys
sys.path.append('../src')

from pathlib import Path
from data_loader import DatasetLoader, SessionLoader
from feature_extractor import FeatureExtractor, analyze_app_patterns
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import json

# Load Dataset A
dataset_a_path = Path('../dataset_a')
loader = DatasetLoader(dataset_a_path)

print("="*80)
print("DATASET A EXPLORATION")
print("="*80)

# Count sessions and events
sessions = loader.list_sessions()
print(f"\nTotal sessions: {len(sessions)}")

# Analyze first session in detail
first_session = sessions[0]
print(f"\nAnalyzing session: {first_session.name}")

session_loader = SessionLoader(first_session)
events = list(session_loader.load_events())
gt_events = session_loader.load_ground_truth()
gt_manifest = session_loader.load_gt_manifest()

print(f"  Events: {len(events)}")
print(f"  Ground truth events: {len(gt_events)}")

# Analyze ground truth structure
print("\n" + "="*80)
print("GROUND TRUTH ANALYSIS")
print("="*80)

if gt_manifest:
    print(f"\nSession duration: {gt_manifest['session']['start_ts']} to {gt_manifest['session']['end_ts']}")
    print(f"Number of processes: {len(gt_manifest['processes'])}")

    print("\nProcesses in this session:")
    for proc in gt_manifest['processes']:
        print(f"  {proc['code']}: {proc['family_name']} ({proc['domain']})")
        print(f"    Executions: {len(proc['executions'])}")
        for exec in proc['executions'][:2]:  # Show first 2 executions
            duration = (datetime.fromisoformat(exec['end_ts']) - datetime.fromisoformat(exec['start_ts'])).total_seconds()
            print(f"      - {exec['case_id']}: {duration:.1f}s, apps={exec['apps']}, variant={exec.get('variant', 'N/A')}")

# Analyze ground truth events
print("\n" + "="*80)
print("GROUND TRUTH EVENT TYPES")
print("="*80)

gt_event_types = Counter(e.event for e in gt_events)
print("\nEvent type distribution:")
for event_type, count in gt_event_types.most_common():
    print(f"  {event_type}: {count}")

# Analyze process boundaries
print("\n" + "="*80)
print("PROCESS BOUNDARY PATTERNS")
print("="*80)

process_starts = [e for e in gt_events if e.event == 'process_started']
process_ends = [e for e in gt_events if e.event in ['process_switched_out', 'process_suspended']]

print(f"\nProcess starts: {len(process_starts)}")
print(f"Process ends: {len(process_ends)}")

if process_starts:
    print("\nFirst 5 process transitions:")
    for i in range(min(5, len(process_starts))):
        start = process_starts[i]
        print(f"  {start.timestamp.strftime('%H:%M:%S')} - START: {start.process_code} ({start.process_name}) - {start.case_id}")

# Analyze event types
print("\n" + "="*80)
print("EVENT TYPE ANALYSIS")
print("="*80)

event_types = Counter(e.event_type for e in events)
print("\nMost common event types:")
for event_type, count in event_types.most_common(15):
    print(f"  {event_type}: {count}")

layer_dist = Counter(e.layer for e in events)
print("\nEvent layers:")
for layer, count in layer_dist.items():
    print(f"  {layer}: {count}")

# Analyze application usage
print("\n" + "="*80)
print("APPLICATION USAGE")
print("="*80)

app_patterns = analyze_app_patterns(events)
print("\nApplication usage statistics:")
for app, stats in sorted(app_patterns.items(), key=lambda x: x[1]['total_seconds'], reverse=True):
    print(f"  {app}:")
    print(f"    Switches: {stats['count']}")
    print(f"    Total time: {stats['total_seconds']:.1f}s")
    print(f"    Avg duration: {stats['avg_seconds']:.1f}s")

# Extract features
print("\n" + "="*80)
print("FEATURE EXTRACTION")
print("="*80)

extractor = FeatureExtractor()
features = extractor.extract_features(events)

print(f"\nApp switches detected: {len(features.app_switches)}")
print(f"Browser navigations: {len(features.browser_navigations)}")
print(f"Keyboard bursts: {len(features.keyboard_bursts)}")
print(f"Text segments: {len(features.text_segments)}")

# Analyze time gaps
time_gaps = features.time_gaps
large_gaps = [g for g in time_gaps if g >= 5.0]
print(f"\nTime gaps >= 5s: {len(large_gaps)}")
if large_gaps:
    print(f"  Min: {min(large_gaps):.1f}s")
    print(f"  Max: {max(large_gaps):.1f}s")
    print(f"  Avg: {sum(large_gaps)/len(large_gaps):.1f}s")

# Compare boundaries
likely_boundaries = extractor.identify_likely_boundaries(events, features)
print(f"\nIdentified likely boundaries: {len(likely_boundaries)}")
print(f"Actual process boundaries (from GT): {len([e for e in gt_events if e.event == 'process_started'])}")

print("\n" + "="*80)
print("ANALYSIS COMPLETE")
print("="*80)
