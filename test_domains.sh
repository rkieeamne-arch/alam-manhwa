#!/bin/bash
DOMAINS=("witanime.pics" "witanime.com" "witanime.net" "witanime.tv" "witanime.co" "witanime.io" "witanime.cam" "witanime.one" "witanime.org" "witanime.rest")
for domain in "${DOMAINS[@]}"; do
  echo "Testing $domain..."
  curl -m 3 -sL "https://$domain" | head -n 3
done
