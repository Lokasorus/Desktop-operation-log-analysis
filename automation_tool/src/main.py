"""
Document Processing Automation Tool - Main Orchestrator

This is a prototype demonstrating automated document approval workflow.
Uses mock APIs since real SharePoint/Teams aren't available in dev.
"""
import time
import logging
from datetime import datetime
from typing import List, Dict
from pathlib import Path
import yaml

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = PROJECT_ROOT / 'logs'
LOG_DIR.mkdir(parents=True, exist_ok=True)
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(
            LOG_DIR / f'automation_{datetime.now().strftime("%Y%m%d")}.log',
            encoding='utf-8'
        ),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DocumentFetcher:
    """Fetches documents from repository (SharePoint/OneDrive/etc)"""

    def __init__(self, config):
        self.config = config
        self.source = config.get('document_source', 'mock')
        logger.info(f"Initialized DocumentFetcher with source: {self.source}")

    def fetch_pending_documents(self) -> List[Dict]:
        """Get list of documents pending approval"""
        if self.source == 'mock':
            return self._mock_fetch()
        elif self.source == 'sharepoint':
            return self._sharepoint_fetch()
        else:
            raise ValueError(f"Unknown document source: {self.source}")

    def _mock_fetch(self) -> List[Dict]:
        """Mock implementation for testing"""
        logger.info("Using mock document source")
        # Simulate realistic document data
        return [
            {
                'id': 'DOC001',
                'title': 'Q4 Budget Proposal',
                'author': 'John Smith',
                'date': '2026-09-10',
                'file_size_mb': 2.5,
                'format': 'docx',
                'url': 'https://sharepoint.example.com/docs/DOC001'
            },
            {
                'id': 'DOC002',
                'title': 'Employee Handbook Update',
                'author': 'Sarah Johnson',
                'date': '2026-09-09',
                'file_size_mb': 5.2,
                'format': 'pdf',
                'url': 'https://sharepoint.example.com/docs/DOC002'
            },
            {
                'id': 'DOC003',
                'title': 'Marketing Campaign Brief',
                'author': None,  # Missing author - should fail validation
                'date': '2026-09-08',
                'file_size_mb': 1.8,
                'format': 'docx',
                'url': 'https://sharepoint.example.com/docs/DOC003'
            }
        ]

    def _sharepoint_fetch(self) -> List[Dict]:
        """Real SharePoint implementation (for production)"""
        # This would use SharePoint Graph API
        # from office365.sharepoint.client_context import ClientContext
        # ctx = ClientContext(site_url).with_credentials(...)
        logger.error("SharePoint integration not implemented in prototype")
        raise NotImplementedError("SharePoint API integration pending")


class DocumentValidator:
    """Validates documents against business rules"""

    def __init__(self, rules):
        self.rules = rules
        logger.info(f"Initialized validator with {len(rules)} rule sets")

    def validate(self, document: Dict) -> tuple[bool, List[str]]:
        """
        Validate document against rules
        Returns: (is_valid, list_of_errors)
        """
        errors = []

        # Check required fields
        required_fields = self.rules.get('required_fields', [])
        for field in required_fields:
            if not document.get(field):
                errors.append(f"Missing required field: {field}")

        # Check file size
        max_size = self.rules.get('max_file_size_mb', 50)
        if document.get('file_size_mb', 0) > max_size:
            errors.append(f"File size {document['file_size_mb']}MB exceeds limit of {max_size}MB")

        # Check format
        allowed_formats = self.rules.get('allowed_formats', ['docx', 'pdf'])
        if document.get('format') not in allowed_formats:
            errors.append(f"Format {document['format']} not in allowed list: {allowed_formats}")

        is_valid = len(errors) == 0
        return is_valid, errors


class NotificationService:
    """Sends notifications (Teams/Email/etc)"""

    def __init__(self, config):
        self.config = config
        self.webhook = config.get('teams_webhook')
        logger.info("Initialized NotificationService")

    def notify_approval(self, document: Dict, validation_result: Dict) -> bool:
        """Send approval notification"""
        if self.webhook and self.webhook != 'mock':
            return self._send_teams_message(document, validation_result)
        else:
            return self._mock_notification(document, validation_result)

    def _mock_notification(self, document: Dict, validation_result: Dict) -> bool:
        """Mock notification for testing"""
        logger.info(f"[MOCK] Would send notification for document: {document['id']}")
        logger.info(f"[MOCK] Title: {document['title']}")
        logger.info(f"[MOCK] Status: {'APPROVED' if validation_result['valid'] else 'REJECTED'}")
        return True

    def _send_teams_message(self, document: Dict, validation_result: Dict) -> bool:
        """Real Teams webhook implementation"""
        import requests
        message = {
            "@type": "MessageCard",
            "summary": f"Document {document['id']} processed",
            "sections": [{
                "activityTitle": f"Document: {document['title']}",
                "facts": [
                    {"name": "Author", "value": document.get('author', 'Unknown')},
                    {"name": "Date", "value": document.get('date', 'Unknown')},
                    {"name": "Status", "value": "APPROVED" if validation_result['valid'] else "REJECTED"}
                ]
            }]
        }
        max_retries = int(self.config.get('max_retries', 3))
        retry_delay = float(self.config.get('retry_delay_seconds', 1))
        for attempt in range(max_retries + 1):
            try:
                response = requests.post(self.webhook, json=message, timeout=10)
                if response.status_code == 200:
                    return True
                logger.warning(
                    f"Teams notification returned HTTP {response.status_code} "
                    f"on attempt {attempt + 1}"
                )
            except requests.RequestException as error:
                logger.warning(
                    f"Teams notification failed on attempt {attempt + 1}: {error}"
                )
            if attempt < max_retries:
                time.sleep(retry_delay)
        return False


