# BMad-Method Development Workflow for 100% PRD Compliance

## CRITICAL BMad-METHOD ACTIVATION INSTRUCTIONS

This workflow follows the **BMad-Method framework religiously** and integrates with the official BMad agent personas. All development must achieve **100% PRD compliance** as specified in `PRD_COMPLETION_ROADMAP.md`.

### BMAD AGENT ACTIVATION SEQUENCE

#### STEP 1: ACTIVATE DEVELOPMENT AGENT (James)
```bash
# Activate the official BMad Development Agent
@.bmad-core/agents/dev.md

# James will greet you and await commands
# James has access to:
# - Story implementation workflows
# - Testing and validation frameworks
# - Code quality standards from devLoadAlwaysFiles
# - Story file update permissions (Dev Agent Record sections only)
```

#### STEP 2: ACTIVATE QA AGENT (Quinn)
```bash
# Activate the official BMad QA Agent for senior review
@.bmad-core/agents/qa.md

# Quinn will greet you and await commands
# Quinn has access to:
# - Story review workflows
# - Quality assurance frameworks
# - Senior developer review capabilities
# - QA Results section update permissions only
```

### BMAD-METHOD WORKFLOW INTEGRATION

#### PHASE 1: PRD ROADMAP ANALYSIS AND STORY SELECTION
**For Project Manager/Coordinator:**
```
1. Review PRD_COMPLETION_ROADMAP.md to identify next CRITICAL PRIORITY story
2. Ensure story file exists in docs/stories/ directory
3. Verify story status is "Ready for Review" or "Draft"
4. Activate James (Development Agent) with specific story directive
5. Provide James with PRD_COMPLETION_ROADMAP.md context for the target story
```

#### PHASE 2: JAMES (DEV AGENT) IMPLEMENTATION DIRECTIVE

**CRITICAL: James must follow BMad-Method develop-story workflow religiously:**

**BMad Development Standards (from devLoadAlwaysFiles):**
- ✅ **Coding Standards**: Follow docs/architecture/coding-standards.md exactly
- ✅ **Tech Stack Compliance**: Adhere to docs/architecture/tech-stack.md specifications
- ✅ **Source Tree Structure**: Follow docs/architecture/source-tree.md organization
- ✅ **Story-Driven Development**: Implement ONLY what's specified in story acceptance criteria
- ✅ **Sequential Task Execution**: Complete tasks in order, mark [x] only when ALL validations pass

**PRD Compliance Integration (from PRD_COMPLETION_ROADMAP.md):**
- ✅ **Functional Requirements**: Every FR from roadmap must be 100% implemented
- ✅ **Non-Functional Requirements**: Every NFR must be met with validation
- ✅ **Acceptance Criteria**: All ACs from story file must be fully satisfied
- ✅ **Code Templates**: Use exact TypeScript templates from PRD_COMPLETION_ROADMAP.md
- ✅ **File Structure**: Create/modify files exactly as specified in roadmap

**BMad Story File Updates (James Permissions):**
- ✅ **Tasks/Subtasks**: Mark [x] only when task is complete and tested
- ✅ **Dev Agent Record**: Update Agent Model Used, Debug Log, Completion Notes, File List
- ✅ **Status Updates**: Change status to "Ready for Review" when complete
- ❌ **FORBIDDEN**: Do NOT modify Story, Acceptance Criteria, Dev Notes, or other sections

#### PHASE 3: BMAD STORY IMPLEMENTATION EXECUTION

**James must execute using BMad develop-story workflow:**

```bash
# James will use his *develop command to implement the story
*develop {story-number}

# This triggers the BMad develop-story.md workflow which:
# 1. Loads the story file from docs/stories/
# 2. Analyzes acceptance criteria and tasks
# 3. Follows sequential task execution
# 4. Updates Dev Agent Record sections only
# 5. Marks tasks [x] only when complete and validated
```

**CRITICAL: James must integrate PRD_COMPLETION_ROADMAP.md specifications:**

