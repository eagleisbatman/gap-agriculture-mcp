# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: GAP Agriculture MCP Server

**Express.js server implementing Model Context Protocol (MCP) to provide agricultural intelligence tools powered by TomorrowNow's Global Access Platform (GAP) weather data.**

## Architecture

This is a **data transformation layer** that:
1. Receives tool requests via MCP StreamableHTTP protocol
2. Fetches raw weather data from GAP API
3. Analyzes weather data using hardcoded agricultural logic
4. Returns farmer-friendly recommendations

**Critical: GAP provides ONLY weather data. All agricultural analysis (planting decisions, irrigation scheduling, crop advice) happens in this server's code.**

## Key Files

### src/index.ts (1000+ lines)
Main server file containing:
- Express.js setup with CORS
- MCP server initialization
- **4 agricultural tools** (see below)
- All crop-specific agricultural logic

### src/gap-client.ts
Wrapper for GAP API:
- `getForecast(lat, lon, days)` - Fetches weather forecast
- `getFarmingForecast(lat, lon, days)` - Same as getForecast but named for clarity
- Handles API authentication, date calculations, data aggregation

## Development Commands

```bash
# Install dependencies
npm install

# Development (with auto-reload)
npm run dev

# Build TypeScript
npm run build

# Production
npm start

# Test health endpoint
curl http://localhost:3000/health

# Test MCP endpoint (requires MCP client)
# Use OpenAI Agent Builder or MCP Inspector
```

## The 4 Agricultural Tools

All defined in `src/index.ts` as `server.tool()` calls:

### 1. get_weather_forecast
**Lines: ~87-167**
- **Purpose**: Fetch and format weather forecast
- **Input**: latitude, longitude (optional if in headers), days (1-14)
- **Process**: Calls GAP API, formats response
- **Output**: Weather data (temp, rain, humidity, wind) without coordinates
- **Key**: This is the ONLY tool that just returns raw weather data

### 2. get_farming_advisory
**Lines: ~170-374**
- **Purpose**: Comprehensive agricultural guidance
- **Input**: latitude, longitude (optional), crop (optional), forecast_days (7-14)
- **Process**:
  - Fetches 14-day GAP forecast
  - Calculates averages (temp, rainfall, humidity)
  - Generates recommendations based on thresholds
  - Provides crop-specific advice (switch statement, lines ~275-348)
- **Output**: Advisory with weather summary, recommendations, best farming days
- **Crop logic**: Hardcoded temp ranges, water needs for all 22 crops

### 3. get_planting_recommendation
**Lines: ~377-821**
- **Purpose**: YES/NO planting decision for specific crop
- **Input**: latitude, longitude (optional), crop (required)
- **Process**:
  - Fetches 14-day GAP forecast
  - Analyzes first 7 days for planting window
  - **Massive switch statement (lines ~450-781)** with logic for each crop:
    - Checks temp against optimal range
    - Checks rainfall against requirements
    - Evaluates special conditions
  - Generates reasons for decision
- **Output**: YES/NO with reasoning, next steps
- **Important**: Each crop has unique logic - when adding crops, follow existing pattern

### 4. get_irrigation_advisory
**Lines: ~824-974**
- **Purpose**: 7-day irrigation schedule
- **Input**: latitude, longitude (optional), crop (optional)
- **Process**:
  - Fetches 7-day GAP forecast
  - **Calculates water deficit** using ET formula: `ET = avgTemp * 0.6 * 7 days`
  - Compares deficit to rainfall
  - Provides day-by-day guidance
- **Output**: Irrigation schedule with water balance, daily recommendations
- **Formula**: This uses a basic evapotranspiration calculation for practical farming guidance

## Tool Implementation Pattern

Every tool follows this structure:

```typescript
server.tool(
  'tool_name',
  'Farmer-friendly description mentioning TomorrowNow GAP',
  {
    latitude: z.number().optional().describe('...Optional if in headers'),
    longitude: z.number().optional().describe('...Optional if in headers'),
    // ... other params
  },
  async ({ latitude, longitude, ... }) => {
    try {
      // 1. Get coordinates (params or headers)
      const lat = latitude ?? defaultLatitude;
      const lon = longitude ?? defaultLongitude;

      // 2. Validate coordinates
      if (lat === undefined || lon === undefined) {
        return { content: [{ type: 'text', text: 'Farmer-friendly error' }], isError: true };
      }

      // 3. Check GAP client configured
      if (!gapClient) {
        return { content: [{ type: 'text', text: 'Connection error to TomorrowNow GAP Platform' }], isError: true };
      }

      // 4. Fetch weather from GAP
      const data = await gapClient.getForecast(lat, lon, days);

      // 5. AGRICULTURAL LOGIC HERE (analysis, calculations, recommendations)
      // ... crop-specific switch statements
      // ... threshold checks
      // ... advice generation

      // 6. Format response (NO COORDINATES, farmer-friendly)
      let response = `🌾 Title\n`;
      response += `Based on weather forecast from TomorrowNow GAP Platform\n\n`;
      // ... build response string

      // 7. Return
      return { content: [{ type: 'text', text: response }] };

    } catch (error) {
      return { content: [{ type: 'text', text: 'Farmer-friendly error message' }], isError: true };
    }
  }
);
```

## Supported Crops (22)

Defined in 4 places as z.enum():
- Line ~176 (get_farming_advisory)
- Line ~383 (get_planting_recommendation)
- Line ~830 (get_irrigation_advisory)

