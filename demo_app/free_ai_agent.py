"""
Free AI Agent for Document Processing
Uses Groq API with Llama 3.1 (100% FREE - no credit card needed)
"""
import os
import requests
import json

class FreeDocumentAIAgent:
    """AI-powered document processing agent using FREE Groq API"""

    def __init__(self):
        # Groq API key (FREE tier: 30 requests/minute, no credit card required)
        api_key = os.getenv('GROQ_API_KEY', '')

        if not api_key:
            print("⚠ No GROQ_API_KEY found. Get one FREE at: https://console.groq.com")
            self.enabled = False
        else:
            self.api_key = api_key
            self.enabled = True
            self.api_url = "https://api.groq.com/openai/v1/chat/completions"
            self.model = "llama-3.1-8b-instant"  # Fast and free!

    def process_document(self, document):
        """
        Process document using FREE Groq AI (Llama 3.1)

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

        if not self.enabled:
            return self._fallback_processing(document)

        # Prepare prompt for AI
        prompt = self._create_analysis_prompt(document)

        try:
            # Call Groq API
            response = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a document processing AI agent. Analyze documents and provide structured validation results."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1024
                },
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                analysis = data['choices'][0]['message']['content']
                result = self._parse_ai_response(analysis, document)
                return result
            else:
                print(f"Groq API error: {response.status_code} - {response.text}")
                return self._fallback_processing(document)

        except Exception as e:
            print(f"AI Agent error: {e}")
            return self._fallback_processing(document)

    def _create_analysis_prompt(self, doc):
        """Create prompt for AI to analyze document"""
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
        """Parse AI's response into structured format"""

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
            doc['author_source'] = 'AI Extracted (Llama 3.1)'

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
            'quality_notes': quality_notes,
            'ai_model': 'Llama 3.1 8B (Groq - FREE)'
        }

    def _fallback_processing(self, doc):
        """Basic validation without AI (fallback)"""
        errors = []
        if not doc.get('author'):
            errors.append('Missing required field: author')
        if doc.get('file_size_mb', 0) > 50:
            errors.append('File size exceeds 50MB limit')
        if doc.get('format') not in ['docx', 'pdf']:
            errors.append(f"Format '{doc.get('format')}' not allowed")

        is_valid = len(errors) == 0

        return {
            'valid': is_valid,
            'errors': errors,
            'ai_analysis': None,
            'recommendation': 'APPROVED' if is_valid else 'NEEDS_REVIEW',
            'confidence': 0.95 if is_valid else 0.60,
            'reasoning': 'All validation checks passed' if is_valid else 'Failed validation checks',
            'ai_model': 'Rule-based (no AI)'
        }

    def explain_decision(self, document, result):
        """
        Get detailed explanation of processing decision
        """
        if not self.enabled:
            return result['reasoning']

        prompt = f"""Explain in simple terms why this document was {result['recommendation']}.

Document: {document['title']}
Decision: {result['recommendation']}
Confidence: {result['confidence']}

Provide a brief, user-friendly explanation (2-3 sentences) that a non-technical manager would understand."""

        try:
            response = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 256
                },
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content']
            else:
                return result['reasoning']

        except:
            return result['reasoning']


# Alias for backward compatibility
DocumentAIAgent = FreeDocumentAIAgent
