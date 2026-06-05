"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { ProfileUpdatePayload } from "@/lib/user-api"
import { useUser } from "@/contexts/user-context"
import { DeliveryRegionField } from "@/components/delivery-region-field"
import { useDeliveryRegions } from "@/hooks/use-delivery-regions"

const inputClassName =
  "w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"

const labelClassName = "block text-sm font-medium text-foreground mb-1"

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required ? " *" : ""}
      </label>
      {children}
      {hint ? (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      ) : null}
    </div>
  )
}

export function AccountPage() {
  const router = useRouter()
  const { user, isLoading, refreshUser, updateProfile } = useUser()
  const { regions, loading: loadingRegions, error: regionsError } =
    useDeliveryRegions()

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    cidade: "",
    estado: "",
    bairro: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingProfile, setFetchingProfile] = useState(true)

  useEffect(() => {
    if (isLoading) return

    if (!user?.accessToken) {
      router.replace("/login")
      return
    }

    let cancelled = false

    async function loadProfile() {
      setFetchingProfile(true)
      try {
        await refreshUser()
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar seus dados.")
        }
      } finally {
        if (!cancelled) {
          setFetchingProfile(false)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [isLoading, user?.accessToken, router, refreshUser])

  useEffect(() => {
    if (!user) return

    setForm({
      nome: user.name ?? "",
      telefone: user.phone ?? "",
      email: user.email ?? "",
      cidade: user.address?.city ?? "",
      estado: user.address?.state ?? "",
      bairro: user.address?.district ?? "",
      cep: user.address?.postal_code ?? "",
      rua: user.address?.street ?? "",
      numero: user.address?.street_number ?? "",
      complemento: user.address?.address_details ?? "",
    })
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRegionChange = (regionName: string) => {
    setForm({ ...form, bairro: regionName })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (
      !form.nome ||
      !form.telefone ||
      !form.cidade ||
      !form.estado ||
      !form.bairro ||
      !form.cep ||
      !form.rua ||
      !form.numero
    ) {
      setError("Preencha todos os campos obrigatórios.")
      return
    }

    if (!regions.some((region) => region.name === form.bairro)) {
      setError("Selecione uma região de entrega válida.")
      return
    }

    const payload: ProfileUpdatePayload = {
      name: form.nome,
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
    }

    setLoading(true)

    try {
      await updateProfile(payload)
      setSuccess("Seus dados foram atualizados com sucesso.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.",
      )
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || fetchingProfile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-10 max-w-lg">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
        Minha conta
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Atualize seus dados pessoais e endereço de entrega.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 sm:space-y-4 bg-card text-card-foreground rounded-2xl shadow-lg p-4 sm:p-8 border border-border"
      >
        <h2 className="text-sm font-semibold text-foreground">Dados pessoais</h2>
        <Field id="account-nome" label="Nome completo" required>
          <input
            id="account-nome"
            name="nome"
            type="text"
            placeholder="Digite seu nome completo"
            value={form.nome}
            onChange={handleChange}
            className={inputClassName}
            required
            disabled={loading}
          />
        </Field>
        <Field id="account-telefone" label="Telefone" required>
          <input
            id="account-telefone"
            name="telefone"
            type="tel"
            placeholder="Digite seu telefone"
            value={form.telefone}
            onChange={handleChange}
            className={inputClassName}
            required
            disabled={loading}
          />
        </Field>
        <Field
          id="account-email"
          label="E-mail"
          hint="O e-mail não pode ser alterado."
        >
          <input
            id="account-email"
            name="email"
            type="email"
            value={form.email}
            readOnly
            className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
          />
        </Field>

        <h2 className="text-sm font-semibold text-foreground pt-2">
          Endereço de entrega
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field id="account-cidade" label="Cidade" required>
            <input
              id="account-cidade"
              name="cidade"
              type="text"
              placeholder="Cidade"
              value={form.cidade}
              onChange={handleChange}
              className={inputClassName}
              required
              disabled={loading}
            />
          </Field>
          <Field id="account-estado" label="Estado (UF)" required>
            <input
              id="account-estado"
              name="estado"
              type="text"
              placeholder="UF"
              value={form.estado}
              onChange={handleChange}
              className={inputClassName}
              required
              disabled={loading}
              maxLength={2}
            />
          </Field>
        </div>
        <DeliveryRegionField
          id="account-region"
          regions={regions}
          value={form.bairro}
          onChange={handleRegionChange}
          loading={loadingRegions}
          error={regionsError}
          disabled={loading}
          showPrice={false}
          selectClassName="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field id="account-cep" label="CEP" required>
            <input
              id="account-cep"
              name="cep"
              type="text"
              placeholder="00000-000"
              value={form.cep}
              onChange={handleChange}
              className={inputClassName}
              required
              disabled={loading}
            />
          </Field>
          <Field id="account-rua" label="Rua" required>
            <input
              id="account-rua"
              name="rua"
              type="text"
              placeholder="Nome da rua"
              value={form.rua}
              onChange={handleChange}
              className={inputClassName}
              required
              disabled={loading}
            />
          </Field>
          <Field id="account-numero" label="Número" required>
            <input
              id="account-numero"
              name="numero"
              type="text"
              placeholder="Nº"
              value={form.numero}
              onChange={handleChange}
              className={inputClassName}
              required
              disabled={loading}
            />
          </Field>
        </div>
        <Field id="account-complemento" label="Complemento">
          <input
            id="account-complemento"
            name="complemento"
            type="text"
            placeholder="Apartamento, bloco, referência..."
            value={form.complemento}
            onChange={handleChange}
            className={inputClassName}
            disabled={loading}
          />
        </Field>
        {error && (
          <div className="text-destructive text-sm text-center">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-sm text-center">{success}</div>
        )}
        <button
          type="submit"
          className="w-full btn-theme-primary py-2 rounded-lg font-semibold shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  )
}
