// server.js - Local development server entry point
// Uses your excellent Express app extracted to app.js

const app = require('./app');

// AWS Amplify compatible port configuration
const PORT = process.env.PORT || 3001;

// Start server with proper error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🏠 Price is Right - AI Insurance Pricing System');
  console.log('🚀 LOCAL DEVELOPMENT MODE');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`📱 Web Interface: http://localhost:${PORT}`);
  console.log(`💊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🤖 AI Vision Status: http://localhost:${PORT}/api/ai-vision-status`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🧪 Routes Debug: http://localhost:${PORT}/debug/routes`);
  }
  
  // Environment validation
  console.log('\n🔑 Environment Variables Status:');
  console.log(`${process.env.SERPAPI_KEY ? '✅' : '❌'} SERPAPI_KEY`);
  console.log(`${process.env.OPENAI_API_KEY ? '✅' : '❌'} OPENAI_API_KEY`);
  console.log(`${process.env.GOOGLE_API_KEY ? '✅' : '❌'} GOOGLE_API_KEY`);
  console.log(`${process.env.GOOGLE_SEARCH_ENGINE_ID ? '✅' : '❌'} GOOGLE_SEARCH_ENGINE_ID`);
  
  if (!process.env.SERPAPI_KEY) {
    console.log('⚠️  WARNING: SERPAPI_KEY not set - CSV processing may fail');
  }
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  WARNING: OPENAI_API_KEY not set - AI Vision will fail');
  }
  
  console.log(`\n🌟 System ready for LOCAL development!`);
  console.log(`🚀 To deploy to AWS Lambda: npm run deploy`);
});

// Graceful shutdown handling for AWS Amplify
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  console.error('🚨 Shutting down due to uncaught exception...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('🚨 Shutting down due to unhandled rejection...');
  process.exit(1);
});