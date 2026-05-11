# matheo — PoC Run Book

Proof-of-Concept for **NCERT Mathematics learning, India launch (Class 7–12)**.
Demo persona: **Arjun Sharma, Class 11, JEE Main aspirant** (~5 months out).

This document tells you how to bring the PoC up locally and what to demo, in
order, so a non-developer evaluator sees the value proposition in under 10 minutes.

---

## 1. What this PoC proves

The hypothesis under test:

> *"Forcing a short, learning-science-grounded concept lesson before any
> problem practice produces measurably better learning per minute than going
> straight to problems."*

The system makes that hypothesis testable by:

1. **Pre-problem Concept Lessons** — 79 NCERT chapters (Class 7–12), each a
   7-step micro-lesson built on **Bruner CPA · Cognitive Load Theory ·
   Variation Theory · Worked Example · Retrieval Practice · Misconception
   surfacing**.
2. **Gated problem practice** — a unit's problem set unlocks only after the
   user passes the retrieval check of every Concept Lesson mapped to that unit.
3. **3-step multiple choice** — every problem decomposes into
   `CONCEPT → PROCESS → ANSWER` with four typed distractors per step, so we
   capture *where* the student fails, not just *that* they failed.
4. **SM-2 spaced repetition** wrong-note review, mastery snapshots, weekly
   reports with mentor message, mock-exam trajectory.

---

## 2. Local bring-up (one-time)

```bash
# 0. Prereqs: Docker Desktop, Node 18+, npm
cd backend

# 1. Postgres + Redis
docker compose up -d

# 2. Env
cp .env.example .env             # only edit if you'd like (defaults work)

# 3. Install + migrate + seed
npm install
npx prisma generate              # picks up ConceptLesson / ConceptStep / NcertClass
npx prisma migrate dev --name init
npm run db:seed                  # ← seeds 79 ConceptLessons + Arjun (Class 11)
npm run start:dev                # http://localhost:4000  · API at /api/v1
```

In a second shell:

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

If you want auto-login as the demo user:

```bash
# frontend/.env.local
VITE_ENABLE_DEMO_AUTO_LOGIN=true
```

Otherwise sign in manually:

| Field | Value |
|---|---|
| Email | `polopot123@gmail.com` |
| Password | `password1234` |

---

## 3. The 8-minute demo script

The shortest path that exercises every PoC claim:

