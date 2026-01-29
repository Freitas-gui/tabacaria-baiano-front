"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // TODO: Replace with real authentication logic
    if (!email || !password) {
      setError("Preencha o e-mail e a senha.");
      return;
    }
    // Simulate login success
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-theme-primary to-blue-300">
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-10 border border-gray-200 backdrop-blur-md">
        <div className="flex flex-col items-center mb-8">
          <div className="kt-login__logo mb-4">
            <a
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#007bff",
                textDecoration: "none",
                fontFamily: "inherit",
              }}
              href="/"
            >
              ClickFarma
            </a>
          </div>
          <div className="w-16 h-16 rounded-full bg-theme-primary flex items-center justify-center mb-3 shadow-lg">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.761-3.582-5-8-5Z"
                fill="#fff"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-theme-primary mb-2">
            Bem-vindo!
          </h1>
          <p className="text-gray-500 text-sm">
            Acesse sua conta para continuar
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-theme-primary mb-1"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 block w-full px-4 py-2 border border-theme-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Digite seu e-mail"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-theme-primary mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 block w-full px-4 py-2 border border-theme-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Digite sua senha"
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-theme-primary text-white py-2 rounded-lg font-semibold shadow-md hover:bg-theme-secondary transition-colors text-lg"
          >
            Entrar
          </button>
        </form>
        <div className="mt-8 flex flex-col items-center space-y-2">
          <a href="#" className="text-theme-secondary text-sm hover:underline">
            Esqueci minha senha
          </a>
          <a
            href="/register"
            className="text-theme-primary text-sm hover:underline"
          >
            Criar conta
          </a>
        </div>
      </div>
    </div>
  );
}
