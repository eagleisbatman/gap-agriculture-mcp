#!/bin/bash

# Test script to verify custom header support for latitude and longitude

echo "Testing MCP Server with Custom Headers"
echo "======================================="
echo ""

# Test coordinates for Kenya (Nairobi area)
LAT="1.2921"
LON="36.8219"

echo "Test 1: Calling tools/list to see available tools"
echo "---------------------------------------------------"
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-Farm-Latitude: $LAT" \
  -H "X-Farm-Longitude: $LON" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }' | python3 -m json.tool

echo ""
echo ""
echo "Test 2: Calling get_weather_forecast WITHOUT coordinates (should use headers)"
echo "------------------------------------------------------------------------------"
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-Farm-Latitude: $LAT" \
  -H "X-Farm-Longitude: $LON" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_weather_forecast",
      "arguments": {
        "days": 3
      }
    },
    "id": 2
  }' | python3 -m json.tool

echo ""
echo ""
echo "Test 3: Calling get_planting_recommendation WITHOUT coordinates (should use headers)"
echo "-------------------------------------------------------------------------------------"
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-Farm-Latitude: $LAT" \
  -H "X-Farm-Longitude: $LON" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_planting_recommendation",
      "arguments": {
        "crop": "maize"
      }
    },
    "id": 3
  }' | python3 -m json.tool

echo ""
echo "Done!"
