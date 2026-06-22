# Cosmic Live IPTV 📺

Cosmic Live IPTV is a high-performance, polished web application designed for browsing and streaming IPTV channels. Built with a focus on visual elegance and platform reliability, it features a modern "Cosmic" dark interface and intelligent stream management.

## ✨ Key Features

- **Live Indexing**: Fetches and parses live M3U playlists directly from the [iptv-org](https://github.com/iptv-org/iptv) index.
- **Smart Liveness Tracker**: High-frequency background verification (batches of 40 every 0.8s) that detects inactive streams in real-time without disrupting the main UI.
- **Virtualized Discovery**: High-performance sidebar utilizing custom virtualization to render thousands of channels smoothly with zero lag.
- **Picture-in-Picture Mode**: Integrated PiP support allowing users to browse and multi-task while keeping the video visible in a mini-player window.
- **Priority-Driven Sorting**: Intelligent channel organization that prioritizes HD/4K quality, favorites, and official sources.
- **Device Optimized**: Adaptive UI with a dedicated mobile tab-switcher and accessible, high-contrast controls.
- **Regional Navigation**: Polished, scrollable region ribbon with country flags and name mapping for easy global browsing.
- **Recent Channels**: Securely tracks your most recently watched channels using browser local storage.
- **Elegant UI**: A custom-crafted "Cosmic" theme utilizing deep charcoal grays, emerald accents, and professional typography.

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
