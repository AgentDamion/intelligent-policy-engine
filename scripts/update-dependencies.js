// scripts/update-dependencies.js
const fs = require('fs');
const path = require('path');

console.log('📦 Updating package.json dependencies for Supabase Auth migration...');

const packagePath = path.join(__dirname, '..', 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add new dependencies
const newDeps = {
  '@supabase/supabase-js': '^2.39.0',
  'helmet': '^7.1.0',
  'express-rate-limit': '^7.1.5'
};

// Remove old auth dependencies
const oldDeps = [
  'express-jwt',
  'jwks-rsa', 
  'jsonwebtoken',
  'express-session'
];

console.log('➕ Adding new dependencies:');
Object.entries(newDeps).forEach(([dep, version]) => {
  if (!package.dependencies[dep]) {
    package.dependencies[dep] = version;
    console.log(`  - ${dep}@${version}`);
  }
});

console.log('\n➖ Removing old auth dependencies:');
oldDeps.forEach(dep => {
  if (package.dependencies[dep]) {
    delete package.dependencies[dep];
    console.log(`  - ${dep}`);
  }
});

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));

console.log('\n✅ Package.json updated!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Verify no dependency conflicts');
console.log('3. Test the new server');
