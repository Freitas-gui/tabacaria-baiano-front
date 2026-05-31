"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { DeliveryRegionField } from "@/components/delivery-region-field";
import { useDeliveryRegions } from "@/hooks/use-delivery-regions";

export default function RegisterPage() {
  const router = useRouter();
  const { regions, loading: loadingRegions, error: regionsError } =
    useDeliveryRegions();
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    confirmacaoSenha: "",
    cidade: "",
    estado: "",
    bairro: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegionChange = (regionName: string) => {
    setForm({ ...form, bairro: regionName });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (
      !form.nome ||
      !form.telefone ||
      !form.email ||
      !form.senha ||
      !form.confirmacaoSenha ||
      !form.cidade ||
      !form.estado ||
      !form.bairro ||
      !form.cep ||
      !form.rua ||
      !form.numero
    ) {
      setError("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    if (!regions.some((region) => region.name === form.bairro)) {
      setError("Selecione uma região de entrega válida.");
      setLoading(false);
      return;
    }

    if (form.senha !== form.confirmacaoSenha) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.nome,
          email: form.email,
          password: form.senha,
          password_confirmation: form.confirmacaoSenha,
          phone: form.telefone,
          address: {
            street: form.rua,
            street_number: form.numero,
            postal_code: form.cep,
            district: form.bairro,
            city: form.cidade,
            state: form.estado,
            address_details: form.complemento || "",
            is_default_address: true,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erro ao registrar. Tente novamente.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch (err) {
      setError("Erro ao conectar com o servidor. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-primary px-4 py-8">
      <div className="w-full max-w-lg bg-card text-card-foreground rounded-2xl shadow-2xl p-6 sm:p-10 border border-white/10 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="kt-login__logo mb-3 sm:mb-4">
            <a
              href="/"
              className="sm:text-[2.5rem] text-2xl font-bold text-foreground no-underline"
            >
              Tabacaria do Baiano
            </a>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Criar Conta
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm text-center">
            Preencha os campos para se cadastrar
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <input
            name="nome"
            type="text"
            placeholder="Nome Completo *"
            value={form.nome}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
            required
            disabled={loading}
          />
          <input
            name="telefone"
            type="tel"
            placeholder="Telefone *"
            value={form.telefone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
            required
            disabled={loading}
          />
          <input
            name="email"
            type="email"
            placeholder="Email *"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
            required
            disabled={loading}
          />
          <input
            name="senha"
            type="password"
            placeholder="Senha *"
            value={form.senha}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
            required
            disabled={loading}
          />
          <input
            name="confirmacaoSenha"
            type="password"
            placeholder="Confirmação de senha *"
            value={form.confirmacaoSenha}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
            required
            disabled={loading}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              name="cidade"
              type="text"
              placeholder="Cidade *"
              value={form.cidade}
              onChange={handleChange}
              className="px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
              required
              disabled={loading}
            />
            <input
              name="estado"
              type="text"
              placeholder="Estado (UF) *"
              value={form.estado}
              onChange={handleChange}
              className="px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
              required
              disabled={loading}
              maxLength={2}
            />
          </div>
          <DeliveryRegionField
            id="register-region"
            regions={regions}
            value={form.bairro}
            onChange={handleRegionChange}
            loading={loadingRegions}
            error={regionsError}
            disabled={loading}
            showPrice={false}
            selectClassName="px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground shadow-sm"
          />
          <div className="grid grid-cols-3 gap-4">
            <input
              name="cep"
              type="text"
              placeholder="CEP *"
              value={form.cep}
              onChange={handleChange}
              className="px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
              required
              disabled={loading}
            />
            <input
              name="rua"
              type="text"
              placeholder="Rua *"
              value={form.rua}
              onChange={handleChange}
              className="px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
              required
              disabled={loading}
            />
            <input
              name="numero"
              type="text"
              placeholder="Número *"
              value={form.numero}
              onChange={handleChange}
              className="px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
              required
              disabled={loading}
            />
          </div>
          <input
            name="complemento"
            type="text"
            placeholder="Complemento"
            value={form.complemento}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-white/10 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground shadow-sm"
            disabled={loading}
          />
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full btn-theme-primary py-2 rounded-lg font-semibold shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
        <div className="mt-8 flex flex-col items-center space-y-2">
          <a
            href="/login"
            className="text-muted-foreground text-sm hover:text-theme-accent hover:underline"
          >
            Já tem conta? Entrar
          </a>
        </div>
      </div>
    </div>
  );
}
