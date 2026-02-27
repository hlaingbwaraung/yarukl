#!/bin/bash
echo "=== BACKEND API ==="
curl -s http://localhost/api/health
echo ""
echo ""
echo "=== FRONTEND ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://localhost/
echo ""
echo ""
echo "=== PM2 STATUS ==="
pm2 status
echo ""
echo "=== NGINX STATUS ==="
sudo systemctl is-active nginx
echo "VERIFICATION_DONE"
