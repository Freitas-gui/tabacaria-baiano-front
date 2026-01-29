"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    confirmacaoSenha: "",
    cidade: "",
    bairro: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Simple validation
    for (const key of [
      "nome",
      "telefone",
      "email",
      "senha",
      "confirmacaoSenha",
      "cidade",
      "bairro",
      "cep",
      "rua",
      "numero",
    ]) {
      if (!form[key]) {
        setError("Preencha todos os campos obrigatórios.");
        return;
      }
    }
    if (form.senha !== form.confirmacaoSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    // TODO: Add real registration logic
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-theme-primary to-blue-300">
      <div className="w-full max-w-lg bg-white/90 rounded-2xl shadow-2xl p-10 border border-gray-200 backdrop-blur-md">
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
          <h1 className="text-2xl font-bold text-theme-primary mb-2">
            Criar Conta
          </h1>
          <p className="text-gray-500 text-sm">
            Preencha os campos para se cadastrar
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="nome"
            type="text"
            placeholder="Nome Completo *"
            value={form.nome}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
            required
          />
          <input
            name="telefone"
            type="tel"
            placeholder="Telefone *"
            value={form.telefone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email *"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
            required
          />
          <input
            name="senha"
            type="password"
            placeholder="Senha *"
            value={form.senha}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
            required
          />
          <input
            name="confirmacaoSenha"
            type="password"
            placeholder="Confirmação de senha *"
            value={form.confirmacaoSenha}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              name="cidade"
              type="text"
              placeholder="Cidade *"
              value={form.cidade}
              onChange={handleChange}
              className="px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
              required
            />
            <input
              name="bairro"
              type="text"
              placeholder="Bairro *"
              value={form.bairro}
              onChange={handleChange}
              className="px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input
              name="cep"
              type="text"
              placeholder="CEP *"
              value={form.cep}
              onChange={handleChange}
              className="px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
              required
            />
            <input
              name="rua"
              type="text"
              placeholder="Rua *"
              value={form.rua}
              onChange={handleChange}
              className="px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
              required
            />
            <input
              name="numero"
              type="text"
              placeholder="Número *"
              value={form.numero}
              onChange={handleChange}
              className="px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
              required
            />
          </div>
          <input
            name="complemento"
            type="text"
            placeholder="Complemento"
            value={form.complemento}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-theme-primary/30 rounded-lg bg-blue-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
          />
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-theme-primary text-white py-2 rounded-lg font-semibold shadow-md hover:bg-theme-secondary transition-colors text-lg"
          >
            Cadastrar
          </button>
        </form>
        <div className="mt-8 flex flex-col items-center space-y-2">
          <a
            href="/login"
            className="text-theme-primary text-sm hover:underline"
          >
            Já tem conta? Entrar
          </a>
        </div>
      </div>
    </div>
  );
}
