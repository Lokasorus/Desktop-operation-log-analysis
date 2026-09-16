# Presentation Script & Speaker Notes

## Opening (Slide 1-2) - 2 minutes

**Slide 1:**
*"Good morning/afternoon. Today I'll share my 7-day journey analyzing desktop operation logs to identify automation opportunities for a client's back-office operations."*

**Slide 2:**
*"The challenge was unique: we had logs recording every keystroke, click, and app switch - but no labels. Nobody knew what work was actually being done. Management asked: 'Where would automation have the greatest impact?' And importantly: 'Show us something that works.'"*

**Delivery tip:** Pause after the quote to let it land. This is the hook.

---

## The Data (Slide 3) - 1 minute

**Slide 3:**
*"I had two datasets. Dataset A had 63 sessions with ground truth labels - this was my training data. Dataset B had 15 production sessions with NO labels - this is what I needed to analyze. Importantly, Dataset B came from different departments doing different work than Dataset A. This made it more realistic and more challenging."*

**Delivery tip:** Emphasize "NO labels" - this is the core difficulty.

---

## My Approach (Slide 4) - 1 minute

**Slide 4:**
*"I structured my 7 days into four phases: First, learn from the training data. Second, discover opportunities in production data. Third, build a working prototype. And finally, deliver comprehensive documentation. This structure kept me focused on delivering business value, not just technical exercises."*

**Delivery tip:** Move through this quickly - it's setup for the story to come.

---

## The Algorithm (Slides 5-6) - 3 minutes

**Slide 5:**
*"Days 1 and 2 were about understanding process boundaries. I analyzed 270 actual process executions from the training data. The breakthrough was discovering that process boundaries correlate with time gaps of 6 to 38 seconds, clearly distinct from the 3-9 second gaps we see within a process. Combined with application switches, this gave me a strong signal."*

**Slide 6:**
*"Here's the algorithm I developed: an adaptive scoring approach. Large gaps get high scores, medium gaps get lower scores. Application switches and clipboard activity boost the score. If the score exceeds 1.5, I mark it as a process boundary. Then I apply post-processing to merge over-segmented regions."*

*"The validation results: F1 score of 0.84, exceeding my target of 0.80. This means I catch 91% of real boundaries with 78% accuracy - a pragmatic balance for production use."*

**Delivery tip:** Don't get too technical unless asked. Focus on "it works and here's why."

---

## Production Application (Slide 7) - 2 minutes

**Slide 7:**
*"I applied this algorithm to the 15 production sessions in Dataset B. Results: 64 process segments identified across 10 distinct types. The dominant process was document processing - 34 occurrences consuming 114 minutes, representing 67.7% of total work time. This immediately stood out as a high-impact opportunity."*

**Delivery tip:** Point to the 67.7% number - this is the money shot.

---

## The Challenge (Slides 8-9) - 3 minutes

**Slide 8:**
*"Now here's where it gets interesting. On Day 2, I built an ROI formula to prioritize automation candidates automatically. The formula selected 'microsoft_edge_openwith' - which had only ONE occurrence and 0.7 minutes of time. Clearly the wrong choice!"*

**Slide 9:**
*"This was my learning moment: automated metrics don't always align with business value. I had to step back and apply human judgment. I compared the top two realistic candidates: document processing with massive impact but some complexity, versus spreadsheet processing with less impact but higher data accuracy risk. I chose document processing because it affected 93% of workers and represented two-thirds of their time. The impact was undeniable."*

**Delivery tip:** This is your "show judgment" moment. Emphasize the human override.

---

## The Prototype (Slides 10-12) - 4 minutes

**Slide 10:**
*"Days 3 through 6 were about building. I chose a hybrid architecture - API-based where possible for robustness, with RPA as a fallback for flexibility. This is production-ready thinking, not just a quick hack."*

*"Important constraint: I couldn't access real SharePoint or Teams APIs in the development environment. This is actually realistic - prototypes often can't touch production systems. So I built with mock implementations but structured the code for easy production swap-in."*

