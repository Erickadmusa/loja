#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Uso: scripts/install-teodoro.sh /caminho/para/leon

Instala os pacotes do Teodoro dentro de um repositório local do Leon.
Você também pode definir a variável de ambiente LEON_DIR.
USAGE
}

if [[ ${1-} == "-h" || ${1-} == "--help" ]]; then
  usage
  exit 0
fi

LEON_DIR=${1:-${LEON_DIR:-}}
if [[ -z "$LEON_DIR" ]]; then
  echo "[ERRO] Informe o caminho do Leon (ex.: ../leon) ou defina LEON_DIR." >&2
  usage
  exit 1
fi

if [[ ! -d "$LEON_DIR" ]]; then
  echo "[ERRO] Diretório '$LEON_DIR' não encontrado." >&2
  exit 1
fi

if [[ ! -d "$LEON_DIR/core/config" ]]; then
  echo "[ERRO] O caminho informado não parece ser um checkout do Leon (faltando core/config)." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TARGET_ROOT="$LEON_DIR/packages/teodoro-system"
TARGET_PACKAGES="$TARGET_ROOT/packages"

mkdir -p "$TARGET_PACKAGES"

echo "[INFO] Copiando pacotes do Teodoro para $TARGET_PACKAGES"
rm -rf "$TARGET_PACKAGES/teodoro" "$TARGET_PACKAGES/financeiro"
cp -R "$REPO_ROOT/packages/teodoro" "$TARGET_PACKAGES/"
cp -R "$REPO_ROOT/packages/financeiro" "$TARGET_PACKAGES/"

if [[ -d "$REPO_ROOT/apps/control-center" ]]; then
  mkdir -p "$TARGET_ROOT/apps"
  echo "[INFO] Copiando interface opcional para $TARGET_ROOT/apps"
  rm -rf "$TARGET_ROOT/apps/control-center"
  cp -R "$REPO_ROOT/apps/control-center" "$TARGET_ROOT/apps/"
fi

dest_compose="$LEON_DIR/docker-compose.teodoro.yml"
echo "[INFO] Atualizando docker-compose.teodoro.yml em $dest_compose"
cp "$REPO_ROOT/docker-compose.teodoro.yml" "$dest_compose"

INSTANCES_FILE="$LEON_DIR/core/config/instances.json"
if [[ ! -f "$INSTANCES_FILE" ]]; then
  echo "[INFO] Arquivo instances.json não encontrado, criando configuração mínima."
  cat <<'JSON' > "$INSTANCES_FILE"
{
  "packages": []
}
JSON
fi

export LEON_DIR
python3 - <<'PY'
import json
import os
from pathlib import Path

leon_dir = Path(os.environ['LEON_DIR'])
instances_path = leon_dir / 'core' / 'config' / 'instances.json'
with instances_path.open('r', encoding='utf-8') as fh:
    data = json.load(fh)

packages = data.setdefault('packages', [])

required = [
    {
        "name": "teodoro",
        "path": "packages/teodoro-system/packages/teodoro"
    },
    {
        "name": "financeiro",
        "path": "packages/teodoro-system/packages/financeiro"
    }
]

existing_paths = {pkg.get('path'): pkg for pkg in packages if isinstance(pkg, dict)}
changed = False
for pkg in required:
    current = existing_paths.get(pkg['path'])
    if current is None:
        packages.append(pkg)
        changed = True
    else:
        if current.get('name') != pkg['name']:
            current['name'] = pkg['name']
            changed = True

if changed:
    with instances_path.open('w', encoding='utf-8') as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
    print(f"[INFO] Arquivo {instances_path} atualizado.")
else:
    print(f"[INFO] Arquivo {instances_path} já contém as entradas necessárias.")
PY

cat <<'NEXT'

[INFO] Instalação concluída! Execute estes passos dentro do diretório do Leon:

  npm install
  npm run bootstrap

Para subir o Teodoro com Docker:

  docker compose -f docker-compose.teodoro.yml up -d

Para compilar as skills manualmente:

  npm run build -- --scope @teodoro/* --scope @teodoro-financeiro/*

NEXT
