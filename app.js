// app.js - Extracted from your excellent server.js code
// Unified Express application for both local and Lambda

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const fs = require('fs'); // Add for file system debugging

const app = express();

// ========================================
// DEPLOYMENT VERSION CHECK
// ========================================
const DEPLOYMENT_VERSION = '2025-07-24-19:30:00-DEBUG'; // Update this timestamp for each deployment
console.log(`🚀 DEPLOYMENT VERSION: ${DEPLOYMENT_VERSION}`);
console.log(`📅 Deployed at: ${new Date().toISOString()}`);

// ========================================
// ENVIRONMENT DETECTION
// ========================================

// Environment detection
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const isLocal = !isLambda;
const isProduction = process.env.NODE_ENV === 'production';

// Debug logging - reduced in production and Lambda
const DEBUG_LOGGING = !isProduction && isLocal;

// Enhanced logging for deployment
console.log('🚀 Price is Right - AI Insurance Pricing System');
console.log(`🌍 Environment: ${isLambda ? 'AWS Lambda' : 'Local'} (${process.env.NODE_ENV || 'development'})`);
console.log('📧 Environment check:');
console.log('  - SERPAPI_KEY:', process.env.SERPAPI_KEY ? '✅ Set' : '❌ Missing');
console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  - GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  - GOOGLE_SEARCH_ENGINE_ID:', process.env.GOOGLE_SEARCH_ENGINE_ID ? '✅ Set' : '❌ Missing');
console.log(`🔍 Debug logging: ${DEBUG_LOGGING ? 'Enabled' : 'Disabled'}`);

// ========================================
// LAMBDA FILE SYSTEM DEBUG
// ========================================
if (isLambda) {
  console.log('\n🔍 LAMBDA FILE SYSTEM DEBUG:');
  try {
    // Check current directory
    const currentDir = process.cwd();
    console.log(`📁 Current directory: ${currentDir}`);
    
    // List all files in root
    const rootFiles = fs.readdirSync('.');
    console.log(`📂 Root files (${rootFiles.length}):`, rootFiles);
    
    // Check if routes directory exists
    if (fs.existsSync('./routes')) {
      const routeFiles = fs.readdirSync('./routes');
      console.log(`📂 Routes directory files (${routeFiles.length}):`, routeFiles);
      
      // Check specifically for csvProcessingRoutes.js
      if (routeFiles.includes('csvProcessingRoutes.js')) {
        console.log('✅ csvProcessingRoutes.js found in routes directory');
        
        // Check file size to ensure it's not empty
        const fileStat = fs.statSync('./routes/csvProcessingRoutes.js');
        console.log(`📄 csvProcessingRoutes.js size: ${fileStat.size} bytes`);
      } else {
        console.log('❌ csvProcessingRoutes.js NOT found in routes directory');
      }
    } else {
      console.log('❌ ./routes directory does not exist');
    }
    
    // Check if models directory exists
    if (fs.existsSync('./models')) {
      const modelFiles = fs.readdirSync('./models');
      console.log(`📂 Models directory files (${modelFiles.length}):`, modelFiles);
    } else {
      console.log('❌ ./models directory does not exist');
    }
    
  } catch (fsError) {
    console.error('❌ File system debug error:', fsError.message);
  }
  console.log('🔍 END LAMBDA FILE SYSTEM DEBUG\n');
}

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log(`✅ OpenAI client initialized successfully (${isLambda ? 'Lambda' : 'Local'})`);
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error.message);
  }
} else {
  console.log('⚠️ OpenAI API key not found in environment variables');
}

// ========================================
// MIDDLEWARE CONFIGURATION
// ========================================

// CORS configuration - AWS Amplify compatible
app.use(cors({
  origin: true, // Allow all origins for Amplify
  credentials: true
}));