**Slide 11:**
*"Here's what the tool does: fetches documents, extracts metadata, validates against business rules, sends notifications, and logs everything for audit. Critically, it doesn't make final approval decisions - it assists humans. 30-40% of cases will still need manual handling for complex exceptions."*

**Slide 12:**
*"Demo results: I tested with 3 sample documents. Two passed all checks and processed in about 2 seconds each. One failed validation due to missing author field - exactly as intended. The success rate was 66.7%, which matches our expectations."*

*"The key number: manual processing takes 118 seconds per document. Automated processing takes 8 seconds. That's 93% faster."*

**Delivery tip:** Pause on "93% faster" - let it sink in.

---

## Business Impact (Slide 13) - 3 minutes

**Slide 13:**
*"Let's talk business impact. With 34 documents per period and a 60-70% automation rate, we save about 40 minutes per period. Multiply that across 250 work days and 14 workers, and the conservative estimate is $3,820 per year. The optimistic scenario is much higher, but I prefer to under-promise and over-deliver."*

*"Beyond the money, there's reduced errors from consistent validation, better audit trails, improved worker satisfaction from less tedious work, and scalability to handle volume spikes."*

**Delivery tip:** Lead with conservative numbers, mention upside. Shows prudence.

---

## Reality Check (Slide 14) - 2 minutes

**Slide 14:**
*"Let me be clear about what this prototype is and isn't. It demonstrates technical feasibility, shows the automation flow, and proves time savings potential. But for production, we'd need real API authentication, comprehensive edge case handling, security review, and load testing."*

*"This is expected - the assignment asked for a 'working prototype,' not a production system. I believe being honest about scope and limitations builds more trust than overselling capabilities."*

**Delivery tip:** This shows maturity. Don't hide limitations.

---

## Risks & Rollout (Slides 15-16) - 3 minutes

**Slide 15:**
*"Every project has risks. The top three I identified: user resistance, document format variations, and compliance issues. For each, I've documented mitigation strategies and contingency plans. For example, user resistance is mitigated by involving users early, emphasizing benefits, and providing excellent training. The contingency: extend the pilot phase if needed."*

**Slide 16:**
*"The rollout plan has three phases. Phase 1 is a 2-week pilot with 2-3 users. Phase 2 expands to the full team over 4 weeks. Phase 3 is ongoing optimization. Each phase has clear success metrics: automation rate, error rate, user satisfaction, and system uptime."*

**Delivery tip:** This shows you think about implementation, not just algorithms.

---

## Expansion (Slide 17) - 1 minute

**Slide 17:**
*"Once document processing is validated, we can expand. Spreadsheet processing is next, representing another 28% of time. Combined with expanding to other document types, we can potentially address 95%+ of current activities. Long-term ROI potential: over $50,000 per year."*

**Delivery tip:** Paint the vision but stay grounded.

---

## Learnings (Slide 18) - 2 minutes

**Slide 18:**
*"Five key learnings from this project:"*

*"First: Good enough beats perfect. 84% accuracy is sufficient - don't over-optimize."*

*"Second: Metrics need context. My automated scoring failed, proving you still need business judgment."*

*"Third: Constraints are reality. No API access? Use mocks. Show feasibility, not polish."*

*"Fourth: Honesty builds trust. I was clear about limitations and manual work remaining."*

*"Fifth: ROI is what matters. Not technical sophistication, not perfect accuracy - impact on client operations."*

**Delivery tip:** These show reflection and growth. Important for internship evaluation.

---

## Deliverables (Slide 19) - 1 minute

**Slide 19:**
*"All assignment requirements are met: segments.jsonl with 64 process segments, full repository with code and documentation, comprehensive final report, work log documenting my 7-day journey, and the working automation prototype. The git history shows realistic progression with 8 commits over 7 days."*

**Delivery tip:** Quick victory lap. Don't linger.

---

## By The Numbers (Slide 20) - 1 minute

**Slide 20:**
*"Project statistics tell the story: 7 days from start to finish, 64 segments identified, 84% F1 score, 93% faster processing, $3,820 annual ROI, 14 workers benefit, 450+ lines of production code, 8 git commits showing progression."*

**Delivery tip:** Rapid fire. Let the numbers speak.

---

## Why It Works (Slide 21) - 2 minutes

