# 🌾 GAP Agriculture MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

**Model Context Protocol (MCP) server providing agriculture weather intelligence for Kenya and East Africa.**

Transforms weather data from [TomorrowNow's Global Access Platform (GAP)](https://tomorrownow.org) into actionable agricultural advice: weather forecasts, planting decisions, irrigation schedules, and farming guidance.

## ✨ Features

### 4 Agricultural Tools

| Tool | Purpose |
|------|---------|
| `get_weather_forecast` | 1-14 day forecasts (temperature, rain, humidity, wind) |
| `get_planting_recommendation` | YES/NO planting decisions for 22 East African crops |
| `get_irrigation_advisory` | 7-day irrigation schedules with water balance calculations |
| `get_farming_advisory` | Comprehensive crop management and risk alerts |

### Supported Crops (22)

**Cereals:** maize, wheat, rice, sorghum, millet
**Legumes:** beans, cowpea, pigeon_pea, groundnut
**Roots:** cassava, sweet_potato, potato
**Vegetables:** tomato, cabbage, kale, onion, vegetables
**Cash Crops:** tea, coffee, sugarcane, banana, sunflower, cotton

### Technical Features

- ✅ Processes 50-member ensemble forecasts into single farmer-friendly values
- ✅ Hardcoded crop-specific logic (temperature ranges, water requirements)
- ✅ Farmer-friendly responses (no coordinates, no technical jargon)
- ✅ TypeScript for production reliability
- ✅ StreamableHTTP MCP transport

## 🏃 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- GAP API Token from [Tomorrow Now](https://tomorrownow.org)

### Local Setup

```bash
# Clone and install
git clone https://github.com/eagleisbatman/gap-agriculture-mcp.git
cd gap-agriculture-mcp
npm install

# Configure environment
cp .env.example .env
# Edit .env: Add your GAP_API_TOKEN

# Start development server
npm run dev

# Test
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "gap-agriculture-mcp-server",
  "gapApiConfigured": true
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required
GAP_API_TOKEN=your_gap_api_token_here

# Optional (defaults shown)
PORT=3000
NODE_ENV=production
GAP_API_BASE_URL=https://gap.tomorrownow.org/api/v1
ALLOWED_ORIGINS=*
```

### Get GAP API Token

1. Visit [TomorrowNow](https://tomorrownow.org)
2. Sign up / Log in
3. Generate API token
4. Add to `.env`

## 🚂 Deploy to Railway

Railway provides free hosting with auto-deployment from GitHub.

### Steps

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Deploy on Railway
# - Go to railway.app
# - New Project → Deploy from GitHub
# - Select your repository
# - Railway auto-detects configuration

# 3. Add environment variable
# In Railway dashboard → Variables:
#   GAP_API_TOKEN = your_token_here

# 4. Get your URL
# Railway generates: https://your-app.up.railway.app
```

### Test Deployment

```bash
curl https://your-app.up.railway.app/health
```

## 🔌 Integration

### OpenAI Agent Builder

**1. Create Agent Workflow:**
- Go to [platform.openai.com](https://platform.openai.com/playground/agents)
- Create new agent

**2. Add MCP Server:**
- Add Tool → Custom MCP Server
- **Name:** `gap-agriculture-mcp`
- **Transport:** `StreamableHTTP`
- **URL:** `https://your-app.up.railway.app/mcp`

**3. Configure System Prompt:**

See the [FarmerChat Widget repository](https://github.com/eagleisbatman/gap-chat-widget) for a complete example system prompt (`SYSTEM_PROMPT.md`) that:
- Instructs the LLM to use MCP tools exclusively for weather data
- Hides technical details from farmers
- Keeps responses concise and actionable
- Lists all supported crops
- Provides farmer-friendly error messages

**4. Test:**
```
What's the weather forecast for latitude -1.2864, longitude 36.8172?
Should I plant maize at -1.2864, 36.8172?
```

## 🏗️ Architecture

```
AI Agent (OpenAI/Claude)
    ↓ MCP Protocol (StreamableHTTP)
Express.js MCP Server (This Repo)
    ↓ HTTP REST
GAP API (TomorrowNow)
    - Provides: Weather data only
    - Returns: 50-member ensemble forecasts

Server analyzes weather data and generates:
    - Planting recommendations
    - Irrigation schedules
    - Farming advice
```

**Critical:** GAP provides ONLY weather data. All agricultural analysis happens in this server's code (`src/index.ts`).

## 📁 Project Structure

```
gap-mcp-server/
├── src/
│   ├── index.ts          # Main: 4 MCP tools + agricultural logic
│   └── gap-client.ts     # GAP API client wrapper
├── dist/                 # Compiled output (generated)
├── .env                  # Environment variables (gitignored)
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config
├── railway.json          # Railway deployment config
├── CLAUDE.md             # Development guidance
└── README.md             # This file
```

## 🛠️ Development

### Commands

```bash
npm install     # Install dependencies
npm run build   # Compile TypeScript
npm run dev     # Development mode (hot reload)
npm start       # Production mode
```

### Adding Crops

1. Edit `src/index.ts`
2. Add to enum in all 4 tools (search for `z.enum`)
3. Add case in switch statements:
   - `get_farming_advisory` (~line 275)
   - `get_planting_recommendation` (~line 450)
4. Define: optimal temperature, water needs, special conditions
5. Test, commit, push (Railway auto-deploys)

## 🐛 Troubleshooting

### Server Won't Start

**Error:** `GAP_API_TOKEN is not set`

```bash
# Check .env exists
ls -la .env

# Verify token is set
grep GAP_API_TOKEN .env

# If missing, copy template
cp .env.example .env
# Then edit .env
```

### GAP API Errors

**401 Unauthorized:** Invalid or expired API token
**404 Not Found:** Coordinates outside GAP coverage or invalid dates

### MCP Connection Failed

1. Test health: `curl https://your-app.up.railway.app/health`
2. Check Railway logs for errors
3. Verify CORS allows OpenAI domains
4. Ensure URL uses `https://`

### Railway Deployment Issues

- Verify `GAP_API_TOKEN` set in Railway variables
- Check Railway build logs
- Server must bind to `0.0.0.0` (not `localhost`)
- Don't hardcode `PORT`

## 📚 Resources

- **GitHub:** https://github.com/eagleisbatman/gap-agriculture-mcp
- **Chat Widget:** https://github.com/eagleisbatman/gap-chat-widget
- **GAP API:** https://tomorrownow.org
- **MCP Protocol:** https://modelcontextprotocol.io

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

**Built for farmers in Kenya and East Africa 🌾**

[⭐ Star this repo](https://github.com/eagleisbatman/gap-agriculture-mcp)