// Body parsing with increased limits for file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Enhanced request logging - reduced in production
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  
  if (DEBUG_LOGGING) {
    console.log(`\n🌐 [${timestamp}] ${req.method} ${req.url}`);
    
    if (req.url.includes('analyze-image') && req.method === 'POST') {
      console.log('🤖 AI Vision Request Debug:');
      console.log('  - Content-Type:', req.headers['content-type']);
      console.log('  - Content-Length:', req.headers['content-length']);
      console.log('  - Body type:', typeof req.body);
      console.log('  - Body keys:', Object.keys(req.body || {}));
      console.log('  - Has image:', !!(req.body && req.body.image));
      console.log('  - Has prompt:', !!(req.body && req.body.prompt));
      console.log('  - Has fileName:', !!(req.body && req.body.fileName));
      console.log('  - Image length:', req.body?.image?.length || 0);
      console.log('  - Prompt length:', req.body?.prompt?.length || 0);
      console.log('  - FileName value:', req.body?.fileName);
    }
  } else if (req.url.includes('/api/') || req.url.includes('/health')) {
    // In production or Lambda, only log API calls
    console.log(`🌐 ${req.method} ${req.url} - ${timestamp} (${isLambda ? 'Lambda' : 'Local'})`);
  }
  
  next();
});

// ========================================
// STATIC FILE SERVING - LOCAL ONLY
// ========================================

// Serve static files ONLY in local mode
if (isLocal) {
  console.log('📁 Static file serving enabled (local mode)');
  
  // Serve static files with proper caching headers
  app.use(express.static('.', {
    maxAge: isProduction ? '1d' : '1h',
    etag: true,
    lastModified: true
  }));

  app.use('/js', express.static(path.join(__dirname, 'js')));
  app.use('/components', express.static(path.join(__dirname, 'components')));
  app.use('/styles', express.static(path.join(__dirname, 'styles')));
}

// ========================================
// API ROUTES - YOUR EXCELLENT CODE
// ========================================

// AI Vision Status Check - Enhanced for production
app.get('/api/ai-vision-status', (req, res) => {
  if (DEBUG_LOGGING) console.log('🤖 AI Vision status endpoint called');
  
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  res.json({
    aiVisionEnabled: hasApiKey,
    openaiClientReady: !!openai,
    status: hasApiKey ? 'ready' : 'missing_api_key',
    message: hasApiKey ? 
      `AI Vision is ready for use (${isLambda ? 'Lambda' : 'Local'})` : 
      'OpenAI API key not configured. Add OPENAI_API_KEY to your environment variables.',
    timestamp: new Date().toISOString(),
    supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
    maxFileSize: '10MB',
    visionModel: 'gpt-4o', // Current OpenAI Vision model
    environment: isLambda ? 'AWS Lambda' : (process.env.NODE_ENV || 'development'),
    deploymentVersion: DEPLOYMENT_VERSION // Add version info
  });
});

