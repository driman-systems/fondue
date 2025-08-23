import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LoginPage from '@/components/LoginPage';

export default async function LoginPageWrapper() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === 'admin') {
    redirect('/admin');
  } else if (session) {
    redirect('/');
  }

  return <LoginPage />;
}