"""
Data loader for parsing events.jsonl and ground truth files.
"""
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Iterator
from dataclasses import dataclass


@dataclass
class Event:
    """Represents a single event from events.jsonl"""
    event_id: str
    session_id: str
    timestamp_ms: int
    timestamp_iso: str
    layer: str
    event_type: str
    context: Dict
    payload: Dict
    correlation: Dict

    @property
    def timestamp(self) -> datetime:
        return datetime.fromisoformat(self.timestamp_iso.replace('Z', '+00:00'))

    @property
    def active_app(self) -> Optional[Dict]:
        return self.context.get('active_app')

    @property
    def extracted_text(self) -> Optional[str]:
        text_data = self.context.get('extracted_text')
        return text_data.get('text') if text_data else None


@dataclass
class GroundTruthEvent:
    """Represents a ground truth event from gt.jsonl"""
    ts_utc: str
    event: str
    current_process: Optional[str]
    process_code: Optional[str]
    process_name: Optional[str]
    case_id: Optional[str]
    raw: Dict

    @property
    def timestamp(self) -> datetime:
        return datetime.fromisoformat(self.ts_utc)


class SessionLoader:
    """Loads data from a single session directory"""

    def __init__(self, session_path: Path):
        self.session_path = Path(session_path)
        self.session_id = session_path.name

    def load_events(self) -> Iterator[Event]:
        """Load all events from all chunks in the session"""
        chunks = sorted(self.session_path.glob('chunk_*'))

        for chunk_dir in chunks:
            events_file = chunk_dir / 'events.jsonl'
            if not events_file.exists():
                continue

            with open(events_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        yield Event(
                            event_id=data['event_id'],
                            session_id=data['session_id'],
                            timestamp_ms=data['timestamp_ms'],
                            timestamp_iso=data['timestamp_iso'],
                            layer=data['layer'],
                            event_type=data['event_type'],
                            context=data.get('context', {}),
                            payload=data.get('payload', {}),
                            correlation=data.get('correlation', {})
                        )

    def load_ground_truth(self) -> List[GroundTruthEvent]:
        """Load ground truth events if available"""
        gt_file = self.session_path / 'gt.jsonl'
        if not gt_file.exists():
            return []

        events = []
        with open(gt_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data = json.loads(line)
                    events.append(GroundTruthEvent(
                        ts_utc=data['ts_utc'],
                        event=data['event'],
                        current_process=data.get('current_process'),
                        process_code=data.get('process_code'),
                        process_name=data.get('process_name'),
                        case_id=data.get('case_id'),
                        raw=data
                    ))
        return events

    def load_gt_manifest(self) -> Optional[Dict]:
        """Load ground truth manifest if available"""
        manifest_file = self.session_path / 'gt_manifest.json'
        if not manifest_file.exists():
            return None

        with open(manifest_file, 'r', encoding='utf-8') as f:
            return json.load(f)


class DatasetLoader:
    """Loads all sessions from a dataset directory"""

    def __init__(self, dataset_path: Path):
        self.dataset_path = Path(dataset_path)

    def list_sessions(self) -> List[Path]:
        """List all session directories"""
        return sorted(self.dataset_path.glob('ses_*'))

    def load_session(self, session_path: Path) -> SessionLoader:
        """Load a specific session"""
        return SessionLoader(session_path)

    def iter_sessions(self) -> Iterator[SessionLoader]:
        """Iterate over all sessions"""
        for session_path in self.list_sessions():
            yield SessionLoader(session_path)


def count_events_in_session(session_path: Path) -> int:
    """Quick count of events in a session"""
    loader = SessionLoader(session_path)
    return sum(1 for _ in loader.load_events())


def count_events_in_dataset(dataset_path: Path) -> int:
    """Quick count of events in entire dataset"""
    loader = DatasetLoader(dataset_path)
    return sum(count_events_in_session(s.session_path) for s in loader.iter_sessions())