// AI Vision Analysis - YOUR EXCELLENT IMPLEMENTATION
app.post('/api/analyze-image', async (req, res) => {
  try {
    if (DEBUG_LOGGING) {
      console.log('🔍 AI Vision analyze endpoint called');
      console.log('📦 Request body keys:', Object.keys(req.body || {}));
      console.log('📦 Request details:', {
        hasImage: !!req.body?.image,
        hasPrompt: !!req.body?.prompt,
        hasFileName: !!req.body?.fileName,
        imageLength: req.body?.image?.length || 0,
        promptLength: req.body?.prompt?.length || 0
      });
    }

    const { image, prompt, fileName } = req.body;

    if (!image) {
      console.error('❌ No image provided in request');
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    if (!prompt) {
      console.error('❌ No prompt provided in request');
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.'
      });
    }

    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI client not initialized properly.'
      });
    }

    console.log(`🤖 Analyzing image: ${fileName} with AI Vision (${isLambda ? 'LAMBDA' : (isProduction ? 'PRODUCTION' : 'DEVELOPMENT')})`);
    if (DEBUG_LOGGING) {
      console.log(`📝 Using prompt: ${prompt.substring(0, 100)}...`);
    }

    // Use current OpenAI Vision model with optimized settings
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Current OpenAI Vision model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "high" // Always high quality
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1 // Consistent results
    });

    const aiResponse = response.choices[0].message.content;
    
    if (DEBUG_LOGGING) {
      console.log(`🤖 AI Vision raw response for ${fileName}:`, aiResponse);
    } else {
      console.log(`🤖 AI Vision analysis completed for ${fileName}`);
    }

    // Try to parse JSON response
    let extractedItems = [];
    try {
      // Clean up the response (remove markdown formatting if present)
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      extractedItems = JSON.parse(cleanResponse);
      
      // Ensure it's an array
      if (!Array.isArray(extractedItems)) {
        extractedItems = [extractedItems];
      }
      
      console.log(`✅ Successfully extracted ${extractedItems.length} items from ${fileName}`);
      
    } catch (parseError) {
      console.log('⚠️ Failed to parse as JSON, attempting text extraction...');
      
      // Fallback: create a generic item from the text response
      extractedItems = [{
        brandOrManufacturer: 'AI Analysis',
        modelNumber: '',
        itemDescription: `Items visible in ${fileName}`,
        costToReplace: '25.99',
        totalCost: '25.99',
        brand: '',
        description: aiResponse.slice(0, 200)
      }];
      
      console.log(`📝 Created fallback item for ${fileName}`);
    }

    // Validate and clean extracted items
    const validatedItems = extractedItems.map((item, index) => ({
      brandOrManufacturer: item.brandOrManufacturer || item.brand || 'No Brand',
      modelNumber: item.modelNumber || item.model || '',
      itemDescription: item.itemDescription || item.description || `Item ${index + 1} from ${fileName}`,
      costToReplace: parseFloat(item.costToReplace) || 25.99,
      totalCost: parseFloat(item.totalCost) || parseFloat(item.costToReplace) || 25.99,
      brand: item.brand || item.brandOrManufacturer || '',
      description: item.description || item.itemDescription || ''
    }));

    console.log(`🎉 Returning ${validatedItems.length} validated items`);

    res.json({
      success: true,
      items: validatedItems,
      fileName: fileName,
      originalResponse: DEBUG_LOGGING ? aiResponse : '[Hidden in production]',
      extractedCount: validatedItems.length,
      processingTime: new Date().toISOString(),
      environment: isLambda ? 'AWS Lambda' : (process.env.NODE_ENV || 'development'),
      deploymentVersion: DEPLOYMENT_VERSION
    });

  } catch (error) {
    console.error('❌ AI Vision analysis error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({
        success: false,
        error: 'OpenAI API quota exceeded. Please check your billing and add credits to your OpenAI account.'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        success: false,
        error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY in environment variables.'
      });
    }

    if (error.message && error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'OpenAI API rate limit exceeded. Please wait and try again.'
      });
    }

    if (error.message && error.message.includes('deprecated')) {
      return res.status(500).json({
        success: false,
        error: 'AI Vision model has been updated. Please contact support if this error persists.',
        message: 'The vision model has been updated to gpt-4o'
      });
    }

    res.status(500).json({
      success: false,
      error: 'AI Vision analysis failed',
      message: (isProduction || isLambda) ? 'Internal server error' : error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint - Enhanced for production
app.get('/api/test', (req, res) => {
  if (DEBUG_LOGGING) console.log('🧪 API test endpoint called');
  
  res.json({
    message: `${isLambda ? 'Lambda' : 'Local'} API routes are working!`,
    timestamp: new Date().toISOString(),
    environment: isLambda ? 'AWS Lambda' : (process.env.NODE_ENV || 'development'),
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    openaiClientReady: !!openai,
    serpapiConfigured: !!process.env.SERPAPI_KEY,
    visionModel: 'gpt-4o',
    systemStatus: 'operational',
    version: '3.0.0-unified',
    platform: isLambda ? 'AWS Lambda' : 'Express Server',
    deploymentVersion: DEPLOYMENT_VERSION
  });
});

// ========================================
// MOUNT CSV PROCESSING ROUTES
// ========================================
console.log(`📡 Mounting CSV processing routes... (${isLambda ? 'Lambda' : 'Local'})`);

try {
  console.log('🔍 Attempting to require ./routes/csvProcessingRoutes...');
  const csvProcessingRoutes = require('./routes/csvProcessingRoutes');
  console.log('✅ csvProcessingRoutes module loaded successfully');
  
  app.use('/', csvProcessingRoutes);
  console.log(`✅ CSV processing routes mounted at / (${isLambda ? 'Lambda' : 'Local'})`);
  console.log('🎯 Available routes: POST /api/process-item, POST /api/process-csv');
  
} catch (error) {
  console.error('❌ Failed to load CSV processing routes:', error.message);
  console.error('🚨 Full error stack:', error.stack);
  console.error('🚨 Make sure SERPAPI_KEY is set in your environment variables');
  console.error('🚨 Also check if csvProcessingRoutes.js exists in routes directory');
  
  // Continue without CSV routes if they fail to load
  console.log('⚠️ Continuing without CSV processing routes...');
  
  // Add a temporary test route to verify routing works
  app.post('/api/process-item', async (req, res) => {
    console.log('🧪 TEMPORARY TEST ROUTE: /api/process-item called');
    res.json({
      success: false,
      error: 'CSV processing routes failed to load',
      message: 'This is a temporary test route. Check Lambda logs for csvProcessingRoutes loading error.',
      timestamp: new Date().toISOString(),
      deploymentVersion: DEPLOYMENT_VERSION,
      body: req.body
    });
  });
  
  console.log('🧪 Added temporary test route for /api/process-item');
}

// ========================================
// UTILITY ROUTES
// ========================================

// Health check - Enhanced for unified deployment
app.get('/health', (req, res) => {
  const healthData = { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: {
      mode: isLambda ? 'AWS Lambda' : 'Local Development',
      nodeEnv: process.env.NODE_ENV || 'development',
      serpapi: !!process.env.SERPAPI_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      google: !!process.env.GOOGLE_API_KEY,
      googleCSE: !!process.env.GOOGLE_SEARCH_ENGINE_ID
    },
    services: {
      aiVision: !!openai,
      visionModel: 'gpt-4o',
      csvProcessing: !!process.env.SERPAPI_KEY,
      serpapiIntegration: !!process.env.SERPAPI_KEY
    },
    version: '3.0.0-unified',
    company: 'KVS Technologies',
    deploymentVersion: DEPLOYMENT_VERSION
  };
  
  // Add additional health metrics in development and local mode
  if (!isProduction && isLocal) {
    healthData.system = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    };
  }
  
  res.json(healthData);
});

// Root route - Local only
if (isLocal) {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

// Debug route - Only available in local development
if (!isProduction && isLocal) {
  app.get('/debug/routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: handler.route.path,
              methods: Object.keys(handler.route.methods),
              source: 'router'
            });
          }
        });
      }
    });
    
    res.json({
      totalRoutes: routes.length,
      routes: routes,
      directApiRoutes: [
        'GET /api/test',
        'GET /api/ai-vision-status', 
        'POST /api/analyze-image'
      ],
      openaiStatus: {
        configured: !!process.env.OPENAI_API_KEY,
        clientReady: !!openai,
        visionModel: 'gpt-4o'
      },
      environment: 'local-development',
      deploymentVersion: DEPLOYMENT_VERSION
    });
  });
}

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use('*', (req, res) => {
  if (DEBUG_LOGGING) {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  }
  
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    environment: isLambda ? 'AWS Lambda' : 'Local Development',
    deploymentVersion: DEPLOYMENT_VERSION,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/test',
      'GET /api/ai-vision-status',
      'POST /api/analyze-image',
      'POST /api/process-csv',
      'POST /api/process-item'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`💥 SERVER ERROR (${isLambda ? 'Lambda' : 'Local'}):`, err.message);
  
  if (DEBUG_LOGGING) {
    console.error('Error stack:', err.stack);
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: (isProduction || isLambda) ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString(),
    environment: isLambda ? 'AWS Lambda' : 'Local Development',
    requestId: req.headers['x-request-id'] || 'unknown',
    deploymentVersion: DEPLOYMENT_VERSION
  });
});

// Export the Express app for Lambda use
module.exports = app;