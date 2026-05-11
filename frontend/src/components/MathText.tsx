import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * MathText — 문제 본문/개념/공식 텍스트에서 LaTeX 수식을 KaTeX 로 렌더링.
 *
 * 지원 문법:
 *   - $...$ 인라인 수식
 *   - $$...$$ 디스플레이 수식
 *   - 그 외 일반 텍스트는 그대로 (개행은 <br/>)
 *
 * KaTeX 는 SSR-safe, throwOnError=false 로 잘못된 LaTeX 도 빨갛게 표시만 하고 중단 안함.
 */
export default function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderInline(text ?? ''), [text]);
  return (
    <span
      className={className}
      // KaTeX 가 만든 HTML 은 신뢰 가능 (라이브러리 sanitize). 사용자 입력은 split 단계에서 escape.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderInline(src: string): string {
  // $$...$$ → display, $...$ → inline. 둘 다 같이 처리.
  const tokens = src.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  const parts: string[] = [];
  for (const tk of tokens) {
    if (!tk) continue;
    const display = tk.startsWith('$$') && tk.endsWith('$$');
    const inline = !display && tk.startsWith('$') && tk.endsWith('$') && tk.length > 1;
    if (display || inline) {
      const tex = display ? tk.slice(2, -2) : tk.slice(1, -1);
      try {
        parts.push(katex.renderToString(tex, {
          displayMode: display,
          throwOnError: false,
          strict: 'ignore',
        }));
      } catch {
        parts.push(escapeHtml(tk));
      }
    } else {
      parts.push(escapeHtml(tk).replace(/\n/g, '<br/>'));
    }
  }
  return parts.join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