### a) Dashboard (60 s)
- Top bar: streak, today's minutes, weekly accuracy, expected exam band.
- Mastery radar: weakest area is **Limits & Derivatives 45%** (intentional —
  it's the JEE bottleneck for Class 11).
- "Today's Focus" card recommends that exact unit with a reason line.

### b) Concept Hub (90 s) — `/learn`
- Tabs by NCERT class. Defaults to **Class 11** (Arjun's grade).
- Each chapter card shows: chapter number, big idea, est. minutes, cognitive
  load color (green → orange → red), `Mastered` / `Locked` badge.
- Click **Limits and Derivatives**.

### c) Concept Lesson run-through (3 min) — `/learn/C11-CH12-LIMITS-DERIVATIVES`
Walk every step and call out the principle:

| Step | What the screen shows | Principle |
|---|---|---|
| HOOK | "*The value as you approach* — the one idea that founds all calculus." | Ausubel advance organizer |
| CONCRETE | A specific f(x) and its limit | Bruner — concrete |
| PICTORIAL | Sketch / graph cue | Bruner — pictorial · dual coding |
| ABSTRACT | lim formal definition + derivative as a limit | Bruner — abstract |
| WORKED_EXAMPLE | Derivative of x² step-by-step | Sweller — worked-example effect |
| MISCONCEPTION | "limit equals f(a) always" → why it's wrong | Conceptual change |
| RETRIEVAL | `d/dx (x³) = ?` typed answer + automatic grading | Karpicke retrieval practice |

Type `3x²` (or `3x^2`, `3*x*x` — answer normaliser accepts equivalents) and the
**Mastered** badge appears.

### d) Gated problem practice (60 s)
- Go to **Study** tab.
- Click any recommended unit that still has unmastered prerequisites — the app
  routes you to the first prerequisite concept lesson, not the problem set.
- Click **Sets** (already mastered) — problem practice starts.

### e) 3-step problem (90 s)
- One problem opens with three multiple-choice steps.
- Pick a deliberately wrong choice → instant feedback names the distractor type
  (`CONCEPT_CONFUSION` / `CALC_ERROR` / `PROCESS_SKIP` / `TIME_PRESSURE_GUESS`)
  and prompts a retry on the same step.

### f) Wrong-note SM-2 (45 s) — **Wrong Notes** tab
- 6 seeded wrong notes across Class 11 topics with realistic SM-2 state
  (next-review, interval, lapse count).
- Click one → modal shows the original problem, the AI insight, and a
  `Review` button that runs the SM-2 update.

### g) Mock-exam trajectory (45 s)
- 6 historical mock results from `Unit Test · April` through
  `Full Mock · October`. Score climbs 62 → 84.
- Below: AI-recommended mock, mini mock (unit), wrong-redo mock, full mock.

---

## 4. Demo-friendly assumptions baked into the seed

- **Arjun is Class 11, India (CBSE/JEE)**. examDate ≈ 150 days out (JEE Main
  April session). targetGrade=1 reads as "top rank band".
- **Mastery distribution chosen to tell a story** — Limits 45% (weakest, JEE
  killer), Trig 52%, Functions 65%, Complex 71%, Sets 82%. Lets recommendations
  trigger the right cards.
- **6 mock exams** distributed over 8 months show an upward trajectory.
- **84 active days** in the heatmap, 23 consecutive at the end → streak demo.
- **8 weekly reports**, the most recent has a mentor message highlighting the
  Trig recovery + JEE Main goal.
- **79 ConceptLesson rows** seeded for every NCERT chapter Class 7–12. About
  one third have full bespoke content (HOOK / ABSTRACT / WORKED / MISCONCEPTION /
  RETRIEVAL in both KO and EN); the rest carry framework-correct fallbacks.
- **32 seed problems** (7 Class 12 / 12 Class 8-10 / 13 Class 11). 7 of these
  (the Class 12 set) have the full 3-step + 5-distractor choice tree wired,
  with **deterministic shuffle** so the correct option is not always at index 1.

---

## 5. What is **not** in scope for this PoC

- Multi-tenant / school admin features
- Real payments / pricing
- Voice / video AI tutors (only the text AI coach via existing prompts)
- Real exam content licensed from NCERT board (we use derivative practice
  problems written for the PoC)
- Production deployment hardening (CDN, auto-scaling, blue-green deploys)

---

## 6. Language

- **English is the launch standard.** Korean strings exist only as a parallel
  translation to help the development team read code paths quickly.
- Toggle language in the top-right (`KO / EN`). On switch, the page reloads so
  all backend-rendered text re-fetches with the new `Accept-Language`.
- If you spot any Korean text in the English UI, that is a bug — please file it
  as a PoC blocker.

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `EPERM: ... query_engine-windows.dll.node` on `prisma generate` | Stop the dev server first (it holds a file lock on Windows), then re-run generate. |
| Concept Lesson cards appear locked even though you just mastered a prereq | Re-fetch — the lock state caches under React Query key `['conceptLessons', activeClass]`. Switch tabs or refresh. |
| Seed re-run wipes my wrong-note history | Wrong-notes are tied to the seeded user and re-created each `db:seed`. To preserve, run the seed only once during the PoC window. |
| Demo wants a non-English locale | Switch language to KO in the top bar — same content, parallel KO copy. |

---

## 8. Useful URLs

- Frontend: `http://localhost:5173`
- API:      `http://localhost:4000/api/v1`
- Health:   `http://localhost:4000/api/v1/health`
- Concept lesson tree: `http://localhost:4000/api/v1/concept-lessons?ncertClass=CLASS_11`
- Concept lesson detail: `http://localhost:4000/api/v1/concept-lessons/C11-CH12-LIMITS-DERIVATIVES`
