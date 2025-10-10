# 🎯 OpenAI Agent Builder Setup Guide

## Visual Workflow Configuration

Based on OpenAI's Agent Builder visual interface with nodes:
- **Start Node** - Entry point
- **Agent Node** - AI reasoning and decision making
- **MCP Node** - Connects to your MCP server
- **Transform Node** - Data processing (optional)
- **Condition Node** - Branching logic (optional)
- **Guardrails Node** - Safety checks (optional)
- **End Node** - Exit point

---

## 🏗️ Recommended Workflow Structure

### Simple Flow (Recommended for Testing):
```
START → AGENT → MCP → END
```

### Advanced Flow (Production):
```
START → GUARDRAILS → AGENT → MCP → TRANSFORM → END
```

---

## Step-by-Step Configuration

### 1️⃣ Start Node
- **Already added by default**
- No configuration needed

### 2️⃣ Add Agent Node

**Click on canvas** → **Select "Agent"** → **Configure**:

**Name**: `Agriculture Assistant`

**Prompt/Instructions**:
```
You are an agricultural advisory assistant for farmers in Kenya and East Africa.

ROLE:
- Help farmers make informed decisions about planting, irrigation, and crop management
- Provide weather-based agricultural guidance
- Support crops: maize, wheat, rice, beans, vegetables, tea, coffee

WORKFLOW:
When a user asks about weather or farming:

1. UNDERSTAND THE REQUEST
   - Identify what the user needs (weather, planting advice, irrigation, farming advisory)
   - Check if they provided location coordinates

2. GET COORDINATES
   If coordinates are missing, ask:
   "To provide accurate information, I need your farm location. Please provide:
   - Latitude (e.g., 1.2921)
   - Longitude (e.g., 36.8219)

   If you don't know your coordinates, you can find them using Google Maps."

3. DETERMINE ACTION
   Based on the request:
   - Weather forecast → Use get_weather_forecast
   - Planting decision → Use get_planting_recommendation
   - Irrigation advice → Use get_irrigation_advisory
   - General farming → Use get_farming_advisory

4. CALL MCP TOOL
   Pass the tool name and parameters to the MCP node

5. INTERPRET RESULTS
   Explain the data in simple, actionable language for farmers

EXAMPLE INTERACTIONS:

User: "What's the weather?"
You: "I'd be happy to help! To give you accurate weather information, please share your farm's coordinates (latitude and longitude)."

User: "Latitude 1.2921, longitude 36.8219"
You: [Call MCP with get_weather_forecast, lat=1.2921, lon=36.8219, days=7]
You: "Here's your 7-day weather forecast for your farm..."

User: "Should I plant maize now? My farm is at 1.2921, 36.8219"
You: [Call MCP with get_planting_recommendation, lat=1.2921, lon=36.8219, crop=maize]
You: "Based on current conditions at your location..."

TONE:
- Friendly and supportive
- Use simple language (avoid technical jargon)
- Focus on actionable advice
- Culturally sensitive to Kenyan farming practices
```

**Output Variables** (to pass to MCP node):
- `tool_name` - Which MCP tool to call
- `latitude` - Farm latitude
- `longitude` - Farm longitude
- `crop` - Crop type (optional)
- `days` - Forecast days (optional)

---

### 3️⃣ Add MCP Node

**Click on canvas** → **Select "MCP"** → **Connect from Agent** → **Configure**:

**MCP Server Configuration**:
```
Name: gap-agriculture-mcp
URL: https://your-railway-url.up.railway.app/mcp
Transport: StreamableHTTP
Description: GAP API agriculture intelligence
```

**Tool Selection**:
✅ Enable all 4 tools:
- `get_weather_forecast`
- `get_planting_recommendation`
- `get_irrigation_advisory`
- `get_farming_advisory`

**Input Mapping** (from Agent node):
Map agent output variables to MCP tool parameters:
```json
{
  "tool": "${agent.tool_name}",
  "parameters": {
    "latitude": "${agent.latitude}",
    "longitude": "${agent.longitude}",
    "crop": "${agent.crop}",
    "days": "${agent.days}"
  }
}
```

