import type { Address, User } from "@/contexts/user-context"

export function parseUserFromApi(
  userDataFromAPI: Record<string, unknown>,
  accessToken?: string,
): User {
  const addressData = userDataFromAPI.address as Record<string, unknown> | undefined

  return {
    id: String(userDataFromAPI.id ?? ""),
    name: String(userDataFromAPI.name ?? ""),
    email: String(userDataFromAPI.email ?? ""),
    phone: userDataFromAPI.phone ? String(userDataFromAPI.phone) : "",
    accessToken,
    address: addressData
      ? {
          id: String(addressData.id ?? ""),
          name: String(addressData.name ?? ""),
          street: String(addressData.street ?? ""),
          street_number: String(addressData.street_number ?? ""),
          postal_code: String(addressData.postal_code ?? ""),
          district: String(addressData.district ?? ""),
          city: String(addressData.city ?? ""),
          state: String(addressData.state ?? ""),
          country: String(addressData.country ?? ""),
          address_details: addressData.address_details
            ? String(addressData.address_details)
            : undefined,
          latitude: addressData.latitude
            ? String(addressData.latitude)
            : undefined,
          longitude: addressData.longitude
            ? String(addressData.longitude)
            : undefined,
          is_default_address: Boolean(addressData.is_default_address),
        }
      : undefined,
  }
}

export interface ProfileUpdatePayload {
  name: string
  phone: string
  password?: string
  password_confirmation?: string
  address: {
    street: string
    street_number: string
    postal_code: string
    district: string
    city: string
    state: string
    address_details?: string
    is_default_address?: boolean
  }
}
