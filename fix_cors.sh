#!/bin/bash
cd /home/ubuntu/yaruki/backend
sed -i "s|https://yourdomain.com|http://43.220.1.151|g" src/server.js
pm2 restart yaruki-api
sleep 2
curl -s http://localhost:5000/api/health
echo ""
echo "CORS_FIX_DONE"
