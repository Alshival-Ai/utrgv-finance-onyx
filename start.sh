#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${ROOT_DIR}/deployment/docker_compose"
ENV_FILE="${COMPOSE_DIR}/.env"
ENV_TEMPLATE="${COMPOSE_DIR}/env.template"
ORIGINAL_ARGS=("$@")

COMPOSE_FILES=(-f docker-compose.yml)
if [[ -f "${COMPOSE_DIR}/docker-compose.https.yml" && -f "${COMPOSE_DIR}/.env.nginx" ]]; then
  COMPOSE_FILES+=(-f docker-compose.https.yml)
fi
UP_ARGS=(-d --wait --wait-timeout 900)
DO_BUILD=false
DO_PULL=false
COMPOSE_RESTART=false
SHOW_LOGS=false
STATUS_ONLY=false
DOWN_ONLY=false
DEPLOY=false

usage() {
  cat <<'EOF'
Usage: ./start.sh [OPTIONS]

Starts the standard Onyx Docker Compose deployment.

Options:
  -d, --deploy        Deploy/update: pull images, compose down, then start.
  --build             Build local backend/web/model images before starting.
  --pull              Pull images before starting.
  --compose-restart   Run docker compose down before starting.
  --dev-ports         Also expose backend, DB, Redis, OpenSearch, MinIO, etc.
  --no-wait           Do not wait for container health checks.
  --logs              Tail logs after starting.
  --status            Show compose status and exit.
  --down              Stop and remove containers, preserving named volumes.
  -h, --help          Show this help.

Examples:
  ./start.sh
  ./start.sh -d
  ./start.sh --build
  ./start.sh --compose-restart --pull
  ./start.sh --dev-ports --logs
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build)
      DO_BUILD=true
      shift
      ;;
    -d|--deploy)
      DEPLOY=true
      DO_PULL=true
      COMPOSE_RESTART=true
      shift
      ;;
    --pull)
      DO_PULL=true
      shift
      ;;
    --compose-restart)
      COMPOSE_RESTART=true
      shift
      ;;
    --dev-ports)
      COMPOSE_FILES+=(-f docker-compose.dev.yml)
      shift
      ;;
    --no-wait)
      UP_ARGS=(-d)
      shift
      ;;
    --logs)
      SHOW_LOGS=true
      shift
      ;;
    --status)
      STATUS_ONLY=true
      shift
      ;;
    --down)
      DOWN_ONLY=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed or not on PATH." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is not available. Install the Docker Compose plugin." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  docker_error="$(docker info 2>&1 || true)"
  if [[ -z "${START_SH_DOCKER_GROUP_REEXEC:-}" ]] \
    && [[ "${docker_error}" == *"permission denied"* ]] \
    && command -v sg >/dev/null 2>&1 \
    && id -nG "${USER}" 2>/dev/null | grep -qw docker; then
    quoted_args=""
    for arg in "${ORIGINAL_ARGS[@]}"; do
      printf -v quoted_arg "%q" "${arg}"
      quoted_args+=" ${quoted_arg}"
    done
    printf -v quoted_root "%q" "${ROOT_DIR}"
    exec sg docker -c "cd ${quoted_root} && START_SH_DOCKER_GROUP_REEXEC=1 ./start.sh${quoted_args}"
  fi

  echo "docker is installed, but this shell cannot talk to the Docker daemon." >&2
  echo "Try 'newgrp docker' or start a fresh login session, then rerun ./start.sh." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ ! -f "${ENV_TEMPLATE}" ]]; then
    echo "Missing ${ENV_TEMPLATE}" >&2
    exit 1
  fi

  cp "${ENV_TEMPLATE}" "${ENV_FILE}"
  if command -v openssl >/dev/null 2>&1; then
    auth_secret="$(openssl rand -hex 32)"
    sed -i.bak "s/^USER_AUTH_SECRET=.*/USER_AUTH_SECRET=\"${auth_secret}\"/" "${ENV_FILE}"
    rm -f "${ENV_FILE}.bak"
  else
    echo "Created ${ENV_FILE}; install openssl or set USER_AUTH_SECRET manually." >&2
  fi
  echo "Created ${ENV_FILE} from env.template."
fi

cd "${COMPOSE_DIR}"

compose() {
  docker compose "${COMPOSE_FILES[@]}" "$@"
}

if [[ "${STATUS_ONLY}" == true ]]; then
  compose ps
  exit 0
fi

if [[ "${DOWN_ONLY}" == true ]]; then
  compose down
  exit 0
fi

if [[ "${COMPOSE_RESTART}" == true ]]; then
  compose down
fi

if [[ "${DO_PULL}" == true ]]; then
  compose pull
fi

if [[ "${DO_BUILD}" == true ]]; then
  compose build
  UP_ARGS+=(--build)
fi

compose up "${UP_ARGS[@]}"

compose ps

echo
echo "Onyx should be available at http://localhost:${HOST_PORT:-3000}"
echo "Use './start.sh --status' to inspect containers or './start.sh --logs' to tail logs."

if [[ "${SHOW_LOGS}" == true ]]; then
  compose logs -f
fi
