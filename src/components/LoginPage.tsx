'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.ok) {
      router.refresh();
    } else {
      setError('Usuário ou senha inválidos.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-yellow-400">
      <form
        onSubmit={handleLogin}
        className="bg-white text-black flex flex-col items-center gap-4 p-8 rounded-lg shadow-lg w-full max-w-sm"
      >
        <Image
          priority
          src="/logo.png"
          alt="Logo Franco Condado"
          width={150}
          height={150}
          className="mb-6"
        />

        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border border-gray-400 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-400 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
          disabled={loading}
        />

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-[#4B1E00] text-yellow-400 font-bold py-2 rounded w-full transition hover:opacity-90 hover:cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          )}
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
