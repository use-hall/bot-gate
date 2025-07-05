# Bot Gate

React/Vue/Svelte components for conditionally rendering content based on bot detection with IP validation. Server-side rendering only.

## Features

- 🤖 **Accurate bot detection**: Combines user agent parsing with mandatory IP validation
- 🔒 **Always validated**: All bots must pass IP validation against official ranges
- ⚡ **Framework agnostic**: Works with React, Vue, and Svelte
- 🚀 **SSR only**: Designed for server-side rendering environments
- 📦 **Zero runtime dependencies**: No external API calls
- 🔄 **Auto-updates**: Daily automated IP range updates from official sources

## Installation

```bash
npm install bot-gate
```

## Quick start

### React (Next.js)

```javascript
import { BotGate } from "bot-gate/react";

export async function getServerSideProps({ req }) {
  return {
    props: {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip || req.connection.remoteAddress,
    },
  };
}

function ProductPage({ userAgent, ipAddress }) {
  return (
    <div>
      <BotGate
        userAgent={userAgent}
        ipAddress={ipAddress}
        display="show"
        role="bot"
      >
        <FullProductDescription />
        <StructuredData />
      </BotGate>

      <BotGate
        userAgent={userAgent}
        ipAddress={ipAddress}
        display="show"
        role="user"
      >
        <InteractiveGallery />
        <AddToCartButton />
      </BotGate>
    </div>
  );
}
```

### Vue (Nuxt.js)

```vue
<template>
  <div>
    <BotGate
      :user-agent="userAgent"
      :ip-address="ipAddress"
      display="show"
      role="bot"
    >
      <FullProductDescription />
      <StructuredData />
    </BotGate>

    <BotGate
      :user-agent="userAgent"
      :ip-address="ipAddress"
      display="show"
      role="user"
    >
      <InteractiveGallery />
      <AddToCartButton />
    </BotGate>
  </div>
</template>

<script>
import { BotGate } from "bot-gate/vue";

export default {
  components: { BotGate },
  async asyncData({ req }) {
    return {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    };
  },
};
</script>
```

### Svelte (SvelteKit)

```svelte
<script>
  import { BotGate } from 'bot-gate/svelte';

  export let userAgent;
  export let ipAddress;
</script>

<BotGate {userAgent} {ipAddress} display="show" role="bot">
  <FullProductDescription />
  <StructuredData />
</BotGate>

<BotGate {userAgent} {ipAddress} display="show" role="user">
  <InteractiveGallery />
  <AddToCartButton />
</BotGate>
```

## API Reference

### Core Function

```javascript
import { validateBot } from "bot-gate/core";

// Validate using user agent and IP address
const userAgent =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const isValid = validateBot(userAgent, "66.249.64.1");
// Returns: true

const isInvalid = validateBot(userAgent, "192.168.1.1");
// Returns: false
```

That's it! One simple function that returns `true` for valid bots, `false` for everything else.

### BotGate Component

| Prop          | Type             | Required | Description                             |
| ------------- | ---------------- | -------- | --------------------------------------- |
| `userAgent`   | string           | ✓        | User agent string from request headers  |
| `ipAddress`   | string           | ✓        | IP address from request                 |
| `display`     | 'show' \| 'hide' | ✓        | Whether to show or hide content         |
| `role`        | 'bot' \| 'user'  | ✓        | Target role for the display rule        |
| `bots`        | string[]         | ✗        | Specific bot names to target            |

## Supported Bots

### Search Engines

- **Google** (googlebot) - IP validation supported
- **Bing** (bingbot) - IP validation supported
- **Apple** (applebot) - IP validation supported
- **DuckDuckGo** (duckduckbot) - IP validation supported

### AI Bots

- **OpenAI SearchBot** (oai-searchbot) - IP validation supported
- **ChatGPT User** (chatgpt-user) - IP validation supported
- **GPTBot** (gptbot) - IP validation supported
- **PerplexityBot** (perplexitybot) - IP validation supported
- **Perplexity User** (perplexity-user) - IP validation supported
- **Apple Extended** (applebot-extended) - IP validation supported
- **DuckDuckGo AI** (duckassistbot) - IP validation supported

## Usage examples

### Basic usage

```javascript
// Show SEO content to search engines
<BotGate userAgent={userAgent} ipAddress={ipAddress} display="show" role="bot">
  <h1>SEO Optimized Title</h1>
  <meta name="description" content="..." />
</BotGate>

// Show interactive content to users
<BotGate userAgent={userAgent} ipAddress={ipAddress} display="show" role="user">
  <InteractiveWidget />
  <LazyLoadedImages />
</BotGate>
```

### Target specific bots

```javascript
<BotGate
  userAgent={userAgent}
  ipAddress={ipAddress}
  display="show"
  role="bot"
  bots={["googlebot", "bingbot"]}
>
  <SearchEngineContent />
</BotGate>
```

**Available bot names for the `bots` prop:**
- `"googlebot"` - Google search bot
- `"bingbot"` - Microsoft Bing search bot  
- `"applebot"` - Apple search bot
- `"duckduckbot"` - DuckDuckGo search bot
- `"oai-searchbot"` - OpenAI SearchBot
- `"chatgpt-user"` - ChatGPT User
- `"gptbot"` - GPTBot
- `"perplexitybot"` - PerplexityBot
- `"perplexity-user"` - Perplexity User
- `"applebot-extended"` - Apple Extended bot
- `"duckassistbot"` - DuckDuckGo AI bot

### Hide content from bots

```javascript
// Hide complex UI from bots
<BotGate userAgent={userAgent} ipAddress={ipAddress} display="hide" role="bot">
  <ComplexJavaScriptWidget />
</BotGate>

// Equivalent to showing content to users only
<BotGate userAgent={userAgent} ipAddress={ipAddress} display="show" role="user">
  <ComplexJavaScriptWidget />
</BotGate>
```


## Framework setup

### Next.js

```javascript
// pages/_app.js or in your page component
export async function getServerSideProps({ req }) {
  return {
    props: {
      userAgent: req.headers["user-agent"] || "",
      ipAddress: req.ip || req.connection.remoteAddress || "",
    },
  };
}
```

### Nuxt.js

```javascript
// nuxt.config.js
export default {
  serverMiddleware: [
    {
      path: "/api",
      handler: (req, res, next) => {
        req.ip = req.connection.remoteAddress;
        next();
      },
    },
  ],
};
```

### SvelteKit

```javascript
// src/routes/+layout.server.js
export async function load({ request, getClientAddress }) {
  return {
    userAgent: request.headers.get("user-agent") || "",
    ipAddress: getClientAddress(),
  };
}
```

## How it works

Bot Gate uses a two-step verification process:

1. **User Agent Detection** - Matches request user agent against known bot patterns
2. **IP validation** - Verifies the request IP belongs to official bot IP ranges

Both checks must pass for a request to be considered a legitimate bot. This prevents:

- Spoofed user agents from fake bots
- Scrapers impersonating search engines
- Unauthorized crawlers

## License

MIT

Made by [Hall](https://usehall.com)