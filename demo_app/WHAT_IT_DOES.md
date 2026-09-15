# What This Demo Application Does

## Purpose

This Flask web demo makes the selected document-processing automation workflow visible. It is a deterministic prototype for the project proposal, not a production SharePoint or RPA integration.

The project analysis found a 118-second median manual processing time for the selected workflow. The demo compares that baseline with its own measured validation time and keeps the final approval decision under human control.

## Workflow

1. A sample document or metadata record is submitted.
2. The document enters an in-memory queue and receives a unique ID.
3. Deterministic validation checks required metadata, file size, and format.
4. Optional Groq/Llama processing can extract metadata and provide reasoning.
5. A valid document becomes `READY FOR APPROVAL`.
6. A human approves or rejects the document in the dashboard.
7. Invalid documents become `NEEDS REVIEW` and cannot be approved through the API.
8. The decision and processing result appear in the audit log.

## Included Scenarios

### Q4 Budget Proposal

Complete metadata and an allowed DOCX format. It demonstrates the valid path and the explicit human approval gate.

### Marketing Campaign Brief

Missing author metadata. It demonstrates validation failure, manual review, and protection against automatic approval.

### Employee Handbook Update

Complete metadata and an allowed PDF format. It demonstrates another valid document path.

## Project Alignment

The demo supports the project requirements by showing:

- The highest-impact document workflow selected from Dataset B.
- Rule-based automation for predictable checks.
- Optional AI assistance without making AI the final authority.
- Human review for exceptions and final approval.
- Auditability through decision and processing logs.
- A reproducible demo mode that requires no production credentials.

## What Is Not Implemented

- Real SharePoint or OneDrive retrieval
- Real Teams notification delivery from this browser demo
- RPA/browser automation against desktop applications
- Persistent database storage
- Binary document upload and content extraction

Those are production follow-up items. The prototype intentionally demonstrates the workflow boundary and governance model without pretending to have access to the client systems.

## Technical Stack

- Frontend: vanilla HTML, CSS, and JavaScript
- Backend: Python Flask
- Optional AI: Groq API with Llama 3.1 8B
- Storage: in-memory Python collections

See `README.md` for startup instructions and `TESTING_GUIDE.md` for the complete manual and API test sequence.
