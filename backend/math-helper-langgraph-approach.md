# Approach for adding a LangGraph based Maths Problem Helper

## Context

I want to add this as a small backend-only feature inside the existing Mathema codebase, not as a rewrite.

The current repo already has the foundation we need:

- NestJS backend
- Prisma and PostgreSQL
- Existing modules like `curriculum`, `problems`, `study-sessions`, `wrong-notes`, `ai-coach`, and `analytics`
- Existing AI infrastructure under `backend/src/infrastructure/ai`
- Existing concept learning and problem data models

So the right approach is to add one isolated module first, prove the flow, and then connect it to the rest of the product later.

The first version should not touch the frontend. It should expose one backend API that can take a free-form maths question, understand the curriculum context, solve it, verify it, and return a student-friendly response.

---

## Goal of the first version

Build this feature first:

```text
7-12 Maths Problem Helper
```

The flow should be:

```text
Student asks a maths problem
        ↓
System detects class, chapter, topic, and concept
        ↓
System fetches matching curriculum context from Postgres
        ↓
System solves the problem
        ↓
System verifies the solution independently
        ↓
System returns a class-appropriate explanation, hints, mistake diagnosis, and next practice concepts
```

This is intentionally more structured than one normal AI call. The point is not just to get an answer. The point is to get a reliable teaching response that fits the student’s class level and curriculum.

---

## What LangGraph means here

LangGraph is not being used as a big autonomous agent.

For this use case, LangGraph is just a controlled backend workflow.

In simple terms:

- **State** is the shared JSON object passed through the flow.
- **Node** is one step in the flow, like classify, retrieve, solve, verify, or format.
- **Edge** means which step runs next.
- **Graph** means the whole connected flow.

So instead of writing one huge service method like this:

```text
call AI once and trust the answer
```

we write a safer flow like this:

```text
classify → retrieve curriculum → solve → verify → format
```

This makes the system easier to debug because every step has its own input and output.

---

## What we should not use in the first version

I do not want to use these in the first version:

- MCP
- n8n
- Bedrock Knowledge Base
- Full agent architecture
- OCR
- Frontend changes
- Large ingestion pipeline

Reason: this feature can be proven with the current backend, Prisma/Postgres, and LangGraph JS only.

If we add MCP, n8n, or Bedrock Knowledge Base now, we will increase complexity before proving the core student value.

---

## Where this should live in the repo

Create a new isolated NestJS module:

```text
backend/src/modules/math-ai-helper/
```

Suggested structure:

```text
backend/src/modules/math-ai-helper/
  math-ai-helper.module.ts
  math-ai-helper.controller.ts
  math-ai-helper.service.ts

  graphs/
    math-helper.graph.ts

  nodes/
    classify-problem.node.ts
    retrieve-curriculum.node.ts
    solve-problem.node.ts
    verify-solution.node.ts
    format-response.node.ts

  dto/
    solve-math-problem.dto.ts
    math-helper-response.dto.ts

  services/
    curriculum-lookup.service.ts
    deterministic-math-check.service.ts
    math-helper-ai.service.ts
    ai-run-logger.service.ts
```

Then import `MathAiHelperModule` in:

```text
backend/src/app.module.ts
```

This keeps the feature separate from the existing `ai-coach`, `study-sessions`, and `wrong-notes` logic.

---

## Data model approach

The repo already has `Unit`, `SubUnit`, `Problem`, and `ConceptLesson` models. I do not want to remove or rewrite those.

For this helper, I would still add a small curriculum lookup table because the problem helper needs fast class/chapter/topic/concept matching.

Suggested Prisma model:

```prisma
model CurriculumNode {
  id          String   @id @default(uuid())
  classLevel  Int
  subject     String   // MATH
  chapter     String
  topic       String
  subtopic    String?
  concept     String?
  order       Int?
  parentId    String?
  status      String   @default("PUBLISHED")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([classLevel, subject])
  @@index([chapter, topic])
}
```

This table is not replacing the existing curriculum module. It is a clean lookup layer for the new helper.

