import { useEffect, useState } from "react";
import { api } from "./api";
import LoginPage from "./LoginPage";
import { DevicesPage } from "./Devicepage";

type AuthState = "checking" | "loggedOut" | "loggedIn";
type Page = "games" | "devices";

function App() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [page, setPage] = useState<Page>("devices");

  useEffect(() => {
    api
      .me()
      .then(() => setAuth("loggedIn"))
      .catch(() => setAuth("loggedOut"));
  }, []);

  async function logout() {
    await api.logout();
    setAuth("loggedOut");
  }

  if (auth === "checking") {
    return <p className="p-8 text-sm text-neutral-500">Lade …</p>;
  }

  if (auth === "loggedOut") {
    return <LoginPage onLoggedIn={() => setAuth("loggedIn")} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-md bg-neutral-900"
                aria-hidden="true"
              />
              <span className="font-semibold">SaveGame Server</span>
            </div>
            <nav className="flex gap-1" aria-label="Hauptnavigation">
              {(["games", "devices"] as const).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setPage(name)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    page === name
                      ? "bg-neutral-100 font-semibold"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {name === "games" ? "Spiele" : "Geräte"}
                </button>
              ))}
            </nav>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-neutral-600 hover:underline"
          >
            Abmelden
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {page === "devices" && <DevicesPage />}
        {page === "games" && (
          <p className="text-sm text-neutral-500">Kommt in Etappe 3b.</p>
        )}
      </main>
    </div>
  );
}

export default App;
