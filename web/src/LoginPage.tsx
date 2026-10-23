import { type FormEvent, useState } from "react";
import { api } from "./api";

interface LoginPageProps {
  onLoggedIn: () => void;
}

const LoginPage = ({ onLoggedIn }: LoginPageProps) => {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(key);
      onLoggedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6"
      >
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-md bg-neutral-900"
            aria-hidden="true"
          />
          <h1 className="text-lg font-semibold">SaveGame Server</h1>
        </div>
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Admin-Schlüssel
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.currentTarget.value)}
            autoComplete="current-password"
            autoFocus
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || key === ""}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {busy ? "Melde an …" : "Anmelden"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