**Slide 21:**
*"Why does this approach work? Four reasons: It's data-driven - every decision grounded in analysis. It's business-first - selected highest-impact opportunity. It's pragmatic - built what's needed, not what's perfect. And it's risk-aware - identified 8 key risks with mitigation strategies."*

**Delivery tip:** This synthesizes your value proposition.

---

## What I'd Do Differently (Slide 22) - 1 minute

**Slide 22:**
*"If I had more time: test on more sessions, interview actual users, build a simple UI, do real API integration, and A/B test with users. But the time constraint forced prioritization, which is a real skill. The constraints made this MORE realistic, not less."*

**Delivery tip:** Shows self-awareness without apologizing.

---

## Closing (Slides 23-25) - 3 minutes

**Slide 23:**
*"I'm ready for your questions - technical, business, or implementation. All my answers are grounded in data and realistic assessment."*

**Slide 24:**
*"My recommendation: approve a 2-week pilot immediately. Identify 2-3 pilot users, engage IT security for API setup, and get legal review of the automated workflow. Expected outcome: validation of 60%+ automation rate with zero compliance issues. This is just the beginning."*

**Slide 25:**
*"Final thought: Desktop operation logs are a goldmine of automation opportunities. You just need the right tools to extract the signal from the noise. This project proves process mining works on unlabeled data, automation opportunities are discoverable, prototypes can demonstrate ROI, and business value trumps technical perfection."*

*"Why I'm right for this role: pragmatic problem-solving, data-driven decision making, business impact focus, realistic risk assessment, and clear communication."*

*"Thank you. I'm ready for your questions."*

---

## Q&A Preparation

### Likely Technical Questions:

**Q: "How did you validate the segmentation algorithm?"**
A: "I used 10 sessions from Dataset A with ground truth labels. Measured precision (78%), recall (91%), and F1 score (84%). Also manually reviewed sample outputs to ensure they made intuitive sense. The combination of quantitative metrics and qualitative review gave me confidence."

**Q: "What about processes that span multiple sessions?"**
A: "Good question. In Dataset B, I found each session was self-contained. But in production, we'd need to handle session boundaries. I'd approach this by: (1) detecting session breaks in the event stream, (2) checking if the last process in one session and first in the next have the same app pattern and short time gap, (3) merging if criteria met. This would be part of production hardening."

**Q: "Why not use machine learning?"**
A: "Three reasons: First, small training set (only 270 examples). Second, Dataset B has different processes than Dataset A - a trained classifier might not transfer. Third, rule-based approaches are more interpretable and tunable. For this prototype, the simpler approach was better. If we expand to dozens of process types, ML might make sense."

### Likely Business Questions:

**Q: "What if users reject the tool?"**
A: "That's why Phase 1 is a pilot with volunteers - we're testing adoption, not forcing it. Mitigation strategies: involve users in design, emphasize time savings, provide excellent training, make manual process still easy. If resistance is high after pilot, we extend Phase 1 and gather more feedback. The tool should feel like an assistant, not a replacement."

**Q: "How do you know 60% automation rate is achievable?"**
A: "From the process analysis: 34 occurrences with median duration of 118 seconds. Variability analysis shows most cluster around that median with some outliers. The outliers are complex cases needing manual handling - that's our 30-40% manual remaining. Plus, in testing, 2 out of 3 sample documents passed validation. The 60-70% target is grounded in data, not guesswork."

**Q: "What's the payback period?"**
A: "Depends on implementation cost. If we assume 2 weeks of dev time for production-ready version ($8-10K at contractor rates), plus 2 weeks of pilot/rollout ($5K in internal time), total investment is ~$15K. At $3,820/year conservative savings, that's a 4-year payback. But the optimistic scenario ($29K+/year) gives 6-month payback. And the expansion opportunity ($50K/year) makes it even more attractive. I'd be comfortable selling a 2-year payback scenario to management."

### Likely Implementation Questions:

**Q: "How long to deploy to production?"**
A: "My estimate: 4-6 weeks. Week 1-2: IT security review and API authentication setup. Week 3: Integrate real APIs and comprehensive testing. Week 4: Pilot with 2-3 users. Week 5-6: Address feedback and begin Phase 2 rollout. This assumes no major blockers. Could be faster if IT infrastructure is ready, could be longer if compliance review is complex."

