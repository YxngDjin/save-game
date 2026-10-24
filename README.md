# SaveGame

**Selbstgehostete Backups für deine PC-Spielstände.**

SaveGame findet die Spielstände deiner installierten Spiele, sichert sie nach jedem Spielende automatisch und lädt sie auf deinen eigenen Server, zum Beispiel einen Raspberry Pi oder ein NAS mit OpenMediaVault. Deine Daten bleiben bei dir, ohne Cloud-Dienst eines Anbieters.

> **Status:** frühe Entwicklung (`v0.1`). Unterstützt werden aktuell Steam-Spiele unter Windows.

---

## Funktionen

- **Spielstände automatisch finden** – über das [Ludusavi-Manifest](https://github.com/mtkennerly/ludusavi-manifest) mit Speicherorten für zehntausende Spiele
- **Automatisch sichern** – nach dem Beenden eines Spiels, unsichtbar im Hintergrund
- **Eigener Server** – Backups landen per Docker auf deinem Raspberry Pi oder NAS
- **Versionen** – mehrere Stände pro Spiel, ältere werden nach einstellbarer Regel aufgeräumt
- **Sicher wiederherstellen** – lokal oder vom Server, mit automatischer Sicherung des aktuellen Stands vorher
- **Keine Duplikate** – unveränderte Spielstände werden erkannt und nicht erneut gespeichert
- **Weboberfläche** – Spiele, Backups und Geräte im Browser verwalten
- **Mehrere Geräte** – PCs per Code koppeln und bei Bedarf wieder sperren

## So funktioniert es

```
┌──────────────────────┐            ┌───────────────────────────┐
│  Windows-PC          │   HTTP     │  Server (Docker)          │
│                      │ ─────────► │  Raspberry Pi / NAS       │
│  SaveGame-App        │            │                           │
│  • erkennt Spiele    │            │  • speichert ZIP-Backups  │
│  • sichert Spiel-    │            │  • verwaltet Versionen    │
│    stände als ZIP    │            │  • Weboberfläche          │
│  • lädt hoch         │ ◄───────── │  • liefert Backups aus    │
└──────────────────────┘            └───────────────────────────┘
```

Die App funktioniert auch **ohne Server**. Dann werden die Backups nur lokal auf dem PC gespeichert.

---

## Server einrichten

Voraussetzungen: ein Linux-Rechner mit **Docker** und **Docker Compose**, zum Beispiel ein Raspberry Pi oder ein NAS. Unterstützt werden ARM- und x86-Prozessoren.

### 1. Herunterladen

```bash
git clone https://github.com/YxngDjin/save-game.git
cd save-game
```

### 2. Konfiguration

Lege neben der `docker-compose.yml` eine Datei `.env` an:

```env
ADMIN_KEY=ein-langer-zufaelliger-schluessel
SAVEGAME_PORT=3000
```

Einen sicheren Schlüssel erzeugst du zum Beispiel mit:

```bash
openssl rand -base64 32
```

| Variable | Pflicht | Standard | Beschreibung |
|---|---|---|---|
| `ADMIN_KEY` | ja | – | Admin-Schlüssel für die Weboberfläche und zum Koppeln von Geräten |
| `SAVEGAME_PORT` | nein | `3000` | Port, unter dem der Server erreichbar ist |
| `RETENTION_COUNT` | nein | `10` | Wie viele Backups pro Spiel behalten werden. `0` = alle behalten |

### 3. Starten

```bash
docker compose up -d --build
```

Der erste Build kann auf einem Raspberry Pi einige Minuten dauern. Danach ist die Weboberfläche unter `http://<IP-des-Servers>:<SAVEGAME_PORT>` erreichbar.

Ob der Server läuft, siehst du mit:

```bash
docker compose logs -f
```

### Daten

Datenbank und Backups liegen im Docker-Volume `savegame-data`. Es bleibt bei Updates und beim Neuerstellen des Containers erhalten.

> ⚠️ **Niemals** `docker compose down -v` ausführen. Das `-v` löscht das Volume und damit alle Backups.

### Updates

```bash
git pull
docker compose up -d --build
```

Datenbank-Migrationen werden beim Start automatisch ausgeführt.

### Häufige Probleme

- **„address already in use"**: Der Port ist schon von einem anderen Dienst belegt. Setze in der `.env` einen anderen `SAVEGAME_PORT`.
- **Server von anderen Geräten nicht erreichbar**: Prüfe, ob eine Firewall den Port blockiert, zum Beispiel mit `sudo ufw status`, und gib ihn frei: `sudo ufw allow 3000/tcp`.
- **Hinter einem Reverse-Proxy** (z. B. Nginx Proxy Manager): Das Rate-Limiting erkennt Clients an ihrer IP-Adresse. Hinter einem Proxy sehen alle Anfragen gleich aus. Dieses Szenario wird noch nicht offiziell unterstützt.

### OpenMediaVault

Unter OpenMediaVault lässt sich der Server über das **Compose-Plugin** einrichten. Verwende den Inhalt der `docker-compose.yml` und trage die Werte aus der `.env` als Umgebungsvariablen ein.

Willst du die Backups statt im Docker-Volume in einem freigegebenen Ordner speichern, ersetze `savegame-data:/data` durch den Pfad zu deinem Ordner. Der Container läuft als Benutzer mit der ID `1000`, der Ordner muss für ihn beschreibbar sein:

```bash
sudo chown -R 1000:1000 /pfad/zu/deinem/ordner
```

---

## App einrichten (Windows)

> Ein fertiger Installer folgt mit dem ersten Release. Bis dahin lässt sich die App aus dem Quellcode bauen, siehe [Entwicklung](#entwicklung).

1. App starten. Sie zeigt alle installierten Steam-Spiele, für die Spielstände gefunden wurden.
2. **Mit dem Server koppeln**:
   1. In der **Weboberfläche** des Servers anmelden, unter **Geräte** auf **„Neues Gerät koppeln"** klicken
   2. In der App unter **Einstellungen** die Serveradresse eintragen, z. B. `http://192.168.178.25:3000`
   3. Gerätenamen und den 6-stelligen Code eingeben, **„Koppeln"**
3. Unter **Einstellungen → Automatik** „Mit Windows starten" aktivieren.

Ab jetzt läuft SaveGame im Infobereich neben der Uhr und sichert jedes Steam-Spiel nach dem Beenden automatisch.

---

## Entwicklung

Das Repository besteht aus drei Projekten:

| Ordner | Inhalt | Technik |
|---|---|---|
| `client/` | Windows-App | [Tauri 2](https://tauri.app), Rust, React, TypeScript, Tailwind |
| `server/` | Server und API | [NestJS](https://nestjs.com), Prisma, SQLite |
| `web/` | Weboberfläche für den Server | React, Vite, Tailwind |

### Voraussetzungen

- [Node.js](https://nodejs.org) 22
- [Rust](https://rustup.rs) (nur für den Client)
- Für den Client unter Windows: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/), siehe [Tauri-Voraussetzungen](https://v2.tauri.app/start/prerequisites/)

### Server

```bash
cd server
npm install
```

Lege eine `server/.env` an:

```env
DATABASE_URL="file:./dev.db"
DATA_DIR="./data"
ADMIN_KEY="lokaler-test-schluessel"
```

Dann:

```bash
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

Der Server läuft auf `http://localhost:3000`.

### Weboberfläche

```bash
cd web
npm install
npm run dev
```

Die Weboberfläche läuft auf `http://localhost:5173` und leitet API-Anfragen an den lokalen Server weiter.

### Client

```bash
cd client
npm install
npm run tauri dev
```

### Pull Requests

Änderungen laufen über Pull Requests. Die CI prüft Server, Weboberfläche, Docker-Image und Client automatisch.

---

## Roadmap

- [ ] Windows-Installer und erstes Release
- [ ] Weitere Launcher: Epic Games, GOG, EA App
- [ ] Synchronisation zwischen mehreren PCs
- [ ] Linux und Steam Deck

Offene Punkte stehen in den [Issues](https://github.com/YxngDjin/save-game/issues).

## Danksagung

- Die Speicherorte der Spielstände stammen aus dem [Ludusavi-Manifest](https://github.com/mtkennerly/ludusavi-manifest) von Matthew T. Kennerly (MIT-Lizenz).
- Das Manifest basiert auf Daten von [PCGamingWiki](https://www.pcgamingwiki.com) (CC BY-NC-SA 3.0).

## Lizenz

[MIT](LICENSE) © 2026 Dennis Lehmann
