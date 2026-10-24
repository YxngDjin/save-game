import type { AdminBackup, AdminDevice, AdminGame, PairingCode } from "./types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? `Fehler ${response.status}`);
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<{ loggedIn: boolean }>("/admin/me"),
  login: (key: string) =>
    request<{ loggedIn: boolean }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ key }),
    }),
  logout: () =>
    request<{ loggedIn: boolean }>("/admin/logout", { method: "POST" }),
  games: () => request<AdminGame[]>("/admin/games"),
  gameBackups: (id: string) =>
    request<AdminBackup[]>(`/admin/games/${id}/backups`),
  devices: () => request<AdminDevice[]>("/admin/devices"),
  revokeDevice: (id: string) =>
    request<{ revoked: boolean }>(`/admin/devices/${id}/revoke`, {
      method: "POST",
    }),
  createPairingCode: () =>
    request<PairingCode>("/pairing/codes", { method: "POST" }),
};

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