```typescript
// STEP 1: Load PRD Roadmap Context for Target Story
// James must reference PRD_COMPLETION_ROADMAP.md for:
// - Exact code templates for the story
// - File creation/modification requirements
// - Acceptance criteria validation methods
// - Integration points with existing codebase

// STEP 2: Follow BMad Sequential Task Execution
// Execute each task in story file sequentially
// Use PRD roadmap code templates as implementation guide
// Validate each task against roadmap specifications
// Mark [x] only when task passes all validations

// STEP 3: Create Files According to Roadmap Structure
// Follow exact file paths from PRD_COMPLETION_ROADMAP.md
// Use provided TypeScript templates as starting points
// Implement comprehensive error handling and validation
// Include proper TypeScript typing and documentation

// STEP 4: Update Story File (Dev Agent Record Only)
// Update Agent Model Used, Debug Log, Completion Notes
// List all files created/modified
// Change status to "Ready for Review" when complete
// DO NOT modify other story sections
```

#### PHASE 4: BMAD STORY COMPLETION VALIDATION

**James must validate using BMad standards before handover:**

```bash
# James validates completion using BMad workflow:
# ✅ All story tasks marked [x] and validated
# ✅ All acceptance criteria implemented and tested
# ✅ Dev Agent Record updated with complete information
# ✅ Story status changed to "Ready for Review"
# ✅ All files follow devLoadAlwaysFiles standards
# ✅ PRD roadmap specifications fully implemented
```

#### PHASE 5: BMAD HANDOVER TO QA (QUINN)

**James completes handover using BMad story file updates:**

```yaml
# James updates Dev Agent Record section in story file:
Dev Agent Record:
  Agent Model Used: "Claude Sonnet 4 via Augment Agent"
  Debug Log: ".ai/debug-log.md"
  Completion Notes: |
    - Implemented all acceptance criteria per PRD_COMPLETION_ROADMAP.md
    - Created/modified files: [list]
    - Integrated with existing codebase successfully
    - All tests passing with required coverage
    - Ready for Quinn (QA) review
  File List:
    - src/lib/[component]/[file].ts (NEW/MODIFIED)
    - src/app/api/[endpoint]/route.ts (NEW/MODIFIED)
    - [additional files...]

Status: "Ready for Review"
```

**CRITICAL: James must NOT create separate implementation reports - all information goes in the story file Dev Agent Record section only, following BMad-Method protocols.**

---

## CRITICAL INSTRUCTIONS FOR QUINN (QA AGENT)

**Quinn operates as Senior Developer & QA Architect** following BMad-Method review protocols. Quinn conducts **COMPREHENSIVE, MULTI-DIRECTIONAL REVIEWS** of all James implementations. Quinn's approval is REQUIRED before any story reaches production.

### BMAD QA REVIEW WORKFLOW

#### QUINN ACTIVATION AND REVIEW COMMAND
```bash
# Activate Quinn for story review
@.bmad-core/agents/qa.md

# Quinn uses BMad review workflow
*review {story-number}

# This triggers review-story.md workflow which:
# 1. Loads story file from docs/stories/
# 2. Analyzes James's implementation in Dev Agent Record
# 3. Conducts comprehensive technical review
# 4. Updates QA Results section only
# 5. Provides APPROVED/REJECTED decision
```

#### PHASE 1: BMAD COMPREHENSIVE TECHNICAL REVIEW

**Quinn's BMad Review Standards (MANDATORY)**
```bash
# Quinn follows BMad review-story.md workflow which validates:

✅ BMad Architecture Compliance
   - Follows docs/architecture/coding-standards.md exactly
   - Adheres to docs/architecture/tech-stack.md specifications
   - Respects docs/architecture/source-tree.md organization
   - Implements story acceptance criteria completely

✅ PRD Roadmap Integration Validation
   - All PRD_COMPLETION_ROADMAP.md specifications implemented
   - Code templates from roadmap properly utilized
   - File structure matches roadmap requirements exactly
   - Functional/Non-Functional Requirements satisfied

✅ BMad Story File Compliance
   - All tasks marked [x] are actually complete and tested
   - Dev Agent Record contains accurate implementation details
   - Status correctly reflects completion state
   - No unauthorized modifications to story sections

✅ Technical Excellence (BMad Standards)
   - TypeScript strict mode compliance
   - Comprehensive error handling and validation
   - Performance benchmarks from PRD roadmap met
   - Security measures properly implemented
   - Test coverage meets BMad quality standards
```

