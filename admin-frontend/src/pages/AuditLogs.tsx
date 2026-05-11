import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api';
import { palette } from '../theme';
import { useT } from '../i18n';

const { NAVY, TEAL, CARD, TEXT_MUTED } = palette;

type AuditRes = {
  items: Array<{
    id: string; adminEmail: string; method: string; path: string;
    query: string | null; body: string | null; statusCode: number;
    ip: string | null; durationMs: number; createdAt: string;
  }>;
  byEmail: Array<{ adminEmail: string; _count: number }>;
};

export default function AuditLogs() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [path, setPath] = useState('');
  const q = useQuery({
    queryKey: ['admin-audit', email, path],
    queryFn: () => get<AuditRes>('/admin/audit-logs', {
      email: email || undefined,
      path: path || undefined,
      limit: 300,
    }),
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 4 }}>{t('audit.title')}</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 20, fontSize: 13 }}>
        {t('audit.subtitle')}
      </p>

      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: TEXT_MUTED }}>
          <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('audit.filter.email')}</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            style={inputStyle} placeholder="*" />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: TEXT_MUTED }}>
          <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('audit.filter.path')}</span>
          <input value={path} onChange={(e) => setPath(e.target.value)}
            style={inputStyle} placeholder="/admin/users" />
        </label>
        {(q.data?.byEmail ?? []).map((b) => (
          <span key={b.adminEmail} style={{
            padding: '4px 10px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
            backgroundColor: `${TEAL}20`, color: NAVY, borderRadius: 12,
          }}>{b.adminEmail} <span style={{ opacity: 0.6 }}>({b._count})</span></span>
        ))}
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${NAVY}15`, borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: `${NAVY}08`, color: TEXT_MUTED }}>
              <Th>{t('audit.col.time')}</Th>
              <Th>{t('audit.col.email')}</Th>
              <Th>{t('audit.col.method')}</Th>
              <Th>{t('audit.col.path')}</Th>
              <Th align="right">{t('audit.col.status')}</Th>
              <Th>{t('audit.col.ip')}</Th>
              <Th align="right">{t('audit.col.duration')}</Th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: TEXT_MUTED }}>{t('common.loading')}</td></tr>}
            {q.data?.items.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: TEXT_MUTED }}>{t('audit.empty')}</td></tr>
            )}
            {q.data?.items.map((row) => {
              const tone = row.statusCode >= 500 ? '#C25E2E' : row.statusCode >= 400 ? '#C7791F' : '#5A8A45';
              return (
                <tr key={row.id} style={{ borderTop: `1px solid ${NAVY}10` }}>
                  <Td mono muted>{new Date(row.createdAt).toISOString().slice(0, 19).replace('T', ' ')}</Td>
                  <Td>{row.adminEmail}</Td>
                  <Td mono><MethodChip method={row.method} /></Td>
                  <Td mono muted style={{ maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.path}</Td>
                  <Td align="right" mono accent={tone}>{row.statusCode}</Td>
                  <Td mono muted>{row.ip ?? '—'}</Td>
                  <Td align="right" mono muted>{row.durationMs}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MethodChip({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: '#5A8A45', POST: '#142850', PATCH: '#C7791F', DELETE: '#C25E2E', PUT: '#1FB8C4',
  };
  return (
    <span style={{
      padding: '1px 6px', fontSize: 10, fontWeight: 700,
      backgroundColor: `${colors[method] ?? '#8B95AB'}25`,
      color: colors[method] ?? '#8B95AB',
      borderRadius: 2,
    }}>{method}</span>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px', fontSize: 12, border: `1px solid ${NAVY}30`,
  borderRadius: 4, backgroundColor: '#EFEBDF', outline: 'none',
  fontFamily: 'inherit', minWidth: 200,
};

function Th({ children, align }: any) {
  return <th style={{ padding: '10px 14px', textAlign: align ?? 'left', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</th>;
}
function Td({ children, align, mono, muted, accent, style }: any) {
  return <td style={{
    padding: '10px 14px', textAlign: align ?? 'left',
    fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
    color: accent ?? (muted ? TEXT_MUTED : NAVY),
    whiteSpace: 'nowrap',
    ...(style ?? {}),
  }}>{children}</td>;
}
