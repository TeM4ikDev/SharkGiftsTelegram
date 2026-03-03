#!/bin/bash

# === НАСТРОЙКИ ===
SERVER_USER="root"
SERVER_IP="95.169.205.231"
SERVER_PATH="/root/PabloCasinoBot"
PM2_APP_NAME="test"

# === 2. Обновляем и перезапускаем на сервере ===
echo "🔁 Обновляю и перезапускаю на сервере..."
# cd backend && npm run env:prod
ssh $SERVER_USER@$SERVER_IP bash -c "'
  cd $SERVER_PATH || exit 1
  
  echo \"📥 Получаю последние изменения из Git...\"
  git pull
  

  # echo \"📦 Устанавливаю зависимости backend...\"
  cd backend
 
  
  echo \"🔧 Генерирую Prisma Client...\"
  npx prisma db push
  
  echo \"🚧 Собираю backend...\"
  npm run build
  
  # echo \"📦 Устанавливаю зависимости client...\"
  cd ../client
  
  echo \"🚧 Собираю client...\"
  npm run build

 # echo \"📦 Устанавливаю зависимости admin-panel...\"
  cd ../admin-panel
  
  echo \"🚧 Собираю admin-panel...\"
  npm run build
    
  echo \"🚀 Запускаю PM2 приложение...\"
  cd ../backend
  pm2 restart $PM2_APP_NAME
'"

echo "✅ Обновление завершено успешно!"