Later we can link this table to existing `Unit`, `SubUnit`, or `ConceptLesson` records if needed.

---

## AI run logging

Every AI call should be logged from day one.

Suggested model:

```prisma
model AiRunLog {
  id          String   @id @default(uuid())
  feature     String
  input       Json
  output      Json
  model       String?
  status      String
  createdAt   DateTime @default(now())

  @@index([feature, createdAt])
  @@index([status, createdAt])
}
```

This is important because maths answers will sometimes be wrong. Without logs, debugging becomes guesswork.

For this feature, use:

```text
feature = "MATH_AI_HELPER"
```

---

## Curriculum import first

Before building the solver endpoint, we need a basic Class 7-12 maths curriculum JSON file.

Create:

```text
backend/data/curriculum/india-math-7-12.json
```

Example format:

```json
[
  {
    "classLevel": 9,
    "subject": "MATH",
    "chapter": "Polynomials",
    "topic": "Remainder Theorem",
    "subtopic": "Finding remainders",
    "concept": "Use f(a) to find the remainder when divided by x - a",
    "order": 1
  }
]
```

Add an import command:

```bash
npm run import:curriculum
```

Suggested script entry in `backend/package.json`:

```json
{
  "scripts": {
    "import:curriculum": "ts-node scripts/import-curriculum.ts"
  }
}
```

The reason this comes first is simple: if we do not give the helper a real curriculum map, it will guess the chapter and topic too often.

---

## API endpoint

Create one endpoint first:

```http
POST /api/v1/math-helper/solve
```

Request:

```json
{
  "classLevel": 9,
  "question": "Find the remainder when x^3 - 3x^2 + 4x - 7 is divided by x - 2.",
  "studentAnswer": "-2"
}
```

`studentAnswer` should be optional.

Response:

```json
{
  "detected": {
    "classLevel": 9,
    "chapter": "Polynomials",
    "topic": "Remainder Theorem",
    "concepts": ["Polynomial substitution", "Remainder theorem"]
  },
  "answer": "-3",
  "isStudentCorrect": false,
  "explanation": "For x - 2, substitute x = 2 into the polynomial. Then f(2) = 8 - 12 + 8 - 7 = -3.",
  "mistakeDiagnosis": "You likely made an arithmetic mistake while simplifying after substitution.",
  "hints": [
    "For x - a, substitute x = a.",
    "Calculate f(2) carefully before finalizing the answer."
  ],
  "nextPractice": [
    "Polynomial substitution",
    "Remainder theorem basics"
  ]
}
```

---

## Minimal LangGraph state

Use one shared state object through the graph.

```ts
type MathHelperState = {
  classLevel?: number;
  question: string;
  studentAnswer?: string;

  detectedChapter?: string;
  detectedTopic?: string;
  detectedConcepts?: string[];

  curriculumContext?: CurriculumNode[];

  solutionDraft?: {
    answer: string;
    steps: string[];
    explanation: string;
  };

  verification?: {
    isVerified: boolean;
    issues: string[];
    confidence: number;
  };

  finalResponse?: {
    answer: string;
    explanation: string;
    hints: string[];
    mistakeDiagnosis?: string;
    nextPractice: string[];
  };
};
```

The important part is that every node only updates part of this state.

---

## LangGraph flow

The first graph should be linear and boring on purpose.

```text
START
  ↓
ClassifyProblem
  ↓
RetrieveCurriculumContext
  ↓
SolveProblem
  ↓
VerifySolution
  ↓
FormatResponse
  ↓
END
```

Do not allow the AI to randomly choose tools. We want predictable behaviour for an education product.

Pseudo-code:

