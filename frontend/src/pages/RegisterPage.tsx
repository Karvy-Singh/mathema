import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, GradeLevel } from '../context/AuthContext';
import { AuthShell, Field } from './LoginPage';
import { useT } from '../lib/i18n';

const GRADES: GradeLevel[] = ['G_MIDDLE_1', 'G_MIDDLE_2', 'G_MIDDLE_3', 'G_HIGH_1', 'G_HIGH_2', 'G_HIGH_3'];

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('2025-11-13');
  const [targetGrade, setTargetGrade] = useState('1');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('G_HIGH_3');
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
        gradeLevel,
      });
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message ?? t('auth.register.failed'));
    } finally { setBusy(false); }
  };

  return <AuthShell title={t('auth.register.title')} subtitle={t('app.brand') + ' ' + t('app.tagline')}>
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label={t('auth.email')} type="email" value={email} onChange={setEmail} />
      <Field label={t('auth.passwordHint')} type="password" value={password} onChange={setPassword} />
      <Field label={t('auth.name')} value={name} onChange={setName} />
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#8B7E6A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('auth.gradeLevel')}</span>
        <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
          style={{ padding: '12px 14px', fontSize: 14, border: '1px solid #1F1A1430', borderRadius: 4, backgroundColor: '#F2EDE2', outline: 'none', fontFamily: 'inherit' }}>
          {GRADES.map((g) => (<option key={g} value={g}>{t(`grade.${g}`)}</option>))}
        </select>
      </label>
      <Field label={t('auth.examDate')} type="date" value={examDate} onChange={setExamDate} />
      <Field label={t('auth.targetGrade')} type="number" value={targetGrade} onChange={setTargetGrade} />
      {err && <div style={{ color: '#8B3A1F', fontSize: 13 }}>{err}</div>}
      <button disabled={busy} type="submit"
        style={{ padding: 14, backgroundColor: '#1F1A14', color: '#F2EDE2', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        {busy ? t('auth.login.busy') : t('auth.register.submit')}
      </button>
      <div style={{ textAlign: 'center', fontSize: 13, color: '#6B6354' }}>
        {t('auth.register.haveAccount')} <Link to="/login" style={{ color: '#1F1A14', fontWeight: 600 }}>{t('auth.register.goLogin')}</Link>
      </div>
    </form>
  </AuthShell>;
}
