// lambda-handler.js - AWS Lambda wrapper for Express app
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./app');

// Export Lambda handler
exports.handler = serverlessExpress({ app });