class AutomationOrchestrator:
    """Main orchestrator for the automation workflow"""

    def __init__(self, config_path=None):
        # Load configuration
        self.config = self._load_config(config_path)

        # Initialize components
        self.fetcher = DocumentFetcher(self.config)
        self.validator = DocumentValidator(self.config.get('validation_rules', {}))
        notification_config = dict(self.config.get('notification', {}))
        notification_config.update(self.config.get('error_handling', {}))
        self.notifier = NotificationService(notification_config)

        # Statistics
        self.stats = {
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'start_time': time.time()
        }

        logger.info("Automation orchestrator initialized")

    def _load_config(self, config_path):
        """Load configuration from file"""
        config_file = Path(config_path) if config_path else PROJECT_ROOT / 'config' / 'rules.yaml'
        if not config_file.is_absolute():
            config_file = Path.cwd() / config_file
        if not config_file.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_file}")

        with config_file.open('r', encoding='utf-8') as stream:
            config = yaml.safe_load(stream) or {}
        if not isinstance(config, dict):
            raise ValueError(f"Configuration must be a YAML mapping: {config_file}")
        return config

    def process_document(self, document: Dict, dry_run=False) -> Dict:
        """Process a single document"""
        doc_id = document.get('id', 'UNKNOWN')
        logger.info(f"Processing document: {doc_id}")

        result = {
            'document_id': doc_id,
            'valid': False,
            'errors': [],
            'processing_time_ms': 0,
            'dry_run': dry_run
        }

        start_time = time.time()

        try:
            # Validate document
            is_valid, errors = self.validator.validate(document)
            result['valid'] = is_valid
            result['errors'] = errors

            if is_valid:
                logger.info(f"[OK] Document {doc_id} passed validation")

                if not dry_run:
                    # Send notification
                    notification_sent = self.notifier.notify_approval(document, result)
                    result['notification_sent'] = notification_sent
                else:
                    logger.info(f"[DRY RUN] Would send notification for {doc_id}")
                    result['notification_sent'] = True

                self.stats['successful'] += 1
            else:
                logger.warning(f"[FAILED] Document {doc_id} failed validation: {', '.join(errors)}")
                self.stats['failed'] += 1

        except Exception as e:
            logger.error(f"Error processing document {doc_id}: {e}")
            result['errors'].append(f"Processing error: {str(e)}")
            self.stats['failed'] += 1

        finally:
            result['processing_time_ms'] = int((time.time() - start_time) * 1000)
            self.stats['processed'] += 1

        return result

    def run(self, dry_run=False, document_id=None):
        """Main execution loop"""
        logger.info("="*80)
        logger.info("DOCUMENT PROCESSING AUTOMATION - STARTING")
        logger.info("="*80)
        logger.info(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")

        # Fetch documents
        documents = self.fetcher.fetch_pending_documents()

        # Filter if specific document requested
        if document_id:
            documents = [d for d in documents if d['id'] == document_id]
            if not documents:
                logger.error(f"Document {document_id} not found")
                return

        logger.info(f"Found {len(documents)} documents to process")

        # Process each document
        results = []
        for doc in documents:
            result = self.process_document(doc, dry_run=dry_run)
            results.append(result)

            # Small delay to simulate realistic processing
            time.sleep(0.5)

        # Print summary
        self._print_summary(results)

        return results

    def _print_summary(self, results):
        """Print execution summary"""
        elapsed = time.time() - self.stats['start_time']

        logger.info("")
        logger.info("="*80)
        logger.info("EXECUTION SUMMARY")
        logger.info("="*80)
        logger.info(f"Total processed: {self.stats['processed']}")
        logger.info(f"Successful: {self.stats['successful']}")
        logger.info(f"Failed: {self.stats['failed']}")
        logger.info(f"Success rate: {(self.stats['successful'] / max(1, self.stats['processed']) * 100):.1f}%")
        logger.info(f"Total time: {elapsed:.2f}s")
        logger.info(f"Avg time per document: {(elapsed / max(1, self.stats['processed'])):.2f}s")

        # Time savings calculation
        manual_time_per_doc = 118  # seconds (median from analysis)
        automated_time_per_doc = elapsed / max(1, self.stats['successful'])
        time_saved = (manual_time_per_doc - automated_time_per_doc) * self.stats['successful']

        logger.info(f"\nTime savings:")
        logger.info(f"  Manual time: {manual_time_per_doc}s per document")
        logger.info(f"  Automated time: {automated_time_per_doc:.1f}s per document")
        logger.info(f"  Saved: {time_saved:.1f}s ({(time_saved/60):.1f} minutes)")
        logger.info("="*80)


def main():
    """Entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Document Processing Automation')
    parser.add_argument('--dry-run', action='store_true', help='Run without making actual changes')
    parser.add_argument('--document-id', type=str, help='Process specific document by ID')
    args = parser.parse_args()

    orchestrator = AutomationOrchestrator()
    orchestrator.run(dry_run=args.dry_run, document_id=args.document_id)


if __name__ == '__main__':
    main()
