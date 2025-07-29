#!/usr/bin/env node
// sync-to-lambda.js - Automatically sync files to Lambda backend

const fs = require('fs');
const path = require('path');

const LAMBDA_SRC = 'amplify/backend/function/getProductPrice/src';

// Files and directories to sync
const SYNC_CONFIG = [
  {
    source: 'routes/csvProcessingRoutes.js',
    dest: 'routes/csvProcessingRoutes.js',
    required: true
  },
  {
    source: 'models/',
    dest: 'models/',
    isDirectory: true,
    required: true
  },
  {
    source: 'utils/',
    dest: 'utils/', 
    isDirectory: true,
    optional: true // Don't fail if this doesn't exist
  }
];

// Color console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`📁 Created directory: ${dirPath}`, 'blue');
  }
}

// Copy file
function copyFile(source, dest) {
  const destDir = path.dirname(dest);
  ensureDir(destDir);
  
  fs.copyFileSync(source, dest);
  
  // Get file size for display
  const stats = fs.statSync(dest);
  const sizeKB = (stats.size / 1024).toFixed(1);
  
  log(`📄 Copied: ${source} → ${dest} (${sizeKB}KB)`, 'green');
}

// Copy directory recursively
function copyDirectory(source, dest) {
  if (!fs.existsSync(source)) {
    return false;
  }

  ensureDir(dest);
  
  const files = fs.readdirSync(source);
  let fileCount = 0;
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(dest, file);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      copyFile(sourcePath, destPath);
      fileCount++;
    }
  }
  
  log(`📁 Copied directory: ${source} → ${dest} (${fileCount} files)`, 'cyan');
  return true;
}

// Check if required dependencies exist in Lambda package.json
function checkLambdaDependencies() {
  const lambdaPackageJsonPath = path.join(LAMBDA_SRC, 'package.json');
  
  if (!fs.existsSync(lambdaPackageJsonPath)) {
    log(`⚠️  Lambda package.json not found at: ${lambdaPackageJsonPath}`, 'yellow');
    return false;
  }
  
  const lambdaPackageJson = JSON.parse(fs.readFileSync(lambdaPackageJsonPath, 'utf8'));
  const requiredDeps = ['multer', 'papaparse', 'xlsx', 'axios'];
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    if (!lambdaPackageJson.dependencies || !lambdaPackageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    log(`❌ Missing Lambda dependencies: ${missingDeps.join(', ')}`, 'red');
    log(`💡 Run: cd ${LAMBDA_SRC} && npm install ${missingDeps.join(' ')}`, 'yellow');
    return false;
  }
  
  log(`✅ All required Lambda dependencies are present`, 'green');
  return true;
}

// Main sync function
function syncToLambda() {
  const startTime = Date.now();
  
  log('🚀 Starting file sync to Lambda backend...', 'blue');
  log(`📁 Target: ${LAMBDA_SRC}`, 'cyan');
  
  // Ensure Lambda src directory exists
  ensureDir(LAMBDA_SRC);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const config of SYNC_CONFIG) {
    const sourcePath = config.source;
    const destPath = path.join(LAMBDA_SRC, config.dest);
    
    try {
      if (!fs.existsSync(sourcePath)) {
        if (config.optional) {
          log(`⚠️  Optional file/directory not found: ${sourcePath}`, 'yellow');
          skipCount++;
          continue;
        } else {
          throw new Error(`Required file/directory not found: ${sourcePath}`);
        }
      }
      
      if (config.isDirectory) {
        const copied = copyDirectory(sourcePath, destPath);
        if (copied) {
          successCount++;
        } else {
          skipCount++;
        }
      } else {
        copyFile(sourcePath, destPath);
        successCount++;
      }
      
    } catch (error) {
      log(`❌ Error syncing ${sourcePath}: ${error.message}`, 'red');
      errorCount++;
      
      if (config.required) {
        log(`🚨 Required file failed to sync. Deployment may fail.`, 'red');
        process.exit(1);
      }
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  log(`\n✅ Sync completed in ${duration}s`, 'green');
  log(`   📊 ${successCount} items synced successfully`, 'green');
  if (skipCount > 0) log(`   ⚠️  ${skipCount} items skipped`, 'yellow');
  if (errorCount > 0) log(`   ❌ ${errorCount} errors occurred`, 'red');
  
  // Check Lambda dependencies
  log(`\n🔍 Checking Lambda dependencies...`, 'blue');
  checkLambdaDependencies();
  
  log(`\n🎉 Ready for deployment!`, 'green');
  log(`💡 Use: npm run deploy (for amplify push) or npm run amplify-build (for full publish)`, 'cyan');
}

// Run if called directly
if (require.main === module) {
  syncToLambda();
}

module.exports = { syncToLambda };