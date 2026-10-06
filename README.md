# 🎮 Esports Scoreboard Overlay

A customizable **esports scoreboard and broadcast overlay** designed for **OBS Studio and YouTube live streaming**.

The project provides a separate control panel for managing teams, scores, match information, countdowns, break screens, images, layouts, and multiple matches, while OBS displays only the clean transparent overlay.

## ✨ Features

- 🎥 OBS Studio Browser Source support
- 🏆 Professional esports-style scoreboard
- 👥 Team names and team logos
- 🔢 Live score controls
- ➕ / ➖ score adjustment
- 🎮 BO1, BO3 and BO5 support
- 🗺️ Map and match information
- ⏱️ Break/intermission countdown
- ▶️ Start, pause, resume and reset countdown
- 🖼️ Custom backgrounds and banners
- 🏅 Tournament logo support
- 🎨 Custom fonts, colors, borders, shadows and glow
- 📐 Independent size controls
- 📍 Independent position controls
- 🔴 Live mode
- ⏸️ Break mode
- 👻 Hidden mode
- 🔄 Real-time updates in OBS
- 📋 Multiple match configurations
- 🔜 Prepare upcoming matches in advance
- 💾 Local configuration storage
- 📤 Configuration import/export
- 🎬 Optional animations
- 🖥️ Designed around a 1920×1080 broadcast canvas
- 🌐 Runs locally without requiring a paid service


## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/esports-scoreboard-overlay.git
```

### 2. Enter the project directory

```bash
cd esports-scoreboard-overlay
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local address shown by Vite in your browser.

## 🎥 Using With OBS Studio

### Control Panel

Open the application normally in your browser.

Use the control panel to configure:

- Tournament name
- Team names
- Team logos
- Scores
- Match format
- Map
- Background
- Countdown
- Break screen
- Positions
- Sizes
- Colors
- Other overlay settings

### OBS Overlay

In OBS Studio:

1. Open your scene.
2. Click **Sources → + → Browser**.
3. Add a Browser Source.
4. Enter the overlay URL provided by the application.
5. Set the resolution to:

```text
Width: 1920
Height: 1080
```

6. Add the Browser Source to your scene.
7. Use the control panel to update the scoreboard.

The OBS source displays only the scoreboard/overlay, while the controls remain outside the stream.

## 🏆 Match Management

The scoreboard supports multiple matches.

You can create configurations such as:

```text
Match 1
Team A: Phantom Wolves
Team B: Shadow Force
Format: BO3
Map: Lotus

Match 2
Team A: Team Alpha
Team B: Team Omega
Format: BO5
Map: Haven

Match 3
Team A: Team Red
Team B: Team Blue
Format: BO3
Map: Bind
```

You can prepare the next match while the current match is being played.

## ⏱️ Break Mode

Break mode is designed for the time between matches.

Example:

```text
MATCH BREAK

NEXT MATCH STARTING IN

01:30
```

The countdown can be:

- Started
- Paused
- Resumed
- Reset
- Increased by 10 seconds
- Decreased by 10 seconds
- Set to a custom duration

You can also display a custom banner or background during the break.

## 🎮 Display Modes

### LIVE

Displays the active match:

```text
TOURNAMENT NAME

PHANTOM WOLVES     2 — 1     SHADOW FORCE

MAP 3
BEST OF 5
```

### BREAK

Displays the intermission screen and countdown.

### HIDDEN

Hides the overlay while keeping the OBS Browser Source active.

## 🎨 Customization

The overlay can be customized without modifying the source code.

You can adjust:

- Team name size
- Score size
- Logo size
- Text position
- Score position
- Countdown position
- Font
- Text color
- Score color
- Opacity
- Borders
- Shadows
- Glow
- Backgrounds
- Banners
- Animations

## 🛠️ Tech Stack

- **React**
- **TypeScript**
- **Vite**
- **CSS**
- **Browser APIs / Local Storage**

## 📌 Use Cases

This project can be used for:

- Esports tournaments
- Gaming livestreams
- YouTube broadcasts
- Twitch streams
- Community tournaments
- College esports events
- LAN events
- Tournament organizers
- Custom gaming broadcasts

## 🔮 Future Improvements

Possible future features include:

- Automatic game result integration
- Game API integrations
- Tournament bracket integration
- Player statistics
- Round/map statistics
- Automated match transitions
- Remote control panel
- Cloud synchronization
- Multiple overlay themes
- Sponsor/advertisement slots
- Stream alerts
- Animated team introductions

## 🤝 Contributing

Contributions, suggestions and improvements are welcome.

If you find a bug or have an idea for a new feature, feel free to open an issue or submit a pull request.

## 📄 License

This project is currently available for personal and educational use.

If you plan to use it commercially, please check the repository license and project dependencies before doing so.

---

### ⭐ If you find this project useful

Consider giving the repository a **star ⭐** and sharing it with other esports creators and tournament organizers.
