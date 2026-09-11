## Day 2 Roadmap - 2026-09-11

### Morning Session (Hours 1-4)

#### Task 1: Validate and Optimize Segmentation (2 hours)
**Goal:** Achieve F1 > 0.80 on Dataset A

**Steps:**
1. Test optimized segmenter on all 63 Dataset A sessions
2. Measure aggregate precision, recall, F1
3. If F1 < 0.80:
   - Adjust gap threshold (try 5s, 6s, 8s)
   - Tune minimum segment duration
   - Add context-aware merging
4. Document final parameters chosen

**Success criteria:** F1 ≥ 0.80, Recall ≥ 0.85

---

#### Task 2: Generate segments.jsonl for Dataset B (1.5 hours)
**Goal:** Complete Step 1 deliverable

**Steps:**
1. Run optimized segmenter on all 15 Dataset B sessions
2. Generate segments.jsonl with format:
   ```json
   {"session_id": "ses_...", "start": "2026-07-01T18:32:32Z", "end": "2026-07-01T18:35:41Z", "label": "process_name"}
   ```
3. Validate output format
4. Generate statistics report (segments per session, label distribution)

**Output:** `segments.jsonl` (Deliverable #1)

---

#### Task 3: Initial Dataset B Analysis (0.5 hours)
**Quick exploration:**
- Load Dataset B sessions
- Count unique process labels
- Calculate basic statistics (avg duration, frequency)
- Identify which machines/users

---

### Afternoon Session (Hours 5-8)

#### Task 4: Deep Dataset B Analysis (2 hours)
**Goal:** Understand work patterns for Step 2

**Analysis dimensions:**
1. **Process inventory:**
   - List all unique process types
   - Frequency of each (executions per session, per day)
   - Total time consumed by each

2. **Complexity analysis:**
   - Which processes have most steps?
   - Application diversity per process
   - Clipboard operations (data copying patterns)
   - Keyboard vs mouse interaction ratios

3. **People/machine analysis:**
   - How many workers?
   - Department distribution (infer from patterns)
   - Workload per person

**Output:** Analysis report with tables and charts

---

#### Task 5: Automation Candidate Prioritization (2 hours)
**Goal:** Complete Step 2 - ranked candidate list

**Prioritization framework:**
1. **Impact score** (40%):
   - Frequency × Duration = Time savings potential
   - Number of people affected
   
2. **Feasibility score** (40%):
   - Deterministic vs variable logic
   - System access complexity
   - Data availability
   - Decision branches
   
3. **Risk score** (20%):
   - Governance constraints
   - Error impact
   - Rollback difficulty

**Selection criteria:**
- Choose top 3-5 candidates
- At least 1 must be highly feasible for Step 3 prototype

**Output:** Prioritized list with justification document

---

### Expected End of Day 2 Status

**Deliverables:**
- ✅ segments.jsonl (Step 1 complete)
- ✅ Dataset B analysis report
- ✅ Prioritized automation candidates (Step 2 complete)
- ✅ Selected process for Step 3 prototype

**Git commits:** 4-6 commits documenting:
- Segmentation validation results
- Dataset B analysis
- Automation candidate prioritization

**Ready for Day 3:**
- Clear target process for automation
- Understanding of its requirements
- Feasibility assessment complete

---

### Contingency Plans

**If F1 < 0.80 takes longer:**
- Reduce Dataset B deep analysis time
- Defer some candidate analysis to Day 3 morning

**If Dataset B has unexpected patterns:**
- Re-run segmentation with adjusted parameters
- Document differences from Dataset A

**If segmentation.jsonl needs revision:**
- Version it (segments_v1.jsonl, segments_v2.jsonl)
- Keep changelog of what changed

---

*Prepared: 2026-09-10 17:35 UTC*
*Status: Ready for Day 2 execution*
