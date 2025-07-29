# 🛠️ AWS Deployment Guide – Price is Right

This guide will help you deploy the **"Price is Right" AI-Enhanced Insurance Item Pricing System** using AWS Amplify, Lambda, API Gateway, S3, and CloudFront.

---

## 📦 Prerequisites

- Node.js 16+
- AWS CLI and Amplify CLI (`npm install -g @aws-amplify/cli`)
- AWS account with access to:
  - Lambda
  - API Gateway
  - Amplify
  - CloudFront
  - S3
- OpenAI, SerpAPI, Google API Keys
- (Optional) GitHub repo for CI/CD integration

---

## 🚀 Deployment Steps

### 1. Initialize Amplify
```bash
amplify init
```
- Accept defaults or configure environment name (e.g. `stage`)
- Select AWS profile and region

---

### 2. Add Backend Function
```bash
amplify add function
```
- Name: `getProductPrice`  
- Runtime: Node.js  
- Handler: `index.handler`  
- Paste your Express handler using `@vendia/serverless-express`

---

### 3. Add REST API (API Gateway)
```bash
amplify add api
```
- Select **REST**
- Path: `/api`
- Use Lambda function: `getProductPrice`

---

### 4. Set Environment Variables
```bash
amplify update function
```
- Select: `getProductPrice`
- Choose: **Environment variables configuration**
- Add the following:
  - `OPENAI_API_KEY`
  - `SERPAPI_KEY`
  - `GOOGLE_API_KEY`
  - `GOOGLE_SEARCH_ENGINE_ID`
  - `SCRAPER_API_KEY` (if used)

---

### 5. Add Hosting (Frontend)
```bash
amplify add hosting
```
- Choose: **Amazon CloudFront and S3**
- Accept defaults or customize bucket name

---

### 6. Publish to AWS
```bash
amplify publish
```
This will:
- Deploy your Lambda backend
- Configure and deploy your API Gateway
- Upload your frontend to S3
- Distribute via CloudFront

---

## ✅ Live URLs

- - **App (Frontend - Staging):**  
  [https://main.d2hbhfpwm1b8g3.amplifyapp.com/](https://main.d2hbhfpwm1b8g3.amplifyapp.com/)

- **API (process item):**  
  [https://udjszezwob.execute-api.us-east-1.amazonaws.com/stage/api/process-item](https://udjszezwob.execute-api.us-east-1.amazonaws.com/stage/api/process-item)

- **API Health Check:**  
  [https://udjszezwob.execute-api.us-east-1.amazonaws.com/stage/health](https://udjszezwob.execute-api.us-east-1.amazonaws.com/stage/health)

---

## 💡 Tips

- For **local dev**, use `npm start` and test at `http://localhost:3001`
- Your frontend auto-switches between local and deployed API based on hostname
- For CI/CD, connect GitHub repo in Amplify Console for auto-deploy on push

---