# Cosmic Live IPTV 📺

Cosmic Live IPTV is a high-performance, polished web application designed for browsing and streaming IPTV channels. Built with a focus on visual elegance and platform reliability, it features a modern "Cosmic" dark interface and intelligent stream management.

## ✨ Key Features

- **Live Indexing**: Fetches and parses live M3U playlists directly from the [iptv-org](https://github.com/iptv-org/iptv) index.
- **Intelligent failure Detection (FAQ)**: Automatically detects and flags broken or inaccessible streams, auto-hiding them from your list to ensure a seamless browsing experience.
- **Virtualized discovery**: High-performance sidebar utilizing custom virtualization to render thousands of channels smoothly with zero lag.
- **Device Optimized**: Adaptive UI with a dedicated mobile tab-switcher for seamless transitions between channel browsing and full-screen playback.
- **Advanced Filtering**: Extensive filtering by search query, category, regional flags, and reliability status.
- **Responsive Player**: Integrated HLS.js player with error handling, automatic "next stream" logic, and immersive fullscreen support.
- **Recent Channels**: Securely tracks your most recently watched channels using browser local storage.
- **Elegant UI**: A custom-crafted "Cosmic" theme utilizing deep charcoal grays, emerald accents, and elegant typography (Space Grotesk & IBM Plex Mono).

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS 4, Motion (Animation)
- **Streaming**: HLS.js
- **Icons**: Lucide React
- **Backend**: Express (Node.js) for serving and API proxying

## 📁 Project Structure

```text
/src
  /components     # Modular React components (Header, Sidebar, VideoPlayer, etc.)
  /lib            # Shared utilities, IPTV parsing, and UI helpers
  /types.ts       # Global TypeScript interfaces
  /App.tsx        # Main application entry point & state orchestrator
  /index.css      # Tailwind configuration and Cosmic design tokens
/server.ts        # Full-stack production-ready Express server
```

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`.

## 📦 Production

To build the application for production:

```bash
npm run build
npm start
```

The build process bundles the frontend into the `dist/` folder and compiles the TypeScript server into a self-contained CommonJS file for deployment.

## 🔑 Environment Variables

- `GEMINI_API_KEY`: (Optional) Required if integrating AI features.
- `APP_URL`: The hosted URL of the application.

## 📜 Credits

- Channel data provided by [iptv-org](https://github.com/iptv-org/iptv).
- Built with Google AI Studio.