**Dynamic Tool Selection**:
The MCP node should call the tool specified in `${agent.tool_name}`:
- If `agent.tool_name = "get_weather_forecast"` → Call `get_weather_forecast(lat, lon, days)`
- If `agent.tool_name = "get_planting_recommendation"` → Call `get_planting_recommendation(lat, lon, crop)`
- etc.

---

### 4️⃣ Add Transform Node (Optional)

**Purpose**: Format MCP response for better presentation

**Click on canvas** → **Select "Transform"** → **Connect from MCP** → **Configure**:

**Transformation Script** (JavaScript/Python):
```javascript
// Input: MCP tool response
const mcpResponse = input.mcp_result;

// Format for display
let formatted = "";

if (input.tool_name === "get_weather_forecast") {
  formatted = `📊 Weather Forecast\n\n${mcpResponse}`;
} else if (input.tool_name === "get_planting_recommendation") {
  formatted = `🌱 Planting Advice\n\n${mcpResponse}`;
} else if (input.tool_name === "get_irrigation_advisory") {
  formatted = `💧 Irrigation Schedule\n\n${mcpResponse}`;
} else {
  formatted = `🌾 Farming Advisory\n\n${mcpResponse}`;
}

return { formatted_response: formatted };
```

---

### 5️⃣ Add Guardrails Node (Optional - Production)

**Purpose**: Ensure responses are safe and appropriate

**Click on canvas** → **Select "Guardrails"** → **Insert after Start** → **Configure**:

**Rules**:
```
1. Block requests for non-agricultural topics
2. Ensure coordinates are within Kenya/East Africa range:
   - Latitude: -5 to 5
   - Longitude: 28 to 42
3. Sanitize user inputs
4. Rate limiting: Max 10 requests per minute per user
```

---

### 6️⃣ Connect to End Node

**Connect** Transform node (or MCP node if no transform) → **End Node**

**End Node Configuration**:
- Return `formatted_response` or `mcp_result` to user

---

## 🎨 Visual Flow Example

### Simple Flow:
```
┌───────┐     ┌───────┐     ┌─────┐     ┌─────┐
│ START │────▶│ AGENT │────▶│ MCP │────▶│ END │
└───────┘     └───────┘     └─────┘     └─────┘

              "Determine     "Call GAP   "Return
               which tool"    API tool"   result"
```

### Advanced Flow:
```
┌───────┐     ┌────────────┐     ┌───────┐     ┌─────┐     ┌───────────┐     ┌─────┐
│ START │────▶│ GUARDRAILS │────▶│ AGENT │────▶│ MCP │────▶│ TRANSFORM │────▶│ END │
└───────┘     └────────────┘     └───────┘     └─────┘     └───────────┘     └─────┘

              "Validate       "Decide      "Fetch    "Format
               input"          action"      data"     output"
```

### With Conditions:
```
                                    ┌─────────────┐
                                    │ Has coords? │
                                    └──────┬──────┘
                                           │
                          ┌────────────────┴────────────────┐
                          │                                 │
                         YES                               NO
                          │                                 │
                          ▼                                 ▼
                      ┌─────┐                      ┌──────────────┐
                      │ MCP │                      │ Ask for      │
                      └─────┘                      │ coordinates  │
                                                   └──────────────┘
```

---

## 🧪 Testing Your Workflow

### Test 1: Weather Forecast
**Input**: "What's the weather for 1.2921, 36.8219?"

**Expected Flow**:
1. START → Receives user message
2. AGENT → Extracts lat=1.2921, lon=36.8219, tool=get_weather_forecast
3. MCP → Calls `get_weather_forecast(1.2921, 36.8219, 7)`
4. Returns: Temperature, humidity, precipitation data
5. END → Displays formatted weather report

### Test 2: Planting Recommendation
**Input**: "Should I plant maize at my farm? Coordinates: 1.2921, 36.8219"

**Expected Flow**:
1. START → Receives user message
2. AGENT → Extracts lat=1.2921, lon=36.8219, crop=maize, tool=get_planting_recommendation
3. MCP → Calls `get_planting_recommendation(1.2921, 36.8219, "maize")`
4. Returns: YES/NO with reasoning
5. END → Displays recommendation