#### PHASE 2: BMAD PRD COMPLIANCE VALIDATION

**Quinn validates PRD compliance using BMad review protocols:**

```yaml
# Quinn's BMad Review Checklist (from review-story.md):

PRD_COMPLETION_ROADMAP Integration:
✅ Story implements exact specifications from roadmap
✅ All Functional Requirements (FRs) 100% satisfied
✅ All Non-Functional Requirements (NFRs) met with validation
✅ Code templates from roadmap properly implemented
✅ File structure matches roadmap specifications exactly

Story Acceptance Criteria Validation:
✅ Every AC in story file is fully implemented
✅ Implementation is testable and has been tested
✅ User workflows are complete and functional
✅ Integration points work correctly with existing codebase
✅ Error scenarios are handled appropriately

BMad Quality Standards:
✅ Follows technical-preferences.md guidelines
✅ Meets BMad testing and validation standards
✅ Adheres to BMad architectural principles
✅ Implements proper BMad error handling patterns
✅ Documentation follows BMad standards
```

#### PHASE 3: TESTING & QUALITY ASSURANCE

**Test Coverage Analysis (MANDATORY)**
```
✅ Unit Test Coverage: 95%+ required
   - All functions and methods tested
   - Edge cases covered
   - Error scenarios tested
   - Mock implementations proper

✅ Integration Test Coverage: Complete workflows
   - API endpoints tested end-to-end
   - Database interactions validated
   - External service integrations tested
   - Authentication flows validated

✅ E2E Test Coverage: User journeys
   - Complete user workflows tested
   - Cross-browser compatibility
   - Mobile responsiveness validated
   - Performance under load tested
```

#### PHASE 4: PRODUCTION READINESS ASSESSMENT

**Deployment Readiness (MANDATORY)**
```
✅ Configuration Management
   - Environment variables properly configured
   - Secrets management implemented
   - Configuration validation

✅ Monitoring & Observability
   - Proper logging implemented
   - Error tracking configured
   - Performance monitoring enabled
   - Health checks implemented

✅ Scalability & Performance
   - Load testing completed
   - Resource usage optimized
   - Caching strategies implemented
   - Database performance validated

✅ Security & Compliance
   - Security scan completed
   - Vulnerability assessment passed
   - Compliance requirements met
   - Data privacy measures implemented
```

#### PHASE 5: BMAD QA DECISION (QUINN'S REVIEW OUTCOME)

**Quinn MUST update QA Results section in story file with ONE of these decisions:**

### OPTION A: BMAD APPROVED ✅
```yaml
# Quinn updates QA Results section in story file:
QA Results:
  Reviewer: "Quinn (Senior Developer & QA Architect)"
  Review Date: "[Date]"
  Status: "APPROVED"

  BMad Compliance:
    Architecture Standards: "PASS"
    Coding Standards: "PASS"
    Tech Stack Compliance: "PASS"
    Source Tree Organization: "PASS"

  PRD Roadmap Compliance:
    Functional Requirements: "100% IMPLEMENTED"
    Non-Functional Requirements: "100% SATISFIED"
    Code Templates Integration: "COMPLETE"
    File Structure: "MATCHES SPECIFICATIONS"

  Story Implementation:
    Acceptance Criteria: "ALL SATISFIED"
    Task Completion: "VALIDATED"
    Integration Testing: "PASS"
    Performance Benchmarks: "MET/EXCEEDED"

  Quality Assessment:
    Code Quality: "EXCELLENT"
    Test Coverage: "[X%] - MEETS STANDARDS"
    Security Implementation: "COMPREHENSIVE"
    Documentation: "COMPLETE"

  Production Readiness: "APPROVED FOR DEPLOYMENT"

  Next Recommended Story: "[Next Priority from PRD_COMPLETION_ROADMAP.md]"
```

