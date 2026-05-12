/**
 * GraphRenderer — ConceptLesson 의 visualData (JSON) 를 받아 인라인 SVG 로 그래프/도형을 그립니다.
 *
 * AI 호출 없이 결정론적으로 렌더 → 수학 정확성·일관성·즉시 응답·무비용.
 *
 * 지원 type:
 *   - unit-circle      삼각함수 단위원 + 각 θ 시각화
 *   - parabola         y = ax² + bx + c
 *   - number-line      수직선 + 점·구간 표시
 *   - venn-2set        2 집합 벤다이어그램 (교집합 표시)
 *   - sine-wave        y = A sin(2π x / period)
 *   - complex-plane    복소평면 + 여러 z 점
 *   - right-triangle   직각삼각형 (opp / adj / hyp 라벨)
 *   - function-line    y = mx + c
 *
 * 새 type 추가:
 *   1. types.ts 의 VisualData union 에 추가
 *   2. 아래 switch 에 case 하나 추가
 */

import React from 'react';

type VisualData =
  | { type: 'unit-circle'; angle: number; label?: string }
  | { type: 'parabola'; a: number; b: number; c: number; range?: [number, number] }
  | { type: 'number-line'; marks: number[]; highlight?: number; range?: [number, number] }
  | { type: 'venn-2set'; a: number; b: number; both: number; labelA: string; labelB: string; total?: number }
  | { type: 'sine-wave'; amplitude?: number; period?: number; marked?: Array<{ x: number; y: number; label?: string }>; range?: [number, number] }
  | { type: 'complex-plane'; points: Array<{ re: number; im: number; label?: string }> }
  | { type: 'right-triangle'; opp: number; adj: number; angleLabel?: string }
  | { type: 'function-line'; m: number; c: number; range?: [number, number]; markedPoints?: Array<{ x: number; y: number }> };

const COLORS = {
  axis: '#5C6B85',
  grid: '#DDD7C5',
  curve: '#2A3447',
  point: '#dc2626',
  arc: '#0ea5e9',
  textMuted: '#8B95AB',
  bgA: 'rgba(14,165,233,0.18)',
  bgB: 'rgba(234,88,12,0.18)',
};

export function GraphRenderer({ data }: { data: VisualData }) {
  switch (data.type) {
    case 'unit-circle': return <UnitCircle angle={data.angle} label={data.label} />;
    case 'parabola': return <Parabola a={data.a} b={data.b} c={data.c} range={data.range} />;
    case 'number-line': return <NumberLine marks={data.marks} highlight={data.highlight} range={data.range} />;
    case 'venn-2set': return <Venn2Set {...data} />;
    case 'sine-wave': return <SineWave amplitude={data.amplitude ?? 1} period={data.period ?? 360} marked={data.marked} range={data.range} />;
    case 'complex-plane': return <ComplexPlane points={data.points} />;
    case 'right-triangle': return <RightTriangle opp={data.opp} adj={data.adj} angleLabel={data.angleLabel} />;
    case 'function-line': return <FunctionLine m={data.m} c={data.c} range={data.range} markedPoints={data.markedPoints} />;
    default: return null;
  }
}

