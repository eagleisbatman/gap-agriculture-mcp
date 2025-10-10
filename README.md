# GAP Agriculture MCP Server

Model Context Protocol (MCP) server for agriculture weather intelligence powered by Tomorrow Now's Global Access Platform (GAP) API.

## Features

### Available MCP Tools

1. **`get_weather_forecast`**
   - Get weather forecast for any location
   - Supports 1-14 day forecasts
   - Includes temperature, precipitation, humidity, wind speed

2. **`get_farming_advisory`**
   - Comprehensive agricultural recommendations
   - Analyzes weather patterns for farming decisions
   - Crop-specific advice available
   - Identifies risks and opportunities

3. **`get_planting_recommendation`**
   - Determines if conditions are suitable for planting
   - Crop-specific requirements analysis
   - Provides actionable yes/no recommendations

4. **`get_irrigation_advisory`**
   - Irrigation scheduling recommendations
   - Water deficit calculations
   - Day-by-day irrigation guide

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- GAP API token from Tomorrow Now
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your GAP API token
# GAP_API_TOKEN=your_token_here
```

### Development

```bash
# Run in development mode with auto-reload
npm run dev
```

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Testing

```bash
# Test the server
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "gap-agriculture-mcp-server",
#   "timestamp": "2025-10-10T...",
#   "version": "1.0.0"
# }
```

## Environment Variables

Create a `.env` file with the following:

```bash
# Required
GAP_API_TOKEN=your_gap_api_token_here

# Optional (with defaults)
GAP_API_BASE_URL=https://gap.tomorrownow.org/api/v1
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=*
LOG_LEVEL=info
```

## API Endpoints

### Health Check
```
GET /health
```

### MCP Endpoint
```
POST /mcp
```

This is the main endpoint for Model Context Protocol communication.

## Railway Deployment

### Method 1: Deploy from GitHub

1. **Push code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create gap-agriculture-mcp --public
   git remote add origin https://github.com/YOUR_USERNAME/gap-agriculture-mcp
   git push -u origin main
   ```

2. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect settings from `railway.json`

3. **Add Environment Variables** in Railway dashboard:
   ```
   GAP_API_TOKEN=d5df1c5d5472a70940bac900bc6b337064f728b19984f40803677f86dac09e3f
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-domain.com
   ```

4. **Get your Railway URL**:
   - Will be something like: `https://gap-agriculture-mcp.up.railway.app`
   - Test it: `https://gap-agriculture-mcp.up.railway.app/health`

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

## OpenAI Agent Builder Configuration

Once deployed to Railway, configure your OpenAI Agent:

1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to Agent Builder
3. Create new workflow
4. Add MCP server:
   ```
   MCP Server URL: https://your-railway-app.up.railway.app/mcp
   Transport: StreamableHTTP
   ```
5. Configure system instructions:
   ```
   You are an agricultural assistant specialized in weather-based
   farming advice. You help farmers make decisions about planting,
   irrigation, and crop management using real-time weather data.

   Always ask for the location (latitude/longitude) before making
   recommendations. Be specific and actionable in your advice.
   ```

## Example Tool Usage

### Weather Forecast

**Input:**
```json
{
  "latitude": -1.404244,
  "longitude": 35.008688,
  "days": 7
}
```

**Output:**
```
Weather Forecast for (-1.404244, 35.008688)
Period: 7 days

Date: 2025-10-10
  Max Temperature: 24.5°C
  Min Temperature: 14.2°C
  Precipitation: 5.3 mm
  ...
```

### Farming Advisory

**Input:**
```json
{
  "latitude": -1.404244,
  "longitude": 35.008688,
  "crop": "maize",
  "forecast_days": 14
}
```

**Output:**
```
🌾 Agricultural Advisory for (-1.404244, 35.008688)
Crop: MAIZE
Forecast Period: 14 days

📊 Weather Summary:
  Average Max Temperature: 25.3°C
  Total Expected Rainfall: 45.2 mm
  ...

💡 Recommendations:
  ✅ Temperature conditions are favorable for most crops
  ⚠️ Low rainfall expected. Action needed:
     - Plan for supplemental irrigation
     ...
```

### Planting Recommendation

**Input:**
```json
{
  "latitude": -1.404244,
  "longitude": 35.008688,
  "crop": "maize"
}
```

**Output:**
```
🌱 Planting Recommendation for MAIZE
Location: (-1.404244, 35.008688)

Current Conditions (Next 7 days):
  Temperature: 24.5°C
  Expected Rainfall: 32.1 mm
  ...

Assessment:
  ✅ Temperature is suitable
  ✅ Rainfall is adequate

📋 RECOMMENDATION: ✅ YES - Conditions are favorable for planting maize
```

## Architecture

```
┌─────────────────┐
│   OpenAI Agent  │
│     Builder     │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│   Express.js    │
│   MCP Server    │
└────────┬────────┘
         │ HTTP REST
         ▼
┌─────────────────┐
│   GAP API       │
│  (Tomorrow Now) │
└─────────────────┘
```

## Supported Crops

- Maize
- Wheat
- Rice
- Beans
- Vegetables (general)
- Tea
- Coffee

## Supported Regions

Optimized for:
- Kenya
- East Africa
- Any region with GAP API coverage

## Troubleshooting

### Server won't start

- Check if `GAP_API_TOKEN` is set in `.env`
- Verify Node.js version >= 18
- Check if port 3000 is available

### GAP API errors

- Verify your API token is valid
- Check if coordinates are within GAP coverage area
- Ensure date ranges are valid
- Check Railway logs for detailed error messages

### MCP connection issues

- Verify Railway URL is accessible
- Check CORS settings in environment variables
- Ensure OpenAI Agent Builder has correct URL
- Test health endpoint first

## Development

### Project Structure

```
gap-mcp-server/
├── src/
│   ├── index.ts          # Main server and MCP tools
│   └── gap-client.ts     # GAP API client
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── railway.json          # Railway deployment config
├── .env                  # Local environment (not in git)
└── README.md
```

### Adding New Tools

1. Register tool in `src/index.ts`:
   ```typescript
   server.registerTool(
     'your_tool_name',
     {
       title: 'Your Tool Title',
       description: 'What your tool does',
       inputSchema: z.object({
         // Define parameters
       })
     },
     async (params) => {
       // Implement logic
       return {
         content: [{
           type: 'text',
           text: 'Response'
         }]
       };
     }
   );
   ```

2. Test locally with `npm run dev`
3. Deploy to Railway

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Your repo URL]
- Email: [Your email]

## Credits

- Weather Data: [Tomorrow Now GAP](https://tomorrownow.org)
- MCP Protocol: [Anthropic](https://modelcontextprotocol.io)
