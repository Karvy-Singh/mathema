import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('polopot123@gmail.com');
  const [password, setPassword] = useState('password1234');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try { await login(email, password); }
    catch (e: any) { setErr(e?.response?.data?.error?.message ?? '로그인 실패'); }
    finally { setBusy(false); }
  };

  return <AuthShell title="로그인" subtitle="Mathēma · 입시 수학">
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Field label="이메일" type="email" value={email} onChange={setEmail} />
      <Field label="비밀번호" type="password" value={password} onChange={setPassword} />
      {err && <div style={{ color: '#8B3A1F', fontSize: 13 }}>{err}</div>}
      <button disabled={busy} type="submit" style={btnPrimary}>{busy ? '진행 중...' : '로그인'}</button>
      <div style={{ textAlign: 'center', fontSize: 13, color: '#6B6354' }}>
        계정이 없나요? <Link to="/register" style={{ color: '#1F1A14', fontWeight: 600 }}>회원가입</Link>
      </div>
      <div style={{ marginTop: 8, padding: 12, fontSize: 12, color: '#8B7E6A', backgroundColor: '#1F1A1408', borderRadius: 4 }}>
        시드 계정: polopot123@gmail.com / password1234
      </div>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#F2EDE2',
      fontFamily: '"Pretendard", -apple-system, sans-serif', color: '#1F1A14',
    }}>
      <div style={{ width: 380, padding: 32, backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.25em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: 8 }}>{subtitle}</div>
        <h1 style={{ fontSize: 28, margin: 0, marginBottom: 24, fontWeight: 500, letterSpacing: '-0.02em' }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, type = 'text', value, onChange }: any) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#8B7E6A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: '12px 14px', fontSize: 14, border: '1px solid #1F1A1430', borderRadius: 4, backgroundColor: '#F2EDE2', outline: 'none', fontFamily: 'inherit' }} />
    </label>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '14px', backgroundColor: '#1F1A14', color: '#F2EDE2',
  border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};
