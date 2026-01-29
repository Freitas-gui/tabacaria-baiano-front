"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    if (!email) {
      setError("Preencha o e-mail.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao solicitar redefinição de senha.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erro ao solicitar redefinição de senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-theme-primary to-blue-300 px-4 py-8">
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-6 sm:p-10 border border-gray-200 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="kt-login__logo mb-3 sm:mb-4">
            <a
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#007bff",
                textDecoration: "none",
                fontFamily: "inherit",
              }}
              href="/"
              className="sm:text-[2.5rem]"
            >
              ClickFarma
            </a>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-theme-primary flex items-center justify-center mb-2 sm:mb-3 shadow-lg">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="sm:w-8 sm:h-8">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                fill="#fff"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-2">
            Esqueci minha senha
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm text-center">
            {success
              ? "Verifique seu e-mail para redefinir sua senha"
              : "Digite seu e-mail para receber o link de redefinição"}
          </p>
        </div>
        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 text-sm">
                Enviamos um link de redefinição de senha para o e-mail informado.
                Verifique sua caixa de entrada e siga as instruções.
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-theme-primary text-white py-2 rounded-lg font-semibold shadow-md hover:bg-theme-secondary transition-colors text-lg"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-6">
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
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              className="w-full bg-theme-primary text-white py-2 rounded-lg font-semibold shadow-md hover:bg-theme-secondary transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Enviar link de redefinição"}
            </button>
          </form>
        )}
        <div className="mt-8 flex flex-col items-center space-y-2">
          <a
            href="/login"
            className="text-theme-primary text-sm hover:underline"
          >
            Voltar para o login
          </a>
        </div>
      </div>
    </div>
  );
}

