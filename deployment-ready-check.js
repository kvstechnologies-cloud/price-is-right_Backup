// deployment-ready-check.js - Pre-deployment verification script for AWS Amplify
// Run this before deploying to ensure everything is ready

const fs = require('fs');
const path = require('path');

console.log('🚀 PRICE IS RIGHT - AWS AMPLIFY DEPLOYMENT READINESS CHECK\n');
console.log('='.repeat(70));

let allChecksPass = true;
let warningCount = 0;

// Check 1: Essential files exist
console.log('\n📁 CHECKING ESSENTIAL FILES:');
const essentialFiles = [
    { file: 'package.json', critical: true },
    { file: 'server.js', critical: true },
    { file: 'amplify.yml', critical: true },
    { file: '.gitignore', critical: true },
    { file: 'index.html', critical: true },
    { file: 'routes/csvProcessingRoutes.js', critical: true },
    { file: 'models/InsuranceItemPricer.js', critical: true }
];

essentialFiles.forEach(({ file, critical }) => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} - Found`);
    } else {
        if (critical) {
            console.log(`  ❌ ${file} - MISSING (CRITICAL)`);
            allChecksPass = false;
        } else {
            console.log(`  ⚠️  ${file} - Missing (Optional)`);
            warningCount++;
        }
    }
});

// Check 2: Package.json validation
console.log('\n📦 CHECKING PACKAGE.JSON CONFIGURATION:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check essential fields
    const requiredFields = [
        { field: 'name', value: packageJson.name },
        { field: 'version', value: packageJson.version },
        { field: 'main', value: packageJson.main },
        { field: 'scripts', value: packageJson.scripts }
    ];
    
    requiredFields.forEach(({ field, value }) => {
        if (value) {
            console.log(`  ✅ ${field}: ${field === 'scripts' ? 'Present' : value}`);
        } else {
            console.log(`  ❌ ${field}: Missing`);
            allChecksPass = false;
        }
    });
    
    // Check main entry point
    if (packageJson.main === 'server.js') {
        console.log('  ✅ Main entry point: server.js (Correct)');
    } else {
        console.log('  ❌ Main entry point should be server.js');
        allChecksPass = false;
    }
    
    // Check Node version requirement
    if (packageJson.engines && packageJson.engines.node) {
        const nodeVersion = packageJson.engines.node;
        if (nodeVersion.includes('16') || nodeVersion.includes('18') || nodeVersion.includes('20')) {
            console.log(`  ✅ Node version requirement: ${nodeVersion}`);
        } else {
            console.log(`  ⚠️  Node version ${nodeVersion} - AWS Amplify supports 16+`);
            warningCount++;
        }
    } else {
        console.log('  ⚠️  Node version not specified (AWS Amplify default will be used)');
        warningCount++;
    }
    
    // Check critical dependencies
    const criticalDeps = [
        'express', 'cors', 'multer', 'axios', 'openai', 'papaparse', 'xlsx', 'dotenv'
    ];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    console.log('\n  📦 Critical Dependencies:');
    criticalDeps.forEach(dep => {
        if (deps[dep]) {
            console.log(`    ✅ ${dep}: ${deps[dep]}`);
        } else {
            console.log(`    ❌ Missing critical dependency: ${dep}`);
            allChecksPass = false;
        }
    });
    
    // Check build script
    if (packageJson.scripts && packageJson.scripts.build) {
        console.log('  ✅ Build script: Present');
    } else {
        console.log('  ❌ Build script: Missing (required for AWS Amplify)');
        allChecksPass = false;
    }
    
} catch (error) {
    console.log('  ❌ Invalid package.json format:', error.message);
    allChecksPass = false;
}

// Check 3: amplify.yml validation
console.log('\n⚙️ CHECKING AMPLIFY.YML CONFIGURATION:');
if (fs.existsSync('amplify.yml')) {
    try {
        const amplifyConfig = fs.readFileSync('amplify.yml', 'utf8');
        
        const requiredSections = [
            { section: 'version: 1', description: 'Version declaration' },
            { section: 'npm ci', description: 'Dependency installation' },
            { section: 'npm run build', description: 'Build command' },
            { section: 'artifacts:', description: 'Artifacts configuration' },
            { section: 'cache:', description: 'Cache configuration' }
        ];
        
        requiredSections.forEach(({ section, description }) => {
            if (amplifyConfig.includes(section)) {
                console.log(`  ✅ ${description} - Found`);
            } else {
                console.log(`  ⚠️  ${description} - Missing or different format`);
                warningCount++;
            }
        });
        
        // Check for environment variable validation
        if (amplifyConfig.includes('SERPAPI_KEY') && amplifyConfig.includes('OPENAI_API_KEY')) {
            console.log('  ✅ Environment variable validation - Present');
        } else {
            console.log('  ⚠️  Environment variable validation - Not found in build config');
            warningCount++;
        }
        
    } catch (error) {
        console.log('  ❌ Error reading amplify.yml:', error.message);
        allChecksPass = false;
    }
} else {
    console.log('  ❌ amplify.yml missing - Required for AWS Amplify deployment');
    allChecksPass = false;
}

// Check 4: .gitignore validation
console.log('\n🚫 CHECKING .GITIGNORE CONFIGURATION:');
if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    
    const criticalIgnores = [
        { pattern: '.env', description: 'Environment files' },
        { pattern: 'node_modules/', description: 'Node modules' },
        { pattern: '*.log', description: 'Log files' },
        { pattern: '.aws', description: 'AWS credentials (if present)' }
    ];
    
    criticalIgnores.forEach(({ pattern, description }) => {
        if (gitignore.includes(pattern)) {
            console.log(`  ✅ Ignores ${pattern} (${description})`);
        } else {
            console.log(`  ❌ Should ignore ${pattern} (${description})`);
            allChecksPass = false;
        }
    });
    
    // Check for AWS Amplify specific ignores
    const awsIgnores = ['amplify/', '.amplify-hosting/'];
    awsIgnores.forEach(pattern => {
        if (gitignore.includes(pattern)) {
            console.log(`  ✅ AWS Amplify ignore: ${pattern}`);
        } else {
            console.log(`  ⚠️  Consider adding AWS Amplify ignore: ${pattern}`);
            warningCount++;
        }
    });
    
} else {
    console.log('  ❌ .gitignore missing - Critical for security');
    allChecksPass = false;
}

// Check 5: Environment variables check
console.log('\n🔑 CHECKING ENVIRONMENT SETUP:');
const requiredEnvVars = [
    { var: 'SERPAPI_KEY', critical: true, description: 'Product search API' },
    { var: 'OPENAI_API_KEY', critical: true, description: 'AI Vision API' }
];

let envVarsSet = 0;
requiredEnvVars.forEach(({ var: envVar, critical, description }) => {
    if (process.env[envVar]) {
        console.log(`  ✅ ${envVar} - Set in current environment (${description})`);
        envVarsSet++;
    } else {
        if (critical) {
            console.log(`  ⚠️  ${envVar} - Not set locally (${description})`);
            console.log(`     📝 Will need to be configured in AWS Amplify Console`);
            warningCount++;
        }
    }
});

if (envVarsSet === 0) {
    console.log('\n  🔔 IMPORTANT: No environment variables detected locally.');
    console.log('     Make sure to add them in AWS Amplify Console:');
    console.log('     - SERPAPI_KEY: Your SerpAPI key');
    console.log('     - OPENAI_API_KEY: Your OpenAI API key');
    console.log('     - NODE_ENV: production');
}

// Check 6: Project structure validation
console.log('\n🏗️ CHECKING PROJECT STRUCTURE:');
const requiredStructure = [
    { path: 'js/', type: 'directory', description: 'Frontend JavaScript' },
    { path: 'components/', type: 'directory', description: 'UI Components' },
    { path: 'styles/', type: 'directory', description: 'CSS Styles' },
    { path: 'models/', type: 'directory', description: 'Backend Models' },
    { path: 'routes/', type: 'directory', description: 'API Routes' },
    { path: 'public/', type: 'directory', description: 'Static Assets', optional: true }
];

requiredStructure.forEach(({ path, type, description, optional }) => {
    const exists = fs.existsSync(path);
    if (exists) {
        const stats = fs.statSync(path);
        if ((type === 'directory' && stats.isDirectory()) || (type === 'file' && stats.isFile())) {
            console.log(`  ✅ ${path} - ${description}`);
        } else {
            console.log(`  ❌ ${path} - Wrong type (expected ${type})`);
            allChecksPass = false;
        }
    } else {
        if (optional) {
            console.log(`  ⚠️  ${path} - Missing (${description}) - Optional`);
            warningCount++;
        } else {
            console.log(`  ❌ ${path} - Missing (${description}) - Required`);
            allChecksPass = false;
        }
    }
});

// Check 7: Key component files
console.log('\n🧩 CHECKING KEY COMPONENT FILES:');
const keyComponents = [
    { path: 'server.js', description: 'Main server file' },
    { path: 'index.html', description: 'Frontend entry point' },
    { path: 'models/InsuranceItemPricer.js', description: 'Pricing engine' },
    { path: 'routes/csvProcessingRoutes.js', description: 'CSV processing routes' },
    { path: 'js/api.js', description: 'Frontend API client' },
    { path: 'components/smartProcessing.js', description: 'Main UI component' }
];

keyComponents.forEach(({ path, description }) => {
    if (fs.existsSync(path)) {
        const stats = fs.statSync(path);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`  ✅ ${path} - ${description} (${sizeKB}KB)`);
    } else {
        console.log(`  ❌ ${path} - Missing (${description})`);
        allChecksPass = false;
    }
});

// Check 8: Port configuration
console.log('\n🔌 CHECKING PORT CONFIGURATION:');
if (fs.existsSync('server.js')) {
    const serverContent = fs.readFileSync('server.js', 'utf8');
    
    if (serverContent.includes('process.env.PORT')) {
        console.log('  ✅ Dynamic port configuration - AWS compatible');
    } else {
        console.log('  ⚠️  Static port detected - May need AWS compatibility update');
        warningCount++;
    }
    
    if (serverContent.includes('0.0.0.0')) {
        console.log('  ✅ Bind to all interfaces (0.0.0.0) - AWS compatible');
    } else {
        console.log('  ⚠️  May need to bind to 0.0.0.0 for AWS Amplify');
        warningCount++;
    }
}

// Final summary and recommendations
console.log('\n' + '='.repeat(70));
console.log('📊 DEPLOYMENT READINESS SUMMARY');
console.log('='.repeat(70));

if (allChecksPass && warningCount === 0) {
    console.log('🎉 PERFECT! All checks passed - Ready for AWS Amplify deployment');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Commit and push to GitHub:');
    console.log('   git add -A');
    console.log('   git commit -m "🚀 Production ready - AWS Amplify deployment"');
    console.log('   git push origin main');
    console.log('\n2. Deploy to AWS Amplify:');
    console.log('   - Go to: https://console.aws.amazon.com/amplify/');
    console.log('   - Create new app > Host web app > Connect to GitHub');
    console.log('   - Add environment variables (SERPAPI_KEY, OPENAI_API_KEY)');
    console.log('   - Deploy and test!');
} else if (allChecksPass && warningCount > 0) {
    console.log(`🟡 READY WITH WARNINGS: All critical checks passed (${warningCount} warnings)`);
    console.log('\n✅ Your deployment should work, but consider addressing warnings above');
    console.log('\n🚀 NEXT STEPS (proceed with caution):');
    console.log('1. Address warnings if possible');
    console.log('2. Commit and push to GitHub');
    console.log('3. Deploy to AWS Amplify');
    console.log('4. Monitor deployment closely');
} else {
    console.log('❌ NOT READY - Critical issues found that must be fixed');
    console.log('\n🔧 REQUIRED ACTIONS:');
    console.log('1. Fix all ❌ critical errors listed above');
    console.log('2. Re-run this script: node deployment-ready-check.js');
    console.log('3. Only proceed when all critical checks pass');
}

console.log('\n📋 SUMMARY STATS:');
console.log(`   ✅ Critical checks: ${allChecksPass ? 'PASSED' : 'FAILED'}`);
console.log(`   ⚠️  Warnings: ${warningCount}`);
console.log(`   📁 Files checked: ${essentialFiles.length + keyComponents.length}`);
console.log(`   🔧 Configuration files: ${fs.existsSync('amplify.yml') ? 1 : 0}/1`);

console.log('\n🆘 NEED HELP?');
console.log('   - Check AWS_DEPLOYMENT_GUIDE.md for detailed instructions');
console.log('   - Ensure API keys are obtained from SerpAPI and OpenAI');
console.log('   - Verify GitHub repository is accessible');

console.log('='.repeat(70));

// Exit with appropriate code
process.exit(allChecksPass ? 0 : 1);