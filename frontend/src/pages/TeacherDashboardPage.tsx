/**
 * TeacherDashboardPage — 명세서 §6 강사용 UI.
 *
 *   필수 컴포넌트:
 *     1. 학생 리스트 (현재 PoC: 본인 1명만. tenant-scoped student API 가 Phase 후속)
 *     2. 학생별 mastery heatmap (concept × score 격자)
 *     3. concept 별 상세 그래프 (선택 시 MasteryEvent 시계열)
 *     4. ErrorPatternProfile 테이블 (status / severity / frequency / recentFrequency)
 *     5. 최근 5회 변화량 (MasteryEvent delta 추세)
 *     6. 추천 개입 전략 (teacherSummary)
 *     7. Teacher Override 입력 UI (mastery / error-pattern / recommendation)
 *     8. WeeklyReport 확인 UI (teacherSummary 전체)
 *
 *   명세서 §1 강사 UI: 진단 중심. 학생용/학부모용과 달리 숫자·표·변화량 전부 노출.
 *   명세서 §10: 강사가 AI 판단을 수정할 수 있어야 함 — Override UI 필수.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Edit3, FileText } from 'lucide-react';
import { TopNav, NAV_TO_HASH, NavKey } from '../components/TopNav';
import { post } from '../lib/api';
import {
  fetchConceptMastery, fetchActivePatterns, fetchWeeklyList, fetchConceptHistory,
  fetchTeacherStudents, fetchStudentMastery, fetchStudentPatterns, fetchStudentWeekly,
  type ConceptMastery, type ErrorPatternRow, type MasteryEventRow, type StudentRow,
} from '../lib/queries';
import { useT } from '../lib/i18n';

const COLORS = {
  bg: '#EFEBDF', ink: '#142850', sub: '#5C6B85', line: '#14285020', card: '#FAF7EF',
  good: '#4A5D3A', warn: '#B45309', bad: '#8B3A1F',
};

export function TeacherDashboardPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { lang } = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // 명세서 §6 강사 UI 1번 — 담당 학생 리스트. (403 = TEACHER role 아님)
  const students = useQuery({
    queryKey: ['teacher','students'],
    queryFn: fetchTeacherStudents,
    retry: false,
  });
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // 선택 학생 (없으면 본인) 의 데이터.
  const useSelf = !selectedStudent;
  const mastery   = useQuery({
    queryKey: ['teacher','mastery', selectedStudent ?? 'self'],
    queryFn: () => selectedStudent ? fetchStudentMastery(selectedStudent) : fetchConceptMastery(),
  });
  const patterns  = useQuery({
    queryKey: ['teacher','patterns', selectedStudent ?? 'self'],
    queryFn: () => selectedStudent ? fetchStudentPatterns(selectedStudent) : fetchActivePatterns(),
  });
  const weekly    = useQuery({
    queryKey: ['teacher','weekly', selectedStudent ?? 'self'],
    queryFn: () => selectedStudent ? fetchStudentWeekly(selectedStudent) : fetchWeeklyList(),
  });

  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<{ type: 'MASTERY'|'ERROR_PATTERN'|'RECOMMENDATION'; id: string; current: any } | null>(null);

  const handleNav = (k: NavKey) => navigate(`/#/${NAV_TO_HASH[k]}`);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {!embedded && <TopNav activeNav="대시보드" setActiveNav={handleNav} />}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 32px 80px' }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: COLORS.sub, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 6 }}>
            {lang === 'ko' ? '강사 대시보드' : 'Teacher dashboard'}
          </div>
          <h1 style={{ fontFamily: 'serif', fontWeight: 600, fontSize: 30, letterSpacing: '-0.02em', margin: 0 }}>
            {lang === 'ko' ? '진단 + 개입 포인트' : 'Diagnosis & Intervention'}
          </h1>
        </header>

        {/* (1) 학생 리스트 — TEACHER role + tenant 의 학생 목록 */}
        <SectionTitle no="01" title={lang === 'ko' ? '담당 학생' : 'Students'} />
        <StudentList
          students={students.data ?? []}
          isError={students.isError}
          selectedId={selectedStudent}
          onSelect={(id) => setSelectedStudent(id)}
          onSelf={() => setSelectedStudent(null)}
          useSelf={useSelf}
        />
        {selectedStudent && (
          <div style={{ marginTop: -8, marginBottom: 16, fontSize: 12, color: COLORS.sub }}>
            선택된 학생 id: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedStudent.slice(0, 8)}…</span>
          </div>
        )}

        {/* (2) Concept × score heatmap */}
        <SectionTitle no="02" title={lang === 'ko' ? '개념별 숙련도 (Heatmap)' : 'Mastery heatmap'} />
        <HeatmapGrid rows={mastery.data ?? []} onSelect={(id) => setSelectedConcept(id)} selected={selectedConcept} />

        {/* (3) 선택 concept 의 시계열 — 최근 5회 변화량 (5번 항목 통합) */}
        {selectedConcept && (
          <>
            <SectionTitle no="03" title={lang === 'ko' ? '선택 개념 — 최근 변화량' : 'Selected concept · recent changes'} />
            <HistoryCard conceptId={selectedConcept} />
          </>
        )}

        {/* (명세서 §1 강사 UI) 진단 메트릭 4종 — concept 별 반응시간/힌트율/confidence gap + 오답 원인 비율 */}
        <SectionTitle no="04a" title={lang === 'ko' ? '진단 메트릭 (concept 별)' : 'Diagnostic metrics'} />
        <DiagnosticMetricsTable rows={mastery.data ?? []} />

        <SectionTitle no="04b" title={lang === 'ko' ? '오답 원인 코드 비율' : 'Error-code breakdown'} />
        <ErrorCodeBreakdown rows={patterns.data ?? []} />

        {/* (4) ErrorPatternProfile 테이블 */}
        <SectionTitle no="04" title={lang === 'ko' ? '반복 오답 패턴' : 'Error patterns'} />
        <PatternTable rows={patterns.data ?? []} onOverride={(p) => setOverrideTarget({ type: 'ERROR_PATTERN', id: p.id, current: p })} />

        {/* (6) 추천 개입 전략 — teacherSummary */}
        {weekly.data?.[0] && (
          <>
            <SectionTitle no="05" title={lang === 'ko' ? '개입 포인트 (이번 주)' : 'Intervention points'} />
            <Card>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>
                {(weekly.data![0] as any).teacherSummary ?? (lang === 'ko' ? '리포트 생성 중...' : 'Generating...')}
              </p>
            </Card>
          </>
        )}

        {/* (8) WeeklyReport 목록 — 진단 추적 */}
        <SectionTitle no="06" title={lang === 'ko' ? '주간 리포트' : 'Weekly reports'} />
        <WeeklyTable rows={weekly.data ?? []} />

        {/* (7) Teacher Override 모달 */}
        {overrideTarget && (
          <OverrideModal
            target={overrideTarget}
            onClose={() => setOverrideTarget(null)}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ['teacher','patterns'] });
              qc.invalidateQueries({ queryKey: ['teacher','mastery'] });
              setOverrideTarget(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

function StudentList({ students, isError, selectedId, onSelect, onSelf, useSelf }: {
  students: StudentRow[]; isError: boolean;
  selectedId: string | null; onSelect: (id: string) => void; onSelf: () => void; useSelf: boolean;
}) {
  if (isError) {
    return (
      <Card>
        <Sub>TEACHER 권한이 없습니다. 본인 계정의 학습 데이터만 표시됩니다.</Sub>
      </Card>
    );
  }
  if (students.length === 0) {
    return (
      <Card>
        <Sub>같은 학원/기관에 등록된 학생이 없습니다. (Tenant 등록 + 학생 가입 필요)</Sub>
      </Card>
    );
  }
  return (
    <Card style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onSelf} style={chipStyle(useSelf)}>본인</button>
        {students.map((s) => (
          <button key={s.id} onClick={() => onSelect(s.id)} style={chipStyle(selectedId === s.id)}>
            {s.name} · {s.email.split('@')[0]}
          </button>
        ))}
      </div>
    </Card>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px', fontSize: 12, fontFamily: 'inherit',
    backgroundColor: active ? COLORS.ink : 'transparent',
    color: active ? COLORS.bg : COLORS.ink,
    border: `1px solid ${COLORS.line}`, borderRadius: 4, cursor: 'pointer',
  };
}

