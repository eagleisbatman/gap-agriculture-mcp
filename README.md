# 🌾 GAP Agriculture MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Railway Deploy](https://img.shields.io/badge/Deploy-Railway-blueviolet)](https://railway.app)

**Production-ready Model Context Protocol (MCP) server providing agriculture weather intelligence for farmers in Kenya and East Africa.**

Powered by [Tomorrow Now's Global Access Platform (GAP)](https://tomorrownow.org), this server delivers real-time weather forecasts, planting recommendations, irrigation schedules, and comprehensive farming advisory through AI agents via the MCP protocol.

---

## 🚀 Live Demo

**Deployed Instance**: `https://gap-agriculture-mcp-production.up.railway.app`

- Health Check: [`/health`](https://gap-agriculture-mcp-production.up.railway.app/health)
- MCP Endpoint: `/mcp` (POST requests only)

---

## ✨ Features

###  4 Agricultural Intelligence Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| **`get_weather_forecast`** | 1-14 day weather forecasts | Daily planning, field work scheduling |
| **`get_planting_recommendation`** | YES/NO planting decisions | Crop planting timing, risk assessment |
| **`get_irrigation_advisory`** | Irrigation scheduling | Water management, irrigation planning |
| **`get_farming_advisory`** | Comprehensive farming guidance | Crop management, risk mitigation |

### Key Capabilities

- ✅ **Ensemble Forecast Handling**: Processes 50-member ensemble forecasts into farmer-friendly single values
- ✅ **7 Supported Crops**: Maize, Wheat, Rice, Beans, Vegetables, Tea, Coffee
- ✅ **Anomaly Detection**: Identifies weather deviations from normal patterns
- ✅ **Production Ready**: Deployed on Railway with health monitoring
- ✅ **Type-Safe**: Built with TypeScript for reliability
- ✅ **Well-Documented**: Comprehensive inline code comments

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Integration Guides](#-integration-guides)
- [Development](#-development)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏃 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **GAP API Token** from [Tomorrow Now](https://tomorrownow.org)
- **npm** or **yarn**

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone https://github.com/eagleisbatman/gap-agriculture-mcp.git
cd gap-agriculture-mcp

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your GAP_API_TOKEN

# 4. Start development server
npm run dev

# 5. Test the server
curl http://localhost:3000/health
```

**Expected Output**:
```json
{
  "status": "healthy",
  "service": "gap-agriculture-mcp-server",
  "timestamp": "2025-10-10T...",
  "version": "1.0.0",
  "gapApiConfigured": true
}
```

---

## 💾 Installation

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode (with hot reload)
npm run dev

# Run in production mode
npm start
```

### Docker (Optional)

```bash
# Build Docker image
docker build -t gap-mcp-server .

# Run container
docker run -p 3000:3000 --env-file .env gap-mcp-server
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required: GAP API Configuration
GAP_API_TOKEN=your_gap_api_token_here
GAP_API_BASE_URL=https://gap.tomorrownow.org/api/v1

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=*  # Use specific domains in production
```

### Get Your GAP API Token

1. Visit [Tomorrow Now](https://tomorrownow.org)
2. Sign up / Log in
3. Navigate to API section
4. Generate a new API token
5. Copy token to `.env` file

---

## 🚂 Deployment

### Deploy to Railway (Recommended)

Railway provides free hosting with automatic deployments from GitHub.

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway auto-detects Node.js project

#### Step 3: Add Environment Variable

In Railway dashboard:
- Go to **Variables** tab
- Add: `GAP_API_TOKEN` = `your_token_here`
- Railway will auto-redeploy

#### Step 4: Get Your URL

Railway generates a public URL:
```
https://your-project-name.up.railway.app
```

Test it:
```bash
curl https://your-project-name.up.railway.app/health
```

### Other Deployment Options

<details>
<summary><b>Heroku</b></summary>

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set GAP_API_TOKEN=your_token_here

# Deploy
git push heroku main
```
</details>

<details>
<summary><b>AWS Lambda</b></summary>

Use [Serverless Framework](https://www.serverless.com/):

```bash
npm install -g serverless
serverless deploy
```
</details>

<details>
<summary><b>Google Cloud Run</b></summary>

```bash
gcloud run deploy gap-mcp-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```
</details>

---

## 📚 API Documentation

### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "gap-agriculture-mcp-server",
  "timestamp": "2025-10-10T12:00:00.000Z",
  "version": "1.0.0",
  "gapApiConfigured": true
}
```

### MCP Endpoint

```http
POST /mcp
Content-Type: application/json
```

This endpoint handles all Model Context Protocol communication. Connect via:
- OpenAI Agent Builder
- Anthropic Claude (with MCP support)
- Custom MCP clients

---

## 🔌 Integration Guides

### OpenAI Agent Builder

#### Step 1: Create New Agent

1. Go to [platform.openai.com](https://platform.openai.com/playground/agents)
2. Click **"Create New Agent"**
3. Add **"Agent"** node to canvas

#### Step 2: Configure Agent

**System Instructions**:
```
You are an agricultural advisory assistant for farmers in Kenya and East Africa.

When users ask about weather or farming:
1. Ask for their farm coordinates (latitude, longitude) if not provided
2. Use the appropriate tool to fetch weather data
3. Provide clear, actionable advice in simple language

Available crops: maize, wheat, rice, beans, vegetables, tea, coffee
Example coordinates for testing: 1.2921, 36.8219 (Kenya)
```

#### Step 3: Add MCP Server

1. In Agent configuration, click **"Add Tool"**
2. Select **"Custom MCP Server"**
3. Configure:
   - **Name**: `gap-agriculture-mcp`
   - **Transport**: `StreamableHTTP`
   - **URL**: `https://gap-agriculture-mcp-production.up.railway.app/mcp`

#### Step 4 (Optional): Configure Default Farm Coordinates

For testing convenience, you can configure default farm coordinates using custom headers. This allows testers to use the tools without typing coordinates every time.

1. In the MCP Server configuration, select **"Authentication"** dropdown
2. Choose **"Custom headers"**
3. Add the following headers:
   ```
   X-Farm-Latitude: 1.2921
   X-Farm-Longitude: 36.8219
   ```

**How it works:**
- Tools will use these header coordinates as defaults if coordinates aren't provided in the query
- Users can still override by providing explicit coordinates in their questions
- Perfect for testing with a consistent location

**Example queries with header coordinates:**
```
What's the weather forecast?  (uses header coordinates)
Should I plant maize?  (uses header coordinates)
Do I need to irrigate?  (uses header coordinates)
```

**Production Note:** In your actual app integration, your application will capture the user's location dynamically and pass it to the MCP tools as parameters. The custom header approach is specifically for testing purposes.

#### Step 5: Test

Try these prompts:
```
What's the weather forecast for latitude 1.2921, longitude 36.8219?
Should I plant maize at coordinates 1.2921, 36.8219?
Do I need to irrigate my farm at 1.2921, 36.8219?
```

---

## 🛠️ Development

### Project Structure

```
gap-mcp-server/
├── src/
│   ├── index.ts          # Main MCP server + 4 tools
│   └── gap-client.ts     # GAP API client with ensemble handling
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Local environment (gitignored)
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── railway.json          # Railway deployment config
└── README.md             # This file
```

### Adding New MCP Tools

1. **Register tool in `src/index.ts`**:

```typescript
server.tool(
  'your_tool_name',
  'Description of what your tool does',
  {
    // Define parameters with Zod schema
    latitude: z.number().describe('Latitude coordinate'),
    longitude: z.number().describe('Longitude coordinate')
  },
  async ({ latitude, longitude }) => {
    // Implement your logic
    const data = await gapClient.getForecast(latitude, longitude, 7);
    
    return {
      content: [{
        type: 'text',
        text: `Your formatted response here`
      }]
    };
  }
);
```

2. **Test locally**: `npm run dev`
3. **Deploy**: Push to GitHub (Railway auto-deploys)

### Running Tests

```bash
# Install test dependencies
npm install --save-dev @types/jest jest ts-jest

# Run tests
npm test
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐
│   AI Agent      │  (OpenAI Agent Builder, Claude, etc.)
│   (User Query)  │
└────────┬────────┘
         │ MCP Protocol (StreamableHTTP)
         ▼
┌─────────────────┐
│   Express.js    │
│   MCP Server    │  - Tool registration
│   (This Repo)   │  - Request routing
│                 │  - Response formatting
└────────┬────────┘
         │ HTTP REST
         ▼
┌─────────────────┐
│   GAP API       │  - Ensemble forecasts (50 members)
│  (Tomorrow Now) │  - Historical & forecast data
└─────────────────┘
```

### Data Flow

1. **User Request** → AI Agent receives farmer's question
2. **Tool Selection** → Agent determines which MCP tool to use
3. **MCP Call** → Agent sends request to MCP server (`/mcp` endpoint)
4. **GAP API Request** → Server fetches weather data from GAP
5. **Data Processing** → Ensemble forecasts averaged to single values
6. **Response** → Formatted advice returned to AI agent → User

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **TypeScript** | Type safety for production reliability |
| **Express.js** | Simple, widely-supported web framework |
| **StreamableHTTP** | MCP transport for web compatibility |
| **Ensemble Aggregation** | Simplifies 50-value arrays to single farmer-friendly values |
| **Railway Hosting** | Free tier, auto-deployment, easy scaling |
| **Zod Validation** | Runtime type checking for MCP parameters |

---

## 📊 Supported Data

### Crops

- Maize
- Wheat
- Rice
- Beans
- Vegetables (general)
- Tea
- Coffee

### Weather Attributes

| Attribute | Unit | Description |
|-----------|------|-------------|
| `max_temperature` | °C | Daily maximum temperature |
| `min_temperature` | °C | Daily minimum temperature |
| `precipitation` | mm | Total rainfall |
| `relative_humidity` | % | Relative humidity (0-100%) |
| `wind_speed` | m/s | Wind speed |
| `solar_radiation` | W/m² | Solar radiation (farming forecast only) |
| `*_anom` | varies | Deviation from normal (anomaly) |

### Geographic Coverage

- **Primary**: Kenya, East Africa
- **Supported**: Any region with GAP API coverage
- **Test Coordinates**: 1.2921°N, 36.8219°E (Nairobi area)

---

## 🐛 Troubleshooting

### Server Won't Start

**Problem**: `ERROR: GAP_API_TOKEN environment variable is not set`

**Solution**:
```bash
# Check if .env file exists
ls -la .env

# Verify GAP_API_TOKEN is set
grep GAP_API_TOKEN .env

# If missing, copy from example
cp .env.example .env
# Then edit .env and add your token
```

### GAP API Errors

**Problem**: `GAP API error: 401 Unauthorized`

**Solution**:
- Verify your API token is valid
- Check token hasn't expired
- Ensure token has correct permissions

**Problem**: `GAP API error: 404 Not Found`

**Solution**:
- Check coordinates are within GAP coverage area
- Verify date ranges are valid (forecast: 1-14 days future)

### MCP Connection Issues

**Problem**: OpenAI Agent Builder can't connect to MCP server

**Solution**:
1. Test health endpoint: `curl https://your-url.up.railway.app/health`
2. Check Railway logs for errors
3. Verify CORS settings allow OpenAI domains
4. Ensure URL uses `https://` not `http://`

### Railway Deployment Fails

**Problem**: Health check failing

**Solution**:
- Verify `GAP_API_TOKEN` is set in Railway variables
- Check Railway build logs for compilation errors
- Ensure `PORT` environment variable is not hardcoded
- Server must bind to `0.0.0.0` not `localhost`

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Write clear commit messages
- Add tests for new features
- Update documentation
- Follow existing code style
- Add JSDoc comments for new functions

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 GAP Agriculture MCP Server Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🙏 Acknowledgments

- **Weather Data**: [Tomorrow Now GAP](https://tomorrownow.org) - Global Access Platform
- **MCP Protocol**: [Anthropic](https://modelcontextprotocol.io) - Model Context Protocol specification
- **Hosting**: [Railway](https://railway.app) - Simple, powerful deployment platform
- **Community**: All contributors and users providing feedback

---

## 📞 Support & Contact

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/eagleisbatman/gap-agriculture-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/eagleisbatman/gap-agriculture-mcp/discussions)
- **Documentation**: This README + inline code comments

### Links

- **Live Demo**: https://gap-agriculture-mcp-production.up.railway.app
- **Repository**: https://github.com/eagleisbatman/gap-agriculture-mcp
- **GAP API Docs**: https://tomorrownow.org/docs
- **MCP Specification**: https://modelcontextprotocol.io

---

## 🎯 Roadmap

### Current Version (v1.0.0)
- ✅ 4 agricultural MCP tools
- ✅ Ensemble forecast handling
- ✅ Railway deployment
- ✅ OpenAI Agent Builder integration

### Future Enhancements
- [ ] Additional weather attributes (soil moisture, etc.)
- [ ] Multi-location batch queries
- [ ] Historical data comparison
- [ ] Pest and disease predictions
- [ ] Market price integration
- [ ] SMS/WhatsApp notifications
- [ ] Multi-language support (Swahili, etc.)

---

<div align="center">

**Built with ❤️ for farmers in Kenya and East Africa**

[⭐ Star this repo](https://github.com/eagleisbatman/gap-agriculture-mcp) if you find it useful!

</div>
