import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { GAPClient } from './gap-client.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id', 'Authorization', 'X-Farm-Latitude', 'X-Farm-Longitude']
}));

// Environment variables
const GAP_API_TOKEN = process.env.GAP_API_TOKEN || '';
const GAP_API_BASE_URL = process.env.GAP_API_BASE_URL || 'https://gap.tomorrownow.org/api/v1';
const PORT = process.env.PORT || 3000;

// Warn if token is missing
if (!GAP_API_TOKEN) {
  console.warn('⚠️  WARNING: GAP_API_TOKEN environment variable is not set!');
  console.warn('⚠️  Server will start but MCP tools will not work until token is configured.');
}

// Initialize GAP Client
const gapClient = GAP_API_TOKEN ? new GAPClient(GAP_API_TOKEN, GAP_API_BASE_URL) : null;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'gap-agriculture-mcp-server',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    gapApiConfigured: !!GAP_API_TOKEN
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GAP Agriculture MCP Server',
    version: '2.0.0',
    description: 'Weather intelligence powered by TomorrowNow GAP API with intelligent Agent analysis',
    endpoints: {
      health: '/health',
      mcp: '/mcp (POST)'
    },
    tools: [
      'get_gap_weather_forecast'
    ]
  });
});

// Main MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    // Extract default coordinates from custom headers
    const headerLat = req.headers['x-farm-latitude'] as string;
    const headerLon = req.headers['x-farm-longitude'] as string;
    const defaultLatitude = headerLat ? parseFloat(headerLat) : undefined;
    const defaultLongitude = headerLon ? parseFloat(headerLon) : undefined;

    if (defaultLatitude && defaultLongitude) {
      console.log(`[MCP] Using default coordinates from headers: lat=${defaultLatitude}, lon=${defaultLongitude}`);
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined // Stateless
    });

    const server = new McpServer({
      name: 'gap-weather-intelligence',
      version: '2.0.0',
      description: 'Satellite weather data for agriculture in Kenya and East Africa via TomorrowNow Global Access Platform (GAP)'
    });

    // Single Tool: Get Weather Forecast
    server.tool(
      'get_gap_weather_forecast',
      'Get satellite weather forecast (temperature, rainfall, humidity, wind) for agricultural planning in Kenya and East Africa. Data from TomorrowNow GAP Platform.',
      {
        latitude: z.number().min(-90).max(90).optional().describe('Latitude coordinate (e.g., -1.2864 for Nairobi). Optional if provided in headers.'),
        longitude: z.number().min(-180).max(180).optional().describe('Longitude coordinate (e.g., 36.8172 for Nairobi). Optional if provided in headers.'),
        days: z.number().min(1).max(14).default(7).optional().describe('Number of days to forecast (1-14, default: 7). Use 14 days for comprehensive analysis.')
      },
      async ({ latitude, longitude, days = 7 }) => {
        try {
          // Use header defaults if coordinates not provided, fallback to Nairobi
          const NAIROBI_LAT = -1.2864;
          const NAIROBI_LON = 36.8172;
          const lat = latitude ?? defaultLatitude ?? NAIROBI_LAT;
          const lon = longitude ?? defaultLongitude ?? NAIROBI_LON;

          console.log(`[MCP Tool] get_gap_weather_forecast called: lat=${lat}, lon=${lon}, days=${days}`);

          // Validate coordinates
          if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
            return {
              content: [{
                type: 'text',
                text: 'Invalid latitude coordinate. Please provide a valid latitude between -90 and 90.'
              }],
              isError: true
            };
          }
          if (typeof lon !== 'number' || isNaN(lon) || lon < -180 || lon > 180) {
            return {
              content: [{
                type: 'text',
                text: 'Invalid longitude coordinate. Please provide a valid longitude between -180 and 180.'
              }],
              isError: true
            };
          }
          if (typeof days !== 'number' || days < 1 || days > 14) {
            return {
              content: [{
                type: 'text',
                text: 'Invalid number of days. Please provide a value between 1 and 14.'
              }],
              isError: true
            };
          }

          if (!gapClient) {
            return {
              content: [{
                type: 'text',
                text: 'I\'m having trouble connecting to the weather data service. Try again in a moment?'
              }],
              isError: true
            };
          }

          const data = await gapClient.getForecast(lat, lon, days);

          if (data.count === 0) {
            return {
              content: [{
                type: 'text',
                text: `No weather data available for this location. Please check if the coordinates are correct.`
              }],
              isError: false
            };
          }

          // Format as clean JSON for Agent to analyze
          const forecast = data.results.map((day) => ({
            date: day.date,
            max_temp: Number(day.max_temperature).toFixed(1),
            min_temp: Number(day.min_temperature).toFixed(1),
            precipitation: Number(day.precipitation).toFixed(1),
            humidity: (Number(day.relative_humidity) * 100).toFixed(1),
            wind_speed: Number(day.wind_speed).toFixed(1)
          }));

          // Return structured data that Agent can analyze intelligently
          const response = {
            location: {
              latitude: lat,
              longitude: lon,
              region: 'Kenya/East Africa'
            },
            period: {
              days: days,
              start_date: forecast[0].date,
              end_date: forecast[forecast.length - 1].date
            },
            forecast: forecast,
            summary: {
              avg_max_temp: (forecast.reduce((sum, d) => sum + parseFloat(d.max_temp), 0) / forecast.length).toFixed(1),
              avg_min_temp: (forecast.reduce((sum, d) => sum + parseFloat(d.min_temp), 0) / forecast.length).toFixed(1),
              total_precipitation: forecast.reduce((sum, d) => sum + parseFloat(d.precipitation), 0).toFixed(1),
              avg_humidity: (forecast.reduce((sum, d) => sum + parseFloat(d.humidity), 0) / forecast.length).toFixed(1)
            },
            data_source: 'TomorrowNow GAP Platform (satellite-based)'
          };

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }]
          };
        } catch (error: any) {
          console.error('[MCP Tool] Error in get_gap_weather_forecast:', error);
          return {
            content: [{
              type: 'text',
              text: `I'm having trouble getting weather data right now. Try again in a moment?`
            }],
            isError: true
          };
        }
      }
    );

    // Connect and handle the request
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

  } catch (error) {
    console.error('[MCP] Error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal server error',
        data: error instanceof Error ? error.message : 'Unknown error'
      },
      id: null
    });
  }
});

// Start server
const HOST = '0.0.0.0';
const server = app.listen(Number(PORT), HOST, () => {
  console.log('');
  console.log('🚀 =========================================');
  console.log('   GAP Weather Intelligence MCP Server');
  console.log('   Version 2.0');
  console.log('=========================================');
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌾 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`🔑 GAP API Token: ${GAP_API_TOKEN ? '✅ Configured' : '⚠️  NOT CONFIGURED'}`);
  console.log(`🛠️  Tools: 1 (get_gap_weather_forecast - up to 14 days)`);
  console.log('=========================================');
  console.log('📝 Agent analyzes weather data for farming advice');
  console.log('=========================================');
  console.log('');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
