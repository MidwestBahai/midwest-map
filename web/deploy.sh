#/bin/bash

# Exit if something fails
# sadly, pipefail isn't supported here, but maybe in future deployments it will be
#set -euo pipefail
set -e

BEFORE=$(git rev-parse HEAD)
git pull
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
  echo "No changes — skipping build and deploy."
  exit 0
fi

pnpm install
pnpm build
sudo cp -r out/* /var/www/html/map.midwestbahai.org
sudo chown -R www-data:www-data /var/www/html/map.midwestbahai.org
