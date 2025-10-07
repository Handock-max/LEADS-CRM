#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

function toggleAuthMode() {
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  
  const currentMode = envContent.includes('VITE_MOCK_AUTH=true');
  
  if (currentMode) {
    // Switch to Supabase mode
    envContent = envContent.replace('VITE_MOCK_AUTH=true', 'VITE_MOCK_AUTH=false');
    console.log('🚀 Switched to SUPABASE mode');
    console.log('⚠️  Make sure to configure your Supabase URL and key!');
  } else {
    // Switch to Mock mode
    envContent = envContent.replace('VITE_MOCK_AUTH=false', 'VITE_MOCK_AUTH=true');
    console.log('🧪 Switched to MOCK mode');
    console.log('✅ You can now use demo accounts');
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('📝 .env file updated');
}

toggleAuthMode();