# 🎮 Esports Scoreboard Overlay

A customizable **esports scoreboard and broadcast overlay** for **OBS Studio, Streamlabs Desktop and YouTube/Twitch live streaming**.

It has two parts: a **Control panel** where you manage teams, scores, matches, countdowns, pages, brackets, tables and styling, and a clean, transparent **Overlay** that OBS shows on stream. It runs entirely on your own computer, with no account and no paid service.

## 📑 Table of contents

- [Features at a glance](#-features-at-a-glance)
- [Screenshots](#-screenshots)
- [Download and run](#-download-and-run)
- [Using it with OBS Studio](#-using-it-with-obs-studio)
- [How it works](#-how-it-works)
- [Detailed features](#-detailed-features)
- [Keyboard shortcuts](#-keyboard-shortcuts)
- [Saving, backups and safety](#-saving-backups-and-safety)
- [Troubleshooting](#-troubleshooting)
- [Tech stack](#-tech-stack)
- [Use cases](#-use-cases)
- [Future improvements](#-future-improvements)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features at a glance

- 🎥 OBS Studio and Streamlabs Desktop Browser Source support
- 🏆 Professional esports-style scoreboard
- 👥 Team names, short names and logos
- 🔢 Live score controls with buttons and keyboard shortcuts
- 🎮 BO1, BO3, BO5 and BO7 series with automatic series-winner detection
- ⏭️ "Finish & next match" and optional auto-advance
- 📋 Unlimited matches, with a "current match" you can switch at any time
- 🏷️ Stage tags (Group Stage, Semi Final, Grand Final…)
- 🖼️ Break pages, image-only banner pages, brackets, group tables and a "today's matches" screen
- ⏱️ Countdown timers: set a duration, or count down to a clock time
- 🎨 Fonts, colors, borders, glow, shadows, opacity and one-click Quick Looks
- 📐 Independent position and size for every element on a 1920×1080 canvas
- 👀 Live previews of what OBS shows and what you are editing
- ↶ Undo / redo
- 💾 Automatic saving, plus backup folder and import/export
- 🔄 Real-time updates in OBS
- 🎬 Optional animations
- 🌐 Runs locally, free


## 📸 Screenshots

<img width="1920" height="940" alt="Screenshot_20261019_111222" src="https://github.com/user-attachments/assets/c5856428-943d-4971-a153-8e2c1619cf15" /> 
<img width="1920" height="947" alt="Screenshot_20261019_111355" src="https://github.com/user-attachments/assets/e720e296-1e2a-4f9d-bda2-29c1894d8dc2" />
<img width="1917" height="935" alt="Screenshot_20261019_111321" src="https://github.com/user-attachments/assets/21551aac-490f-4c7c-8cdd-9e10dca34e71" />
<img width="1691" height="949" alt="Screenshot_20261019_111246" src="https://github.com/user-attachments/assets/58d9f4de-127f-44b1-9f0c-b89e145dbef9" />

### Control panel

![Control panel](docs/screenshots/control-panel.png)

### Overlay in OBS

![Scoreboard overlay](docs/screenshots/overlay.png)


## 🚀 Download and run

Every package the project needs is listed with its version in [`src/requirements.txt`](src/requirements.txt). You install **Node.js once**, and one command (`npm install`) downloads all the rest.

### 1. Download the project (ZIP)

1. Open <https://github.com/Divyansh-3/LIVE-SCORE>
2. Click the green **Code** button → **Download ZIP**.
3. Extract the ZIP (right-click → **Extract All** on Windows, double-click on macOS). You get a folder named `LIVE-SCORE-main`.

### 2. Install Node.js (once)

Install the **LTS** version from <https://nodejs.org>, or use your system's command:

| System                          | Command                                             |
| ------------------------------- | --------------------------------------------------- |
| **Windows** (CMD or PowerShell) | `winget install OpenJS.NodeJS.LTS`                  |
| **macOS** (Homebrew)            | `brew install node`                                 |
| **Ubuntu / Debian**             | `sudo apt update && sudo apt install -y nodejs npm` |
| **Fedora**                      | `sudo dnf install -y nodejs npm`                    |
| **Arch**                        | `sudo pacman -S nodejs npm`                         |

Close and reopen your terminal afterwards, then check it works:

```bash
node -v
npm -v
```

### 3. Install and run

Open a terminal **inside the `src` folder** of the extracted project (it contains `package.json` and `requirements.txt`), then run the commands for your system.

#### 🪟 Windows

Open the extracted folder, open `src`, click the address bar, type `powershell` and press Enter. Then:

```powershell
npm install
npm run dev
```

Or from any PowerShell window (if the ZIP is in Downloads):

```powershell
cd "$HOME\Downloads\LIVE-SCORE-main\src"
npm install
npm run dev
```

#### 🍎 macOS

```bash
cd ~/Downloads/LIVE-SCORE-main/src
npm install
npm run dev
```

#### 🐧 Linux

```bash
cd ~/Downloads/LIVE-SCORE-main/src
npm install
npm run dev
<<<<<<< HEAD
```

(If you downloaded the ZIP from the terminal: `unzip LIVE-SCORE-main.zip`, then `cd LIVE-SCORE-main/src`.)

#### Install from `requirements.txt` instead (optional)

`requirements.txt` lists the exact versions of every package. `npm` cannot read that format directly, so these commands convert it for you. Run them inside `src`, **then** `npm run dev`:

```powershell
# Windows (PowerShell)
npm install --no-save (Get-Content requirements.txt | ForEach-Object { $_ -replace '==','@' })
```

```bash
# macOS / Linux
npm install --no-save $(sed 's/==/@/' requirements.txt)
```

`--no-save` installs those exact versions without changing `package.json`.

### 4. Open it

Go to **<http://localhost:5173>** in Chrome or Edge.

- **Keep the terminal window open while you stream.** Closing it stops the scoreboard.
- **Next time**, you only need `npm run dev`: open a terminal in `src` and run it. `npm install` is only needed the first time.
- `npm run dev` already locks the port to `5173` on purpose. Browsers keep your data per address, so if the port changed, your tournament would seem to disappear. If the port is busy, close the other copy of the app first.

The first time you run it on your own computer, a step-by-step **Welcome guide** opens automatically. You can reopen it from **⚙ Backup & settings → Welcome / help**.

---

## 🎥 Using it with OBS Studio

The app has two addresses on the same site:

| Page        | Address                          | Purpose                        |
| ----------- | -------------------------------- | ------------------------------ |
| **Control** | `http://localhost:PORT/`         | Where you click and type       |
| **Overlay** | `http://localhost:PORT/#overlay` | What viewers see (transparent) |

The Control page shows the exact overlay link in the **"Paste in OBS"** box at the top.

### Step 1: Add the overlay

1. In OBS, under **Sources**, click **+ → Browser**.
2. Name it "Scoreboard" and click OK.
3. Paste the overlay link into **URL**.
4. Set **Width 1920** and **Height 1080**.
5. Leave **Custom CSS** unchanged. The background is already transparent.
6. Click OK and place the source above your game capture.

### Step 2: Open Control inside OBS (important)

OBS Browser Sources use OBS's own built-in browser, which keeps its own separate storage. The overlay reads the data saved by the Control page, so **Control must run in the same OBS browser**, not in Chrome or Edge.

1. In OBS, open **Docks → Custom Browser Docks…**
2. Name it "Scoreboard Control" and paste the Control address (the same address as the overlay, without `#overlay`).
3. Click **Apply**. The control panel now appears as a dock inside OBS.
4. Run your whole show from that dock.

> ⚠️ Use the **exact same address** for the dock and the overlay. `localhost` and `127.0.0.1` are treated as different sites with separate storage, so do not mix them.
>
> If you control the scoreboard from a normal Chrome or Edge window, the overlay in OBS will **not** update.

In Streamlabs Desktop, use its custom browser dock option if your version has one.

---

## 🧠 How it works

- **Matches** hold team names, logos, format (BO1–BO7), stage and the score. One match is the **current match**.
- **Pages** are screens. Only one page is **on air** at a time, or none (overlay hidden).
- The **score belongs to the match**, so it shows on every page that displays that match.
- Every change is broadcast to the overlay within about 40 ms and saved to your browser's IndexedDB database shortly after.
- The top bar always shows what OBS is displaying right now.

---

## 🔍 Detailed features

### 🏆 Match management

- Create as many matches as you need, and **duplicate**, **reorder** and **delete** them.
- Click a match to edit it, and press **Make current** to put it on the scoreboard.
- Prepare upcoming matches while the current one is being played. A warning shows when you are editing a match that is not on stream.
- Per match: **tournament name**, **format** (BO1, BO3, BO5, BO7), **stage tag**, an optional **match banner**, and for each team a **name**, **short name** and **logo**.

Example:

```text
Match 1   Phantom Wolves vs Shadow Force   BO3   Quarter Final
Match 2   Team Alpha vs Team Omega         BO5   Semi Final
Match 3   Team Red vs Team Blue            BO3   Grand Final
```

### 🔢 Scoring and series

- **+1 / −1** buttons for each team in the strip at the top, always visible.
- Keyboard scoring with the arrow keys (no mouse needed).
- **Reset scores** and **Next match →** controls.
- When a team wins the series (for example 2–0 in a BO3), a banner appears with **Finish & next match**. It moves on to the next match.
- Optional **Auto-advance finished series**: waits a few seconds so viewers can see the final score, then moves on. Undo cancels it.
- Scores can never go below 0.

### 📄 Pages (break screens)

Each page is a screen you can put on air. A normal page can show:

- A **big title**, a **line above the timer**, and a **"when timer hits 0"** message
- An **info line** (for example "Next map: Bind")
- A **countdown** and/or a **scoreboard** (each can be switched on or off)
- A **default banner** image
- A **match shown** setting: follow the current match automatically, or lock the page to one specific match

You can add, duplicate, reorder and delete pages. Pages are numbered, and the number keys put them on air.

### 🖼️ Banner pages

An **image-only** page that shows one picture and nothing else: no title, countdown or scoreboard. Choose **Fill the screen** (may crop) or **Show the whole image**, and use Position & size to move or resize it.

### ⏱️ Countdown timers

Every page that shows a countdown has its own timer:

- **Start**, **Pause**, **Resume** and **Reset**
- **+10s / −10s**, even while it is running
- Quick presets: 00:30, 01:00, 02:00, 05:00
- **Custom time** such as 03:30
- **Count down to a clock time** (24-hour, for example 22:00 = 10 PM). If that time has already passed today, it counts to tomorrow.
- **Space** starts or pauses the timer of the page that is on air

### 🏆 Bracket screens

- Add as many bracket screens as you need (Upper bracket, Lower bracket, Group A…).
- Each screen has its own title, banner, layout and style.
- Bracket slots are linked to your matches.
- Option to **show scores** and, for double-elimination brackets, to **show Upper and Lower together** on one screen.
- Deleting a match used by a bracket warns you first and leaves that slot empty until you pick another match.

### 📊 Table screens

- Group-stage tables with their own teams, fixtures and results.
- Shows a **champion** when the table is complete.
- The Control list shows progress such as "4 teams · 3/6 played".
- Add as many as you need and **duplicate** a table (Group A → Group B) with one click.
- Each table has its own title, banner, layout and style.

### 🗓️ Today's matches screen

A screen that lists the matches being played today, with a banner and **no timer**. Add several (Morning, Evening…) with their own titles, subtitles and an optional **show scores** setting.

```

(If you downloaded the ZIP from the terminal: `unzip LIVE-SCORE-main.zip`, then `cd LIVE-SCORE-main/src`.)

#### Install from `requirements.txt` instead (optional)

`requirements.txt` lists the exact versions of every package. `npm` cannot read that format directly, so these commands convert it for you. Run them inside `src`, **then** `npm run dev`:

```powershell
# Windows (PowerShell)
npm install --no-save (Get-Content requirements.txt | ForEach-Object { $_ -replace '==','@' })
```

```bash
# macOS / Linux
npm install --no-save $(sed 's/==/@/' requirements.txt)
```

`--no-save` installs those exact versions without changing `package.json`.

### 4. Open it

Go to **<http://localhost:5173>** in Chrome or Edge.

- **Keep the terminal window open while you stream.** Closing it stops the scoreboard.
- **Next time**, you only need `npm run dev`: open a terminal in `src` and run it. `npm install` is only needed the first time.
- `npm run dev` already locks the port to `5173` on purpose. Browsers keep your data per address, so if the port changed, your tournament would seem to disappear. If the port is busy, close the other copy of the app first.

The first time you run it on your own computer, a step-by-step **Welcome guide** opens automatically. You can reopen it from **⚙ Backup & settings → Welcome / help**.

## 🎥 Using it with OBS Studio

The app has two addresses on the same site:

| Page        | Address                          | Purpose                        |
| ----------- | -------------------------------- | ------------------------------ |
| **Control** | `http://localhost:PORT/`         | Where you click and type       |
| **Overlay** | `http://localhost:PORT/#overlay` | What viewers see (transparent) |

The Control page shows the exact overlay link in the **"Paste in OBS"** box at the top.

### Step 1: Add the overlay

1. In OBS, under **Sources**, click **+ → Browser**.
2. Name it "Scoreboard" and click OK.
3. Paste the overlay link into **URL**.
4. Set **Width 1920** and **Height 1080**.
5. Leave **Custom CSS** unchanged. The background is already transparent.
6. Click OK and place the source above your game capture.

### Step 2: Open Control inside OBS (important)

OBS Browser Sources use OBS's own built-in browser, which keeps its own separate storage. The overlay reads the data saved by the Control page, so **Control must run in the same OBS browser**, not in Chrome or Edge.

1. In OBS, open **Docks → Custom Browser Docks…**
2. Name it "Scoreboard Control" and paste the Control address (the same address as the overlay, without `#overlay`).
3. Click **Apply**. The control panel now appears as a dock inside OBS.
4. Run your whole show from that dock.

> ⚠️ Use the **exact same address** for the dock and the overlay. `localhost` and `127.0.0.1` are treated as different sites with separate storage, so do not mix them.
>
> If you control the scoreboard from a normal Chrome or Edge window, the overlay in OBS will **not** update.

In Streamlabs Desktop, use its custom browser dock option if your version has one.


## 🧠 How it works

- **Matches** hold team names, logos, format (BO1–BO7), stage and the score. One match is the **current match**.
- **Pages** are screens. Only one page is **on air** at a time, or none (overlay hidden).
- The **score belongs to the match**, so it shows on every page that displays that match.
- Every change is broadcast to the overlay within about 40 ms and saved to your browser's IndexedDB database shortly after.
- The top bar always shows what OBS is displaying right now.


## 🔍 Detailed features

### 🏆 Match management

- Create as many matches as you need, and **duplicate**, **reorder** and **delete** them.
- Click a match to edit it, and press **Make current** to put it on the scoreboard.
- Prepare upcoming matches while the current one is being played. A warning shows when you are editing a match that is not on stream.
- # Per match: **tournament name**, **format** (BO1, BO3, BO5, BO7), **stage tag**, an optional **match banner**, and for each team a **name**, **short name** and **logo**.

# LIVE-SCORE: a free esports scoreboard for OBS Studio

A browser-based scoreboard and stream-overlay system for **tournament organisers and streamers**.
You run it on your own computer, control it from a Control Panel, and show it in OBS Studio as a
Browser Source. There is **no server, no database, no account and no cost**.

- Many matches per tournament (BO1 / BO3 / BO5), each with its own teams, logos, score and banner
- Break screens with countdown timers (including "count down to 10:00 PM")
- Banner-only pages (just an image, no text)
- Tournament **brackets** (manual or automatic), several at once
- League **points tables** for 4 to 16 teams, several at once
- **Today's matches** schedule screen
- Switch what is on stream with one click or one key, without reloading OBS
- Everything is saved in your browser and survives restarts; one-click JSON backups

Built with React, TypeScript and Vite. No other runtime dependencies.


## Table of contents

1. [Quick start](#1-quick-start)
2. [Setting it up in OBS (read this)](#2-setting-it-up-in-obs-read-this)
3. [How it works: matches and screens](#3-how-it-works-matches-and-screens)
4. [The Control Panel tour](#4-the-control-panel-tour)
5. [Matches](#5-matches)
6. [Pages: breaks, countdowns, banners](#6-pages-breaks-countdowns-banners)
7. [Brackets](#7-brackets)
8. [Points tables](#8-points-tables)
9. [Today's matches](#9-todays-matches)
10. [Position, size and style](#10-position-size-and-style)
11. [Saving, backups and your data](#11-saving-backups-and-your-data)
12. [A typical tournament day](#12-a-typical-tournament-day)
13. [Keyboard shortcuts](#13-keyboard-shortcuts)
14. [Troubleshooting](#14-troubleshooting)
15. [Project structure and architecture](#15-project-structure-and-architecture)
16. [Development](#16-development)
17. [Known limitations](#17-known-limitations)
18. [Contributing and license](#18-contributing-and-license)


## 1. Quick start

**You need:** [Node.js](https://nodejs.org) 18 or newer (the LTS version is fine) and
[OBS Studio](https://obsproject.com).

```bash
# 1. Download or clone this project, then open a terminal in its folder
npm install

# 2. Start it (leave this window open while you stream)
npm run dev
```

Then open **http://localhost:5173** in your browser. That is the Control Panel.

> **Always use `localhost`, never `127.0.0.1`, and keep the port 5173.**
> Your saved tournament belongs to that exact address. A different address or port is a different,
> empty database. The project is set to fail loudly instead of switching ports
> (`strictPort`), so you never silently lose sight of your data.

Other command:

| Command         | What it does                                                      |
| --------------- | ----------------------------------------------------------------- |
| `npm run dev`   | Starts the app with live reload (recommended while you set up)    |
| `npm run start` | Builds an optimised copy and serves it on the same address (5173) |

The first start loads sample data (three matches, a few pages) so you can see how everything
looks. Replace it with your own, or use **Reset everything** (see [section 11](#11-saving-backups-and-your-data)).


## 2. Setting it up in OBS (read this)

### Why this matters

The Control Panel and the overlay talk to each other through your browser's own storage
(IndexedDB) and a BroadcastChannel. Both only work **between pages inside the same browser
profile**. OBS's Browser Source has its **own** embedded browser, which is _not_ Chrome or Edge.
That is why the Control Panel must also run inside OBS.

### Recommended setup: Control Panel as an OBS dock

1. In OBS choose **View → Docks → Custom Browser Docks**.
2. Add a dock named `Scoreboard` with the URL `http://localhost:5173` and click **Apply**.
   This is your Control Panel, docked inside OBS. (Drag it wide, or float it as a window: it is
   designed for a desktop-sized area.)
3. In your scene click **+** under _Sources_ and choose **Browser**.
4. Set the URL to `http://localhost:5173/#overlay`.
5. Set **Width 1920** and **Height 1080**. Leave the custom CSS box at its default.
   Do **not** tick "Local file".
6. Click **OK**, then resize the source to fill your canvas.
7. Use the dock to control what appears. The overlay updates instantly, with no refresh.

The overlay has a **transparent background**, no scrollbars and no controls. If your OBS canvas is
not 1920×1080 it scales to fit (it is drawn on a 1920×1080 reference canvas).

### Testing without OBS

Open `http://localhost:5173` (Control Panel) and `http://localhost:5173/#overlay` (overlay) in two
tabs of the **same** browser. They sync live. The Control Panel also shows two live previews
(_What OBS shows now_ and _The page you are editing_) with a checkerboard where the overlay is
transparent.

### Using Chrome/Edge for the Control Panel instead

A Control Panel in Chrome will **not** update an overlay inside OBS (different profiles, different
storage). Use the dock, or view the overlay in another tab of that same Chrome.

---

## 3. How it works: matches and screens

There are two kinds of things:

| Concept    | What it is                                                                                |
| ---------- | ----------------------------------------------------------------------------------------- |
| **Match**  | Two teams, a score, a format (BO1/BO3/BO5), a tournament name, optional logos and banner. |
| **Screen** | One thing you can put on stream (a _page_). OBS shows exactly one screen at a time.       |

Screens come in five types:

| Screen type         | Section in the panel | What it shows                                               |
| ------------------- | -------------------- | ----------------------------------------------------------- |
| **Page** (break)    | ② Your pages         | Title, optional countdown, optional scoreboard card, banner |
| **Banner page**     | ② Your pages         | **Only an image.** No text at all                           |
| **Bracket screen**  | ③ Bracket screens    | A tournament bracket                                        |
| **Table screen**    | ④ Tables             | A points table (standings)                                  |
| **Today's matches** | ⑤ Today's matches    | A schedule list of matches with times and scores            |

Match data is **shared**: pages, brackets and schedules _read_ matches from your match list, so a
score change shows up everywhere at once. The exception is points tables, which keep their own
teams and fixtures (see [section 8](#8-points-tables)).


The **current match** is the one pages show on their scoreboard card. Change it with
**Make current** or **Next match →**.


```text
Match 1   Phantom Wolves vs Shadow Force   BO3   Quarter Final
Match 2   Team Alpha vs Team Omega         BO5   Semi Final
Match 3   Team Red vs Team Blue            BO3   Grand Final
```

### 🔢 Scoring and series

- **+1 / −1** buttons for each team in the strip at the top, always visible.
- Keyboard scoring with the arrow keys (no mouse needed).
- **Reset scores** and **Next match →** controls.
- When a team wins the series (for example 2–0 in a BO3), a banner appears with **Finish & next match**. It moves on to the next match.
- Optional **Auto-advance finished series**: waits a few seconds so viewers can see the final score, then moves on. Undo cancels it.
- Scores can never go below 0.

### 📄 Pages (break screens)

Each page is a screen you can put on air. A normal page can show:

- A **big title**, a **line above the timer**, and a **"when timer hits 0"** message
- An **info line** (for example "Next map: Bind")
- A **countdown** and/or a **scoreboard** (each can be switched on or off)
- A **default banner** image
- A **match shown** setting: follow the current match automatically, or lock the page to one specific match

You can add, duplicate, reorder and delete pages. Pages are numbered, and the number keys put them on air.

### 🖼️ Banner pages

An **image-only** page that shows one picture and nothing else: no title, countdown or scoreboard. Choose **Fill the screen** (may crop) or **Show the whole image**, and use Position & size to move or resize it.

### ⏱️ Countdown timers

Every page that shows a countdown has its own timer:

- **Start**, **Pause**, **Resume** and **Reset**
- **+10s / −10s**, even while it is running
- Quick presets: 00:30, 01:00, 02:00, 05:00
- **Custom time** such as 03:30
- **Count down to a clock time** (24-hour, for example 22:00 = 10 PM). If that time has already passed today, it counts to tomorrow.
- **Space** starts or pauses the timer of the page that is on air

### 🏆 Bracket screens

- Add as many bracket screens as you need (Upper bracket, Lower bracket, Group A…).
- Each screen has its own title, banner, layout and style.
- Bracket slots are linked to your matches.
- Option to **show scores** and, for double-elimination brackets, to **show Upper and Lower together** on one screen.
- Deleting a match used by a bracket warns you first and leaves that slot empty until you pick another match.

### 📊 Table screens

- Group-stage tables with their own teams, fixtures and results.
- Shows a **champion** when the table is complete.
- The Control list shows progress such as "4 teams · 3/6 played".
- Add as many as you need and **duplicate** a table (Group A → Group B) with one click.
- Each table has its own title, banner, layout and style.

### 🗓️ Today's matches screen

A screen that lists the matches being played today, with a banner and **no timer**. Add several (Morning, Evening…) with their own titles, subtitles and an optional **show scores** setting.

### 📐 Position and size

- The canvas is **1920×1080**.
- Every element has its own **X, Y and Size**, and an element can be **hidden** with its "show" checkbox.
- Elements include: plate, tournament name and logo, match info, map, team logos, names and scores, countdown, banner, break title and subtitle, scoreboard and info line.
- Bracket, table and list screens also get **Width / Height** and **Shift** buttons (±10, ±50, up, down) plus **Center**, which centers the block without changing its size.
- A **background image** per page, with its own size %, X and Y.

### 🎨 Colors and style

- **Font** (type any installed font, with suggestions), **weight** and **letter spacing**
- Colors for **text, team names, score/timer, accent/border and panel**
- **Panel opacity, border width, corner radius, glow, shadow** and **overall opacity**
- **Quick Looks**: ready-made styles you can apply to the current page or **ALL pages** (texts, images and scores are kept, only the style changes)
- **Save current look as Custom** and reuse it on other pages
- A theme picker for the Control panel itself
- Optional **animations** (on/off)

> Fonts must be installed on the computer running OBS. If one doesn't appear, pick another.

### 🖼️ Images

- Logos, banners and backgrounds are resized automatically in your browser. Logos are limited to 512 px and other images to 1920 px.
- **PNG and WEBP transparency is preserved.**
- Images are stored inside your saved data, so they are not limited by the small browser localStorage quota.

### 👀 Live previews

Two previews sit beside the controls: **What OBS shows now** and **The page you are editing**. A checkerboard means transparent.

### ↶ Undo and redo

- Up to 30 steps of undo and redo for edits, with quick bursts of typing grouped into one step.
- Scores always get their own step.
- Undo **never changes what is on air or your running timers**, so it is safe to use during a live stream.
- Even a full import or reset can be undone.

---

## ⌨️ Keyboard shortcuts

Shortcuts are ignored while you type in a text box.

| Key                        | Action                                       |
| -------------------------- | -------------------------------------------- |
| `←` / `→`                  | +1 for Team A / Team B                       |
| `Shift` + `←` / `→`        | −1 for Team A / Team B                       |
| `Space`                    | Start or pause the on-air countdown          |
| `1` – `9`                  | Put that numbered page on air                |
| `0`                        | Hide the overlay                             |
| `Enter`                    | Finish a won series and go to the next match |
| `Ctrl+Z`                   | Undo                                         |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo                                         |

---

## 💾 Saving, backups and safety

- **Autosave**: every change is saved within a moment. The top bar shows "Last saved", and a red warning appears if saving fails.
- **Persistent storage**: the app asks the browser not to delete its data when space runs low.
- **Save / Load configuration**: export your entire tournament as a `.json` file and load it on any computer.
- **Automatic backup folder** (Chrome / Edge): choose a folder once and backups are written there automatically, with a dated copy every 30 minutes (the last 12 are kept). This may not be available inside OBS's built-in browser, so also use **Save configuration** before big events.
- **Multi-tab safety**: if the Control page is open in two tabs, the newer state always wins and an old tab can never overwrite newer data.
- **Fallback mode**: if the browser blocks storage (for example a private window), you can continue without saving and export backups manually.
- **Reset everything** erases all matches, pages and images (with confirmation, and undoable).

---

## 🩺 Troubleshooting

| Problem                         | Fix                                                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OBS shows nothing               | Check the top bar says "ON OBS NOW". Press **▶ Show** on a page.                                                                                                                                                 |
| Overlay shows but never updates | You are controlling from Chrome/Edge. Use the **Control dock inside OBS** (see above), and make sure both addresses match exactly. Then right-click the source → **Properties → Refresh cache of current page**. |
| My data disappeared             | Control and the overlay used different browsers, so they have different data. Load your saved configuration in the dock.                                                                                         |
| The overlay is cut off          | Make sure the Browser Source is **1920×1080**.                                                                                                                                                                   |
| A font looks different          | It is not installed on that PC. Pick another font.                                                                                                                                                               |
| A shortcut does nothing         | You may be typing in a text box. Click an empty area first.                                                                                                                                                      |
| "Database is blocked"           | Close other copies of the app, or continue without saving and export backups often.                                                                                                                              |

---

## 🛠️ Tech stack

- **React**
- **TypeScript**
- **Vite**
- **CSS**
- **IndexedDB**: saves your tournament and images on your computer
- **BroadcastChannel API**: instant updates between Control and the overlay
- **File System Access API**: optional automatic folder backups (Chrome / Edge)

---

## 4. The Control Panel tour

```
┌─ Top bar ──────────────────────────────────────────────────────────────────┐
│ SCOREBOARD CONTROL · 🔴 ON OBS NOW: … · Hide overlay · 💾 Last saved · URL · ⚙ │
├─ Score strip: CURRENT MATCH 1 · BO3   TEAM A 0 [+1][−1]  TEAM B 0 [+1][−1] …  ┤
├──────────────┬───────────────────────────────────────┬─────────────────────┤
│ ① Matches    │ ⑥ EDITING: the selected screen        │ ⑦ WHAT OBS SHOWS    │
│ ② Your pages │   tabs: This page / Teams & match /   │   NOW (live preview)│
│ ③ Brackets   │   Position & size / Colors & style    │                     │
│ ④ Tables     │                                       │ THE PAGE YOU ARE    │
│ ⑤ Today's    │                                       │   EDITING (preview) │
└──────────────┴───────────────────────────────────────┴─────────────────────┘
```

- **Top bar**: shows what is on air, **Hide overlay**, the save indicator, the overlay URL, and a
  **⚙ Backup & settings** menu (animations on/off, save/load backup, reset).
- **Score strip**: always visible. +1 / −1 for the _current_ match, **Reset scores**, **Next match →**.
- **Left column**: your lists. Click a card to edit it; use the green button on a card to put it on air.
  Each card has ✕ (delete) and, where available, ⧉ (duplicate).
- **Middle column**: the editor for whatever you selected.
- **Right column**: the two previews. The first is exactly what OBS shows now. The second is the
  screen you are editing, so you can prepare it _before_ you put it on air.

The three columns scroll independently. Editing a screen never changes what OBS shows unless that
screen is the one on air.

Confirmations ("Delete this match?") appear as in-page dialogs, not browser pop-ups, so they cannot
be blocked.

---

## 5. Matches

Section **① Matches today** is your list for the whole tournament.

- **+ New match**, **Duplicate**, **↑ / ↓** to reorder, **✕** to delete (you must keep at least one).
- Click a match, then open **Teams & match** to edit it:
  - **Tournament** name, **Format** (BO1 / BO3 / BO5)
  - **Stage tag** (optional): for example "Semi Final". Shown on the scoreboard info line.
  - **Banner for THIS match**: its own image. Changing it never affects other matches.
  - **Team A / Team B**: name, short name (shown if there is no logo), logo.
- **Make current** puts a match on the scoreboard. A match marked **CURRENT** is the one pages display.
- **Editing is safe**: the ⚠ note tells you when you are editing a match that is not current, so you
  can prepare Match 5 while Match 4 is on air.

**Logos and images** accept PNG, JPG/JPEG and WEBP (PNG/WEBP transparency is kept). Images are
downscaled when you add them (logos to 512 px, banners and backgrounds to 1920 px) to keep your
saved data small.

Deleting a match that a bracket slot uses is allowed; the slot simply shows as empty until you
pick another match.

---

## 6. Pages: breaks, countdowns, banners

Section **② Your pages**. The sample project starts with _Starting soon_, _Break 1_ and _Break 2_.

- **+ New page**, **Duplicate**, **↑ / ↓**, **✕**.
- Press **▶ Show** to put a page on air (or press its number key, see [shortcuts](#13-keyboard-shortcuts)).

### What a page can show (tab: _This page_)

| Setting           | Meaning                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| Big title         | For example `MATCH BREAK`                                                |
| Line above timer  | For example `NEXT MAP STARTING IN`                                       |
| When timer hits 0 | Text that replaces the line above the timer at `00:00`                   |
| Info line         | For example `NEXT: MAP 2`                                                |
| Match shown       | _Current match (automatic)_, or pin the page to one specific match       |
| Show countdown    | Show or hide the timer                                                   |
| Show scoreboard   | Show or hide the teams-and-score card                                    |
| Banner image      | Default banner for this page (a match's own banner wins when it has one) |

### Countdown timer

Each page has its **own** timer:

- **Start / Resume**, **Pause**, **Reset**, **+10s**, **−10s**
- Quick buttons **00:30, 01:00, 02:00, 05:00**, or type your own `mm:ss`
- **Count down to a clock time** (24-hour): type `22:00` and press _Start countdown to it_. At 10:00 PM
  the timer reaches `00:00`.
- The timer stops at `00:00` (never negative) and the line above it changes to your "When timer hits 0" text.
- It is timestamp-based, so it stays accurate in OBS even if the source is hidden.

### Banner pages

**+ New banner page** makes a page that shows **only an image**: no title, no timer, no
scoreboard, no text. It has its own image and an **Image fit** option (_Fill the screen_ or
_Show the whole image_). Move and resize it in _Position & size_.

---

## 7. Brackets

Section **③ Bracket screens**. Each bracket screen owns **one** bracket, plus its own banner, title,
position and style. Make as many as you want (Upper bracket, Lower bracket, Group A…).

A bracket never keeps scores of its own. Each slot points at a normal **match**, so you keep using the
usual score buttons.

### Build one step by step (manual)

Select the bracket screen and open **🏆 Bracket options**:

1. Press **Start a new bracket**. You get one round with no name and no matches.
2. Press **+ New match** in the round (or **+ Existing match…** to reuse one).
3. _(Optional)_ type a round name such as `Quarter Final`. **Nothing is named or tagged for you.**
4. On each match, choose **Winner goes to…** (a match in a later round). Or press **Link pairs →** on
   a round to send winners to the next round two by two.
5. Press **+ Add round** for the next stage and repeat.

Rounds can have different sizes (for example 6 → 3 → 1). A match can have at most two matches feeding it.

### Winners move up

When a match ends, press **Complete & advance** on its slot. The winner is placed into the match you
chose: the first feeder fills team A, the second fills team B. Notes:

- A winner needs the BO1/BO3/BO5 win target (1 / 2 / 3). If the series is not finished you are asked
  whether the team with more points should win anyway.
- A team you typed into the next match by hand is **never overwritten**; you get a warning instead.
- **Reopen** un-completes a slot (teams already moved are left as they are).

### Automatic bracket for teams

Under **Advanced** you can create a complete bracket for **2, 4, 8 or 16 teams**. It builds every
round and match and links the winners. The rounds are unnamed. You type the names if you want them.

### Other bracket options

- **Clear all round names** removes names and the stage tags they added.
- **Delete bracket (keep matches)** or **Delete bracket + its matches** (keeps any match another
  bracket still uses).
- **Position & size** has X, Y, Size, Width, Height, **Shift** buttons (◀ ▶ ▲ ▼) and **Center**.
  Shifting never changes the size.

On stream, the bracket draws one column per round with connector lines that follow your
_Winner goes to_ choices.

---

## 8. Points tables

Section **④ Tables**. A points table is a league: **every team plays every other team**, wins give
points, and the standings calculate themselves. Each table screen has its **own teams, fixtures,
results, champion, banner and style**, and changing one never touches another.

### Create a table

Press **+ New table** and fill in the form:

- **Table name**
- **Number of teams**: **4, 6, 8, 10, 12, 14 or 16**
- **Format**: everyone plays everyone once, or home and away (twice)
- **Points** for a win and for a draw (defaults 3 and 1)
- **Team names** (they must all be different)

Fixtures are generated automatically (round-robin). For example 10 teams = 9 rounds and 45 matches.
All supported sizes are even, so nobody ever sits out; there are no byes in a round-robin.

### Run it

- Under **Matches & results**, type both scores to complete a match (clear a score to undo it).
- Match status labels: **COMPLETED** (both scores in), **ONGOING** (one score in), **UP NEXT**
  (the first match not started), **PENDING**.
- **Standings** rank by points, then score difference, then scores for, then name.
- When every match has a result, the **champion** is shown (🏆) in the editor, on the table's card
  and on stream.
- **Rename or replace a team** any time; its results stay.
- **Change table size or format** rebuilds the fixtures and **clears results** (you must confirm).
  Existing team names are kept.
- **Reset results** and **Delete table data** both ask first.
- **⧉** duplicates a whole table; **✕** deletes it.

On stream the table shows rank, team, P, W, D, L, +/−, PTS. The text shrinks automatically so the
whole table fits the **Height** you set (_Size_ is the largest allowed text).

---

## 9. Today's matches

Section **⑤ Today's matches**. A screen that looks like a break screen but has **no timer**: a banner,
a title, an optional line under the title (for example the date) and a list of matches.

1. Press **+ New today's-matches screen**.
2. Set the title, optional line, and **Banner (only this screen)**.
3. Under **Matches on this screen** pick matches with **+ Add a match…** or **Add all matches**.
4. Type a **time** for each (just text, such as `6:00 PM`), reorder with ↑ / ↓, remove with ✕.

On stream each row shows the time, the two team names, **VS** (or the score once the match has one)
and the format. The current match gets a brighter border. Untick **Show scores** to always show VS.
Names and scores come from your match list, so they stay up to date. Rows shrink to fit the Height
you set.

---

## 10. Position, size and style

Every screen has two more tabs.

### Position & size

One row per element on that screen. Each can be shown or hidden, moved (**X**, **Y**), and resized
(**Size**, plus **Width / Height** where it applies). The canvas is **1920 × 1080**. Sizes are
independent: changing the score size does not scale anything else. Position and size are saved per
screen, so each page, bracket, table and schedule has its own layout. Each screen also has an optional
**background image** with size and position.

### Colors & style

- **Quick looks**: _Minimal_, _Modern_, _Broadcast_ and your own **Custom** (save any page's look,
  then apply it). Apply to **this page** or **all pages** (you are asked to confirm). A look only
  changes style, never your teams, scores or images.
- **Font** (any installed font name), weight, letter spacing
- **Colors**: text, team names, scores/timer, accent/border, panel
- **Panel**: opacity, border thickness, corner radius, glow, shadow, overall opacity

The **⚙ Backup & settings** menu has an **Animations** switch (score pop, fade between screens,
countdown blink).

---

## 11. Saving, backups and your data

- **Where data lives:** in your browser's **IndexedDB** (no size problems with big images, unlike
  localStorage). The app asks the browser to keep it permanently.
- **Autosave:** every change is saved shortly after you stop typing. The top bar shows
  `💾 Last saved 14:32:05`, `⏳ saving…`, or a red `NOT SAVED` message with the reason.
- **Survives:** refresh, closing the browser, and restarting the computer.
- **No stale overwrites:** every saved state has a revision number and a page only accepts a newer
  one. If you open two Control tabs, the newer change wins in both.
- **If storage is blocked** (for example a private window) you can continue in "memory only" mode,
  with a clear warning. Nothing is saved then.

### Backups (do this regularly)

Open **⚙ Backup & settings**:

- **Save configuration** downloads `tournament-backup-YYYY-MM-DD.json` with _everything_
  (matches, screens, brackets, tables, schedules, images, styles).
- **Load configuration** restores a backup (after a confirmation). It also accepts an old
  `data/state.json` from the earlier server-based version.
- **Reset everything** erases all data and restores the sample project (after a confirmation).

> **Clearing your browser's site data deletes your tournament.** Export a backup before big events and
> after each day of a multi-week tournament.

---

## 12. A typical tournament day

1. **Morning:** add every match of the day under ① and fill in teams and logos. Create a
   **Today's matches** screen and add them with times.
2. **Before the stream:** show _Starting soon_ and use **Count down to clock time** `22:00` (or your
   start time).
3. **During a match:** switch OBS to your game scene and hide the overlay (key `0`), or keep a
   scoreboard page on air.
4. **After each map:** press **+1** for the winner and show _Break 1_. It shows the series score,
   the next-map info line and the countdown. Press **▶ Start** on the timer.
5. **Between matches:** press **Next match →** (or **Make current** on a specific one). Break pages now
   show the next teams at 0–0.
6. **Preparing ahead:** click a later match and edit it. Nothing on stream changes until you make it current.
7. **Group stage / knockouts:** show the **table** or **bracket** screen between matches.
8. **End of day:** **Save configuration** to download a backup.

---

## 13. Keyboard shortcuts

Shortcuts work whenever the focus is **not** in a text box or dropdown (click an empty area first).

| Key     | Action                                                               |
| ------- | -------------------------------------------------------------------- |
| `1`–`9` | Show the 1st–9th page from **② Your pages** (banner pages count too) |
| `0`     | Hide the overlay (OBS shows nothing)                                 |

Bracket, table and schedule screens are not numbered; use their **▶ Show** buttons.

---

## 14. Troubleshooting

**The overlay in OBS is blank.**
OBS has its own browser storage. Run the Control Panel as an **OBS dock** (see [section 2](#2-setting-it-up-in-obs-read-this)).
Also check the URL is exactly `http://localhost:5173/#overlay` and the Control Panel was opened
first so it has saved data. Make sure a screen is **on air** (not "Hide overlay").

**Changes in Chrome do not reach OBS.**
Different browser profiles do not share data. Use the OBS dock.

**`Error: Port 5173 is already in use`.**
The app refuses to move to another port on purpose. Close the other copy (or whatever uses 5173), then
run `npm run dev` again.

**My tournament "disappeared".**
You are probably on a different address. Check you are using `http://localhost:5173` (not
`127.0.0.1`, not another port), and the same browser or OBS dock as before. Clearing site data also
deletes it. Restore with **Load configuration**.

**"Could not open the local database".**
Private/incognito windows or strict privacy settings can block IndexedDB. Use a normal window, or
continue in memory-only mode and export often.

**`Failed to resolve import "./src/model"`.**
Your files are in the wrong place. `Control.tsx` and `Overlay.tsx` must be inside `src/` and import
`./model`. Check the folder structure in [section 15](#15-project-structure-and-architecture).

**A button seems to do nothing.**
Confirmations appear as in-page dialogs in the middle of the screen; look for a dialog asking
_Yes / Cancel_. Some actions are intentionally blocked with a message (for example deleting your last match).

**The overlay shows a white or black box in OBS.**
Remove any custom CSS you added to the Browser Source and do not tick "Local file". The overlay
itself is transparent.

**A font does not look right.**
Fonts must be installed on the computer running OBS. Type the exact name in _Colors & style → Font_.

**Images look blurry.**
Images are downscaled on import (banners/backgrounds to 1920 px, logos to 512 px). Use images at
least that large.

**The page is wider than my screen.**
The panel is built for desktop windows of about 1280 px or wider. Under 1400 px the previews move
below the editor.

---

## 15. Project structure and architecture

```
LIVE-SCORE/
├── index.html
├── package.json            scripts: dev, start
├── tsconfig.json
├── vite.config.ts          frontend only, fixed port 5173
├── README.md
├── data/state.json         legacy file from the old server version (no longer used; import it
│                           with "Load configuration" if you have old data)
└── src/
    ├── main.tsx            opens the Control Panel, or the Overlay when the URL has #overlay
    ├── model.ts            data model, defaults, presets, migration of old saves
    ├── Control.tsx         the Control Panel
    ├── Overlay.tsx         the transparent overlay shown in OBS
    ├── styles.css          overlay styles + control-panel styles (clearly sectioned)
    ├── storage/
    │   ├── db.ts           IndexedDB: initDB, loadState, saveState, clearState, loadOrInit
    │   └── sync.ts         BroadcastChannel publish/subscribe + the Overlay's useSharedState hook
    ├── bracket/
    │   ├── bracket.ts      bracket logic (manual + automatic, advancing winners)
    │   └── BracketPanel.tsx
    ├── table/
    │   ├── table.ts        round-robin fixtures, standings, status, champion
    │   └── TablePanel.tsx
    └── schedule/
        └── SchedulePanel.tsx
```

### Why no backend?

The goal is that anyone can download the project, run two commands and run a tournament. So all data
lives in the browser, with two native APIs:

- **IndexedDB** stores the whole state (images included) and is the source of truth.
- **BroadcastChannel** pushes every change from the Control Panel to the Overlay instantly. As a safety
  net the Overlay also re-reads a tiny revision number from IndexedDB every 2 seconds.

Vite only serves the frontend. The trade-off is the one explained in [section 2](#2-setting-it-up-in-obs-read-this):
both pages must run in the same browser profile, which in OBS means using a dock.

> > > > > > > main

### Data model (`src/model.ts`)

## <<<<<<< feature/upcoming

>>>>>>> ce3b0b761e87ba6539ed9bd129863826c1bd5dba
## 🔮 Future improvements

- Automatic game result integration
- Game API integrations
- Player statistics
- Round/map statistics
- Remote control panel
- Cloud synchronization
- Multiple overlay themes
- Sponsor/advertisement slots
- Stream alerts
- Animated team introductions

---

## 🤝 Contributing

=======

<<<<<<< HEAD
If you find a bug or have an idea for a new feature, feel free to [open an issue](https://github.com/Divyansh-3/LIVE-SCORE/issues/new) or submit a pull request.

---
=======
```
State
├── pages[]      screens. Each Page has a scene (layout + style + background + timer) and,
│                depending on its kind:  (normal page) · 'banner' · 'bracket' (bracket) ·
│                'table' (table) · 'schedule' (schedule)
├── matches[]    Match { teams, scores, format, tournament, optional stage tag, banner }
├── curId        the current match
├── airId        the screen on OBS (null = nothing)
├── custom       your saved "Custom" look
├── anim         animations on/off
└── rev          revision number (newer wins; used for sync and saving)
```
>>>>>>> ce3b0b761e87ba6539ed9bd129863826c1bd5dba

Old saves are upgraded automatically on load (`migrate()`), including the earlier single-match
format and the earlier single shared bracket.

### Overlay rendering

The overlay is drawn on a fixed **1920 × 1080** stage that is scaled to fit the Browser Source, so
resizing the source keeps proportions. Elements are absolutely positioned from the values in
_Position & size_. Which screen it draws is `airId`. A preview URL such as
`/#overlay&page=<screen id>` draws a specific screen (this is how the editor preview works).

> > > > > > > main

---

<<<<<<< feature/upcoming
If you find a bug or have an idea for a new feature, feel free to [open an issue](https://github.com/Divyansh-3/LIVE-SCORE/issues/new) or submit a pull request.

---

=======

## 16. Development

> > > > > > > main

```bash
npm install
npm run dev          # http://localhost:5173
```

- Stack: React 18, TypeScript 5, Vite 5. No other runtime dependencies.
- Pure logic is kept out of components so it can be tested without a browser:
  `src/bracket/bracket.ts`, `src/table/table.ts` and the migration code in `src/model.ts`.
- During development, the bracket, table, migration and schedule-model logic was exercised with Node
  scripts (every table size 4–16, round-robin fairness, standings and tie-breaks, winner advancement,
  migration of old saves). The UI, IndexedDB sync and OBS behaviour were **not** covered by automated tests.
- Type-check: `npx tsc --noEmit` (the repo's `tsconfig.json` is already set up).

Handy places to customise:

- Default look and layouts: `STYLE`, `PRESETS`, `*_LAYOUT` in `src/model.ts`
- Sample data: `mkState()` in `src/model.ts`
- Overlay drawing: `src/Overlay.tsx`
- Panel colours and column widths: the variables at the top of the Control Panel section of `src/styles.css`

---

## 17. Known limitations

- **One browser profile only.** Control Panel and Overlay must share it (use the OBS dock).
- **Desktop tool.** The Control Panel is not designed for phones or tablets.
- **One Control tab is recommended.** Several tabs stay in sync, but one is simpler.
- **No login or multi-user editing.** It is a single-operator tool.
- **Brackets cannot be duplicated** (create a new one). Points tables and schedules can.
- **Points tables** have their own teams and are not linked to the match list or its scores.
- **Points tables support only the sizes 4, 6, 8, 10, 12, 14 and 16**, single or double round-robin.
  A 16-team home-and-away table has 240 matches.
- **Brackets are single elimination.** Double elimination is not implemented.
- **Backups include images**, so files can be large if you use big banners.

---

## 18. Contributing and license

Issues and pull requests are welcome. Please keep the project local-first (no required backend, no
accounts) and keep new features separate from existing ones (add a module, avoid redesigning
unrelated screens).

**License:** add your license here (for example MIT) before publishing.

**Credits:** built with [React](https://react.dev), [Vite](https://vitejs.dev) and
[TypeScript](https://www.typescriptlang.org). No third-party broadcast branding is used or implied.