// =========================================================
// UNIT CIRCLE
// =========================================================
function UnitCircle({ angle, label }: { angle: number; label?: string }) {
  const W = 320, H = 320, cx = W / 2, cy = H / 2, R = 110;
  const rad = (angle * Math.PI) / 180;
  const px = cx + R * Math.cos(rad);
  const py = cy - R * Math.sin(rad);   // SVG y 반전
  // 호 그리기 (양의 x 축에서 angle 까지)
  const largeArc = Math.abs(angle) > 180 ? 1 : 0;
  const sweepEnd = `${cx + 40 * Math.cos(rad)},${cy - 40 * Math.sin(rad)}`;
  return (
    <Frame w={W} h={H} caption={`(cos ${angle}°, sin ${angle}°) = (${Math.cos(rad).toFixed(2)}, ${Math.sin(rad).toFixed(2)})`}>
      {/* 축 */}
      <line x1={20} y1={cy} x2={W - 20} y2={cy} stroke={COLORS.axis} strokeWidth={1} />
      <line x1={cx} y1={20} x2={cx} y2={H - 20} stroke={COLORS.axis} strokeWidth={1} />
      {/* 단위원 */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={COLORS.grid} strokeWidth={1.5} />
      {/* 각 호 */}
      <path
        d={`M ${cx + 40},${cy} A 40 40 0 ${largeArc} 0 ${sweepEnd}`}
        fill="none" stroke={COLORS.arc} strokeWidth={2}
      />
      <text x={cx + 50} y={cy - 8} fill={COLORS.arc} fontSize={12} fontWeight={600}>
        {angle}°
      </text>
      {/* 종점 */}
      <line x1={cx} y1={cy} x2={px} y2={py} stroke={COLORS.curve} strokeWidth={2} />
      <circle cx={px} cy={py} r={5} fill={COLORS.point} />
      <text x={px + 8} y={py - 8} fill={COLORS.curve} fontSize={13} fontWeight={600}>
        {label ?? `(${Math.cos(rad).toFixed(2)}, ${Math.sin(rad).toFixed(2)})`}
      </text>
    </Frame>
  );
}

// =========================================================
// PARABOLA y = ax² + bx + c
// =========================================================
function Parabola({ a, b, c, range = [-5, 5] as [number, number] }: { a: number; b: number; c: number; range?: [number, number] }) {
  const W = 360, H = 280, padX = 30, padY = 24;
  const [xmin, xmax] = range;
  // y 값 범위 자동 계산
  const samples: Array<[number, number]> = [];
  for (let i = 0; i <= 60; i++) {
    const x = xmin + (xmax - xmin) * (i / 60);
    samples.push([x, a * x * x + b * x + c]);
  }
  const ys = samples.map((s) => s[1]);
  const ymin = Math.min(...ys, 0) - 1;
  const ymax = Math.max(...ys, 0) + 1;
  const sx = (x: number) => padX + ((x - xmin) / (xmax - xmin)) * (W - 2 * padX);
  const sy = (y: number) => H - padY - ((y - ymin) / (ymax - ymin)) * (H - 2 * padY);

  const d = samples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${sx(s[0])},${sy(s[1])}`).join(' ');
  // 영점 (실근만)
  const disc = b * b - 4 * a * c;
  const roots: number[] = [];
  if (disc >= 0 && a !== 0) {
    const r1 = (-b - Math.sqrt(disc)) / (2 * a);
    const r2 = (-b + Math.sqrt(disc)) / (2 * a);
    roots.push(r1);
    if (r1 !== r2) roots.push(r2);
  }
  return (
    <Frame w={W} h={H} caption={`y = ${fmtCoef(a)}x² ${signCoef(b)}x ${signCoef(c)}`.replace(' 1x', ' x')}>
      <Axes sx={sx} sy={sy} xmin={xmin} xmax={xmax} ymin={ymin} ymax={ymax} />
      <path d={d} fill="none" stroke={COLORS.curve} strokeWidth={2.5} />
      {roots.map((r, i) => (
        <g key={i}>
          <circle cx={sx(r)} cy={sy(0)} r={4.5} fill={COLORS.point} />
          <text x={sx(r) + 6} y={sy(0) + 16} fontSize={11} fill={COLORS.point}>x = {r.toFixed(2)}</text>
        </g>
      ))}
    </Frame>
  );
}

// =========================================================
// NUMBER LINE
// =========================================================
function NumberLine({ marks, highlight, range }: { marks: number[]; highlight?: number; range?: [number, number] }) {
  const W = 360, H = 100, cy = H / 2, padX = 30;
  const xmin = range?.[0] ?? Math.min(...marks) - 1;
  const xmax = range?.[1] ?? Math.max(...marks) + 1;
  const sx = (x: number) => padX + ((x - xmin) / (xmax - xmin)) * (W - 2 * padX);
  return (
    <Frame w={W} h={H} caption={`number line · ${marks.join(', ')}`}>
      <line x1={padX} y1={cy} x2={W - padX} y2={cy} stroke={COLORS.axis} strokeWidth={1.5} />
      {/* 화살표 */}
      <polygon points={`${W - padX},${cy} ${W - padX - 8},${cy - 5} ${W - padX - 8},${cy + 5}`} fill={COLORS.axis} />
      <polygon points={`${padX},${cy} ${padX + 8},${cy - 5} ${padX + 8},${cy + 5}`} fill={COLORS.axis} />
      {marks.map((m) => (
        <g key={m}>
          <circle cx={sx(m)} cy={cy} r={highlight === m ? 6 : 4} fill={highlight === m ? COLORS.point : COLORS.curve} />
          <text x={sx(m)} y={cy + 22} textAnchor="middle" fontSize={12} fill={COLORS.curve} fontWeight={highlight === m ? 700 : 500}>
            {m}
          </text>
        </g>
      ))}
    </Frame>
  );
}

// =========================================================
// VENN DIAGRAM (2 set)
// =========================================================
function Venn2Set({ a, b, both, labelA, labelB, total }: {
  a: number; b: number; both: number; labelA: string; labelB: string; total?: number;
}) {
  const W = 360, H = 240, cy = 120, r = 70, cxA = 120, cxB = 240;
  const onlyA = a - both;
  const onlyB = b - both;
  return (
    <Frame w={W} h={H} caption={`${labelA}: ${a} · ${labelB}: ${b} · both: ${both}${total != null ? ` · neither: ${total - a - b + both}` : ''}`}>
      <circle cx={cxA} cy={cy} r={r} fill={COLORS.bgA} stroke={COLORS.arc} strokeWidth={1.5} />
      <circle cx={cxB} cy={cy} r={r} fill={COLORS.bgB} stroke="#ea580c" strokeWidth={1.5} />
      <text x={cxA - 40} y={28} fontSize={13} fontWeight={600} fill={COLORS.arc}>{labelA}</text>
      <text x={cxB - 4} y={28} fontSize={13} fontWeight={600} fill="#ea580c">{labelB}</text>
      <text x={cxA - 35} y={cy + 6} fontSize={16} fontWeight={700} fill={COLORS.curve}>{onlyA}</text>
      <text x={(cxA + cxB) / 2 - 6} y={cy + 6} fontSize={16} fontWeight={700} fill={COLORS.curve}>{both}</text>
      <text x={cxB + 25} y={cy + 6} fontSize={16} fontWeight={700} fill={COLORS.curve}>{onlyB}</text>
      {total != null && (
        <text x={W / 2} y={H - 12} textAnchor="middle" fontSize={11} fill={COLORS.textMuted}>
          U = {total}
        </text>
      )}
    </Frame>
  );
}

// =========================================================
// SINE WAVE
// =========================================================
function SineWave({ amplitude, period, marked, range }: {
  amplitude: number; period: number;
  marked?: Array<{ x: number; y: number; label?: string }>;
  range?: [number, number];
}) {
  const W = 380, H = 240, padX = 32, padY = 24;
  const xmin = range?.[0] ?? 0;
  const xmax = range?.[1] ?? 360;
  const ymin = -amplitude - 0.5;
  const ymax = amplitude + 0.5;
  const sx = (x: number) => padX + ((x - xmin) / (xmax - xmin)) * (W - 2 * padX);
  const sy = (y: number) => H - padY - ((y - ymin) / (ymax - ymin)) * (H - 2 * padY);
  const samples: Array<[number, number]> = [];
  for (let i = 0; i <= 120; i++) {
    const x = xmin + (xmax - xmin) * (i / 120);
    samples.push([x, amplitude * Math.sin((2 * Math.PI * x) / period)]);
  }
  const d = samples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${sx(s[0])},${sy(s[1])}`).join(' ');
  return (
    <Frame w={W} h={H} caption={`y = ${amplitude} sin(2πx / ${period})`}>
      <Axes sx={sx} sy={sy} xmin={xmin} xmax={xmax} ymin={ymin} ymax={ymax} ticksX={[0, 90, 180, 270, 360].filter((x) => x >= xmin && x <= xmax)} />
      <path d={d} fill="none" stroke={COLORS.curve} strokeWidth={2.5} />
      {marked?.map((p, i) => (
        <g key={i}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={5} fill={COLORS.point} />
          <text x={sx(p.x) + 6} y={sy(p.y) - 6} fontSize={11} fill={COLORS.point}>
            {p.label ?? `(${p.x}, ${p.y.toFixed(2)})`}
          </text>
        </g>
      ))}
    </Frame>
  );
}

