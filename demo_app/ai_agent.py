"""
AI Agent for Document Processing
Uses Anthropic Claude API to intelligently process documents
"""
import os
from anthropic import Anthropic

class DocumentAIAgent:
    """AI-powered document processing agent using Claude"""

    def __init__(self):
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = Anthropic(api_key=api_key)
        self.model = "claude-3-5-sonnet-20241022"

    def process_document(self, document):
        """
        Process document using Claude AI

        Returns:
            dict: {
                'valid': bool,
                'errors': list,
                'ai_analysis': str,
                'recommendation': str,
                'confidence': float,
                'reasoning': str,
                'extracted_metadata': dict
            }
        """

        # Prepare prompt for Claude
        prompt = self._create_analysis_prompt(document)

        try:
            # Call Claude API
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse response
            analysis = message.content[0].text
            result = self._parse_ai_response(analysis, document)

            return result

        except Exception as e:
            print(f"AI Agent error: {e}")
            return {
                'valid': False,
                'errors': [f"AI processing error: {str(e)}"],
                'ai_analysis': None,
                'recommendation': 'ERROR',
                'confidence': 0.0,
                'reasoning': 'Failed to process with AI agent'
            }

    def _create_analysis_prompt(self, doc):
        """Create prompt for Claude to analyze document"""
        return f"""You are a document processing AI agent for an automation system. Analyze this document and provide a structured assessment.

Document Information:
- Title: {doc.get('title', 'N/A')}
- Author: {doc.get('author', 'NOT PROVIDED')}
- Date: {doc.get('date', 'N/A')}
- Format: {doc.get('format', 'N/A')}
- File Size: {doc.get('file_size_mb', 'N/A')} MB
- Content Preview: {doc.get('content', 'N/A')[:500]}

Validation Rules:
1. Must have: title, author, date
2. File size must be ≤ 50 MB
3. Format must be: docx or pdf

Your Task:
1. Check if document meets all validation rules
2. If author is missing, try to extract from content
3. Assess document quality and completeness
4. Make a recommendation: APPROVED, NEEDS_REVIEW, or REJECTED
5. Provide confidence score (0.0 to 1.0)
6. Explain your reasoning

Respond in this exact format:
VALIDATION: [PASS/FAIL]
MISSING_FIELDS: [list any missing required fields]
EXTRACTED_AUTHOR: [if you found author in content, otherwise "N/A"]
RECOMMENDATION: [APPROVED/NEEDS_REVIEW/REJECTED]
CONFIDENCE: [0.0 to 1.0]
REASONING: [your explanation in 1-2 sentences]
QUALITY_NOTES: [any additional observations]"""

    def _parse_ai_response(self, analysis, doc):
        """Parse Claude's response into structured format"""

        lines = analysis.strip().split('\n')
        parsed = {}

        for line in lines:
            if ':' in line:
                key, value = line.split(':', 1)
                parsed[key.strip()] = value.strip()

        # Extract key fields
        validation = parsed.get('VALIDATION', 'FAIL')
        is_valid = validation.upper() == 'PASS'

        missing_fields_str = parsed.get('MISSING_FIELDS', '[]')
        errors = [] if is_valid else ['Validation failed: ' + missing_fields_str]

        extracted_author = parsed.get('EXTRACTED_AUTHOR', 'N/A')
        if extracted_author != 'N/A' and not doc.get('author'):
            doc['author'] = extracted_author
            doc['author_source'] = 'AI Extracted'

        recommendation = parsed.get('RECOMMENDATION', 'NEEDS_REVIEW')

        try:
            confidence = float(parsed.get('CONFIDENCE', '0.5'))
        except:
            confidence = 0.5

        reasoning = parsed.get('REASONING', 'AI analysis completed')
        quality_notes = parsed.get('QUALITY_NOTES', '')

        return {
            'valid': is_valid,
            'errors': errors,
            'ai_analysis': analysis,
            'recommendation': recommendation,
            'confidence': confidence,
            'reasoning': reasoning,
            'extracted_metadata': {
                'author': extracted_author if extracted_author != 'N/A' else None
            },
            'quality_notes': quality_notes
        }

    def explain_decision(self, document, result):
        """
        Get detailed explanation of processing decision
        """
        prompt = f"""Explain in simple terms why this document was {result['recommendation']}.

Document: {document['title']}
Decision: {result['recommendation']}
Confidence: {result['confidence']}

Provide a brief, user-friendly explanation (2-3 sentences) that a non-technical manager would understand."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=256,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            return message.content[0].text
        except:
            return result['reasoning']