**Cereals:** maize, wheat, rice, sorghum, millet
**Legumes:** beans, cowpea, pigeon_pea, groundnut
**Roots:** cassava, sweet_potato, potato
**Vegetables:** tomato, cabbage, kale, onion, vegetables
**Cash Crops:** tea, coffee, sugarcane, banana, sunflower, cotton

### Adding a New Crop

1. Add to all 4 enum definitions
2. Add case in `get_farming_advisory` switch (line ~275)
3. Add case in `get_planting_recommendation` switch (line ~450)
4. Define optimal temp range, water requirements, special conditions
5. Follow existing pattern for consistency

## Farmer-Friendly Response Rules

**❌ NEVER include:**
- Coordinates like `(${lat}, ${lon})`
- "MCP server", "MCP tool", "API"
- Technical error messages
- Function names, parameter names

**✅ ALWAYS include:**
- Attribution: "Based on weather forecast from TomorrowNow GAP Platform"
- Clear, simple language
- Actionable advice
- Emojis for visual clarity (🌾, 💧, ✅, ❌, ⚠️)

**Examples:**

```typescript
// ✅ Good
let response = `🌤️ Weather Forecast\n`;
response += `Based on data from TomorrowNow GAP Platform\n`;
response += `Period: ${days} days\n\n`;

// ❌ Bad
let response = `Weather Forecast for (${lat}, ${lon})\n`;
response += `Period: ${days} days\n\n`;
```

```typescript
// ✅ Good error
text: 'I need to know your farm location to provide weather information. Please let me know where your farm is located.'

// ❌ Bad error
text: 'ERROR: Latitude and longitude are required parameters'
```

## Environment Variables

Required:
```bash
GAP_API_TOKEN=<token>  # From TomorrowNow GAP Platform
```

Optional:
```bash
PORT=3000              # Default: 3000
NODE_ENV=production
ALLOWED_ORIGINS=*      # CORS config
GAP_API_BASE_URL=https://gap.tomorrownow.org/api/v1
```

## GAP API Details

**Base URL:** `https://gap.tomorrownow.org/api/v1`

**Endpoint:** `/measurement/`

**Required Parameters:**
- `lat`: Latitude
- `lon`: Longitude
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD
- `product`: `salient_seasonal_forecast`
- `attributes`: Comma-separated (max_temperature, min_temperature, precipitation, relative_humidity, wind_speed)
- `output_type`: `json`

**Response Format:**
- Ensemble forecast: 50 values per attribute per date
- Each attribute returns array of 50 predictions
- Server aggregates by taking mean of 50 values
- See `gap-client.ts` for aggregation logic

## Custom Headers for Coordinates

The MCP endpoint accepts custom headers for default coordinates:
- `X-Farm-Latitude`: Default latitude if not in tool params
- `X-Farm-Longitude`: Default longitude if not in tool params

Set by ChatKit session server when creating sessions.

## Deployment (Railway)

**Config file:** `railway.json`

Railway automatically:
1. Detects Node.js project
2. Runs `npm install`
3. Runs `npm run build`
4. Runs `npm start`

**Required environment variable in Railway:**
- `GAP_API_TOKEN`

**Health check:**
```
GET /health
```

**MCP endpoint:**
```
POST /mcp
```

## Testing Locally

```bash
# Start server
npm run dev

# Test health
curl http://localhost:3000/health
# Expected: {"status":"healthy","service":"gap-agriculture-mcp-server",...}

# Test root
curl http://localhost:3000/
# Expected: Server info with list of 4 tools

# Test MCP endpoint (requires MCP client like Agent Builder)
# Cannot test with curl - requires MCP protocol
```

## Code Quality Guidelines

### When Modifying Agricultural Logic
- Keep temp ranges realistic for East African climate
- Rainfall thresholds should match local conditions
- Test with Nairobi coordinates: -1.2864, 36.8172
- Verify response hides coordinates

### When Adding Features
- Follow existing tool pattern
- Add descriptive logging: `console.log('[MCP Tool] tool_name called: ...')`
- Return farmer-friendly errors
- Update tool descriptions to mention TomorrowNow GAP

### TypeScript Patterns
- Use z.enum() for crop types (keeps them consistent)
- Use optional parameters with `??` fallback for coordinates
- Type API responses (see gap-client.ts)
- Handle errors gracefully with farmer-friendly messages

## Common Issues

**"GAP_API_TOKEN is not set"**
- Set in .env file locally
- Set in Railway dashboard for production
- Server starts anyway (for health check) but tools won't work

**"No weather data available"**
- Check coordinates are valid
- Check GAP API is responding
- Test GAP API directly with curl
- Check date range is valid

**Responses showing coordinates**
- Search for `(${lat}, ${lon})` in code
- Replace with farmer-friendly headers
- Add "Based on weather forecast from TomorrowNow GAP Platform"

## Related Files

- **../gap-chat-widget/SYSTEM_PROMPT.md**: Agent Builder system prompt (must instruct LLM to hide technical details)
- **../gap-chat-widget/server.js**: Session server that passes X-Farm-Latitude/X-Farm-Longitude headers
- **../DEPLOYMENT_GUIDE.md**: Full deployment instructions
- **../GAP_API_DOCUMENTATION.md**: GAP API reference

## GitHub Repository

https://github.com/eagleisbatman/gap-agriculture-mcp

Changes pushed to `main` branch trigger automatic Railway deployment.