```ts
const graph = new StateGraph(MathHelperStateAnnotation)
  .addNode('classifyProblem', classifyProblemNode)
  .addNode('retrieveCurriculum', retrieveCurriculumNode)
  .addNode('solveProblem', solveProblemNode)
  .addNode('verifySolution', verifySolutionNode)
  .addNode('formatResponse', formatResponseNode)
  .addEdge(START, 'classifyProblem')
  .addEdge('classifyProblem', 'retrieveCurriculum')
  .addEdge('retrieveCurriculum', 'solveProblem')
  .addEdge('solveProblem', 'verifySolution')
  .addEdge('verifySolution', 'formatResponse')
  .addEdge('formatResponse', END)
  .compile();
```

Later we can add retry branching after verification, but the first implementation can keep it simple.

---

## What each node does

### 1. `ClassifyProblem`

Input:

```text
question, classLevel if provided
```

Output:

```text
detected class, chapter, topic, concepts
```

This node decides what type of maths problem this is.

Example:

```text
Question: Find the remainder when a polynomial is divided by x - 2.
Detected: Class 9, Polynomials, Remainder Theorem
```

It should use structured output, not free text.

---

### 2. `RetrieveCurriculumContext`

Input:

```text
detected class, chapter, topic, concepts
```

Output:

```text
matching CurriculumNode records
```

This should be a normal Prisma/Postgres lookup first.

Example lookup:

```ts
where: {
  classLevel: 9,
  subject: 'MATH',
  status: 'PUBLISHED',
  OR: [
    { chapter: { contains: detectedChapter, mode: 'insensitive' } },
    { topic: { contains: detectedTopic, mode: 'insensitive' } },
    { concept: { contains: detectedConcept, mode: 'insensitive' } }
  ]
}
```

No vector search is needed in the first version.

---

### 3. `SolveProblem`

Input:

```text
question + curriculum context
```

Output:

```text
answer, steps, explanation
```

The solver should be prompted to stay within the detected class level.

For example, for Class 9 it should not explain polynomial remainder theorem using university-level algebra.

---

### 4. `VerifySolution`

Input:

```text
question + solution draft
```

Output:

```text
isVerified, issues, confidence
```

This is the most important node.

The verifier should recompute the answer independently instead of just agreeing with the solver.

For common problem types, add deterministic checks:

- Arithmetic
- Fractions
- Percentages
- Linear equations
- Quadratic roots
- Polynomial substitution
- Remainder theorem
- Basic coordinate geometry
- Simplification
- Ratio and proportion

For example, in a remainder theorem problem, the deterministic checker can substitute the value directly and compare with the solver answer.

If solver and verifier disagree:

```text
retry solve once → verify again → if still mismatched, return cautious response
```

Cautious response means:

```text
I could not verify the answer confidently. Here is the method and the most likely answer, but this should be reviewed.
```

---

### 5. `FormatResponse`

Input:

```text
verified solution + student answer if available
```

Output:

```text
final API response
```

This node should format the result for the student.

It should return:

- Final answer
- Step-by-step explanation
- Whether student answer is correct
- Mistake diagnosis if student answer is wrong
- Hints
- Next practice concepts

It should not expose raw chain-of-thought.

We can expose structured teaching artifacts like this:

```json
{
  "solutionPlan": [
    "Identify the chapter and concept",
    "Choose the relevant theorem",
    "Solve step by step",
    "Check the answer"
  ],
  "conceptsUsed": [
    "Remainder Theorem",
    "Polynomial evaluation"
  ],
  "verificationChecklist": {
    "answerRecomputed": true,
    "classLevelAppropriate": true,
    "stepsConsistent": true
  }
}
```

But do not expose private reasoning text.

---

## AI provider approach

The graph should not call OpenAI, Anthropic, or Bedrock directly.

Use a provider interface:

```ts
export interface AiModelProvider {
  generateStructured<T>(input: {
    systemPrompt: string;
    userPrompt: string;
    schema: unknown;
  }): Promise<T>;
}
```

Then implement one provider first.

If we want the fastest dev path, use OpenAI or Anthropic behind this interface.

If we want AWS alignment, use Bedrock behind the same interface.

The graph should call:

```ts
this.aiModelProvider.generateStructured(...)
```

not:

```ts
openai.chat.completions.create(...)
```

