# Codeforces Auto-Open Extension

A Chrome/Brave web extension that automatically opens Codeforces when you start your browser, plus includes daily random problem missions.

## Features

- ✅ Automatically opens Codeforces on browser startup
- ✅ **Daily Missions**: Get 1-5 random Codeforces problems each day
- ✅ **Interactive Popup**: View and manage your daily missions from the popup
- ✅ **Detailed Homepage**: Beautiful detailed view with mission information
- ✅ **One-Click Problem Access**: Click any mission to open it on Codeforces
- ✅ **Refresh Missions**: Generate new random problems anytime
- ✅ **Daily Reset**: Missions automatically reset each day

## Installation

### For Chrome or Brave:

1. Open the extension management page:
   - **Chrome**: `chrome://extensions/`
   - **Brave**: `brave://extensions/`

2. Enable "Developer mode" (toggle in the top-right corner)

3. Click "Load unpacked" and select the `webextension` folder

4. The extension should now be installed and active

## How It Works

### Auto-Open
- The extension uses Chrome's `runtime.onStartup` event to detect when the browser starts
- It automatically creates a new tab with Codeforces.com

### Daily Missions
- When you click the extension icon, the popup displays today's random mission problems
- 1-5 random problems are fetched from the Codeforces API each day
- Missions reset every day automatically
- Click any problem card to open it directly on Codeforces

### Detailed Homepage
- Click the "📖 Details" button in the popup to open the detailed mission page
- View all missions in a beautiful grid layout
- See problem ratings and information
- Manage missions with refresh and open buttons

## File Structure

```
webextension/
├── manifest.json       - Extension configuration
├── background.js       - Service worker (handles startup events)
├── popup.html         - Popup UI with mission list
├── popup.js           - Popup functionality
├── homepage.html      - Detailed mission view page
├── homepage.js        - Homepage functionality
└── README.md          - This file
```

## Usage

1. **View Daily Missions**: Click the extension icon to see today's mission problems
2. **Open Codeforces**: Click "Open Codeforces" button to go directly to the site
3. **Solve Problems**: Click any mission problem to open it on Codeforces
4. **Refresh**: Click "🔄 Refresh Missions" to get new random problems
5. **Detailed View**: Click "📖 Details" to see a comprehensive mission overview

## Customization

To change the Codeforces URL:
- Edit `background.js` - change `https://codeforces.com`
- Edit `popup.js` - change the URL in `openCFBtn` handler
- Edit `homepage.js` - change the URL in `openCFBtn` handler

To change the number of daily missions:
- Edit `popup.js` or `homepage.js`
- Modify the line: `const numMissions = getRandomInt(1, 5);` to your preferred range

