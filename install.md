# Install Guide — 3D Print Ecommerce

Welcome! Follow these steps to get the project running locally after cloning the repo.

> Just want it running? Pick your OS below and paste the whole block into your terminal.

---

## One-shot install (copy and paste)

<details>
<summary><b>macOS / Linux</b> — click to expand</summary>

> Open **Terminal** (`Cmd + Space` → "Terminal" on macOS, or your distro's terminal app).

```bash
git clone https://github.com/gytdrop/3d_print_ecommerce.git && \
cd 3d_print_ecommerce/frontend && \
npm install && \
npm run dev
```

</details>

<details>
<summary><b>Windows (PowerShell)</b> — click to expand</summary>

> Open **PowerShell** (`Win + X` → "Windows PowerShell" or "Terminal").

```powershell
git clone https://github.com/gytdrop/3d_print_ecommerce.git; `
cd 3d_print_ecommerce/frontend; `
npm install; `
npm run dev
```

</details>

<details>
<summary><b>Windows (Command Prompt / CMD)</b> — click to expand</summary>

> Open **Command Prompt** (`Win + R` → type `cmd` → Enter).

```bat
git clone https://github.com/gytdrop/3d_print_ecommerce.git & cd 3d_print_ecommerce\frontend & npm install & npm run dev
```

</details>

When the dev server is ready, open **http://localhost:3000** in your browser.

> What is happening: `git clone` downloads the repo, `cd` moves into the Next.js app folder, `npm install` installs all dependencies listed in `package.json`, and `npm run dev` starts the local server with hot-reload. If any command fails, jump to the [Troubleshooting](#troubleshooting) section below.

---

## Prerequisites

Make sure these are installed on your machine **before** you start.

| Tool | Version | Download | Check |
|------|---------|----------|-------|
| **Node.js** | 18.18 or newer (LTS recommended: 20.x or 22.x) | https://nodejs.org | `node -v` |
| **npm** | comes with Node.js | bundled | `npm -v` |
| **Git** | latest | https://git-scm.com | `git --version` |

> You can use `yarn`, `pnpm`, or `bun` instead of `npm` — the project works with all of them. Examples below use `npm`.

### Optional but recommended

- **VS Code** — https://code.visualstudio.com (best Next.js DX)
- **nvm** (Node Version Manager) — https://github.com/nvm-sh/nvm — lets you switch Node versions easily

---

## Quick Start (5 minutes)

```bash
# 1. Clone the repo
git clone https://github.com/gytdrop/3d_print_ecommerce.git
cd 3d_print_ecommerce

# 2. Move into the frontend app
cd frontend

# 3. Install dependencies
npm install

# 4. Run the dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## What gets installed

The project lives entirely inside the **`frontend/`** folder. The root contains only docs and metadata — you do not need to install anything there.

### Runtime dependencies

These ship with the app:

- `next@16.2.9` — React framework
- `react@19.2.4` + `react-dom@19.2.4` — UI library
- `three@0.168` — 3D engine (used by the model viewer)
- `@react-three/fiber` + `@react-three/drei` — React wrappers around Three.js
- `zustand` — state management for the order flow
- `framer-motion` — animations
- `lucide-react` — icons

### Dev dependencies

- `typescript`, `@types/*`
- `tailwindcss@4` + `@tailwindcss/postcss`
- `eslint`, `eslint-config-next`

> All of these are listed in `frontend/package.json` and installed automatically by `npm install`. You do not need to install them one-by-one.

---

## Available Scripts

Run these from inside the `frontend/` folder:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Starts the dev server at `http://localhost:3000` with hot-reload |
| `npm run build` | Builds the production bundle into `.next/` |
| `npm start` | Runs the production build (run `build` first) |
| `npm run lint` | Runs ESLint to check code quality |

---

## Troubleshooting

### `node: command not found`

Node.js is not installed or is not on your PATH.

Install from https://nodejs.org and restart your terminal.

### `npm install` fails with permission errors (Linux / macOS)

```bash
# Fix npm permissions (recommended over sudo)
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### `EACCES` on macOS

Do not use `sudo` with npm. Instead, fix permissions as above, or use [nvm](https://github.com/nvm-sh/nvm).

### Port 3000 is already in use

```bash
# Either kill the process using port 3000
npx kill-port 3000

# Or run on a different port
npm run dev -- -p 3001
```

### `Module not found` errors after pulling new changes

Someone added a new dependency. Run:

```bash
npm install
```

### WebGL / 3D viewer shows a blank screen

The 3D model viewer needs WebGL. Make sure:

- You are using a modern browser (Chrome, Firefox, Edge, Safari 15+)
- Hardware acceleration is enabled in your browser settings
- Your GPU drivers are up to date

### `sharp` or `cpu-features` warnings during install

These are native modules used by Next.js for image optimization. They are listed in `package.json` under `allowScripts` — npm may prompt you to approve running their install scripts. **Type `y` to approve** — they are safe and needed.

### Stale build cache

If something looks broken after pulling, nuke the cache:

```bash
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

---

## Environment Variables (none required for now)

This project does not need any `.env` file to run in development. If that is added later, you will create `frontend/.env.local` (already in `.gitignore`).

---

## Project Structure

```
3d_print_ecommerce/
|-- frontend/              The Next.js app (everything installs here)
|   |-- app/               Pages (App Router)
|   |-- components/        Reusable React components
|   |-- config/            Site content and theme config
|   |-- public/            Static assets (images, STL files)
|   |-- store/             Zustand state stores
|   `-- package.json       Dependencies and scripts
|-- Agent.md               Project agent notes
|-- hierarchy.md           Project hierarchy doc
|-- install.md             You are here
|-- README.md              Project overview
`-- .gitignore
```

---

## Verify your install

After `npm run dev` is running, you should see:

1. The home page at `http://localhost:3000`
2. An `/explore` page with sample 3D-printed products
3. An `/upload` page with an STL uploader and 3D viewer
4. No red errors in your terminal

If all four check out — you are good to go.

---

## Cross-platform one-liner (auto-detects your OS)

If you do not want to pick a block from above, this single block works on **macOS, Linux, and Windows PowerShell**:

### macOS / Linux / PowerShell

```bash
git clone https://github.com/gytdrop/3d_print_ecommerce.git && cd 3d_print_ecommerce/frontend && npm install && npm run dev
```

### What this does, step by step

| Step | Command | What happens |
|------|---------|--------------|
| 1 | `git clone <url>` | Downloads the repo into a new folder |
| 2 | `cd 3d_print_ecommerce/frontend` | Moves into the Next.js app folder |
| 3 | `npm install` | Reads `package.json` and installs every dependency |
| 4 | `npm run dev` | Starts the dev server at `http://localhost:3000` |

### OS-specific notes

- **macOS / Linux**: paste straight into **Terminal**. The `&&` chains commands — if any step fails, the rest stop.
- **Windows PowerShell**: paste straight in. PowerShell also supports `&&` (since Windows 10 1809+). If yours is older, use the [PowerShell block](#one-shot-install-copy-and-paste) above.
- **Windows CMD (`cmd.exe`)**: `&&` is NOT supported there — use the [Command Prompt block](#one-shot-install-copy-and-paste) above, or open PowerShell instead.
- **Git Bash on Windows**: behaves like Linux — the macOS/Linux block works.

### Even safer version (checks Node first)

If you want to fail fast with a clear message when Node is not installed:

```bash
# macOS / Linux
command -v node >/dev/null 2>&1 || { echo "Node.js not found. Install from https://nodejs.org"; exit 1; }
git clone https://github.com/gytdrop/3d_print_ecommerce.git && \
cd 3d_print_ecommerce/frontend && \
npm install && \
npm run dev
```

```powershell
# Windows PowerShell
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "Node.js not found. Install from https://nodejs.org" -ForegroundColor Red; exit 1 }
git clone https://github.com/gytdrop/3d_print_ecommerce.git; cd 3d_print_ecommerce/frontend; npm install; npm run dev
```

---

## Need help?

Open an issue on the repo: https://github.com/gytdrop/3d_print_ecommerce/issues
