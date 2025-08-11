#!/bin/bash

# Create .env file with environment variables from Vercel
echo "Creating .env file with environment variables"
touch .env
echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" >> .env
echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env

# Run the build command
npm run build