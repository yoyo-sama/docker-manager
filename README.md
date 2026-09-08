# Docker Manager

[![en](https://img.shields.io/badge/lang-en-blue)](README.md) [![fr](https://img.shields.io/badge/lang-fr-red)](README.fr.md)

Web-based Docker manager: monitor and control your containers from the browser — system dashboard, interactive terminal, one-click GitHub deploy.

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)

## Features

- **System dashboard**: CPU, memory, disk, NVIDIA GPUs (via `nvidia-smi`), container/image/volume counters, real-time gradient charts
- **Container list**: status, image, restart policy, **launch directory** (host bind mounts + WorkingDir) and a **direct link to the app** for every published TCP port
- **Host-network port auto-detection**: apps running with `network_mode: host` (no published ports) get their listening ports detected through `/proc` (socket inodes ↔ TCP tables matching)
- **Container detail**: CPU/RAM stats (CPU memory + GPU VRAM), network, history charts, configuration (command, ports, mounts)
- **Interactive terminal**: in-browser shell (xterm.js + WebSocket) in any running container, with automatic bash/sh detection and resizing
- **GitHub deploy**: clone → build → run a repository straight from the UI, with live logs (SSE), timeout and automatic cleanup
- **Actions**: start / stop / restart / delete with confirmation
- **Dark / light theme**: modern monochrome interface (Inter font, Lucide icons, JetBrains Mono for technical data), persisted toggle defaulting to system preference

## Stack

| Component | Technologies |
|---|---|
| Frontend | React 19, Vite, TypeScript, TailwindCSS v4, xterm.js, Recharts, Lucide |
| Backend | Node.js, Express 5, dockerode, ws (WebSocket), SSE |
| Packaging | Single multi-stage Docker image (frontend build + backend + gzip compression) |

## Installation

### Prerequisites

- [Docker Engine](https://docs.docker.com/get-docker/) ≥ 20.10 with [Compose v2](https://docs.docker.com/compose/) (`docker compose`)
- The Docker socket `/var/run/docker.sock` must be accessible to the user running compose (the backend mounts it as a bind mount)
- *(Optional)* NVIDIA drivers + [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) for GPU metrics

### Install and start

```bash
# 1. Clone the repository
git clone https://github.com/yoyo-sama/docker-manager.git
cd docker-manager

# 2. Build and start (no environment variables required)
docker compose up -d --build
```

The application is available at **http://localhost:8081**.

Everything runs in a **single container**: the Node backend serves both the API (including the WebSocket terminal) and the static frontend.

### Without an NVIDIA GPU

The `docker-compose.yml` reserves GPUs through `deploy.resources` (nvidia runtime). Without a GPU — or without nvidia-container-toolkit — remove this block:

```yaml
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

Everything else works normally; the GPUs section simply stays empty.

### Update

```bash
git pull
docker compose up -d --build
```

### Stop

```bash
docker compose down
```

### Configuration

No configuration is required. Optional variables (through the `environment:` section of the `app` service in compose):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Internal server port (serves both the API and the frontend) |

> To expose the UI on a port other than 8081, edit the `ports:` section of the `app` service (e.g. `"9090:3001"`).

## Structure

```
├── backend/
│   ├── index.js        # REST API, WebSocket exec, GitHub deploy, static serving
│   ├── hostports.js    # Listening port detection (host-network containers)
│   ├── metrics.js      # System / GPU / container stats metrics
├── frontend/
│   ├── src/
│   │   ├── components/ # Dashboard, ContainerDetail, Terminal, DeployModal…
│   │   ├── lib/        # dark/light theme hook
│   │   ├── types.ts
│   │   └── App.tsx
│   └── vite.config.ts  # /api proxy for local development
├── Dockerfile          # Single multi-stage image (frontend build + backend)
└── docker-compose.yml
```

## API

| Method | Route | Description |
|---|---|---|
| GET | `/api/containers` | Container list (+ detected ports, directories) |
| GET | `/api/containers/:id` | Container detail |
| GET | `/api/containers/:id/stats` | Live stats (CPU/RAM/network/VRAM) |
| POST | `/api/containers/:id/start\|stop\|restart` | Lifecycle actions |
| DELETE | `/api/containers/:id` | Remove container |
| GET | `/api/system` | System + GPU metrics |
| POST | `/api/deploy/github` | GitHub repository deploy |
| GET | `/api/events/deploy/:id` | Deploy logs (SSE) |
| WS | `/api/exec/:id` | Interactive terminal |

## Development

Local development environment (outside Docker):

```bash
# Backend (port 3001)
cd backend && npm install && npm start

# Frontend (port 5173, /api proxy → localhost:3001)
cd frontend && npm install && npm run dev
```

## Security note

The application has **no authentication** and the terminal grants a shell inside containers. Intended for a local network or trusted environment; put it behind an authenticating proxy if exposed.
