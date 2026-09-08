# Docker Manager

[![en](https://img.shields.io/badge/lang-en-red)](README.md) [![fr](https://img.shields.io/badge/lang-fr-blue)](README.fr.md)

Gestionnaire Docker web : surveillez et pilotez vos conteneurs depuis le navigateur — dashboard système, terminal interactif, déploiement direct depuis GitHub.

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)

## Fonctionnalités

- **Dashboard système** : CPU, mémoire, disque, GPU NVIDIA (via `nvidia-smi`), compteurs conteneurs/images/volumes, graphiques temps réel avec dégradés
- **Liste des conteneurs** : statut, image, politique de redémarrage, **répertoire de lancement** (bind mounts hôtes + WorkingDir) et **lien direct vers l'app** pour chaque port TCP publié
- **Auto-détection des ports host-network** : les apps en `network_mode: host` (sans port publié) voient leurs ports d'écoute détectés via `/proc` (croisement inodes sockets ↔ tables TCP)
- **Détail conteneur** : stats CPU/RAM (mémoire CPU + GPU VRAM), réseau, graphiques d'historique, configuration (commande, ports, mounts)
- **Terminal interactif** : shell in-browser (xterm.js + WebSocket) dans n'importe quel conteneur actif, avec détection automatique bash/sh et redimensionnement
- **Déploiement GitHub** : clone → build → run d'un repo directement depuis l'UI, avec logs en direct (SSE), timeout et nettoyage automatiques
- **Actions** : start / stop / restart / delete avec confirmation
- **Thème sombre / clair** : interface monochrome moderne (police Inter, icônes Lucide, JetBrains Mono pour les données techniques), bascule persistée et défaut selon la préférence système

## Stack

| Composant | Technologies |
|---|---|
| Frontend | React 19, Vite, TypeScript, TailwindCSS v4, xterm.js, Recharts, Lucide |
| Backend | Node.js, Express 5, dockerode, ws (WebSocket), SSE |
| Packaging | Image Docker unique multi-stage (build frontend + backend + compression gzip) |

## Installation

### Prérequis

- [Docker Engine](https://docs.docker.com/get-docker/) ≥ 20.10 avec [Compose v2](https://docs.docker.com/compose/) (`docker compose`)
- Le socket Docker `/var/run/docker.sock` doit être accessible à l'utilisateur qui lance le compose (le backend y accède via un bind mount)
- *(Optionnel)* Pilotes NVIDIA + [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) pour les métriques GPU

### Installer et démarrer

```bash
# 1. Cloner le repo
git clone https://github.com/yoyo-sama/docker-manager.git
cd docker-manager

# 2. Construire et démarrer (aucune variable d'environnement requise)
docker compose up -d --build
```

L'application est disponible sur **http://localhost:8081**.

Tout tourne dans un **conteneur unique** : le backend Node sert à la fois l'API (y compris le terminal WebSocket) et le frontend statique.

### Sans GPU NVIDIA

Le `docker-compose.yml` réserve les GPU via `deploy.resources` (runtime nvidia). Sans GPU — ou sans nvidia-container-toolkit — retirez ce bloc :

```yaml
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

Tout le reste fonctionne normalement ; la section GPUs reste simplement vide.

### Mettre à jour

```bash
git pull
docker compose up -d --build
```

### Arrêter

```bash
docker compose down
```

### Configuration

Aucune configuration n'est nécessaire. Variables optionnelles (via `environment:` du service `app` dans le compose) :

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `3001` | Port interne du serveur (sert l'API et le frontend) |

> Pour exposer l'UI sur un autre port que 8081, modifiez la section `ports:` du service `app` (ex: `"9090:3001"`).

## Structure

```
├── backend/
│   ├── index.js        # API REST, WebSocket exec, déploiement GitHub, fichiers statiques
│   ├── hostports.js    # Détection des ports d'écoute (conteneurs host-network)
│   ├── metrics.js      # Métriques système / GPU / stats conteneurs
├── frontend/
│   ├── src/
│   │   ├── components/ # Dashboard, ContainerDetail, Terminal, DeployModal…
│   │   ├── lib/        # hook de thème dark/light
│   │   ├── types.ts
│   │   └── App.tsx
│   └── vite.config.ts  # Proxy /api pour le dev local
├── Dockerfile          # Image unique multi-stage (build frontend + backend)
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

## Développement

Environnement de dev local (hors Docker) :

```bash
# Backend (port 3001)
cd backend && npm install && npm start

# Frontend (port 5173, proxy /api → localhost:3001)
cd frontend && npm install && npm run dev
```

## Note sécurité

L'application n'a **pas d'authentification** et le terminal donne un shell dans les conteneurs. À réserver à un réseau local ou un environnement de confiance ; placez-la derrière un proxy avec authentification si exposée.
