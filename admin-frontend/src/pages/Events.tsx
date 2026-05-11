import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api';
import { palette } from '../theme';
import { useT } from '../i18n';

const { NAVY, TEAL, CARD, TEXT_MUTED } = palette;

type EventsRes = {
  items: Array<{
    id: string; eventType: string; payload: any; source: string | null;
    sessionId: string | null; createdAt: string;
    user: { email: string; name: string } | null;
  }>;
  byType: Array<{ eventType: string; _count: number }>;
};

export default function Events() {
  const { t } = useT();
  const [type, setType] = useState('');
  const q = useQuery({
    queryKey: ['admin-events', type],
    queryFn: () => get<EventsRes>('/admin/events', { type: type || undefined, limit: 200 }),
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 4 }}>{t('events.title')}</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 20, fontSize: 13 }}>
        {t('events.subtitle')}
      </p>

      <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: TEXT_MUTED }}>
          <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('events.filter')}</span>
          <input
            value={type} onChange={(e) => setType(e.target.value)}
            placeholder={t('events.placeholder')}
            style={{ padding: '6px 10px', fontSize: 12, border: `1px solid ${NAVY}30`, borderRadius: 4, backgroundColor: '#EFEBDF', outline: 'none', fontFamily: 'inherit', minWidth: 200 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(q.data?.byType ?? []).slice(0, 10).map((b) => (
            <button key={b.eventType} onClick={() => setType(b.eventType)} style={{
              padding: '4px 10px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
              backgroundColor: type === b.eventType ? NAVY : `${TEAL}20`,
              color: type === b.eventType ? '#EFEBDF' : NAVY,
              border: 'none', borderRadius: 12, cursor: 'pointer',
            }}>{b.eventType} <span style={{ opacity: 0.6 }}>({b._count})</span></button>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${NAVY}15`, borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: `${NAVY}08`, color: TEXT_MUTED }}>
              <Th>{t('events.col.time')}</Th><Th>{t('events.col.user')}</Th><Th>{t('events.col.type')}</Th><Th>{t('events.col.payload')}</Th><Th>{t('events.col.source')}</Th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: TEXT_MUTED }}>{t('common.loading')}</td></tr>}
            {q.data?.items.map((e) => (
              <tr key={e.id} style={{ borderTop: `1px solid ${NAVY}10` }}>
                <Td mono muted>{new Date(e.createdAt).toISOString().slice(0, 16).replace('T', ' ')}</Td>
                <Td>{e.user ? <span><b>{e.user.name}</b> <span style={{ color: TEXT_MUTED, fontSize: 11 }}>· {e.user.email}</span></span> : <span style={{ color: TEXT_MUTED }}>guest</span>}</Td>
                <Td><span style={{ padding: '2px 8px', backgroundColor: `${TEAL}20`, color: NAVY, borderRadius: 2, fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{e.eventType}</span></Td>
                <Td mono muted style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>{JSON.stringify(e.payload)}</Td>
                <Td muted>{e.source ?? '—'}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align }: any) {
  return <th style={{ padding: '10px 14px', textAlign: align ?? 'left', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</th>;
}
function Td({ children, align, mono, muted, style }: any) {
  return <td style={{
    padding: '10px 14px', textAlign: align ?? 'left',
    fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
    color: muted ? TEXT_MUTED : NAVY,
    whiteSpace: 'nowrap',
    ...(style ?? {}),
  }}>{children}</td>;
}
