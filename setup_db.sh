#!/bin/bash
sudo -u postgres psql <<EOF
CREATE USER yaruki_user WITH PASSWORD 'YarukiDB2026secure';
CREATE DATABASE yaruki OWNER yaruki_user;
GRANT ALL PRIVILEGES ON DATABASE yaruki TO yaruki_user;
EOF
echo "DB_SETUP_DONE"
