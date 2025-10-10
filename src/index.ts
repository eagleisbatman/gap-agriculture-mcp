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

// Warn if token is missing, but don't crash - this allows healthcheck to work
if (!GAP_API_TOKEN) {
  console.warn('⚠️  WARNING: GAP_API_TOKEN environment variable is not set!');
  console.warn('⚠️  Server will start but MCP tools will not work until token is configured.');
}

// Initialize GAP Client (will be null if no token)
const gapClient = GAP_API_TOKEN ? new GAPClient(GAP_API_TOKEN, GAP_API_BASE_URL) : null;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'gap-agriculture-mcp-server',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    gapApiConfigured: !!GAP_API_TOKEN
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GAP Agriculture MCP Server',
    version: '1.0.0',
    description: 'Agriculture weather intelligence powered by Tomorrow Now GAP API',
    endpoints: {
      health: '/health',
      mcp: '/mcp (POST)'
    },
    tools: [
      'get_weather_forecast',
      'get_farming_advisory',
      'get_planting_recommendation',
      'get_irrigation_advisory'
    ]
  });
});

// Main MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    // Extract default coordinates from custom headers (for testing convenience)
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
      name: 'gap-agriculture-mcp',
      version: '1.0.0',
      description: 'Agriculture weather intelligence for farmers using GAP API'
    });

    // Tool 1: Get Weather Forecast
    server.tool(
      'get_weather_forecast',
      'Get weather forecast for a specific location. Provide latitude and longitude coordinates, or they will be read from request headers if configured.',
      {
        latitude: z.number().min(-90).max(90).optional().describe('Latitude coordinate (e.g., -1.404244 for Kenya). Optional if provided in headers.'),
        longitude: z.number().min(-180).max(180).optional().describe('Longitude coordinate (e.g., 35.008688 for Kenya). Optional if provided in headers.'),
        days: z.number().min(1).max(14).default(7).optional().describe('Number of days to forecast (1-14, default: 7)')
      },
      async ({ latitude, longitude, days = 7 }) => {
        try {
          // Use header defaults if coordinates not provided
          const lat = latitude ?? defaultLatitude;
          const lon = longitude ?? defaultLongitude;

          if (lat === undefined || lon === undefined) {
            return {
              content: [{
                type: 'text',
                text: 'ERROR: Latitude and longitude are required. Please provide coordinates either as parameters or configure them in the MCP server headers (X-Farm-Latitude, X-Farm-Longitude).'
              }],
              isError: true
            };
          }

          console.log(`[MCP Tool] get_weather_forecast called: lat=${lat}, lon=${lon}, days=${days}`);

          if (!gapClient) {
            return {
              content: [{
                type: 'text',
                text: 'ERROR: GAP API token is not configured. Please set the GAP_API_TOKEN environment variable.'
              }],
              isError: true
            };
          }

          const data = await gapClient.getForecast(lat, lon, days);

          if (data.count === 0) {
            return {
              content: [{
                type: 'text',
                text: `No weather data available for coordinates (${lat}, ${lon}). Please check if the coordinates are correct.`
              }],
              isError: false
            };
          }

          // Format the response
          let response = `Weather Forecast for (${lat}, ${lon})\n`;
          response += `Period: ${days} days\n\n`;

          data.results.forEach((day) => {
            response += `Date: ${day.date}\n`;
            if ('max_temperature' in day) response += `  Max Temperature: ${Number(day.max_temperature).toFixed(1)}°C\n`;
            if ('min_temperature' in day) response += `  Min Temperature: ${Number(day.min_temperature).toFixed(1)}°C\n`;
            if ('precipitation' in day) response += `  Precipitation: ${Number(day.precipitation).toFixed(1)} mm\n`;
            if ('relative_humidity' in day) response += `  Humidity: ${(Number(day.relative_humidity) * 100).toFixed(1)}%\n`;
            if ('wind_speed' in day) response += `  Wind Speed: ${Number(day.wind_speed).toFixed(1)} m/s\n`;
            response += '\n';
          });

          return {
            content: [{
              type: 'text',
              text: response
            }]
          };
        } catch (error: any) {
          console.error('[MCP Tool] Error in get_weather_forecast:', error);
          return {
            content: [{
              type: 'text',
              text: `Error fetching weather forecast: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool 2: Get Farming Advisory
    server.tool(
      'get_farming_advisory',
      'Get agricultural advisory based on weather forecast. Includes planting recommendations and risk alerts.',
      {
        latitude: z.number().min(-90).max(90).optional().describe('Latitude coordinate. Optional if provided in headers.'),
        longitude: z.number().min(-180).max(180).optional().describe('Longitude coordinate. Optional if provided in headers.'),
        crop: z.enum([
          'maize', 'wheat', 'rice', 'beans', 'vegetables', 'tea', 'coffee',
          'sorghum', 'millet', 'cassava', 'sweet_potato', 'potato',
          'tomato', 'cabbage', 'kale', 'onion', 'banana', 'sugarcane',
          'cowpea', 'pigeon_pea', 'groundnut', 'sunflower', 'cotton'
        ]).optional().describe('Type of crop being grown (East African crops)'),
        forecast_days: z.number().min(7).max(14).default(14).optional().describe('Days to look ahead')
      },
      async ({ latitude, longitude, crop, forecast_days = 14 }) => {
        try {
          // Use header defaults if coordinates not provided
          const lat = latitude ?? defaultLatitude;
          const lon = longitude ?? defaultLongitude;

          if (lat === undefined || lon === undefined) {
            return {
              content: [{
                type: 'text',
                text: 'ERROR: Latitude and longitude are required. Please provide coordinates either as parameters or configure them in the MCP server headers (X-Farm-Latitude, X-Farm-Longitude).'
              }],
              isError: true
            };
          }

          console.log(`[MCP Tool] get_farming_advisory called: lat=${lat}, lon=${lon}, crop=${crop}`);

          if (!gapClient) {
            return {
              content: [{
                type: 'text',
                text: 'ERROR: GAP API token is not configured. Please set the GAP_API_TOKEN environment variable.'
              }],
              isError: true
            };
          }

          const data = await gapClient.getFarmingForecast(lat, lon, forecast_days);

          if (data.count === 0) {
            return {
              content: [{
                type: 'text',
                text: `No data available for this location.`
              }],
              isError: false
            };
          }

          // Analyze the forecast
          const results = data.results;
          const avgMaxTemp = results.reduce((sum, r) => sum + (Number(r.max_temperature) || 0), 0) / results.length;
          const avgMinTemp = results.reduce((sum, r) => sum + (Number(r.min_temperature) || 0), 0) / results.length;
          const totalPrecip = results.reduce((sum, r) => sum + (Number(r.precipitation) || 0), 0);
          const avgHumidity = results.reduce((sum, r) => sum + (Number(r.relative_humidity) || 0), 0) / results.length;

          let advisory = `🌾 Agricultural Advisory for (${lat}, ${lon})\n`;
          if (crop) advisory += `Crop: ${crop.toUpperCase()}\n`;
          advisory += `Forecast Period: ${forecast_days} days\n\n`;

          advisory += `📊 Weather Summary:\n`;
          advisory += `  Average Max Temperature: ${avgMaxTemp.toFixed(1)}°C\n`;
          advisory += `  Average Min Temperature: ${avgMinTemp.toFixed(1)}°C\n`;
          advisory += `  Total Expected Rainfall: ${totalPrecip.toFixed(1)} mm\n`;
          advisory += `  Average Humidity: ${(avgHumidity * 100).toFixed(1)}%\n\n`;

          // Generate recommendations
          advisory += `💡 Recommendations:\n`;

          // Temperature analysis
          if (avgMaxTemp > 35) {
            advisory += `  ⚠️ High temperatures expected. Consider:\n`;
            advisory += `     - Increase irrigation frequency\n`;
            advisory += `     - Apply mulch to retain soil moisture\n`;
            advisory += `     - Monitor for heat stress in crops\n`;
          } else if (avgMaxTemp < 15) {
            advisory += `  ⚠️ Cool temperatures expected. Consider:\n`;
            advisory += `     - Delay planting of warm-season crops\n`;
            advisory += `     - Protect sensitive plants from cold\n`;
          } else {
            advisory += `  ✅ Temperature conditions are favorable for most crops\n`;
          }

          // Rainfall analysis
          if (totalPrecip < 10) {
            advisory += `  ⚠️ Low rainfall expected. Action needed:\n`;
            advisory += `     - Plan for supplemental irrigation\n`;
            advisory += `     - Check soil moisture regularly\n`;
            advisory += `     - Consider drought-resistant varieties\n`;
          } else if (totalPrecip > 100) {
            advisory += `  ⚠️ Heavy rainfall expected. Take precautions:\n`;
            advisory += `     - Ensure good drainage in fields\n`;
            advisory += `     - Delay fertilizer application\n`;
            advisory += `     - Monitor for fungal diseases\n`;
          } else {
            advisory += `  ✅ Rainfall levels are adequate for normal farming activities\n`;
          }

          // Crop-specific advice
          if (crop) {
            advisory += `\n🌱 Specific advice for ${crop.replace('_', ' ')}:\n`;
            switch (crop) {
              case 'maize':
                advisory += `  - Optimal temp range: 18-27°C\n`;
                advisory += `  - Water needs: Moderate to high\n`;
                if (avgMaxTemp >= 18 && avgMaxTemp <= 27 && totalPrecip >= 30) {
                  advisory += `  ✅ Conditions favorable for maize growth\n`;
                }
                break;
              case 'wheat':
                advisory += `  - Optimal temp range: 15-24°C\n`;
                advisory += `  - Water needs: Moderate\n`;
                if (avgMaxTemp >= 15 && avgMaxTemp <= 24) {
                  advisory += `  ✅ Good conditions for wheat\n`;
                }
                break;
              case 'sorghum':
              case 'millet':
                advisory += `  - Heat-tolerant, ideal for drier conditions\n`;
                advisory += `  - Optimal temp range: 25-35°C\n`;
                if (avgMaxTemp >= 25 && totalPrecip < 50) {
                  advisory += `  ✅ Good conditions for ${crop}\n`;
                }
                break;
              case 'cassava':
                advisory += `  - Drought-tolerant once established\n`;
                advisory += `  - Needs moisture in first 3 months\n`;
                advisory += `  - Optimal temp: 25-29°C\n`;
                break;
              case 'sweet_potato':
              case 'potato':
                advisory += `  - Prefers cool to moderate temperatures\n`;
                advisory += `  - Monitor soil moisture carefully\n`;
                advisory += `  - Optimal temp: 18-24°C\n`;
                break;
              case 'tomato':
              case 'cabbage':
              case 'kale':
              case 'onion':
                advisory += `  - Regular moisture critical\n`;
                advisory += `  - Watch for fungal diseases in high humidity\n`;
                advisory += `  - Optimal temp: 18-25°C\n`;
                break;
              case 'banana':
                advisory += `  - High water needs year-round\n`;
                advisory += `  - Protect from strong winds\n`;
                advisory += `  - Optimal temp: 26-30°C\n`;
                break;
              case 'tea':
              case 'coffee':
                advisory += `  - Needs well-distributed rainfall\n`;
                advisory += `  - High humidity beneficial\n`;
                advisory += `  - Optimal temp: 18-25°C\n`;
                break;
              case 'cowpea':
              case 'pigeon_pea':
              case 'groundnut':
                advisory += `  - Nitrogen-fixing legume\n`;
                advisory += `  - Moderate water needs\n`;
                advisory += `  - Optimal temp: 25-30°C\n`;
                break;
              case 'vegetables':
                advisory += `  - Most vegetables prefer 18-30°C\n`;
                advisory += `  - Consistent moisture needed\n`;
                if (totalPrecip >= 20 && totalPrecip <= 60) {
                  advisory += `  ✅ Good conditions for vegetable cultivation\n`;
                }
                break;
              default:
                advisory += `  - Consult local extension for specific advice\n`;
                break;
            }
          }

          // Best days for activities
          advisory += `\n📅 Best Days for Farming Activities:\n`;
          const dryDays = results.filter(r => (Number(r.precipitation) || 0) < 2);
          if (dryDays.length > 0) {
            advisory += `  Good days for field work: ${dryDays.slice(0, 3).map(d => d.date).join(', ')}\n`;
          }

          return {
            content: [{
              type: 'text',
              text: advisory
            }]
          };
        } catch (error: any) {
          console.error('[MCP Tool] Error in get_farming_advisory:', error);
          return {
            content: [{
              type: 'text',
              text: `Error generating farming advisory: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool 3: Get Planting Recommendation
    server.tool(
      'get_planting_recommendation',
      'Get recommendation on whether current conditions are good for planting specific crops',
      {
        latitude: z.number().min(-90).max(90).optional().describe('Latitude coordinate. Optional if provided in headers.'),
        longitude: z.number().min(-180).max(180).optional().describe('Longitude coordinate. Optional if provided in headers.'),
        crop: z.enum([
          'maize', 'wheat', 'rice', 'beans', 'vegetables', 'tea', 'coffee',
          'sorghum', 'millet', 'cassava', 'sweet_potato', 'potato',
          'tomato', 'cabbage', 'kale', 'onion', 'banana', 'sugarcane',
          'cowpea', 'pigeon_pea', 'groundnut', 'sunflower', 'cotton'
        ]).describe('Crop to plant (East African crops)')
      },
      async ({ latitude, longitude, crop }) => {
        try {
          // Use header defaults if coordinates not provided
          const lat = latitude ?? defaultLatitude;
          const lon = longitude ?? defaultLongitude;

          if (lat === undefined || lon === undefined) {
            return {
              content: [{
                type: 'text',
                text: 'ERROR: Latitude and longitude are required. Please provide coordinates either as parameters or configure them in the MCP server headers (X-Farm-Latitude, X-Farm-Longitude).'
              }],
              isError: true
            };
          }

          console.log(`[MCP Tool] get_planting_recommendation called: lat=${lat}, lon=${lon}, crop=${crop}`);

          if (!gapClient) {
            return {
              content: [{
                type: 'text',
                text: 'ERROR: GAP API token is not configured. Please set the GAP_API_TOKEN environment variable.'
              }],
              isError: true
            };
          }

          // Get next 14 days forecast
          const data = await gapClient.getFarmingForecast(lat, lon, 14);

          if (data.count === 0) {
            return {
              content: [{
                type: 'text',
                text: `No data available for this location.`
              }],
              isError: false
            };
          }

          const results = data.results;
          const firstWeek = results.slice(0, 7);

          const avgTemp = firstWeek.reduce((sum, r) => sum + (Number(r.max_temperature) || 0), 0) / firstWeek.length;
          const totalRainfall = firstWeek.reduce((sum, r) => sum + (Number(r.precipitation) || 0), 0);
          const avgHumidity = firstWeek.reduce((sum, r) => sum + (Number(r.relative_humidity) || 0), 0) / firstWeek.length;

          let recommendation = `🌱 Planting Recommendation for ${crop.toUpperCase()}\n`;
          recommendation += `Location: (${lat}, ${lon})\n\n`;

          recommendation += `Current Conditions (Next 7 days):\n`;
          recommendation += `  Temperature: ${avgTemp.toFixed(1)}°C\n`;
          recommendation += `  Expected Rainfall: ${totalRainfall.toFixed(1)} mm\n`;
          recommendation += `  Humidity: ${(avgHumidity * 100).toFixed(1)}%\n\n`;

          // Crop-specific requirements
          let shouldPlant = false;
          let reasons: string[] = [];

          switch (crop) {
            case 'maize':
              recommendation += `Maize Requirements:\n`;
              recommendation += `  - Optimal temperature: 18-27°C\n`;
              recommendation += `  - Minimum rainfall: 50mm per week during germination\n`;
              recommendation += `  - Soil should be moist but not waterlogged\n\n`;

              if (avgTemp >= 18 && avgTemp <= 30) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature is not optimal');
                shouldPlant = false;
              }

              if (totalRainfall >= 30 && totalRainfall <= 100) {
                reasons.push('✅ Rainfall is adequate');
              } else if (totalRainfall < 30) {
                reasons.push('⚠️ Low rainfall - irrigation will be needed');
              } else {
                reasons.push('⚠️ Very high rainfall - ensure good drainage');
              }
              break;

            case 'wheat':
              recommendation += `Wheat Requirements:\n`;
              recommendation += `  - Optimal temperature: 15-24°C\n`;
              recommendation += `  - Moderate moisture needed\n`;
              recommendation += `  - Cool season crop\n\n`;

              if (avgTemp >= 15 && avgTemp <= 25) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not ideal for wheat');
                shouldPlant = false;
              }

              if (totalRainfall >= 20 && totalRainfall <= 60) {
                reasons.push('✅ Moisture levels are good');
              } else {
                reasons.push('⚠️ Rainfall may not be optimal');
              }
              break;

            case 'beans':
              recommendation += `Beans Requirements:\n`;
              recommendation += `  - Optimal temperature: 18-24°C\n`;
              recommendation += `  - Moderate water needs\n`;
              recommendation += `  - Sensitive to waterlogging\n\n`;

              if (avgTemp >= 16 && avgTemp <= 28) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not optimal');
                shouldPlant = false;
              }

              if (totalRainfall >= 20 && totalRainfall <= 70) {
                reasons.push('✅ Rainfall is appropriate');
              } else if (totalRainfall > 70) {
                reasons.push('⚠️ High rainfall - beans are sensitive to waterlogging');
                shouldPlant = false;
              }
              break;

            case 'vegetables':
              recommendation += `Vegetables (General) Requirements:\n`;
              recommendation += `  - Optimal temperature: 18-30°C (varies by type)\n`;
              recommendation += `  - Consistent moisture needed\n`;
              recommendation += `  - Regular watering important\n\n`;

              if (avgTemp >= 15 && avgTemp <= 32) {
                reasons.push('✅ Temperature suitable for most vegetables');
                shouldPlant = true;
              } else {
                reasons.push('⚠️ Temperature may be challenging for vegetables');
              }

              if (totalRainfall >= 15) {
                reasons.push('✅ Adequate moisture expected');
              }
              break;

            case 'rice':
              recommendation += `Rice Requirements:\n`;
              recommendation += `  - Optimal temperature: 20-35°C\n`;
              recommendation += `  - High water needs (flooded fields)\n`;
              recommendation += `  - Requires standing water\n\n`;

              if (avgTemp >= 20 && avgTemp <= 35) {
                reasons.push('✅ Temperature is good for rice');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not ideal');
                shouldPlant = false;
              }

              if (totalRainfall >= 50) {
                reasons.push('✅ High rainfall suitable for rice cultivation');
              } else {
                reasons.push('⚠️ Ensure adequate irrigation for rice paddies');
              }
              break;

            case 'tea':
            case 'coffee':
              recommendation += `${crop.toUpperCase()} Requirements:\n`;
              recommendation += `  - Temperature: 18-25°C\n`;
              recommendation += `  - Well-distributed rainfall\n`;
              recommendation += `  - High humidity beneficial\n\n`;

              if (avgTemp >= 18 && avgTemp <= 26) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('⚠️ Temperature not ideal for ' + crop);
              }

              if (avgHumidity >= 0.60) {
                reasons.push('✅ Good humidity levels');
              }
              break;

            case 'sorghum':
            case 'millet':
              recommendation += `${crop.toUpperCase()} Requirements:\n`;
              recommendation += `  - Optimal temperature: 25-35°C\n`;
              recommendation += `  - Drought-tolerant crop\n`;
              recommendation += `  - Low water requirements\n\n`;

              if (avgTemp >= 22 && avgTemp <= 35) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not optimal for ' + crop);
                shouldPlant = false;
              }

              if (totalRainfall >= 15) {
                reasons.push('✅ Sufficient moisture for germination');
              } else {
                reasons.push('⚠️ Consider irrigation for establishment');
              }
              break;

            case 'cassava':
              recommendation += `Cassava Requirements:\n`;
              recommendation += `  - Optimal temperature: 25-29°C\n`;
              recommendation += `  - Drought-tolerant once established\n`;
              recommendation += `  - Needs moisture for first 3 months\n\n`;

              if (avgTemp >= 20 && avgTemp <= 32) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not ideal');
                shouldPlant = false;
              }

              if (totalRainfall >= 40) {
                reasons.push('✅ Good rainfall for establishment');
              } else {
                reasons.push('⚠️ Ensure irrigation during establishment phase');
              }
              break;

            case 'sweet_potato':
            case 'potato':
              recommendation += `${crop.toUpperCase().replace('_', ' ')} Requirements:\n`;
              recommendation += `  - Optimal temperature: 18-24°C\n`;
              recommendation += `  - Moderate water needs\n`;
              recommendation += `  - Well-drained soil essential\n\n`;

              if (avgTemp >= 15 && avgTemp <= 27) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not optimal');
                shouldPlant = false;
              }

              if (totalRainfall >= 30 && totalRainfall <= 80) {
                reasons.push('✅ Rainfall is appropriate');
              } else if (totalRainfall > 80) {
                reasons.push('⚠️ High rainfall - ensure good drainage');
              }
              break;

            case 'tomato':
            case 'cabbage':
            case 'kale':
            case 'onion':
              recommendation += `${crop.toUpperCase()} Requirements:\n`;
              recommendation += `  - Optimal temperature: 18-25°C\n`;
              recommendation += `  - Regular moisture needed\n`;
              recommendation += `  - Avoid waterlogging\n\n`;

              if (avgTemp >= 15 && avgTemp <= 28) {
                reasons.push('✅ Temperature suitable for vegetables');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature may be challenging');
                shouldPlant = false;
              }

              if (totalRainfall >= 20 && totalRainfall <= 60) {
                reasons.push('✅ Good moisture levels');
              } else if (totalRainfall < 20) {
                reasons.push('⚠️ Plan for irrigation');
              }
              break;

            case 'banana':
              recommendation += `Banana Requirements:\n`;
              recommendation += `  - Optimal temperature: 26-30°C\n`;
              recommendation += `  - High water needs\n`;
              recommendation += `  - Continuous moisture preferred\n\n`;

              if (avgTemp >= 22 && avgTemp <= 32) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not ideal');
                shouldPlant = false;
              }

              if (totalRainfall >= 50) {
                reasons.push('✅ Good rainfall for bananas');
              } else {
                reasons.push('⚠️ Plan for regular irrigation');
              }
              break;

            case 'sugarcane':
              recommendation += `Sugarcane Requirements:\n`;
              recommendation += `  - Optimal temperature: 20-30°C\n`;
              recommendation += `  - High water needs\n`;
              recommendation += `  - Long growing season (12-18 months)\n\n`;

              if (avgTemp >= 20 && avgTemp <= 32) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not optimal');
                shouldPlant = false;
              }

              if (totalRainfall >= 40) {
                reasons.push('✅ Good rainfall for establishment');
              } else {
                reasons.push('⚠️ Ensure adequate irrigation');
              }
              break;

            case 'cowpea':
            case 'pigeon_pea':
            case 'groundnut':
              recommendation += `${crop.toUpperCase().replace('_', ' ')} Requirements:\n`;
              recommendation += `  - Optimal temperature: 25-30°C\n`;
              recommendation += `  - Moderate water needs\n`;
              recommendation += `  - Drought-tolerant legume\n\n`;

              if (avgTemp >= 20 && avgTemp <= 32) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not ideal');
                shouldPlant = false;
              }

              if (totalRainfall >= 25 && totalRainfall <= 70) {
                reasons.push('✅ Appropriate rainfall');
              } else if (totalRainfall > 70) {
                reasons.push('⚠️ High rainfall - monitor for waterlogging');
              }
              break;

            case 'sunflower':
              recommendation += `Sunflower Requirements:\n`;
              recommendation += `  - Optimal temperature: 20-25°C\n`;
              recommendation += `  - Moderate water needs\n`;
              recommendation += `  - Tolerates some drought\n\n`;

              if (avgTemp >= 18 && avgTemp <= 28) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not optimal');
                shouldPlant = false;
              }

              if (totalRainfall >= 20 && totalRainfall <= 60) {
                reasons.push('✅ Good rainfall conditions');
              }
              break;

            case 'cotton':
              recommendation += `Cotton Requirements:\n`;
              recommendation += `  - Optimal temperature: 21-27°C\n`;
              recommendation += `  - Moderate water during growth\n`;
              recommendation += `  - Dry conditions for harvest\n\n`;

              if (avgTemp >= 20 && avgTemp <= 30) {
                reasons.push('✅ Temperature is suitable');
                shouldPlant = true;
              } else {
                reasons.push('❌ Temperature not optimal');
                shouldPlant = false;
              }

              if (totalRainfall >= 25 && totalRainfall <= 70) {
                reasons.push('✅ Appropriate rainfall');
              }
              break;

            default:
              recommendation += `General Agricultural Assessment:\n`;
              recommendation += `  - Weather conditions analysis only\n`;
              recommendation += `  - Consult local agricultural extension for specific crop advice\n\n`;

              if (avgTemp >= 18 && avgTemp <= 30) {
                reasons.push('✅ Temperature is in general suitable range');
                shouldPlant = true;
              }

              if (totalRainfall >= 20) {
                reasons.push('✅ Some rainfall expected');
              }
              break;
          }

          recommendation += `Assessment:\n`;
          reasons.forEach(reason => {
            recommendation += `  ${reason}\n`;
          });

          recommendation += `\n📋 RECOMMENDATION: `;
          if (shouldPlant) {
            recommendation += `✅ YES - Conditions are favorable for planting ${crop}\n\n`;
            recommendation += `Next Steps:\n`;
            recommendation += `  1. Prepare soil and ensure good drainage\n`;
            recommendation += `  2. Check seed quality\n`;
            recommendation += `  3. Plan for irrigation if rainfall is insufficient\n`;
            recommendation += `  4. Monitor weather updates regularly\n`;
          } else {
            recommendation += `⏳ WAIT - Conditions are not optimal at this time\n\n`;
            recommendation += `Suggestions:\n`;
            recommendation += `  1. Wait for better weather conditions\n`;
            recommendation += `  2. Consider alternative crops suited to current conditions\n`;
            recommendation += `  3. Check forecast again in a few days\n`;
          }

          return {
            content: [{
              type: 'text',
              text: recommendation
            }]
          };
        } catch (error: any) {
          console.error('[MCP Tool] Error in get_planting_recommendation:', error);
          return {
            content: [{
              type: 'text',
              text: `Error generating planting recommendation: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool 4: Get Irrigation Advisory
    server.tool(
      'get_irrigation_advisory',
      'Get recommendations for irrigation scheduling based on weather forecast',
      {
        latitude: z.number().min(-90).max(90).optional().describe('Latitude coordinate. Optional if provided in headers.'),
        longitude: z.number().min(-180).max(180).optional().describe('Longitude coordinate. Optional if provided in headers.'),
        crop: z.enum([
          'maize', 'wheat', 'rice', 'beans', 'vegetables', 'tea', 'coffee',
          'sorghum', 'millet', 'cassava', 'sweet_potato', 'potato',
          'tomato', 'cabbage', 'kale', 'onion', 'banana', 'sugarcane',
          'cowpea', 'pigeon_pea', 'groundnut', 'sunflower', 'cotton'
        ]).optional().describe('Type of crop (East African crops)')
      },
      async ({ latitude, longitude, crop }) => {
        try {
          // Use header defaults if coordinates not provided
          const lat = latitude ?? defaultLatitude;
          const lon = longitude ?? defaultLongitude;

          if (lat === undefined || lon === undefined) {
            return {
              content: [{
                type: 'text',
                text: 'ERROR: Latitude and longitude are required. Please provide coordinates either as parameters or configure them in the MCP server headers (X-Farm-Latitude, X-Farm-Longitude).'
              }],
              isError: true
            };
          }

          console.log(`[MCP Tool] get_irrigation_advisory called: lat=${lat}, lon=${lon}, crop=${crop}`);

          if (!gapClient) {
            return {
              content: [{
                type: 'text',
                text: 'ERROR: GAP API token is not configured. Please set the GAP_API_TOKEN environment variable.'
              }],
              isError: true
            };
          }

          const data = await gapClient.getForecast(lat, lon, 7);

          if (data.count === 0) {
            return {
              content: [{
                type: 'text',
                text: `No data available for this location.`
              }],
              isError: false
            };
          }

          const results = data.results;
          const totalRainfall = results.reduce((sum, r) => sum + (Number(r.precipitation) || 0), 0);
          const avgTemp = results.reduce((sum, r) => sum + (Number(r.max_temperature) || 0), 0) / results.length;
          const avgHumidity = results.reduce((sum, r) => sum + (Number(r.relative_humidity) || 0), 0) / results.length;

          let advisory = `💧 Irrigation Advisory\n`;
          advisory += `Location: (${lat}, ${lon})\n`;
          if (crop) advisory += `Crop: ${crop.toUpperCase()}\n`;
          advisory += `\n`;

          advisory += `7-Day Forecast Summary:\n`;
          advisory += `  Expected Rainfall: ${totalRainfall.toFixed(1)} mm\n`;
          advisory += `  Average Temperature: ${avgTemp.toFixed(1)}°C\n`;
          advisory += `  Average Humidity: ${(avgHumidity * 100).toFixed(1)}%\n\n`;

          // Calculate evapotranspiration estimate (simplified)
          const estimatedET = avgTemp * 0.6; // Very simplified ET calculation
          const waterDeficit = estimatedET * 7 - totalRainfall;

          advisory += `Water Balance:\n`;
          advisory += `  Estimated Water Loss (ET): ${(estimatedET * 7).toFixed(1)} mm/week\n`;
          advisory += `  Expected Rainfall: ${totalRainfall.toFixed(1)} mm\n`;
          advisory += `  Water Deficit: ${waterDeficit > 0 ? waterDeficit.toFixed(1) : 0} mm\n\n`;

          // Irrigation recommendation
          advisory += `🔧 Irrigation Recommendation:\n`;
          if (waterDeficit <= 0) {
            advisory += `  ✅ NO IRRIGATION NEEDED - Rainfall is sufficient\n`;
            advisory += `  - Natural rainfall will meet crop water needs\n`;
            advisory += `  - Monitor soil moisture levels\n`;
            advisory += `  - Resume irrigation if dry spell occurs\n`;
          } else if (waterDeficit < 20) {
            advisory += `  ⚠️ LIGHT IRRIGATION RECOMMENDED\n`;
            advisory += `  - Supplement rainfall with light irrigation\n`;
            advisory += `  - Apply approximately ${waterDeficit.toFixed(0)} mm this week\n`;
            advisory += `  - 1-2 irrigation sessions should be sufficient\n`;
          } else if (waterDeficit < 40) {
            advisory += `  💧 MODERATE IRRIGATION NEEDED\n`;
            advisory += `  - Regular irrigation required\n`;
            advisory += `  - Apply approximately ${waterDeficit.toFixed(0)} mm this week\n`;
            advisory += `  - Schedule 2-3 irrigation sessions\n`;
          } else {
            advisory += `  🚰 HEAVY IRRIGATION REQUIRED\n`;
            advisory += `  - Significant water deficit expected\n`;
            advisory += `  - Apply approximately ${waterDeficit.toFixed(0)} mm this week\n`;
            advisory += `  - Schedule 3-4 irrigation sessions\n`;
            advisory += `  - Consider drip irrigation for efficiency\n`;
          }

          // Daily breakdown
          advisory += `\n📅 Day-by-Day Irrigation Guide:\n`;
          results.forEach((day) => {
            const precip = Number(day.precipitation) || 0;
            const maxTemp = Number(day.max_temperature) || 0;

            advisory += `  ${day.date}:\n`;
            advisory += `    Rain: ${precip.toFixed(1)} mm, Temp: ${maxTemp.toFixed(1)}°C\n`;

            if (precip >= 10) {
              advisory += `    ✅ Skip irrigation - sufficient rain expected\n`;
            } else if (precip >= 5) {
              advisory += `    ⚠️ Light irrigation if soil is dry\n`;
            } else if (maxTemp > 30) {
              advisory += `    💧 Irrigate - hot and dry conditions\n`;
            } else {
              advisory += `    💧 Irrigate if no recent rain\n`;
            }
          });

          // Additional tips
          advisory += `\n💡 Irrigation Tips:\n`;
          advisory += `  - Best time to irrigate: Early morning or evening\n`;
          advisory += `  - Avoid midday irrigation (high evaporation)\n`;
          advisory += `  - Check soil moisture before irrigating\n`;
          advisory += `  - Ensure even water distribution\n`;
          if (crop === 'rice') {
            advisory += `  - Maintain standing water for rice paddies\n`;
          } else {
            advisory += `  - Avoid waterlogging (except for rice)\n`;
          }

          return {
            content: [{
              type: 'text',
              text: advisory
            }]
          };
        } catch (error: any) {
          console.error('[MCP Tool] Error in get_irrigation_advisory:', error);
          return {
            content: [{
              type: 'text',
              text: `Error generating irrigation advisory: ${error.message}`
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
const HOST = '0.0.0.0'; // Listen on all network interfaces (required for Railway)
app.listen(Number(PORT), HOST, () => {
  console.log('');
  console.log('🚀 =========================================');
  console.log('   GAP Agriculture MCP Server');
  console.log('=========================================');
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌾 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`🔑 GAP API Token: ${GAP_API_TOKEN ? '✅ Configured' : '⚠️  NOT CONFIGURED - Add GAP_API_TOKEN environment variable'}`);
  console.log('=========================================');
  console.log('');
});
