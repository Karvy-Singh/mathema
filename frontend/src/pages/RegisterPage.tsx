import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthShell, Field } from './LoginPage';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('2025-11-13');
  const [targetGrade, setTargetGrade] = useState('1');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await register({
        email, password, name,
        examDate: new Date(examDate).toISOString(),
        targetGrade: Number(targetGrade),
      });
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message ?? '회원가입 실패');
    } finally { setBusy(false); }
  };

  return <AuthShell title="회원가입" subtitle="Mathēma · 입시 수학">
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="이메일" type="email" value={email} onChange={setEmail} />
      <Field label="비밀번호 (8자 이상)" type="password" value={password} onChange={setPassword} />
      <Field label="이름" value={name} onChange={setName} />
      <Field label="수능 날짜" type="date" value={examDate} onChange={setExamDate} />
      <Field label="목표 등급 (1~9)" type="number" value={targetGrade} onChange={setTargetGrade} />
      {err && <div style={{ color: '#8B3A1F', fontSize: 13 }}>{err}</div>}
      <button disabled={busy} type="submit"
        style={{ padding: 14, backgroundColor: '#1F1A14', color: '#F2EDE2', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        {busy ? '진행 중...' : '계정 만들기'}
      </button>
      <div style={{ textAlign: 'center', fontSize: 13, color: '#6B6354' }}>
        이미 계정이 있나요? <Link to="/login" style={{ color: '#1F1A14', fontWeight: 600 }}>로그인</Link>
      </div>
    </form>
  </AuthShell>;
}
