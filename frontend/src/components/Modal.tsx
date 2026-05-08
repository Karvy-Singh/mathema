import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { useT } from '../lib/i18n';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  width?: number | string;
  children: ReactNode;
};

export default function Modal({ open, onClose, title, subtitle, width = 640, children }: Props) {
  const { t } = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(31,26,20,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: '"Pretendard", sans-serif',
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto',
          backgroundColor: '#FAF6EB', border: '1px solid #1F1A1420',
          borderRadius: 6, padding: 32, position: 'relative', color: '#1F1A14',
          boxShadow: '0 20px 60px rgba(31,26,20,0.25)',
        }}
      >
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6B6354', padding: 4,
          }}
        >
          <X size={18} />
        </button>
        {(title || subtitle) && (
          <div style={{ marginBottom: 20 }}>
            {subtitle && (
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: 6 }}>
                {subtitle}
              </div>
            )}
            {title && (
              <h2 style={{
                fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0,
                fontFamily: 'Fraunces, "Noto Serif KR", serif',
              }}>
                {title}
              </h2>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