### OPTION B: BMAD REJECTED ❌
```yaml
# Quinn updates QA Results section in story file:
QA Results:
  Reviewer: "Quinn (Senior Developer & QA Architect)"
  Review Date: "[Date]"
  Status: "REJECTED - REQUIRES REWORK"

  Critical Issues:
    - Issue: "[Specific problem description]"
      Impact: "[Why this prevents approval]"
      Required Fix: "[Exact steps to resolve]"
      Validation: "[How James should verify the fix]"

    - Issue: "[Additional critical issues...]"

  BMad Compliance Failures:
    Architecture Standards: "[PASS/FAIL with details]"
    PRD Roadmap Integration: "[Specific gaps identified]"
    Story Implementation: "[Missing acceptance criteria]"

  Rework Requirements:
    - Address ALL critical issues listed above
    - Re-validate against PRD_COMPLETION_ROADMAP.md specifications
    - Update Dev Agent Record with rework details
    - Change status back to "Ready for Review" when complete

  Re-review Required: "YES"
  Estimated Rework Time: "[X hours/days]"
```

---

## BMAD-METHOD WORKFLOW EXECUTION INSTRUCTIONS

### FOR PROJECT MANAGER/COORDINATOR:

**Step 1: Activate James (Development Agent) for Story Implementation**
```bash
# Activate James using official BMad agent
@.bmad-core/agents/dev.md

# Once James is active, provide story directive:
"James, you must implement the next CRITICAL PRIORITY story from PRD_COMPLETION_ROADMAP.md.

CRITICAL REQUIREMENTS:
1. Follow PRD_COMPLETION_ROADMAP.md specifications religiously
2. Start with Story 3.3: Precision Keyword Integration
3. Use *develop 3.3 command to trigger BMad develop-story workflow
4. Integrate exact code templates from PRD roadmap
5. Update only Dev Agent Record section in story file
6. Change status to 'Ready for Review' when complete

Execute: *develop 3.3"
```

**Step 2: Activate Quinn (QA Agent) for Story Review**
```bash
# Activate Quinn using official BMad agent
@.bmad-core/agents/qa.md

# Once Quinn is active, provide review directive:
"Quinn, conduct comprehensive review of James's implementation of Story 3.3.

CRITICAL REQUIREMENTS:
1. Follow BMad review-story.md workflow religiously
2. Validate against PRD_COMPLETION_ROADMAP.md specifications
3. Check BMad architecture compliance (devLoadAlwaysFiles)
4. Update only QA Results section in story file
5. Provide APPROVED or REJECTED decision with detailed feedback

Execute: *review 3.3"
```

**Step 3: Handle BMad Rejection Cycle (if needed)**
```bash
# If Quinn rejects, reactivate James for rework:
@.bmad-core/agents/dev.md

"James, Quinn has rejected Story 3.3. Review the QA Results section in the story file for detailed feedback.

REWORK REQUIREMENTS:
1. Address ALL critical issues listed in QA Results
2. Follow Quinn's specific fix requirements
3. Re-validate against PRD_COMPLETION_ROADMAP.md
4. Update Dev Agent Record with rework details
5. Change status back to 'Ready for Review'

Execute: *develop 3.3"
```

**Step 4: Continue BMad Cycle Until 100% PRD Compliance**
Repeat this BMad workflow for all CRITICAL and HIGH PRIORITY stories in PRD_COMPLETION_ROADMAP.md:
- Story 3.3: Precision Keyword Integration
- Story 3.6: Content Validation & Anti-Hallucination
- Story 3.1: Expert-Level Content Generation
- Story 5.4: CMS Integration & Publishing
- [Continue through all roadmap priorities]

### BMAD SUCCESS CRITERIA
- ✅ All 17 Functional Requirements: 100% implemented via BMad stories
- ✅ All 20 Non-Functional Requirements: 100% satisfied via BMad validation
- ✅ All 6 Epics: 100% complete with Quinn approval
- ✅ All stories: Quinn (QA) approved in story files
- ✅ BMad architecture compliance: 100% validated
- ✅ Production deployment: Ready and BMad-validated

This BMad-Method workflow ensures **RELIGIOUS ADHERENCE** to BMad protocols while achieving **100% PRD compliance** through James/Quinn collaboration cycles.