// =========================================================
// COMPLEX PLANE
// =========================================================
function ComplexPlane({ points }: { points: Array<{ re: number; im: number; label?: string }> }) {
  const W = 320, H = 320, cx = W / 2, cy = H / 2;
  const allRe = points.map((p) => p.re);
  const allIm = points.map((p) => p.im);
  const bound = Math.max(2, ...allRe.map(Math.abs), ...allIm.map(Math.abs)) + 1;
  const scale = (W / 2 - 20) / bound;
  return (
    <Frame w={W} h={H} caption="complex plane (Re, Im)">
      <line x1={20} y1={cy} x2={W - 20} y2={cy} stroke={COLORS.axis} />
      <line x1={cx} y1={20} x2={cx} y2={H - 20} stroke={COLORS.axis} />
      <text x={W - 16} y={cy - 6} fontSize={11} fill={COLORS.textMuted}>Re</text>
      <text x={cx + 6} y={24} fontSize={11} fill={COLORS.textMuted}>Im</text>
      {points.map((p, i) => {
        const x = cx + p.re * scale;
        const y = cy - p.im * scale;
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={COLORS.arc} strokeWidth={1.5} strokeDasharray="3 3" />
            <circle cx={x} cy={y} r={5} fill={COLORS.point} />
            <text x={x + 8} y={y - 6} fontSize={12} fontWeight={600} fill={COLORS.curve}>
              {p.label ?? `${p.re}${p.im >= 0 ? '+' : ''}${p.im}i`}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

// =========================================================
// RIGHT TRIANGLE
// =========================================================
function RightTriangle({ opp, adj, angleLabel }: { opp: number; adj: number; angleLabel?: string }) {
  const W = 320, H = 240, padX = 40, padY = 30;
  const maxLen = Math.max(opp, adj);
  const scale = Math.min((W - 2 * padX) / adj, (H - 2 * padY) / opp);
  const x0 = padX, y0 = H - padY;
  const x1 = x0 + adj * scale;
  const y1 = y0 - opp * scale;
  const hyp = Math.sqrt(opp * opp + adj * adj);
  return (
    <Frame w={W} h={H} caption={`opp ${opp} · adj ${adj} · hyp ${hyp.toFixed(2)}`}>
      <polygon points={`${x0},${y0} ${x1},${y0} ${x1},${y1}`} fill="rgba(14,165,233,0.15)" stroke={COLORS.curve} strokeWidth={2} />
      <text x={(x0 + x1) / 2} y={y0 + 18} textAnchor="middle" fontSize={12} fill={COLORS.curve}>adj = {adj}</text>
      <text x={x1 + 6} y={(y0 + y1) / 2} fontSize={12} fill={COLORS.curve}>opp = {opp}</text>
      <text x={(x0 + x1) / 2 - 30} y={(y0 + y1) / 2 - 10} fontSize={12} fill={COLORS.curve}>hyp = {hyp.toFixed(2)}</text>
      {/* 직각 표시 */}
      <rect x={x1 - 10} y={y0 - 10} width={10} height={10} fill="none" stroke={COLORS.curve} />
      {angleLabel && (
        <text x={x0 + 16} y={y0 - 8} fontSize={12} fontWeight={600} fill={COLORS.arc}>{angleLabel}</text>
      )}
    </Frame>
  );
}

// =========================================================
// FUNCTION LINE y = mx + c
// =========================================================
function FunctionLine({ m, c, range = [-5, 5] as [number, number], markedPoints }: {
  m: number; c: number; range?: [number, number]; markedPoints?: Array<{ x: number; y: number }>;
}) {
  const W = 360, H = 280, padX = 30, padY = 24;
  const [xmin, xmax] = range;
  const ymin = Math.min(m * xmin + c, m * xmax + c, 0) - 1;
  const ymax = Math.max(m * xmin + c, m * xmax + c, 0) + 1;
  const sx = (x: number) => padX + ((x - xmin) / (xmax - xmin)) * (W - 2 * padX);
  const sy = (y: number) => H - padY - ((y - ymin) / (ymax - ymin)) * (H - 2 * padY);
  return (
    <Frame w={W} h={H} caption={`y = ${fmtCoef(m)}x ${signCoef(c)}`}>
      <Axes sx={sx} sy={sy} xmin={xmin} xmax={xmax} ymin={ymin} ymax={ymax} />
      <line x1={sx(xmin)} y1={sy(m * xmin + c)} x2={sx(xmax)} y2={sy(m * xmax + c)} stroke={COLORS.curve} strokeWidth={2.5} />
      {markedPoints?.map((p, i) => (
        <g key={i}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={5} fill={COLORS.point} />
          <text x={sx(p.x) + 6} y={sy(p.y) - 6} fontSize={11} fill={COLORS.point}>({p.x}, {p.y})</text>
        </g>
      ))}
    </Frame>
  );
}

// =========================================================
// 공용 helpers
// =========================================================
function Frame({ w, h, caption, children }: { w: number; h: number; caption: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-block', padding: 12, background: '#FAF8F1', border: '1px solid #DDD7C5', borderRadius: 8, margin: '8px 0' }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={caption}>
        {children}
      </svg>
      <div style={{ fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
        {caption}
      </div>
    </div>
  );
}

function Axes({ sx, sy, xmin, xmax, ymin, ymax, ticksX }: {
  sx: (x: number) => number; sy: (y: number) => number;
  xmin: number; xmax: number; ymin: number; ymax: number; ticksX?: number[];
}) {
  const x0 = sx(xmin), x1 = sx(xmax), y0 = sy(0), yMin = sy(ymin), yMax = sy(ymax);
  const xZero = sx(0);
  const xTicks = ticksX ?? rangeTicks(xmin, xmax);
  return (
    <g>
      <line x1={x0} y1={y0} x2={x1} y2={y0} stroke={COLORS.axis} strokeWidth={1} />
      <line x1={xZero} y1={yMin} x2={xZero} y2={yMax} stroke={COLORS.axis} strokeWidth={1} />
      {xTicks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} y1={y0 - 3} x2={sx(t)} y2={y0 + 3} stroke={COLORS.axis} />
          <text x={sx(t)} y={y0 + 14} textAnchor="middle" fontSize={10} fill={COLORS.textMuted}>{t}</text>
        </g>
      ))}
    </g>
  );
}

function rangeTicks(min: number, max: number): number[] {
  const step = Math.ceil((max - min) / 6);
  const out: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) out.push(t);
  return out;
}

function fmtCoef(c: number): string {
  if (c === 1) return '';
  if (c === -1) return '−';
  return String(c);
}
function signCoef(c: number): string {
  if (c === 0) return '';
  if (c > 0) return `+ ${c}`;
  return `− ${Math.abs(c)}`;
}