function HeatmapGrid({ rows, onSelect, selected }: {
  rows: ConceptMastery[]; onSelect: (id: string) => void; selected: string | null;
}) {
  if (rows.length === 0) {
    return <Card><Sub>아직 mastery 데이터가 없습니다.</Sub></Card>;
  }
  return (
    <Card style={{ padding: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
        {rows.map((m) => {
          const c = m.masteryScore >= 80 ? COLORS.good
            : m.masteryScore >= 60 ? '#A4B574'
            : m.masteryScore >= 40 ? '#E0A458' : COLORS.bad;
          const isSel = selected === m.conceptId;
          return (
            <button key={m.id}
              onClick={() => onSelect(m.conceptId)}
              style={{
                backgroundColor: c, color: '#FAF7EF', padding: '10px 12px',
                borderRadius: 4, border: isSel ? `2px solid ${COLORS.ink}` : 'none',
                textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 2 }}>{m.concept.name.slice(0, 18)}</div>
              <div style={{ fontSize: 16, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{Math.round(m.masteryScore)}</div>
              <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>n={m.evidenceCount} · {m.trend}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function HistoryCard({ conceptId }: { conceptId: string }) {
  const history = useQuery({ queryKey: ['teacher','history',conceptId], queryFn: () => fetchConceptHistory(conceptId, 10) });
  const rows: MasteryEventRow[] = (history.data ?? []).slice().reverse();
  if (rows.length === 0) return <Card><Sub>이력 없음.</Sub></Card>;
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginBottom: 8 }}>
        {rows.map((e) => {
          const h = Math.max(2, e.masteryScore);
          const c = e.delta >= 0 ? COLORS.good : COLORS.bad;
          return (
            <div key={e.id} title={`${e.masteryScore}/100, delta ${e.delta > 0 ? '+' : ''}${e.delta}`}
              style={{ width: 16, height: `${h}%`, backgroundColor: c, borderRadius: '2px 2px 0 0' }} />
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: COLORS.sub }}>
        {rows.length}개 시계열 (좌→우 시간순). 막대 색: 녹 = mastery 상승, 적 = 하락.
      </div>
    </Card>
  );
}

/**
 * 명세서 §1 강사 UI 명시 메트릭:
 *   - 반응시간 변화 (averageResponseTimeSec)
 *   - 힌트 사용률  (hintUsageRate)
 *   - 자신감 점수와 실제 정답률 차이 (confidenceGap)
 */
function DiagnosticMetricsTable({ rows }: { rows: ConceptMastery[] }) {
  if (rows.length === 0) return <Card><Sub>데이터 없음.</Sub></Card>;
  return (
    <Card style={{ padding: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.line}`, backgroundColor: '#14285008' }}>
            {['Concept', 'Mastery', 'Recent Acc.', 'Resp(s)', 'Hint%', 'Conf Gap', 'Trend'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, letterSpacing: '0.1em', color: COLORS.sub }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const gapColor = m.confidenceGap >= 20 ? COLORS.bad : m.confidenceGap >= 10 ? COLORS.warn : COLORS.sub;
            return (
              <tr key={m.id} style={{ borderBottom: `1px dashed ${COLORS.line}` }}>
                <td style={{ padding: '10px 14px' }}>{m.concept.name}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(m.masteryScore)}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(m.recentAccuracy * 100)}%</td>
                <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{m.averageResponseTimeSec}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(m.hintUsageRate * 100)}%</td>
                <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', color: gapColor, fontWeight: 600 }}>{Math.round(m.confidenceGap)}</td>
                <td style={{ padding: '10px 14px', color: m.trend === 'UP' ? COLORS.good : m.trend === 'DOWN' ? COLORS.bad : COLORS.sub }}>{m.trend}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

/** 명세서 §1 강사 UI — 오답 원인 코드 비율 (전체 패턴의 frequency 합계 기준). */
function ErrorCodeBreakdown({ rows }: { rows: ErrorPatternRow[] }) {
  if (rows.length === 0) return <Card><Sub>오답 패턴 없음.</Sub></Card>;
  const totalsByCode = new Map<string, number>();
  for (const r of rows) totalsByCode.set(r.errorCode, (totalsByCode.get(r.errorCode) ?? 0) + r.frequency);
  const total = [...totalsByCode.values()].reduce((s, x) => s + x, 0) || 1;
  const palette: Record<string, string> = {
    SIGN: '#8B3A1F', ALG: '#B5552B', CON: '#C7791F', FORMULA: '#D9A055',
    GRAPH: '#5C6B85', UNIT: '#A89684', CALC: '#4A5D3A', LOGIC: '#1F1A14',
  };
  const items = [...totalsByCode.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <Card>
      {items.map(([code, count]) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={code} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.ink }}>{code}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.sub }}>{count}회 · {pct}%</span>
            </div>
            <div style={{ height: 6, backgroundColor: '#14285010', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: palette[code] ?? COLORS.sub }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function PatternTable({ rows, onOverride }: { rows: ErrorPatternRow[]; onOverride: (p: ErrorPatternRow) => void }) {
  if (rows.length === 0) return <Card><Sub>활성 오답 패턴 없음.</Sub></Card>;
  return (
    <Card style={{ padding: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.line}`, backgroundColor: '#14285008' }}>
            {['Concept', 'ErrorCode', 'Frequency', 'Recent', 'Severity', 'Status', 'Action'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, letterSpacing: '0.1em', color: COLORS.sub }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} style={{ borderBottom: `1px dashed ${COLORS.line}` }}>
              <td style={{ padding: '10px 14px' }}>{p.concept.name}</td>
              <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{p.errorCode}</td>
              <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{p.frequency}</td>
              <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{p.recentFrequency}</td>
              <td style={{ padding: '10px 14px', color: p.severity === 'high' ? COLORS.bad : p.severity === 'medium' ? COLORS.warn : COLORS.sub }}>{p.severity}</td>
              <td style={{ padding: '10px 14px', color: p.status === 'ACTIVE' ? COLORS.bad : COLORS.sub }}>{p.status}</td>
              <td style={{ padding: '10px 14px' }}>
                <button onClick={() => onOverride(p)} style={btnSmall} title="Teacher Override">
                  <Edit3 size={11} /> Override
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function WeeklyTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) return <Card><Sub>리포트 없음.</Sub></Card>;
  return (
    <Card style={{ padding: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.line}`, backgroundColor: '#14285008' }}>
            {['Week', 'Attempts', 'Accuracy', 'Sessions', 'AI', 'Generated'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, letterSpacing: '0.1em', color: COLORS.sub }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: `1px dashed ${COLORS.line}` }}>
              <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{r.isoWeek}</td>
              <td style={{ padding: '10px 14px' }}>{r.totalAttempts}</td>
              <td style={{ padding: '10px 14px' }}>{Math.round(r.accuracyPct)}%</td>
              <td style={{ padding: '10px 14px' }}>{r.totalSessions}</td>
              <td style={{ padding: '10px 14px' }}>{r.aiScore}/10</td>
              <td style={{ padding: '10px 14px', color: COLORS.sub }}>{new Date(r.generatedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function OverrideModal({ target, onClose, onSuccess }: {
  target: { type: 'MASTERY'|'ERROR_PATTERN'|'RECOMMENDATION'; id: string; current: any };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [statusChoice, setStatusChoice] = useState<'ACTIVE'|'IMPROVING'|'RESOLVED'>('IMPROVING');
  const mut = useMutation({
    mutationFn: async () => {
      const after: any = {};
      if (target.type === 'ERROR_PATTERN') after.status = statusChoice;
      return post('/teacher-overrides', {
        studentUserId: target.current.userId,
        targetType: target.type,
        targetId: target.id,
        afterValue: after,
        reason,
      });
    },
    onSuccess,
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#14285055', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: COLORS.bg, borderRadius: 6, padding: 28, width: 480, border: `1px solid ${COLORS.line}`,
      }}>
        <h3 style={{ margin: 0, marginBottom: 12, fontSize: 18, fontWeight: 600 }}>
          Teacher Override — {target.type}
        </h3>
        <div style={{ fontSize: 12, color: COLORS.sub, marginBottom: 16 }}>
          Target id: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{target.id.slice(0, 8)}…</span>
        </div>
        {target.type === 'ERROR_PATTERN' && (
          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: COLORS.sub, letterSpacing: '0.15em' }}>새 STATUS</span>
            <select value={statusChoice} onChange={(e) => setStatusChoice(e.target.value as any)} style={input}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="IMPROVING">IMPROVING</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </label>
        )}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: COLORS.sub, letterSpacing: '0.15em' }}>이유 (감사 기록)</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="예: 수업 관찰 결과, 개념은 이해하나 부호 실수 단계 반복" rows={3}
            style={{ ...input, fontFamily: 'inherit', resize: 'vertical' }} />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={btnGhost}>취소</button>
          <button
            onClick={() => mut.mutate()}
            disabled={!reason.trim() || mut.isPending}
            style={{ ...btnPrimary, opacity: !reason.trim() || mut.isPending ? 0.5 : 1 }}
          >
            {mut.isPending ? '저장 중…' : 'Override 저장'}
          </button>
        </div>
        {mut.isError && (
          <div style={{ marginTop: 12, color: COLORS.bad, fontSize: 12 }}>
            저장 실패: {(mut.error as Error).message}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ no, title }: { no: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 36, marginBottom: 12 }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: COLORS.sub, letterSpacing: '0.15em' }}>No {no}</span>
      <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h2>
    </div>
  );
}

const cardStyle: React.CSSProperties = { backgroundColor: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: '18px 20px' };
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...cardStyle, marginBottom: 12, ...style }}>{children}</div>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, color: COLORS.sub, fontSize: 13, fontStyle: 'italic' }}>{children}</p>;
}
const btnSmall: React.CSSProperties = {
  padding: '4px 10px', fontSize: 11, backgroundColor: 'transparent',
  border: `1px solid ${COLORS.line}`, borderRadius: 3, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 4, color: COLORS.ink, fontFamily: 'inherit',
};
const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', backgroundColor: COLORS.ink, color: COLORS.bg, border: 'none',
  borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};
const btnGhost: React.CSSProperties = {
  padding: '8px 16px', backgroundColor: 'transparent', color: COLORS.sub,
  border: `1px solid ${COLORS.line}`, borderRadius: 4, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
};
const input: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6, padding: '8px 10px',
  border: `1px solid ${COLORS.line}`, borderRadius: 4, fontSize: 13, backgroundColor: COLORS.bg,
  fontFamily: 'inherit',
};
