import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type ToastEvent = { id: number; kind: ToastKind; text: string };

let nextId = 1;
const EVENT = 'mathema-toast';

export function toast(text: string, kind: ToastKind = 'info') {
  window.dispatchEvent(new CustomEvent<ToastEvent>(EVENT, {
    detail: { id: nextId++, kind, text },
  }));
}

export function ToastHost() {
  const [items, setItems] = useState<ToastEvent[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastEvent>).detail;
      setItems((prev) => [...prev, detail]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== detail.id));
      }, 3500);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      display: 'flex', flexDirection: 'column', gap: 8,
      fontFamily: '"Pretendard", sans-serif',
    }}>
      {items.map((it) => {
        const color =
          it.kind === 'success' ? '#5A8A45' :
          it.kind === 'error' ? '#C25E2E' : '#142850';
        const Icon =
          it.kind === 'success' ? CheckCircle2 :
          it.kind === 'error' ? AlertCircle : Info;
        return (
          <div key={it.id} style={{
            backgroundColor: '#142850', color: '#EFEBDF',
            padding: '12px 16px', borderRadius: 4, minWidth: 280, maxWidth: 420,
            display: 'flex', alignItems: 'flex-start', gap: 10,
            borderLeft: `3px solid ${color}`,
            boxShadow: '0 8px 24px rgba(31,26,20,0.25)',
            animation: 'toastIn 0.22s ease-out',
            fontSize: 13, lineHeight: 1.5,
          }}>
            <style>{`@keyframes toastIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
            <Icon size={16} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{it.text}</span>
          </div>
        );
      })}
    </div>
  );
}
