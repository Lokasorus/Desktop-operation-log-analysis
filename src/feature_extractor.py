"""
Feature extraction for segmentation algorithm.
Extracts meaningful signals from raw events that help identify process boundaries.
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import Counter
from dataclasses import dataclass
import re


@dataclass
class SessionFeatures:
    """Features extracted from a session for segmentation"""

    # Time-based features
    time_gaps: List[float]  # seconds between consecutive events

    # Application switching patterns
    app_switches: List[Dict]  # {timestamp, from_app, to_app}
    app_sequence: List[str]  # sequence of app names

    # Window title changes
    window_titles: List[Dict]  # {timestamp, app, title}

    # Activity intensity
    events_per_minute: List[int]

    # Text patterns (from extracted_text)
    text_segments: List[Dict]  # {timestamp, text}

    # Browser activity
    browser_navigations: List[Dict]  # {timestamp, url, title}

    # Input patterns
    keyboard_bursts: List[Dict]  # {start, end, char_count}
    clipboard_activities: List[Dict]  # {timestamp, type}


class FeatureExtractor:
    """Extracts features from event stream"""

    def __init__(self):
        self.min_gap_for_boundary = 5.0  # seconds
        self.keyboard_burst_gap = 2.0  # seconds

    def extract_features(self, events: List) -> SessionFeatures:
        """Extract all features from event list"""

        # Sort events by timestamp
        events = sorted(events, key=lambda e: e.timestamp_ms)

        # Time gaps
        time_gaps = []
        for i in range(1, len(events)):
            gap = (events[i].timestamp_ms - events[i-1].timestamp_ms) / 1000.0
            time_gaps.append(gap)

        # App switches
        app_switches = []
        app_sequence = []
        for event in events:
            if event.event_type == 'app_switch':
                payload = event.payload
                app_switches.append({
                    'timestamp': event.timestamp,
                    'from_app': payload.get('previous_app', {}).get('app_name'),
                    'to_app': payload.get('new_app', {}).get('app_name')
                })
                to_app = payload.get('new_app', {}).get('app_name')
                if to_app:
                    app_sequence.append(to_app)

        # Window titles
        window_titles = []
        for event in events:
            active_app = event.active_app
            if active_app and 'window_title' in active_app:
                window_titles.append({
                    'timestamp': event.timestamp,
                    'app': active_app.get('app_name'),
                    'title': active_app.get('window_title')
                })

        # Events per minute
        events_per_minute = self._compute_events_per_minute(events)

        # Text segments
        text_segments = []
        for event in events:
            text = event.extracted_text
            if text and len(text.strip()) > 10:
                text_segments.append({
                    'timestamp': event.timestamp,
                    'text': text
                })

        # Browser navigations
        browser_navigations = []
        for event in events:
            if event.event_type == 'browser_navigation':
                payload = event.payload
                browser_navigations.append({
                    'timestamp': event.timestamp,
                    'url': payload.get('url'),
                    'title': payload.get('title')
                })

        # Keyboard bursts
        keyboard_bursts = self._extract_keyboard_bursts(events)

        # Clipboard activities
        clipboard_activities = []
        for event in events:
            if event.event_type == 'clipboard_change':
                clipboard_activities.append({
                    'timestamp': event.timestamp,
                    'type': 'clipboard'
                })

        return SessionFeatures(
            time_gaps=time_gaps,
            app_switches=app_switches,
            app_sequence=app_sequence,
            window_titles=window_titles,
            events_per_minute=events_per_minute,
            text_segments=text_segments,
            browser_navigations=browser_navigations,
            keyboard_bursts=keyboard_bursts,
            clipboard_activities=clipboard_activities
        )

    def _compute_events_per_minute(self, events: List) -> List[int]:
        """Compute event density over time"""
        if not events:
            return []

        start_time = events[0].timestamp
        end_time = events[-1].timestamp
        duration_minutes = int((end_time - start_time).total_seconds() / 60) + 1

        counts = [0] * duration_minutes
        for event in events:
            minute_idx = int((event.timestamp - start_time).total_seconds() / 60)
            if 0 <= minute_idx < len(counts):
                counts[minute_idx] += 1

        return counts

    def _extract_keyboard_bursts(self, events: List) -> List[Dict]:
        """Identify bursts of keyboard activity"""
        bursts = []
        current_burst = None

        for event in events:
            if event.event_type == 'keystroke':
                if current_burst is None:
                    current_burst = {
                        'start': event.timestamp,
                        'end': event.timestamp,
                        'count': 1
                    }
                else:
                    gap = (event.timestamp - current_burst['end']).total_seconds()
                    if gap <= self.keyboard_burst_gap:
                        current_burst['end'] = event.timestamp
                        current_burst['count'] += 1
                    else:
                        bursts.append(current_burst)
                        current_burst = {
                            'start': event.timestamp,
                            'end': event.timestamp,
                            'count': 1
                        }

        if current_burst:
            bursts.append(current_burst)

        return bursts

    def identify_likely_boundaries(self, events: List, features: SessionFeatures) -> List[datetime]:
        """Identify timestamps that are likely process boundaries"""
        candidates = []

        # Large time gaps
        for i, gap in enumerate(features.time_gaps):
            if gap >= self.min_gap_for_boundary:
                candidates.append(events[i+1].timestamp)

        # App switches combined with time gaps
        for switch in features.app_switches:
            # Check if there's a time gap around this switch
            candidates.append(switch['timestamp'])

        # Deduplicate and sort
        candidates = sorted(set(candidates))

        return candidates


def analyze_app_patterns(events: List) -> Dict:
    """Analyze application usage patterns"""
    app_durations = {}
    current_app = None
    current_start = None

    for event in events:
        if event.event_type == 'app_switch':
            if current_app and current_start:
                duration = (event.timestamp - current_start).total_seconds()
                if current_app not in app_durations:
                    app_durations[current_app] = []
                app_durations[current_app].append(duration)

            current_app = event.payload.get('new_app', {}).get('app_name')
            current_start = event.timestamp

    # Compute statistics
    stats = {}
    for app, durations in app_durations.items():
        stats[app] = {
            'count': len(durations),
            'total_seconds': sum(durations),
            'avg_seconds': sum(durations) / len(durations) if durations else 0
        }

    return stats
