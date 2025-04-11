#/bin/bash

# Exit if something fails
# sadly, pipefail isn't supported here, but maybe in future deployments it will be
#set -euo pipefail
set -e

git pull
pnpm install
pnpm build
sudo cp -r out/* /var/www/html/map.midwestbahai.org
sudo chown -R www-data:www-data /var/www/html/map.midwestbahai.org
