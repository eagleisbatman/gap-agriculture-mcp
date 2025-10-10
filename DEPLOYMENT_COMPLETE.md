# 🚀 Complete Deployment & Integration Guide

## ✅ What's Ready

Your MCP server is **production-ready** and pushed to GitHub:
- **Repository**: https://github.com/eagleisbatman/gap-agriculture-mcp
- **Status**: All 4 agricultural tools tested and working
- **GAP API**: Integrated with ensemble forecast support
- **Test Coordinates**: 1.2921, 36.8219 (Kenya)

---

## Step 1: Deploy MCP Server to Railway (5 minutes)

### 1.1 Go to Railway Dashboard
Visit: https://railway.app/

### 1.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: `eagleisbatman/gap-agriculture-mcp`
4. Railway will auto-detect it's a Node.js project

### 1.3 Configure Environment Variable
1. In Railway project, go to **"Variables"** tab
2. Add this environment variable:
   ```
   GAP_API_TOKEN=d5df1c5d5472a70940bac900bc6b337064f728b19984f40803677f86dac09e3f
   ```
3. Click **"Add"** or **"Save"**

### 1.4 Deploy
1. Railway will automatically build and deploy
2. Wait 2-3 minutes for deployment
3. You'll get a URL like: `https://gap-agriculture-mcp-production.up.railway.app`

### 1.5 Test Deployment
Open in browser: `https://your-railway-url.up.railway.app/health`

You should see:
```json
{
  "status": "healthy",
  "service": "gap-agriculture-mcp-server",
  "timestamp": "2025-10-10T...",
  "version": "1.0.0"
}
```

**✅ MCP Server Deployed!**

---

## Step 2: Configure OpenAI Agent Builder (10 minutes)

### 2.1 Access OpenAI Agent Builder
Visit: https://platform.openai.com/playground/agents

Or from your OpenAI dashboard, navigate to the visual workflow builder you showed in the screenshot.

### 2.2 Create New Agent
1. Click **"Create New Agent"** or **"New Workflow"**
2. You'll see a visual canvas with nodes

### 2.3 Add Agent Node (Blue Node)
1. Drag an **"Agent"** node (blue) onto the canvas
2. Click on the node to configure it

### 2.4 Configure Agent Instructions
In the Agent configuration panel:

**Name**: `Kenya Agriculture Assistant`

**Instructions**:
```
You are an agricultural advisory assistant for farmers in Kenya and East Africa.

Your role:
- Provide weather forecasts for farming locations
- Give planting recommendations based on current conditions
- Advise on irrigation scheduling
- Offer comprehensive farming guidance

Available crops: maize, wheat, rice, beans, vegetables, tea, coffee

When a user asks about weather or farming advice:
1. If they don't provide coordinates, ask for their farm location (latitude, longitude)
2. Example working coordinates for Kenya: lat=1.2921, lon=36.8219
3. Use the appropriate tool to fetch data
4. Provide clear, actionable advice in simple language

Always be helpful, culturally sensitive, and focused on practical farming advice.
```

### 2.5 Add MCP Server as Tool
1. In the Agent configuration, look for **"Tools"** or **"Custom Actions"** section
2. Click **"Add Tool"** or **"Add MCP Server"**
3. Select **"Custom MCP Server"** or **"StreamableHTTP"**

**MCP Server Configuration**:
```
Name: gap-agriculture-mcp
Transport: StreamableHTTP
URL: https://your-railway-url.up.railway.app/mcp
Description: Agriculture weather intelligence using GAP API
```

4. Click **"Connect"** or **"Add"**

### 2.6 Verify Tools Are Loaded
OpenAI Agent Builder should detect and list your 4 tools:
- ✅ `get_weather_forecast`
- ✅ `get_farming_advisory`
- ✅ `get_planting_recommendation`
- ✅ `get_irrigation_advisory`

### 2.7 Test in Playground
1. Save your agent configuration
2. Go to the **Playground** or **Test** tab
3. Try these test prompts:

**Test 1: Weather Forecast**
```
What's the weather forecast for latitude 1.2921, longitude 36.8219?
```

Expected: Agent calls `get_weather_forecast` and returns temperature, humidity, wind speed

**Test 2: Planting Advice**
```
Should I plant maize at coordinates 1.2921, 36.8219?
```

Expected: Agent calls `get_planting_recommendation` and provides YES/NO with reasoning

**Test 3: Irrigation**
```
Do I need to irrigate my maize farm at lat 1.2921, lon 36.8219?
```

Expected: Agent calls `get_irrigation_advisory` and recommends irrigation schedule

**✅ Agent Configured and Working!**

---

## Step 3: Get Workflow/Agent ID
1. In OpenAI Agent Builder, find your agent's **ID** or **Workflow ID**
2. It looks like: `wf_abc123xyz` or `agent_abc123`
3. **Copy this ID** - you'll need it for ChatKit

---

## Step 4: Deploy ChatKit Widget (15 minutes)

