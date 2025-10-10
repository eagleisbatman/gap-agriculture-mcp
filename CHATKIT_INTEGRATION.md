# ChatKit JS Integration Guide

## Using OpenAI's ChatKit JS Library

**Repository**: https://github.com/openai/chatkit-js

This is OpenAI's official chat widget library. You don't need to build a custom chat UI - just use their pre-built components!

---

## Quick Setup

### Step 1: Install ChatKit JS in Your Website

Add to your HTML:

```html
<!-- In your <head> or before </body> -->
<script src="https://cdn.jsdelivr.net/npm/@openai/chatkit-js@latest/dist/chatkit.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@openai/chatkit-js@latest/dist/chatkit.min.css">
```

Or install via npm:

```bash
npm install @openai/chatkit-js
```

---

### Step 2: Initialize ChatKit on Your Page

**Simple Integration** (Floating Widget):

```html
<!DOCTYPE html>
<html>
<head>
    <title>Kenya Agriculture Assistant</title>
    <script src="https://cdn.jsdelivr.net/npm/@openai/chatkit-js@latest/dist/chatkit.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@openai/chatkit-js@latest/dist/chatkit.min.css">
</head>
<body>
    <h1>Welcome to Kenya Agriculture Portal</h1>
    <p>Ask our AI assistant about weather and farming advice!</p>

    <!-- ChatKit will automatically add a floating chat button -->
    <script>
        // Initialize ChatKit
        ChatKit.init({
            // Your OpenAI Agent/Workflow ID (from Agent Builder)
            agentId: 'YOUR_WORKFLOW_ID_HERE', // e.g., 'wf_abc123xyz'

            // Your OpenAI API Key
            apiKey: 'YOUR_OPENAI_API_KEY',

            // Chat widget configuration
            config: {
                title: '🌾 Kenya Agriculture Assistant',
                greeting: 'Hello! I can help you with weather forecasts, planting advice, and irrigation recommendations for your farm in Kenya.',
                placeholder: 'Ask about weather or farming...',
                position: 'bottom-right', // or 'bottom-left'
                primaryColor: '#10b981', // Green for agriculture

                // Suggest example questions
                suggestions: [
                    'What\'s the weather forecast for my location?',
                    'Should I plant maize now?',
                    'Do I need to irrigate my crops?',
                    'Give me farming advice for this week'
                ]
            }
        });
    </script>
</body>
</html>
```

---

## Step 3: Configure with Your Agent Workflow

After setting up your Agent Builder workflow:

1. **Get your Workflow ID**:
   - In OpenAI Agent Builder, copy your workflow/agent ID
   - It looks like: `wf_abc123xyz` or `agent_abc123`

2. **Get your OpenAI API Key**:
   - From OpenAI Platform: https://platform.openai.com/api-keys
   - Create a new key if needed

3. **Update the JavaScript**:
   ```javascript
   ChatKit.init({
       agentId: 'wf_YOUR_ACTUAL_WORKFLOW_ID',
       apiKey: 'sk-YOUR_ACTUAL_OPENAI_API_KEY',
       config: { /* ... */ }
   });
   ```

---

