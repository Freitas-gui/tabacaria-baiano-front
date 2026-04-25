"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Preencha o e-mail e a senha.");
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-primary px-4 py-8">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-2xl p-6 sm:p-10 border border-white/10 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="kt-login__logo mb-3 sm:mb-4">
            <a
              href="/"
              className="sm:text-[2.5rem] text-2xl font-bold text-foreground no-underline"
            >
              Tabacaria do Baiano
            </a>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-theme-accent flex items-center justify-center mb-2 sm:mb-3 shadow-lg">
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              className="sm:w-8 sm:h-8"
            >
              <path
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.761-3.582-5-8-5Z"
                fill="#fff"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Bem-vindo!
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm text-center">
            Acesse sua conta para continuar
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 block w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Digite seu e-mail"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 block w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
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
            className="w-full btn-theme-primary py-2 rounded-lg font-semibold shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="mt-8 flex flex-col items-center space-y-2">
          <a
            href="/forgot-password"
            className="text-muted-foreground text-sm hover:text-theme-accent hover:underline"
          >
            Esqueci minha senha
          </a>
          <a
            href="/register"
            className="text-foreground text-sm hover:text-theme-accent hover:underline"
          >
            Criar conta
          </a>
        </div>
      </div>
    </div>
  );
}
