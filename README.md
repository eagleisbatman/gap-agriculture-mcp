# 🌾 GAP Agriculture MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

**Model Context Protocol (MCP) server providing agriculture weather intelligence.**

Transforms weather data from [TomorrowNow's Global Access Platform (GAP)](https://tomorrownow.org) into actionable agricultural advice: weather forecasts, planting decisions, irrigation schedules, and farming guidance.

## ✨ Features

### 1 MCP Tool

| Tool | Purpose |
|------|---------|
| `get_weather_forecast` | Get satellite weather forecast (temperature, rainfall, humidity, wind) for agricultural planning in Kenya and East Africa. Returns up to 14 days of forecast data. |

### Technical Features

- ✅ Processes 50-member ensemble forecasts into single values
- ✅ Input validation for coordinates and dates
- ✅ 30-second timeout protection (prevents hanging requests)
- ✅ Response validation and error handling
- ✅ Graceful shutdown handling (SIGTERM/SIGINT)
- ✅ Farmer-friendly responses (no technical jargon)
- ✅ TypeScript for production reliability
- ✅ StreamableHTTP MCP transport

## 🌍 Geographic Coverage

**IMPORTANT:** This MCP server relies on [TomorrowNow's Global Access Platform (GAP)](https://tomorrownow.org) for weather data. GAP coverage is **limited to specific regions** where TomorrowNow operates.

**Check GAP availability for your region before deployment.**

Current GAP coverage includes parts of:
- East Africa (Kenya, Tanzania, Uganda, Ethiopia, Somalia)
- Other regions may be available - verify at [tomorrownow.org](https://tomorrownow.org)

**Note:** The server provides weather data that can be analyzed by AI agents for any crop or agricultural purpose, but the server will only work where GAP provides weather data coverage.

## 🏃 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- GAP API Token from [Tomorrow Now](https://tomorrownow.org)
- **Verify GAP covers your target region**

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

## 🚀 Deployment

This server can be deployed to any Node.js hosting platform:

- **PaaS:** Railway, Heroku, Render, Fly.io
- **Cloud:** AWS (EC2/Lambda), Google Cloud Run, Azure App Service
- **Containerized:** Docker, Kubernetes
- **VPS:** DigitalOcean, Linode, your own server

### Generic Deployment Steps

1. **Push code to version control** (GitHub, GitLab, etc.)
2. **Choose hosting platform** based on your needs
3. **Configure environment variables:**
   - Set `GAP_API_TOKEN`
   - Optionally set `PORT`, `NODE_ENV`, `ALLOWED_ORIGINS`
4. **Deploy** using platform-specific method
5. **Test:** `curl https://your-deployment-url/health`

### Platform-Specific Notes

**Railway/Heroku/Render:** Auto-detect Node.js, use `npm start`
**AWS Lambda:** May need serverless framework adapter
**Docker:** Use provided `Dockerfile` (if available) or create one
**VPS:** Use PM2 or systemd for process management

## 🔌 Integration

### OpenAI Agent Builder

**1. Deploy MCP Server** (any platform)

**2. Create Agent Workflow:**
- Go to [platform.openai.com](https://platform.openai.com/playground/agents)
- Create new agent

**3. Add MCP Server:**
- Add Tool → Custom MCP Server
- **Name:** `gap-agriculture-mcp`
- **Transport:** `StreamableHTTP`
- **URL:** `https://your-deployment-url/mcp`

**4. Configure System Prompt:**

See the [FarmerChat Widget repository](https://github.com/eagleisbatman/gap-chat-widget) for a complete example system prompt (`SYSTEM_PROMPT.md`) that:
- Instructs the LLM to use MCP tools exclusively for weather data
- Hides technical details from end users
- Keeps responses concise and actionable
- Lists all supported crops
- Provides user-friendly error messages

**5. Test the agent:**

The MCP server accepts coordinates in two ways:

**Option A - Default coordinates (Recommended for production):**
Configure default coordinates via HTTP headers when creating ChatKit sessions. Users can then ask simple questions:
```
What's the weather?
Should I plant maize?
Do I need to irrigate?
```

**Option B - Explicit coordinates (For testing or multi-location support):**
Users can specify different locations:
```
What's the weather for latitude XX.XXXX, longitude YY.YYYY?
Should I plant maize at latitude XX.XXXX, longitude YY.YYYY?
```

See the [FarmerChat Widget](https://github.com/eagleisbatman/gap-chat-widget) for a complete example of how to configure default coordinates via session headers.

## 🔧 Configuring Default Coordinates

The MCP server accepts default coordinates via HTTP headers, allowing farmers to ask questions without specifying location every time.

### How It Works

When your AI agent calls the MCP server, include these custom headers:

```http
X-Farm-Latitude: XX.XXXX
X-Farm-Longitude: YY.YYYY
```

The server uses these as defaults when users don't provide coordinates in their query.

### Example: OpenAI ChatKit Integration

```javascript
// In your session creation endpoint
const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Farm-Latitude': '-1.2864',      // Your region's default latitude
    'X-Farm-Longitude': '36.8172'      // Your region's default longitude
  },
  body: JSON.stringify({
    workflow_id: WORKFLOW_ID
  })
});
```

### Example: Direct MCP Call

```bash
curl -X POST https://your-mcp-server.com/mcp \
  -H "Content-Type: application/json" \
  -H "X-Farm-Latitude: XX.XXXX" \
  -H "X-Farm-Longitude: YY.YYYY" \
  -d '{"tool": "get_weather_forecast", "args": {}}'
```

### User Experience

**With default coordinates configured:**
- User: "What's the weather?"
- Agent: *Uses default coordinates, provides weather*

**Without default coordinates:**
- User: "What's the weather?"
- Agent: "I need to know your farm location to provide weather information. Please let me know where your farm is located."

**For a complete implementation example**, see the [FarmerChat Widget repository](https://github.com/eagleisbatman/gap-chat-widget).

## 🏗️ Architecture

```
AI Agent (OpenAI/Claude/Custom)
    ↓ MCP Protocol (StreamableHTTP) + Custom Headers
Express.js MCP Server (This Repo)
    ↓ Reads X-Farm-Latitude, X-Farm-Longitude from headers
    ↓ Uses as defaults if user doesn't provide coordinates
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
5. Test, commit, deploy

### Customizing for Your Region

1. **Update crop list:** Add/remove crops relevant to your region
2. **Adjust thresholds:** Modify temperature/rainfall ranges in crop logic
3. **Change units:** Adapt temperature (°C/°F) and rainfall (mm/inches) if needed
4. **Language:** Translate response strings for local language support

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
**404 Not Found:** Coordinates outside GAP coverage area or invalid dates

**Important:** If you consistently get 404 errors with valid coordinates, your region may not be covered by TomorrowNow GAP Platform. Verify coverage at [tomorrownow.org](https://tomorrownow.org)

### MCP Connection Failed

1. Test health endpoint: `curl https://your-url/health`
2. Check server logs for errors
3. Verify CORS allows your AI agent's domain
4. Ensure URL uses `https://`

### Deployment Issues

- Verify `GAP_API_TOKEN` is set in platform's environment variables
- Check build logs for compilation errors
- Server must bind to `0.0.0.0` (not `localhost`)
- Don't hardcode `PORT` - use `process.env.PORT`

## 📚 Resources

- **GitHub:** https://github.com/eagleisbatman/gap-agriculture-mcp
- **Chat Widget:** https://github.com/eagleisbatman/gap-chat-widget
- **GAP API:** https://tomorrownow.org
- **MCP Protocol:** https://modelcontextprotocol.io

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

**Open source agricultural intelligence for farmers worldwide 🌾**

[⭐ Star this repo](https://github.com/eagleisbatman/gap-agriculture-mcp)
