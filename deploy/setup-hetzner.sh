#!/bin/bash
# ============================================================
# Setup Hetzner + Coolify pour AppartUpgrade
#
# ÉTAPES À FAIRE TOI-MÊME (une seule fois) :
#
# 1. Crée un serveur Hetzner :
#    - Va sur https://console.hetzner.cloud
#    - Nouveau projet → Ajouter un serveur
#    - Type: CX22 (4 vCPU, 8 GB RAM, 80 GB SSD) = ~5.39 EUR/mois
#    - OS: Ubuntu 24.04
#    - Localisation: Falkenstein (Allemagne) pour RGPD
#    - Ajoute ta clé SSH
#
# 2. Configure le DNS :
#    - Pointe ton domaine vers l'IP du serveur
#    - Ex: appartupgrade.com → A → <IP_SERVEUR>
#    - Ex: api.appartupgrade.com → A → <IP_SERVEUR>
#
# 3. SSH dans le serveur et lance ce script :
#    ssh root@<IP_SERVEUR>
#    curl -fsSL https://raw.githubusercontent.com/<ton-repo>/main/deploy/setup-hetzner.sh | bash
#
# ============================================================

set -euo pipefail

echo "=== AppartUpgrade — Setup Hetzner ==="

# 1. Installer Coolify
echo "[1/4] Installation de Coolify..."
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

echo ""
echo "[2/4] Coolify installé !"
echo "  → Accède à Coolify : http://$(curl -s ifconfig.me):8000"
echo "  → Crée ton compte admin"
echo ""

# 3. Configurer le firewall (UFW)
echo "[3/4] Configuration du firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp  # Coolify dashboard (à fermer après config)
ufw --force enable

# 4. Instructions pour Coolify
echo "[4/4] Prochaines étapes dans Coolify :"
echo ""
echo "  1. Connecte-toi à http://$(curl -s ifconfig.me):8000"
echo "  2. Crée un compte admin"
echo "  3. Ajoute ton repo Git (GitHub/GitLab)"
echo "  4. Crée un nouveau service 'Docker Compose'"
echo "  5. Pointe vers docker-compose.prod.yml"
echo "  6. Configure les variables d'environnement :"
echo ""
echo "     ANTHROPIC_API_KEY=sk-ant-..."
echo "     DATABASE_URL=postgresql://postgres:<password>@db:5432/appart_upgrade"
echo "     REDIS_URL=redis://:redispassword@redis:6379/0"
echo "     STRIPE_SECRET_KEY=sk_live_..."
echo "     STRIPE_WEBHOOK_SECRET=whsec_..."
echo "     JWT_SECRET=$(openssl rand -hex 32)"
echo "     POSTGRES_PASSWORD=$(openssl rand -hex 16)"
echo "     REDIS_PASSWORD=$(openssl rand -hex 16)"
echo "     FRONTEND_URL=https://appartupgrade.com"
echo "     BACKEND_URL=https://api.appartupgrade.com"
echo ""
echo "  7. Configure les domaines dans Coolify :"
echo "     - frontend → appartupgrade.com"
echo "     - backend  → api.appartupgrade.com"
echo "     - Coolify gère le SSL automatiquement (Let's Encrypt)"
echo ""
echo "  8. Après le premier déploiement, lance la migration :"
echo "     docker exec <backend-container> alembic upgrade head"
echo ""
echo "  9. Ferme le port Coolify dashboard :"
echo "     ufw delete allow 8000/tcp"
echo "     (Accède ensuite via SSH tunnel: ssh -L 8000:localhost:8000 root@<IP>)"
echo ""
echo "=== Setup terminé ! ==="
