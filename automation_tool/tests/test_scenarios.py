# Test Scenarios for Document Processing Automation

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import DocumentValidator, DocumentFetcher, AutomationOrchestrator

def test_validator():
    """Test validation rules"""
    print("="*80)
    print("TESTING VALIDATION ENGINE")
    print("="*80)

    rules = {
        'required_fields': ['title', 'author', 'date'],
        'max_file_size_mb': 50,
        'allowed_formats': ['docx', 'pdf']
    }

    validator = DocumentValidator(rules)

    test_cases = [
        {
            'name': 'Valid document',
            'doc': {
                'title': 'Test Doc',
                'author': 'John Doe',
                'date': '2026-09-10',
                'file_size_mb': 5,
                'format': 'docx'
            },
            'expected': True
        },
        {
            'name': 'Missing author',
            'doc': {
                'title': 'Test Doc',
                'author': None,
                'date': '2026-09-10',
                'file_size_mb': 5,
                'format': 'docx'
            },
            'expected': False
        },
        {
            'name': 'File too large',
            'doc': {
                'title': 'Test Doc',
                'author': 'John Doe',
                'date': '2026-09-10',
                'file_size_mb': 100,
                'format': 'docx'
            },
            'expected': False
        },
        {
            'name': 'Invalid format',
            'doc': {
                'title': 'Test Doc',
                'author': 'John Doe',
                'date': '2026-09-10',
                'file_size_mb': 5,
                'format': 'txt'
            },
            'expected': False
        }
    ]

    passed = 0
    failed = 0

    for test in test_cases:
        is_valid, errors = validator.validate(test['doc'])
        status = "✓ PASS" if is_valid == test['expected'] else "✗ FAIL"

        print(f"\n{status} - {test['name']}")
        print(f"  Expected: {test['expected']}, Got: {is_valid}")
        if errors:
            print(f"  Errors: {', '.join(errors)}")

        if is_valid == test['expected']:
            passed += 1
        else:
            failed += 1

    print(f"\n{'='*80}")
    print(f"Test Results: {passed} passed, {failed} failed")
    return failed == 0


def test_full_workflow():
    """Test complete workflow"""
    print("\n" + "="*80)
    print("TESTING FULL WORKFLOW")
    print("="*80)

    orchestrator = AutomationOrchestrator()
    results = orchestrator.run(dry_run=True)

    print(f"\nWorkflow test completed")
    print(f"Processed: {len(results)} documents")
    successful = sum(1 for r in results if r['valid'])
    print(f"Success rate: {(successful/len(results)*100):.1f}%")

    return True


if __name__ == '__main__':
    print("Document Processing Automation - Test Suite\n")

    all_passed = True
    all_passed &= test_validator()
    all_passed &= test_full_workflow()

    print("\n" + "="*80)
    if all_passed:
        print("✓ ALL TESTS PASSED")
    else:
        print("✗ SOME TESTS FAILED")
    print("="*80)

    sys.exit(0 if all_passed else 1)
