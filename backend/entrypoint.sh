#!/bin/sh

echo "Running migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
  echo "Prisma migrations failed!"
  exit 1
fi

echo "Running database seed..."
npm run db:seed
if [ $? -ne 0 ]; then
  echo "Database seed failed!"
  exit 1
fi

echo "Starting production server..."
npm start