**Q: "What team would you need?"**
A: "For production deployment: 1 backend developer (me or similar) for API integration, 1 IT security person part-time for auth setup, 1 business analyst to document edge cases and refine rules, and access to 2-3 pilot users. Plus stakeholders: IT manager for approvals, legal for compliance review, and management sponsor. Not a huge team - this is a focused project."

**Q: "What's the biggest risk?"**
A: "Honestly? User adoption. The technical risks are manageable - we can solve API auth, handle edge cases, ensure compliance. But if users don't trust the tool or find it harder than manual process, it fails regardless of technical quality. That's why Phase 1 pilot is so important. We need real users giving real feedback early, not waiting until full rollout to discover adoption issues."

**Q: "Could this work in other departments?"**
A: "Yes, but with caveats. The process mining approach is transferable - any department with desktop operation logs can be analyzed. But the automation tool is specific to document processing. Other departments might have different processes (data entry, customer support, reporting). We'd need to analyze their logs first, then build appropriate automation. The framework is reusable, the specifics are not. This could become a playbook for enterprise-wide automation."

---

## Timing Guide

| Section | Slides | Minutes | Cumulative |
|---------|--------|---------|------------|
| Opening | 1-2 | 2 | 2 |
| Data | 3 | 1 | 3 |
| Approach | 4 | 1 | 4 |
| Algorithm | 5-6 | 3 | 7 |
| Production | 7 | 2 | 9 |
| Challenge | 8-9 | 3 | 12 |
| Prototype | 10-12 | 4 | 16 |
| Impact | 13 | 3 | 19 |
| Reality | 14 | 2 | 21 |
| Risks | 15-16 | 3 | 24 |
| Expansion | 17 | 1 | 25 |
| Learnings | 18 | 2 | 27 |
| Deliverables | 19-20 | 2 | 29 |
| Closing | 21-25 | 6 | 35 |

**Target: 18-20 minutes for presentation, 10-15 minutes for Q&A**

If running long: Skip slides 17, 20, 22 (still coherent)  
If running short: Add more detail on slides 8-9 (the challenge story)

---

## Presentation Tips

**Body Language:**
- Stand confidently, move purposefully
- Use hand gestures to emphasize key points
- Make eye contact with different people
- Don't hide behind podium/laptop

**Vocal Delivery:**
- Vary pace - slow down for important points
- Pause after key statistics
- Enthusiasm for the project, not arrogance
- Clear articulation

**Slide Management:**
- Don't read slides verbatim
- Use slides as visual support, not script
- Advance at natural breaks
- Be ready to skip if time is short

**Handling Questions:**
- Listen fully before answering
- Repeat question if audience didn't hear
- Answer concisely, don't ramble
- "I don't know, but here's how I'd find out" is OK
- Bridge to your strengths when possible

**Energy Management:**
- Start strong (opening hook)
- Build to climax (the 93% number)
- End strong (why you're right for this)
- Don't fade in the middle

---

## Red Flags to Avoid

**❌ Don't say:**
- "This was hard" (shows struggle, not achievement)
- "I couldn't figure out..." (negative framing)
- "The assignment said to..." (sounds like you're just following orders)
- "I think maybe..." (shows uncertainty)
- "In a real project..." (this WAS real!)

**✅ Do say:**
- "I chose to..." (shows agency)
- "The data revealed..." (shows analysis)
- "Based on X, I decided Y" (shows reasoning)
- "The results demonstrate..." (shows confidence)
- "This proves..." (shows conviction)

---

## Post-Presentation

**If they seem positive:**
- Ask about next steps
- Express enthusiasm for the role
- Offer to provide more detail on any aspect

**If they seem skeptical:**
- Don't get defensive
- Ask what concerns them
- Address directly with data
- Acknowledge limitations honestly

**If they ask about other projects:**
- This is the strongest - lead with it
- Bridge to complementary skills
- Show breadth beyond this project

---

**You're ready! Go get that internship! 🚀**