### Test 3: Missing Coordinates
**Input**: "What's the weather?"

**Expected Flow**:
1. START → Receives user message
2. AGENT → Detects missing coordinates
3. AGENT → Responds: "Please provide your farm coordinates..."
4. User provides coordinates
5. Continue to MCP node

---

## 🔧 MCP Node Configuration Details

### Tool: `get_weather_forecast`
**Parameters**:
```json
{
  "latitude": number,
  "longitude": number,
  "days": number (1-14, default: 7)
}
```

**Returns**:
```
Weather Forecast for (lat, lon)
Period: X days

Date: 2025-10-10
  Max Temperature: 29.5°C
  Min Temperature: 17.6°C
  Precipitation: 0.1 mm
  Humidity: 50.2%
  Wind Speed: 5.7 m/s
...
```

### Tool: `get_planting_recommendation`
**Parameters**:
```json
{
  "latitude": number,
  "longitude": number,
  "crop": "maize" | "wheat" | "rice" | "beans" | "vegetables" | "tea" | "coffee"
}
```

**Returns**:
```
🌱 Planting Recommendation for MAIZE
Location: (lat, lon)

Current Conditions (Next 7 days):
  Temperature: 29.6°C
  Expected Rainfall: 0.5 mm
  Humidity: 50.0%

Assessment:
  ✅ Temperature is suitable
  ⚠️ Low rainfall - irrigation will be needed

📋 RECOMMENDATION: ✅ YES - Conditions are favorable
...
```

### Tool: `get_irrigation_advisory`
**Parameters**:
```json
{
  "latitude": number,
  "longitude": number,
  "crop": "maize" | "wheat" | "rice" | "beans" | "vegetables" | "tea" | "coffee" (optional)
}
```

**Returns**:
```
💧 Irrigation Advisory
Location: (lat, lon)

7-Day Forecast Summary:
  Expected Rainfall: 0.6 mm
  Average Temperature: 29.6°C
  Average Humidity: 50.0%

🔧 Irrigation Recommendation:
  🚰 HEAVY IRRIGATION REQUIRED
  - Apply approximately 124 mm this week
  - Schedule 3-4 irrigation sessions
...
```

### Tool: `get_farming_advisory`
**Parameters**:
```json
{
  "latitude": number,
  "longitude": number,
  "crop": "maize" | "wheat" | "rice" | "beans" | "vegetables" | "tea" | "coffee" (optional),
  "forecast_days": number (7-14, default: 14)
}
```

**Returns**:
```
🌾 Agricultural Advisory for (lat, lon)
Crop: MAIZE
Forecast Period: 7 days

📊 Weather Summary:
  Average Max Temperature: 29.6°C
  Total Expected Rainfall: 0.6 mm

💡 Recommendations:
  ✅ Temperature conditions are favorable
  ⚠️ Low rainfall expected - plan irrigation
...
```

---

## 💾 Saving Your Workflow

1. Click **"Save"** in Agent Builder
2. Give it a name: `Kenya Agriculture Assistant`
3. Copy the **Workflow ID** (looks like `wf_abc123xyz`)
4. You'll need this ID for ChatKit integration

---

## 🚀 Publishing Your Agent

1. **Test Mode**: Test in Agent Builder playground first
2. **Publish**: Click "Publish" or "Deploy"
3. **Get API Endpoint**: Copy the agent endpoint URL
4. **Use in ChatKit**: Configure ChatKit with your workflow ID

---

## 📋 Checklist

Before publishing:
- [ ] Start node connected
- [ ] Agent node configured with instructions
- [ ] MCP node connected to your Railway URL
- [ ] All 4 tools enabled in MCP node
- [ ] Test all conversation flows
- [ ] Guardrails configured (optional)
- [ ] Transform node working (optional)
- [ ] End node returns correct response
- [ ] Workflow saved with meaningful name

---

## 🎯 Next: ChatKit Integration

After your workflow is published, follow the ChatKit documentation to:
1. Install ChatKit on your website
2. Configure with your workflow ID
3. Customize appearance
4. Test end-to-end

The chat widget will send user messages to your Agent Builder workflow, which will use the MCP node to call your Railway-deployed MCP server!
