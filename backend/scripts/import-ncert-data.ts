import { PrismaClient, Difficulty, GradeLevel, NcertClass } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type CurriculumFile = {
  classes: Array<{
    classLevel: number;
    ncertClass: NcertClass;
    chapters: Array<{
      chapterCode: string;
      chapterNumber: number;
      titleEn: string;
      titleHi?: string;
      unitName: string;
      bigIdea: string;
      estimatedMinutes?: number;
      difficultyLevel?: number;
      prerequisiteChapterCodes?: string[];
      topics?: Array<{ topicCode: string; title: string; order: number; conceptCodes: string[] }>;
    }>;
  }>;
};

type ConceptsFile = {
  concepts: Array<{
    conceptCode: string;
    classLevel: number;
    chapterCode: string;
    topicCode: string;
    name: string;
    prerequisiteConceptCodes?: string[];
  }>;
};

type ProblemsFile = {
  problems: Array<{
    problemKey: string;
    classLevel: number;
    chapterCode: string;
    topicCode: string;
    body: string;
    answer: string;
    difficultyLevel: number;
    estimatedTimeSec?: number;
    conceptCodes: string[];
    requiredSkills?: string[];
    expectedSolutionSteps?: string[];
    hints?: string[];
    commonErrorCodes?: string[];
    solution?: { finalAnswer: string; steps: string[]; explanation: string };
  }>;
};

type ChapterIndex = Record<
  string,
  {
    classLevel: number;
    ncertClass: NcertClass;
    chapterNumber: number;
    titleEn: string;
    titleHi?: string;
    unitName: string;
    bigIdea: string;
    estimatedMinutes?: number;
    difficultyLevel?: number;
    prerequisiteChapterCodes?: string[];
  }
>;

const DATA_DIR = path.resolve(__dirname, '../data/ncert');

