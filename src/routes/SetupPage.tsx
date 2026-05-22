import { FormEvent, useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/bookdApi';
import { useToast } from '../components/ToastProvider';

export function SetupPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    authApi.hasAdmin().then((status) => {
      if (status.hasAdmin) navigate('/login', { replace: true });
    }).catch(() => undefined);
  }, [navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');
    const email = String(form.get('email') ?? '').trim() || null;

    if (username.length < 3) {
      showToast('用户名至少需要3个字符', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('密码至少需要6个字符', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('两次输入的密码不一致', 'error');
      return;
    }

    setLoading(true);
    try {
      await authApi.setup(username, password, email);
      showToast('管理员创建成功，请登录', 'success');
      navigate('/login', { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创建失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel setup-panel">
        <Rocket size={48} />
        <h1>欢迎使用 Bookd</h1>
        <p>首次设置，创建管理员账号</p>
        <form className="form" onSubmit={submit}>
          <label>
            用户名
            <input name="username" required autoComplete="username" />
          </label>
          <label>
            密码
            <input name="password" type="password" required autoComplete="new-password" />
          </label>
          <label>
            确认密码
            <input name="confirmPassword" type="password" required autoComplete="new-password" />
          </label>
          <label>
            邮箱
            <input name="email" type="email" autoComplete="email" />
          </label>
          <button className="button primary full" disabled={loading} type="submit">
            创建管理员
          </button>
        </form>
      </section>
    </main>
  );
}