This keeps the graph provider-agnostic.

The existing `AiService` can either be extended or wrapped. I would wrap it first so we do not disturb existing `ai-coach` behaviour.

---

## Dependency to add

Inside `backend`:

```bash
npm install @langchain/langgraph @langchain/core zod
```

`zod` is useful for validating structured outputs from the model.

---

## First implementation plan

### Step 1: Add schema changes

Add:

- `CurriculumNode`
- `AiRunLog`

Then run:

```bash
npx prisma migrate dev --name add_math_ai_helper
npx prisma generate
```

---

### Step 2: Add curriculum import

Create:

```text
backend/data/curriculum/india-math-7-12.json
backend/scripts/import-curriculum.ts
```

Add script:

```bash
npm run import:curriculum
```

Do this before solving logic.

---

### Step 3: Create the backend module

Create:

```text
backend/src/modules/math-ai-helper/
```

Add:

- Controller
- Service
- DTOs
- Graph file
- Node files
- Helper services

Register the module in `app.module.ts`.

---

### Step 4: Create the endpoint

Implement:

```http
POST /api/v1/math-helper/solve
```

The controller should only validate the request and call the service.

The service should invoke the graph.

---

### Step 5: Add LangGraph flow

Start with a fixed linear graph:

```text
classify → retrieve → solve → verify → format
```

Do not add dynamic tool calling yet.

---

### Step 6: Add verification

First add AI verifier.

Then add deterministic checks for easy cases.

Priority deterministic checks:

1. Remainder theorem
2. Linear equation
3. Basic arithmetic
4. Percentage and ratio
5. Quadratic roots

This will make the system better than a normal one-shot AI answer.

---

### Step 7: Add logs

Log every node that calls a model.

At minimum log:

- Feature name
- Node name
- Input
- Output
- Model name
- Status
- Error if failed

Do not log sensitive user data if this becomes production-facing.

---

### Step 8: Add basic tests

Start with service-level tests.

Test cases:

- Class 9 remainder theorem question
- Student answer correct
- Student answer incorrect
- Unknown topic fallback
- Solver/verifier mismatch fallback

This does not need a huge test suite initially, but we need tests around the graph response shape.

---

## Definition of done for Milestone 1

The first milestone is done when this works:

```http
POST /api/v1/math-helper/solve
```

Backed by:

- Class 7-12 maths curriculum lookup table
- Curriculum import JSON
- LangGraph solve and verify pipeline
- Structured JSON response
- AI run logs
- Basic deterministic verification for at least 2-3 problem types

No frontend is required for this milestone.

---

## Why this approach is better than one AI call

One AI call can solve the question, but it has problems:

- It may guess the chapter or topic.
- It may solve at the wrong class level.
- It may make calculation mistakes.
- It gives us limited debugging data.
- It is hard to improve step by step.

This graph approach gives us:

- Separate classification
- Curriculum-grounded solving
- Independent verification
- Retry path when answer is not verified
- Logs for debugging
- A response format that fits the app’s teaching model

That is the main reason to use LangGraph here.

---

## What can come later

After this backend flow works, we can add:

- Frontend screen for free-form problem solving
- Link output to wrong notes
- Save solved helper questions as practice history
- Recommend similar problems from existing `Problem` table
- Add OCR for uploaded images
- Add vector search if curriculum content becomes large
- Add Bedrock Knowledge Base if we start storing full textbook chunks and teacher notes
- Add admin tooling for curriculum upload and review
- Add n8n only for content operations, not the student answer path
- Convert internal services into MCP tools only when we actually have many tools to standardize

---

## Final decision

For the first version, I want to build:

```text
NestJS module + Prisma/Postgres curriculum lookup + LangGraph JS solve/verify flow + swappable model provider
```

I do not want to build a full agent system yet.

The clean first deliverable is:

```text
POST /api/v1/math-helper/solve
```

Once this endpoint is stable, we can connect it to the frontend and reuse the same graph for wrong-note explanations, study-session guides, and practice recommendations.