## Complete Working Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kenya Agriculture Assistant</title>

    <!-- ChatKit CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@openai/chatkit-js@latest/dist/chatkit.min.css">

    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(to bottom, #f0fdf4 0%, #ffffff 100%);
        }

        .hero {
            text-align: center;
            padding: 60px 20px;
        }

        .hero h1 {
            font-size: 3em;
            color: #047857;
            margin-bottom: 20px;
        }

        .hero p {
            font-size: 1.3em;
            color: #065f46;
            max-width: 600px;
            margin: 0 auto;
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin-top: 50px;
        }

        .feature {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .feature h3 {
            color: #047857;
            font-size: 1.5em;
            margin-bottom: 15px;
        }

        .feature p {
            color: #374151;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>🌾 Kenya Agriculture Portal</h1>
        <p>Get personalized farming advice powered by AI and real-time weather data</p>
    </div>

    <div class="features">
        <div class="feature">
            <h3>🌤️ Weather Forecasts</h3>
            <p>Get accurate 7-14 day weather forecasts for your specific farm location</p>
        </div>

        <div class="feature">
            <h3>🌱 Planting Advice</h3>
            <p>Know the best time to plant maize, wheat, beans, and other crops</p>
        </div>

        <div class="feature">
            <h3>💧 Irrigation Scheduling</h3>
            <p>Optimize water usage with intelligent irrigation recommendations</p>
        </div>

        <div class="feature">
            <h3>🌾 Farming Advisory</h3>
            <p>Get comprehensive guidance on crop management and best practices</p>
        </div>
    </div>

    <!-- ChatKit JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/@openai/chatkit-js@latest/dist/chatkit.min.js"></script>

    <script>
        // Initialize ChatKit with your configuration
        ChatKit.init({
            // Replace with your actual Workflow ID from OpenAI Agent Builder
            agentId: 'wf_YOUR_WORKFLOW_ID',

            // Replace with your OpenAI API Key
            apiKey: 'sk-YOUR_OPENAI_API_KEY',

            config: {
                // Chat widget appearance
                title: '🌾 Agriculture Assistant',
                greeting: 'Hello! 👋 I\'m your agriculture assistant. Ask me about:\n\n' +
                         '• Weather forecasts for your farm\n' +
                         '• Planting recommendations\n' +
                         '• Irrigation scheduling\n' +
                         '• General farming advice\n\n' +
                         'Please provide your farm coordinates (latitude, longitude) for accurate information.',

                placeholder: 'Ask about weather or farming...',

                // Widget position
                position: 'bottom-right',

                // Colors (green theme for agriculture)
                primaryColor: '#10b981',
                secondaryColor: '#059669',

                // Suggested prompts to help users get started
                suggestions: [
                    'What\'s the weather forecast for latitude 1.2921, longitude 36.8219?',
                    'Should I plant maize at my farm (1.2921, 36.8219)?',
                    'Do I need to irrigate? Location: 1.2921, 36.8219',
                    'Give me farming advice for coordinates 1.2921, 36.8219'
                ],

                // Widget dimensions
                width: '400px',
                height: '600px',

                // Auto-open the chat (optional)
                autoOpen: false,

                // Show/hide features
                showTimestamp: true,
                showAvatar: true,

                // Custom avatar (optional)
                avatarUrl: 'https://example.com/agriculture-bot-avatar.png'
            }
        });
    </script>
</body>
</html>
```

---

## How It Works

### User Flow:

1. **User visits your website**
2. **Sees floating chat button** (bottom-right corner)
3. **Clicks to open chat widget**
4. **Types**: "What's the weather for my farm at 1.2921, 36.8219?"
5. **ChatKit sends message** → **OpenAI Agent Builder**
6. **Agent Builder workflow** → **MCP node** → **Your Railway MCP server**
7. **MCP server** → **GAP API** → **Returns weather data**
8. **Response flows back** to user in chat widget

### Architecture:

```
Your Website (ChatKit widget)
        ↓
OpenAI API (via ChatKit)
        ↓
Agent Builder Workflow
        ↓
MCP Node
        ↓
Your MCP Server (Railway)
        ↓
GAP API
```

---

## Advanced Configuration

### Custom Styling

```javascript
ChatKit.init({
    agentId: 'wf_YOUR_WORKFLOW_ID',
    apiKey: 'sk-YOUR_OPENAI_API_KEY',
    config: {
        // ... other config ...

        // Custom CSS
        customStyles: `
            .chatkit-message-user {
                background-color: #10b981;
            }
            .chatkit-message-bot {
                background-color: #f3f4f6;
            }
            .chatkit-header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
        `
    }
});
```

### Event Handlers

```javascript
ChatKit.on('message:sent', (message) => {
    console.log('User sent:', message);

    // Track analytics
    analytics.track('chat_message_sent', {
        message: message.text,
        timestamp: new Date()
    });
});

ChatKit.on('message:received', (response) => {
    console.log('Bot responded:', response);
});

ChatKit.on('chat:opened', () => {
    console.log('Chat widget opened');
});

ChatKit.on('chat:closed', () => {
    console.log('Chat widget closed');
});
```

---

## Deployment

### Option 1: Static Hosting (Simple)
Just upload your HTML file to:
- **Netlify**: Drag and drop
- **Vercel**: `vercel --prod`
- **GitHub Pages**: Push to gh-pages branch
- **AWS S3 + CloudFront**: Static website hosting

### Option 2: Integrate into Existing Website
Add the ChatKit script to your existing website:

**WordPress**:
```php
// Add to footer.php or use a plugin
<script>
ChatKit.init({ /* config */ });
</script>
```

**React**:
```jsx
import { useEffect } from 'react';

function App() {
    useEffect(() => {
        // Load ChatKit script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@openai/chatkit-js@latest/dist/chatkit.min.js';
        script.onload = () => {
            window.ChatKit.init({ /* config */ });
        };
        document.body.appendChild(script);
    }, []);

    return <div>Your app content</div>;
}
```

---

## Testing

### Test Locally:
```bash
# Simple HTTP server
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

### Test Conversations:
1. "What's the weather for 1.2921, 36.8219?" → Should get weather data
2. "Should I plant maize at 1.2921, 36.8219?" → Should get planting advice
3. "Irrigation advice for 1.2921, 36.8219" → Should get irrigation schedule

---

## Security Best Practices

### 1. Protect Your API Key
**❌ Don't hardcode in frontend** (everyone can see it!)

**✅ Use environment variables** + **backend proxy**:

```javascript
// Instead of exposing API key, proxy through your backend
ChatKit.init({
    agentId: 'wf_YOUR_WORKFLOW_ID',
    apiEndpoint: 'https://your-backend.com/api/chat', // Your proxy
    config: { /* ... */ }
});
```

### 2. Rate Limiting
Implement on your backend to prevent abuse

### 3. User Authentication (Optional)
Require login to use chat assistant

---

## Troubleshooting

### Widget Not Appearing?
1. Check browser console for errors
2. Verify ChatKit script loaded: `console.log(window.ChatKit)`
3. Check API key is valid
4. Verify workflow ID is correct

### Chat Not Responding?
1. Test your Agent Builder workflow in playground first
2. Verify MCP server is running on Railway
3. Check Railway logs for errors
4. Test MCP server health: `https://your-railway-url.up.railway.app/health`

### Wrong Data Returned?
1. Test MCP tools directly with `test-quick.ts`
2. Verify coordinates are being extracted correctly by agent
3. Check Agent Builder logs for tool calls

---

## Summary

**What You Need**:
1. ✅ MCP Server deployed on Railway (you have this ready)
2. ✅ Agent Builder workflow configured (to do)
3. ✅ ChatKit integrated on your website (this guide)

**Steps**:
1. Deploy MCP server to Railway
2. Configure Agent Builder with MCP node
3. Get workflow ID
4. Add ChatKit to your website with workflow ID
5. Test and launch!

The ChatKit library handles all the UI - you just need to provide the workflow ID and styling! 🎉
