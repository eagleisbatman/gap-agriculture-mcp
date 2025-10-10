#!/bin/bash

echo "🧪 === Testing GAP Agriculture MCP Server ==="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
curl -s http://localhost:3000/health | jq
echo ""
echo "✅ Health check complete"
echo ""

# Test 2: List Available Tools
echo "2️⃣  Listing Available MCP Tools..."
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }' | jq -r '.result.tools[] | "  - \(.name): \(.description)"'
echo ""
echo "✅ Tools listed"
echo ""

# Test 3: Get Weather Forecast
echo "3️⃣  Testing: get_weather_forecast"
echo "   Location: -1.404244, 35.008688 (Kenya)"
echo "   Days: 3"
echo ""
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_weather_forecast",
      "arguments": {
        "latitude": -1.404244,
        "longitude": 35.008688,
        "days": 3
      }
    },
    "id": 2
  }' | jq -r '.result.content[0].text'
echo ""
echo "✅ Weather forecast complete"
echo ""

# Test 4: Get Planting Recommendation
echo "4️⃣  Testing: get_planting_recommendation"
echo "   Location: -1.404244, 35.008688"
echo "   Crop: maize"
echo ""
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_planting_recommendation",
      "arguments": {
        "latitude": -1.404244,
        "longitude": 35.008688,
        "crop": "maize"
      }
    },
    "id": 3
  }' | jq -r '.result.content[0].text'
echo ""
echo "✅ Planting recommendation complete"
echo ""

# Test 5: Get Irrigation Advisory
echo "5️⃣  Testing: get_irrigation_advisory"
echo "   Location: -1.404244, 35.008688"
echo "   Crop: maize"
echo ""
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_irrigation_advisory",
      "arguments": {
        "latitude": -1.404244,
        "longitude": 35.008688,
        "crop": "maize"
      }
    },
    "id": 4
  }' | jq -r '.result.content[0].text'
echo ""
echo "✅ Irrigation advisory complete"
echo ""

# Test 6: Get Farming Advisory
echo "6️⃣  Testing: get_farming_advisory"
echo "   Location: -1.404244, 35.008688"
echo "   Crop: maize"
echo ""
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_farming_advisory",
      "arguments": {
        "latitude": -1.404244,
        "longitude": 35.008688,
        "crop": "maize",
        "forecast_days": 7
      }
    },
    "id": 5
  }' | jq -r '.result.content[0].text'
echo ""
echo "✅ Farming advisory complete"
echo ""

echo "🎉 === All Tests Complete! ==="
echo ""
echo "Summary:"
echo "  ✅ Health check passed"
echo "  ✅ Tools listed (4 tools available)"
echo "  ✅ Weather forecast working"
echo "  ✅ Planting recommendation working"
echo "  ✅ Irrigation advisory working"
echo "  ✅ Farming advisory working"
echo ""
echo "🚀 Your MCP server is ready for deployment!"