### 4.1 Follow OpenAI ChatKit Documentation
Visit: https://github.com/openai/openai-chatkit-starter-app

### 4.2 Clone ChatKit Starter
```bash
git clone https://github.com/openai/openai-chatkit-starter-app.git
cd openai-chatkit-starter-app
npm install
```

### 4.3 Configure ChatKit
Edit the configuration file (usually `config.json` or similar):

```json
{
  "agentId": "YOUR_WORKFLOW_ID_FROM_STEP_3",
  "apiKey": "YOUR_OPENAI_API_KEY",
  "title": "Kenya Agriculture Assistant",
  "greeting": "👋 Hello! I'm your agriculture assistant. Ask me about weather, planting, or irrigation for your farm in Kenya.",
  "placeholder": "Ask about weather or farming advice..."
}
```

### 4.4 Customize Widget (Optional)
Update branding, colors, and styling in the ChatKit configuration:
- Logo: Add your organization's logo
- Colors: Match your website theme
- Position: Choose floating position (bottom-right, bottom-left, etc.)

### 4.5 Deploy Widget
Deploy to Vercel or Netlify:

**Vercel**:
```bash
vercel
```

**Netlify**:
```bash
netlify deploy --prod
```

### 4.6 Embed on Your Website
Add the ChatKit script to your webpage:

```html
<script src="https://your-chatkit-url.vercel.app/widget.js"></script>
<script>
  ChatKit.init({
    agentId: 'YOUR_WORKFLOW_ID',
    position: 'bottom-right'
  });
</script>
```

**✅ ChatKit Widget Live!**

---

## 🎯 How Users Will Interact

### User Flow:
1. **User** opens your website
2. **Clicks** on floating chat widget (bottom-right corner)
3. **Types**: "What's the weather for my farm?"
4. **Agent** asks: "Please provide your farm coordinates (latitude, longitude)"
5. **User** responds: "1.2921, 36.8219"
6. **Agent** calls MCP tool → GAP API → Returns weather data
7. **User** sees: Temperature, humidity, precipitation, wind speed

### Example Conversations:

**Conversation 1: Weather Check**
```
User: What's the weather like for farming at 1.2921, 36.8219?
Agent: [Calls get_weather_forecast]
Agent: The weather forecast for your location shows:
      - Temperature: 29.5°C with 50% humidity
      - Very light rainfall expected (0.1mm)
      - Good conditions for field work
```

**Conversation 2: Planting Decision**
```
User: Should I plant maize now? My farm is at lat 1.2921, lon 36.8219
Agent: [Calls get_planting_recommendation]
Agent: ✅ YES - Conditions are favorable for planting maize
      Temperature is suitable (29.6°C)
      ⚠️ Low rainfall expected - plan for irrigation

      Next steps:
      1. Prepare soil and ensure good drainage
      2. Check seed quality
      3. Plan irrigation schedule
```

**Conversation 3: Irrigation Advice**
```
User: How much should I irrigate my maize? Location: 1.2921, 36.8219
Agent: [Calls get_irrigation_advisory]
Agent: 🚰 HEAVY IRRIGATION REQUIRED
      Water deficit: 124mm this week
      Schedule 3-4 irrigation sessions
      Best time: Early morning or evening
```

---

## 🔧 Maintenance & Updates

### Update MCP Server Code
```bash
git add .
git commit -m "Update: description of changes"
git push
```

Railway will auto-deploy the update within 2-3 minutes.

### Monitor MCP Server
Railway Dashboard → Your Project → View Logs

Check for:
- Deployment status
- API errors
- Usage metrics

### Update Agent Instructions
1. Go to OpenAI Agent Builder
2. Edit your agent
3. Update instructions or add new tools
4. Save and test

---

## 📊 Testing Checklist

- [ ] Railway deployment successful
- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] OpenAI Agent Builder connected to MCP server
- [ ] All 4 tools appear in Agent Builder
- [ ] Test conversation returns real weather data
- [ ] Chat widget loads on webpage
- [ ] Widget connects to OpenAI agent
- [ ] End-to-end conversation works

---

## 🎉 You're Done!

Your complete agriculture intelligence system is now live:

**Architecture**:
```
User's Webpage
     ↓
ChatKit Widget (Vercel)
     ↓
OpenAI Agent Builder
     ↓
MCP Server (Railway)
     ↓
GAP API (Weather Data)
```

**What Users Can Do**:
- ✅ Get weather forecasts for any Kenya location
- ✅ Receive planting recommendations
- ✅ Get irrigation scheduling advice
- ✅ Comprehensive farming guidance

---

## 📞 Next Steps

1. Deploy to Railway (5 min)
2. Configure OpenAI Agent (10 min)
3. Test with real conversations
4. Deploy ChatKit widget
5. Launch to farmers!

Need help? Check:
- Railway Docs: https://docs.railway.app
- OpenAI Agent Builder: https://platform.openai.com/docs/agents
- ChatKit: https://github.com/openai/openai-chatkit-starter-app
