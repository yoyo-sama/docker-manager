# Docker Manager

Gestionnaire Docker web : surveillez et pilotez vos conteneurs depuis le navigateur — dashboard système, terminal interactif, déploiement direct depuis GitHub.

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)

## Fonctionnalités

- **Dashboard système** : CPU, mémoire, disque, GPU NVIDIA (via `nvidia-smi`), compteurs conteneurs/images/volumes, graphiques temps réel
- **Liste des conteneurs** : statut, image, politique de redémarrage, **répertoire de lancement** (bind mounts hôtes + WorkingDir) et **lien direct vers l'app** pour chaque port TCP publié
- **Auto-détection des ports host-network** : les apps en `network_mode: host` (sans port publié) voient leurs ports d'écoute détectés via `/proc` (croisement inodes sockets ↔ tables TCP)
- **Détail conteneur** : stats CPU/RAM (mémoire CPU + GPU VRAM), réseau, graphiques d'historique, configuration (commande, ports, mounts)
- **Terminal interactif** : shell in-browser (xterm.js + WebSocket) dans n'importe quel conteneur actif, avec détection automatique bash/sh et redimensionnement
- **Déploiement GitHub** : clone → build → run d'un repo directement depuis l'UI, avec logs en direct (SSE), timeout et nettoyage automatiques
- **Actions** : start / stop / restart / delete avec confirmation

## Stack

| Composant | Technologies |
|---|---|
| Frontend | React 19, Vite, TypeScript, TailwindCSS, xterm.js, Recharts |
| Backend | Node.js, Express 5, dockerode, ws (WebSocket), SSE |
| Reverse proxy | nginx (static + proxy `/api` + upgrade WebSocket) |

## Lancement

Prérequis : [Docker](https://docs.docker.com/get-docker/) avec le socket `/var/run/docker.sock` accessible.

```bash
docker compose up -d --build
```

L'application est disponible sur **http://localhost:8081**.

> **GPU NVIDIA (optionnel)** : le compose réserve les GPU via `deploy.resources` (nvidia runtime). Sans GPU, retirez le bloc `deploy:` de `docker-compose.yml` — tout le reste fonctionne normalement.

## Structure

```
├── backend/
│   ├── index.js        # API REST, WebSocket exec, déploiement GitHub
│   ├── hostports.js    # Détection des ports d'écoute (conteneurs host-network)
│   ├── metrics.js      # Métriques système / GPU / stats conteneurs
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/ # Dashboard, ContainerDetail, Terminal, DeployModal…
│   │   ├── types.ts
│   │   └── App.tsx
│   ├── nginx.conf      # Proxy /api + WebSocket
│   └── Dockerfile
└── docker-compose.yml
```

## API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/containers` | Liste des conteneurs (+ ports détectés, répertoires) |
| GET | `/api/containers/:id` | Détail d'un conteneur |
| GET | `/api/containers/:id/stats` | Stats live (CPU/RAM/réseau/VRAM) |
| POST | `/api/containers/:id/start\|stop\|restart` | Actions du cycle de vie |
| DELETE | `/api/containers/:id` | Suppression |
| GET | `/api/system` | Métriques système + GPU |
| POST | `/api/deploy/github` | Déploiement d'un repo GitHub |
| GET | `/api/events/deploy/:id` | Logs de déploiement (SSE) |
| WS | `/api/exec/:id` | Terminal interactif |

## Note sécurité

L'application n'a **pas d'authentification** et le terminal donne un shell dans les conteneurs. À réserver à un réseau local ou un environnement de confiance ; placez-la derrière un proxy avec authentification si exposée.