function readJson<T>(fileName: string): T {
  const filePath = path.join(DATA_DIR, fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function gradeLevelForClass(classLevel: number): GradeLevel {
  const map: Record<number, GradeLevel> = {
    7: 'G_MIDDLE_1',
    8: 'G_MIDDLE_2',
    9: 'G_MIDDLE_3',
    10: 'G_HIGH_1',
    11: 'G_HIGH_2',
    12: 'G_HIGH_3',
  };

  const gradeLevel = map[classLevel];
  if (!gradeLevel) throw new Error(`Unsupported NCERT classLevel: ${classLevel}`);
  return gradeLevel;
}

function difficultyForLevel(level: number): Difficulty {
  if (level <= 2) return 'MIDDLE';
  if (level === 3) return 'UPPER_MIDDLE';
  if (level === 4) return 'SEMI_KILLER';
  return 'KILLER';
}

function buildChapterIndex(curriculum: CurriculumFile): ChapterIndex {
  const index: ChapterIndex = {};

  for (const klass of curriculum.classes) {
    for (const chapter of klass.chapters) {
      index[chapter.chapterCode] = {
        classLevel: klass.classLevel,
        ncertClass: klass.ncertClass,
        chapterNumber: chapter.chapterNumber,
        titleEn: chapter.titleEn,
        titleHi: chapter.titleHi,
        unitName: chapter.unitName,
        bigIdea: chapter.bigIdea,
        estimatedMinutes: chapter.estimatedMinutes,
        difficultyLevel: chapter.difficultyLevel,
        prerequisiteChapterCodes: chapter.prerequisiteChapterCodes ?? [],
      };
    }
  }

  return index;
}

async function nextUnitOrder(): Promise<number> {
  const result = await prisma.unit.aggregate({ _max: { order: true } });
  return (result._max.order ?? 0) + 1;
}

async function importChapters(curriculum: CurriculumFile, chapterIndex: ChapterIndex): Promise<Record<string, string>> {
  const unitIdByChapterCode: Record<string, string> = {};
  let order = await nextUnitOrder();

  for (const [chapterCode, chapter] of Object.entries(chapterIndex)) {
    const unitName = `NCERT Class ${chapter.classLevel}: ${chapter.unitName}`;
    const existingUnit = await prisma.unit.findUnique({ where: { name: unitName } });
    const unit = existingUnit
      ? await prisma.unit.update({
          where: { id: existingUnit.id },
          data: { gradeLevels: [gradeLevelForClass(chapter.classLevel)] },
        })
      : await prisma.unit.create({
          data: {
            name: unitName,
            order: order++,
            gradeLevels: [gradeLevelForClass(chapter.classLevel)],
          },
        });

    unitIdByChapterCode[chapterCode] = unit.id;

    await prisma.conceptLesson.upsert({
      where: { chapterCode },
      update: {
        ncertClass: chapter.ncertClass,
        chapterNumber: chapter.chapterNumber,
        titleKo: chapter.titleEn,
        titleEn: chapter.titleEn,
        titleHi: chapter.titleHi ?? null,
        bigIdeaKo: chapter.bigIdea,
        bigIdeaEn: chapter.bigIdea,
        estimatedMin: chapter.estimatedMinutes ?? 15,
        cognitiveLoad: Math.max(0, Math.min(3, chapter.difficultyLevel ?? 1)),
        prerequisiteCodes: chapter.prerequisiteChapterCodes ?? [],
        unitId: unit.id,
      } as any,
      create: {
        ncertClass: chapter.ncertClass,
        chapterNumber: chapter.chapterNumber,
        chapterCode,
        titleKo: chapter.titleEn,
        titleEn: chapter.titleEn,
        titleHi: chapter.titleHi ?? null,
        bigIdeaKo: chapter.bigIdea,
        bigIdeaEn: chapter.bigIdea,
        estimatedMin: chapter.estimatedMinutes ?? 15,
        cognitiveLoad: Math.max(0, Math.min(3, chapter.difficultyLevel ?? 1)),
        prerequisiteCodes: chapter.prerequisiteChapterCodes ?? [],
        unitId: unit.id,
      } as any,
    });
  }

  // Touch the curriculum object so TypeScript keeps this importer tied to the file shape.
  if (curriculum.classes.length === 0) throw new Error('No curriculum classes found.');
  return unitIdByChapterCode;
}

async function importConcepts(conceptsFile: ConceptsFile, unitIdByChapterCode: Record<string, string>) {
  const idByConceptCode: Record<string, string> = {};

  for (const concept of conceptsFile.concepts) {
    const row = await (prisma as any).concept.upsert({
      where: { code: concept.conceptCode },
      update: {
        name: concept.name,
        subject: 'math',
        gradeLevel: gradeLevelForClass(concept.classLevel),
        unitId: unitIdByChapterCode[concept.chapterCode] ?? null,
      },
      create: {
        code: concept.conceptCode,
        name: concept.name,
        subject: 'math',
        gradeLevel: gradeLevelForClass(concept.classLevel),
        unitId: unitIdByChapterCode[concept.chapterCode] ?? null,
      },
    });
    idByConceptCode[concept.conceptCode] = row.id;
  }

  for (const concept of conceptsFile.concepts) {
    const prerequisiteConceptIds = (concept.prerequisiteConceptCodes ?? [])
      .map((code) => idByConceptCode[code])
      .filter(Boolean);

    await (prisma as any).concept.update({
      where: { code: concept.conceptCode },
      data: { prerequisiteConceptIds },
    });
  }
}

async function importProblems(problemsFile: ProblemsFile, unitIdByChapterCode: Record<string, string>) {
  for (const problem of problemsFile.problems) {
    const unitId = unitIdByChapterCode[problem.chapterCode];
    if (!unitId) throw new Error(`No unit found for chapterCode ${problem.chapterCode}`);

    const existing = await prisma.problem.findFirst({ where: { source: problem.problemKey } });
    const data = {
      unitId,
      subUnitId: null,
      difficulty: difficultyForLevel(problem.difficultyLevel),
      body: problem.body,
      formula: null,
      concept: problem.solution?.explanation ?? null,
      answer: problem.answer,
      hint: problem.hints?.join('\n') ?? null,
      difficultyLevel: Math.max(1, Math.min(5, problem.difficultyLevel)),
      requiredSkills: problem.requiredSkills ?? [],
      expectedSolutionSteps: problem.expectedSolutionSteps ?? undefined,
      commonErrorCodes: (problem.commonErrorCodes ?? []) as any,
      expectedTimeSec: problem.estimatedTimeSec ?? null,
    };

    const saved = existing
      ? await prisma.problem.update({ where: { id: existing.id }, data })
      : await prisma.problem.create({ data: { source: problem.problemKey, ...data } });

    await (prisma as any).problemConcept.deleteMany({ where: { problemId: saved.id } });

    for (const conceptCode of problem.conceptCodes) {
      const concept = await (prisma as any).concept.findUnique({ where: { code: conceptCode } });
      if (!concept) throw new Error(`No concept found for conceptCode ${conceptCode}`);

      await (prisma as any).problemConcept.create({
        data: { problemId: saved.id, conceptId: concept.id, weight: 1 },
      });
    }
  }
}

async function main() {
  const curriculum = readJson<CurriculumFile>('curriculum.ncert-math-7-12.json');
  const concepts = readJson<ConceptsFile>('concepts.ncert-math-7-12.json');
  const problems = readJson<ProblemsFile>('problems.ncert-math-7-12.json');
  const chapterIndex = buildChapterIndex(curriculum);

  if (process.argv.includes('--dry-run')) {
    console.log(`Validated ${Object.keys(chapterIndex).length} NCERT chapters.`);
    console.log(`Validated ${concepts.concepts.length} NCERT concepts.`);
    console.log(`Validated ${problems.problems.length} NCERT problems.`);
    return;
  }

  const unitIdByChapterCode = await importChapters(curriculum, chapterIndex);
  await importConcepts(concepts, unitIdByChapterCode);
  await importProblems(problems, unitIdByChapterCode);

  console.log(`Imported ${Object.keys(chapterIndex).length} NCERT chapters.`);
  console.log(`Imported ${concepts.concepts.length} NCERT concepts.`);
  console.log(`Imported ${problems.problems.length} NCERT problems.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
