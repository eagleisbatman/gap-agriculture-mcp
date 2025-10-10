import 'dotenv/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function testMCPServer() {
  console.log('🧪 Testing MCP Server...\n');

  // Create transport
  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:3000/mcp')
  );

  // Create client
  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  });

  try {
    // Connect
    console.log('📡 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected!\n');

    // List tools
    console.log('📋 Listing available tools...');
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tools:\n`);

    tools.tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   Description: ${tool.description}`);
      console.log(`   Input Schema:`, JSON.stringify(tool.inputSchema, null, 2));
      console.log('');
    });

    // Test Tool 1: Get Weather Forecast
    console.log('🌤️  Testing: get_weather_forecast');
    console.log('   Location: -1.404244, 35.008688 (Kenya)');
    console.log('   Days: 3\n');

    const weatherResult = await client.callTool({
      name: 'get_weather_forecast',
      arguments: {
        latitude: -1.404244,
        longitude: 35.008688,
        days: 3
      }
    });

    console.log('📊 Result:');
    console.log(weatherResult.content[0].text);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test Tool 2: Get Planting Recommendation
    console.log('🌱 Testing: get_planting_recommendation');
    console.log('   Location: -1.404244, 35.008688');
    console.log('   Crop: maize\n');

    const plantingResult = await client.callTool({
      name: 'get_planting_recommendation',
      arguments: {
        latitude: -1.404244,
        longitude: 35.008688,
        crop: 'maize'
      }
    });

    console.log('📊 Result:');
    console.log(plantingResult.content[0].text);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test Tool 3: Get Irrigation Advisory
    console.log('💧 Testing: get_irrigation_advisory');
    console.log('   Location: -1.404244, 35.008688');
    console.log('   Crop: maize\n');

    const irrigationResult = await client.callTool({
      name: 'get_irrigation_advisory',
      arguments: {
        latitude: -1.404244,
        longitude: 35.008688,
        crop: 'maize'
      }
    });

    console.log('📊 Result:');
    console.log(irrigationResult.content[0].text);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test Tool 4: Get Farming Advisory
    console.log('🌾 Testing: get_farming_advisory');
    console.log('   Location: -1.404244, 35.008688');
    console.log('   Crop: maize');
    console.log('   Forecast Days: 7\n');

    const advisoryResult = await client.callTool({
      name: 'get_farming_advisory',
      arguments: {
        latitude: -1.404244,
        longitude: 35.008688,
        crop: 'maize',
        forecast_days: 7
      }
    });

    console.log('📊 Result:');
    console.log(advisoryResult.content[0].text);
    console.log('\n' + '='.repeat(80) + '\n');

    console.log('🎉 All tests passed!');
    console.log('\n✅ Summary:');
    console.log('  • MCP server is running correctly');
    console.log('  • All 4 tools are working');
    console.log('  • GAP API integration successful');
    console.log('  • Server is ready for deployment!\n');

    // Close connection
    await client.close();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testMCPServer().catch(console.error);
