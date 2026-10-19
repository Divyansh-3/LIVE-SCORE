import { useEffect, useState, type ReactNode } from "react";

// TODO: put your own links here before you publish the repo
const REPO = "https://github.com/Divyansh-3/LIVE-SCORE";
const EMAIL = "divyanshra75@gmail.com";

const KEY = "scoreboard:welcome-seen";

/** true when the app runs on the person's own computer/network (the downloaded zip),
 *  false when it is opened from a public website */
function isLocalInstall(): boolean {
  const h = location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "[::1]" ||
    h.endsWith(".local") ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)
  );
}

/** true = do NOT auto-open the welcome box.
 *  It only opens automatically on a local install, once per browser.
 *  Everyone can still reopen it from ⚙ Backup & settings → Welcome / help. */
export function welcomeSeen(): boolean {
  if (!isLocalInstall()) return true; // public website: never auto-show
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true; // storage blocked: don't show it on every load
  }
}

const copy = (t: string) => navigator.clipboard?.writeText(t);

function LinkBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="txt">
      <span>{label}</span>
      <input readOnly value={value} onFocus={(e) => e.target.select()} />
      <button onClick={() => copy(value)} title="Copy the link">
        Copy
      </button>
    </div>
  );
}

function Keys({ rows }: { rows: string[][] }) {
  return (
    <table>
      <tbody>
        {rows.map(([k, d]) => (
          <tr key={k}>
            <td style={{ paddingRight: 16, whiteSpace: "nowrap" }}>
              <b>{k}</b>
            </td>
            <td>{d}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Welcome({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    onClose();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);

  const link = location.origin + "/#overlay";
  const ctl = location.origin + "/";

  const STEPS: [string, ReactNode][] = [
    [
      "Welcome 👋",
      <>
        <p>
          This is a free scoreboard for your stream. You control it from one
          page, and it shows on your stream as a transparent overlay. No
          account, no internet service, and your data stays on your computer.
        </p>
        <p>Setup takes about five minutes and has three parts:</p>
        <ol>
          <li>Add the overlay and the control panel to OBS (once).</li>
          <li>Enter your teams and choose what to show.</li>
          <li>Change scores while you play.</li>
        </ol>
        <p className="hint">
          Use <b>Next</b> to read the full guide, or <b>Skip</b> to start. You
          can reopen this guide any time from ⚙ Backup &amp; settings → Welcome
          / help, and jump to any topic with the menu below.
        </p>
      </>,
    ],
    [
      "How it works",
      <>
        <p>There are two pages, and they talk to each other:</p>
        <ul>
          <li>
            <b>Control</b> (this page): where you click buttons and type.
          </li>
          <li>
            <b>Overlay</b> (the link ending in <b>/#overlay</b>): what viewers
            see. It is added to OBS as a Browser Source and is transparent, so
            your game shows through.
          </li>
        </ul>
        <p>Three ideas to know:</p>
        <ul>
          <li>
            <b>Matches</b> hold team names, logos, format and the score. One
            match is the <b>current</b> match.
          </li>
          <li>
            <b>Pages</b> are screens (break screens, banners, brackets, tables,
            lists). Only one page is <b>on air</b> at a time, or none.
          </li>
          <li>
            The score belongs to the match, so it shows on every page that
            displays that match.
          </li>
        </ul>
        <p className="hint">
          The two preview boxes on the right show exactly what OBS shows now,
          and the page you are editing. A checkerboard means transparent.
        </p>
      </>,
    ],
    [
      "1. Add the overlay",
      <>
        <ol>
          <li>
            In OBS, under <b>Sources</b>, click <b>+</b> and choose{" "}
            <b>Browser</b>.
          </li>
          <li>Name it "Scoreboard" and click OK.</li>
          <li>
            Paste this link into the <b>URL</b> field:
          </li>
        </ol>
        <LinkBox label="Overlay link" value={link} />
        <ol start={4}>
          <li>
            Set <b>Width 1920</b> and <b>Height 1080</b>.
          </li>
          <li>
            Leave Custom CSS as it is. The background is already transparent.
          </li>
          <li>Click OK and place the source above your game capture.</li>
          <li>
            Keep it at full size: the Control page moves and resizes things for
            you, so do not stretch the source in OBS.
          </li>
        </ol>
        <p className="hint">
          Nothing shows yet. That is normal: no page is on air until you press{" "}
          <b>▶ Show</b> in Control.
        </p>
      </>,
    ],
    [
      "2. Open Control inside OBS",
      <>
        <p>
          <b>Important:</b> OBS has its own built-in browser with its own
          storage. Control must run in that same browser, or the overlay will
          not see your changes.
        </p>
        <ol>
          <li>
            In OBS, open <b>Docks → Custom Browser Docks…</b>
          </li>
          <li>Name it "Scoreboard Control" and paste this address:</li>
        </ol>
        <LinkBox label="Control link" value={ctl} />
        <ol start={3}>
          <li>
            Click <b>Apply</b>. The control panel appears as a window inside
            OBS. Drag it to a big area or make it float.
          </li>
          <li>Run your whole show from that dock.</li>
        </ol>
        <p className="hint">
          Use the exact same web address for the dock and the overlay (for
          example both "localhost", never one "localhost" and one "127.0.0.1").
          Controlling from Chrome or Edge will not update OBS, because they keep
          separate data. In Streamlabs Desktop, use its custom browser dock
          option if your version has one.
        </p>
      </>,
    ],
    [
      "3. Set up your match",
      <>
        <p>
          In <b>① Matches today</b> click a match, then open the{" "}
          <b>Teams &amp; match</b> tab:
        </p>
        <ul>
          <li>
            <b>Tournament</b>: the event name shown on the scoreboard.
          </li>
          <li>
            <b>Format</b>: BO1, BO3, BO5 or BO7. This decides how many wins make
            a series winner.
          </li>
          <li>
            <b>Stage tag</b>: for example "Semi Final". Pick from the list or
            type your own.
          </li>
          <li>
            <b>Banner for THIS match</b>: an image used by break pages that have
            no banner of their own.
          </li>
          <li>
            <b>Team A / Team B</b>: name, short name and logo. Logos are resized
            automatically and keep transparency (PNG or WEBP).
          </li>
        </ul>
        <p>
          Use <b>+ New match</b>, <b>Duplicate</b> and <b>↑ ↓</b> to build the
          day's list. Press <b>Make current</b> on a match to put it on the
          scoreboard. If you edit a match that is not current, a yellow note
          tells you OBS is not showing it.
        </p>
      </>,
    ],
    [
      "4. Show a page on air",
      <>
        <p>
          <b>② Your pages</b> are the screens viewers see. Click a page to edit
          it, press <b>▶ Show</b> (or its number key) to put it on OBS. The top
          bar always says what is on air. <b>Hide overlay</b> (key 0) shows
          nothing.
        </p>
        <p>
          On the <b>This page</b> tab of a normal page you can set:
        </p>
        <ul>
          <li>
            <b>Big title</b>, <b>Line above timer</b>, <b>When timer hits 0</b>{" "}
            and <b>Info line</b> (for example "Next map: Bind").
          </li>
          <li>
            <b>Match shown</b>: follow the current match automatically, or lock
            this page to one match.
          </li>
          <li>
            Tick or untick <b>Show countdown</b> and <b>Show scoreboard</b>.
          </li>
          <li>
            <b>Default banner</b>: used when the match has no banner.
          </li>
        </ul>
        <p>
          A <b>banner page</b> (image only) shows just one picture. Choose "Fill
          the screen" or "Show the whole image". Use <b>+ New page</b>,{" "}
          <b>Duplicate</b>, <b>↑ Up</b> and <b>↓ Down</b> to organise.
        </p>
        <p className="hint">
          Number keys 1–9 match the numbers in the Your pages list.
        </p>
      </>,
    ],
    [
      "5. Countdown timer",
      <>
        <p>
          Every page that shows a countdown has its own timer, found under{" "}
          <b>COUNTDOWN</b> on the <b>This page</b> tab.
        </p>
        <ul>
          <li>
            <b>▶ Start / Resume</b>, <b>⏸ Pause</b> and <b>↺ Reset</b>.
          </li>
          <li>
            <b>+10s / −10s</b> adds or removes time, even while it is running.
          </li>
          <li>
            <b>Set time</b>: pick 00:30, 01:00, 02:00 or 05:00, or type your own
            like 03:30 and press Set.
          </li>
          <li>
            <b>Count down to clock time</b>: type a 24-hour time such as 22:00
            (10 PM) and press Start. If that time has already passed today it
            counts to tomorrow.
          </li>
        </ul>
        <p>
          While the page is on air, press <b>Space</b> to start or pause its
          timer. When it hits zero, the text from "When timer hits 0" appears.
        </p>
      </>,
    ],
    [
      "6. Scoring and series",
      <>
        <p>
          The strip at the top always shows the <b>current match</b>:
        </p>
        <ul>
          <li>
            <b>+1</b> and <b>−1</b> buttons per team, or the keyboard: ← adds to
            Team A, → adds to Team B, and Shift makes it −1.
          </li>
          <li>
            <b>Reset scores</b> sets both teams to 0.
          </li>
          <li>
            <b>Next match →</b> makes the next match in your list current.
          </li>
        </ul>
        <p>
          When one team wins the series (for example 2–0 in a BO3), a trophy bar
          appears with <b>Finish &amp; next match</b> (key Enter). It saves the
          result and moves on, and brackets and tables are updated for you.
        </p>
        <p>
          Prefer hands-off? Open ⚙ Backup &amp; settings and tick{" "}
          <b>Auto-advance finished series</b>. After a few seconds, so viewers
          can see the final score, it moves on by itself. Press undo during the
          wait to cancel it.
        </p>
      </>,
    ],
    [
      "7. Brackets, tables, today's matches",
      <>
        <p>
          Beyond break pages, you can add whole tournament screens. Each one is
          its own page with its own banner and style, and you can add as many as
          you like.
        </p>
        <ul>
          <li>
            <b>🏆 Brackets (③)</b>: knockout brackets, with an upper and lower
            bracket if you use one. Slots link to your matches, so finishing a
            match fills the next round. Use <b>Bracket options</b> to show
            scores or show upper and lower together.
          </li>
          <li>
            <b>📊 Tables (④)</b>: group stages with their own teams, fixtures
            and results. The table works out the standings and the champion. Use{" "}
            <b>⧉</b> to duplicate one, for example Group A to Group B.
          </li>
          <li>
            <b>🗓 Today's matches (⑤)</b>: a list of the day's games with a
            banner and no timer.
          </li>
        </ul>
        <p className="hint">
          Deleting a match that a bracket uses leaves that slot empty until you
          pick another match, and Control warns you first.
        </p>
      </>,
    ],
    [
      "8. Make it look yours",
      <>
        <p>
          Every page has two tabs for design. Changes show instantly in the
          preview.
        </p>
        <p>
          <b>Position &amp; size</b>: each row moves one element. The screen is
          1920×1080, X goes left to right and Y goes top to bottom. Untick{" "}
          <b>show</b> to hide an element. On bracket, table and list screens,
          the Shift buttons nudge them and <b>Center</b> centres them without
          changing the size. You can also add a <b>background image</b> with its
          own size and position.
        </p>
        <p>
          <b>Colors &amp; style</b>: start with <b>Quick looks</b>, pick one,
          and apply it to this page or ALL pages (texts, images and scores are
          kept). Then change the font, weight, letter spacing, colors, panel
          opacity, border, corner radius, glow and shadow. Happy with it?{" "}
          <b>Save current look as Custom</b> and reuse it on other pages.
        </p>
        <p className="hint">
          Fonts must be installed on the computer running OBS. If a font does
          not appear, pick a different one.
        </p>
      </>,
    ],
    [
      "Keyboard shortcuts",
      <>
        <p>Run the show without the mouse:</p>
        <Keys
          rows={[
            ["← / →", "+1 for Team A / Team B"],
            ["Shift + ← / →", "−1"],
            ["Space", "Start or pause the on-air timer"],
            ["1 – 9", "Show that page"],
            ["0", "Hide the overlay"],
            ["Enter", "Finish a won series, go to the next match"],
            ["Ctrl+Z / Ctrl+Y", "Undo / redo"],
          ]}
        />
        <p className="hint">
          Shortcuts are ignored while you type in a text box, so click outside
          it first. Undo covers about 30 steps and never changes what is on air
          or your running timers.
        </p>
      </>,
    ],
    [
      "Stay safe: saving and backups",
      <>
        <ul>
          <li>
            <b>Autosave</b>: every change is saved within a moment. The top bar
            shows "Last saved". A red "NOT SAVED" warning means something is
            wrong, so export a backup straight away.
          </li>
          <li>
            <b>Save configuration</b> (in ⚙ Backup &amp; settings) downloads
            your whole tournament as a file. Do this before big events. Use{" "}
            <b>Load configuration</b> to restore it, even on another PC.
          </li>
          <li>
            <b>Automatic backup folder</b>: if your browser supports it, pick a
            folder once and backups are written there every few minutes, with a
            dated copy every 30 minutes.
          </li>
          <li>
            <b>Reset everything</b> erases all matches, pages and images, so
            think twice. You can undo it.
          </li>
          <li>
            <b>Animations</b> can be switched off in the same menu.
          </li>
        </ul>
        <p className="hint">
          Your data lives inside the browser you used (OBS's browser if you use
          the dock). Clearing that browser's data deletes it, so keep a saved
          configuration file.
        </p>
      </>,
    ],
    [
      "Troubleshooting",
      <>
        <p>
          <b>OBS shows nothing.</b> Check the top bar says "ON OBS NOW" and not
          "shows nothing". Press <b>▶ Show</b> on a page.
        </p>
        <p>
          <b>It shows, but the score or text never changes.</b> You are probably
          controlling from Chrome or Edge instead of the dock inside OBS. Use
          the Control dock (step 2). Also check both links use the same address
          (localhost vs 127.0.0.1). Then right-click the source → Properties →{" "}
          <b>Refresh cache of current page</b>.
        </p>
        <p>
          <b>My teams and pages disappeared.</b> Control and the overlay were
          opened in different browsers, so they have different data. Load your
          saved configuration file in the dock.
        </p>
        <p>
          <b>The overlay looks cut off or the wrong size.</b> The source must be
          1920×1080. Use Position &amp; size inside Control to move things.
        </p>
        <p>
          <b>The font looks different.</b> It is not installed on this PC. Pick
          another font in Colors &amp; style.
        </p>
        <p>
          <b>A shortcut does nothing.</b> You may be typing in a text box. Click
          an empty area first.
        </p>
        <p>
          <b>It says the database is blocked.</b> Close other copies of the app,
          or use "Continue without saving" and export a backup often.
        </p>
      </>,
    ],
    [
      "Help me improve it",
      <>
        <p>
          Thanks for using this scoreboard. I hope it makes your streams easier.
          Got an idea, found a bug, or something confusing? Please tell me. It
          really helps.
        </p>
        <div className="btns">
          <a
            href={REPO + "/issues/new"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button>💡 Suggest a feature</button>
          </a>
          <a href={REPO} target="_blank" rel="noopener noreferrer">
            <button>⭐ Star the project</button>
          </a>
          <a
            href={
              "https://mail.google.com/mail/?view=cm&fs=1&to=" +
              encodeURIComponent(EMAIL) +
              "&su=" +
              encodeURIComponent("LIVE-SCORE feedback")
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <button>✉ Email me</button>
          </a>
        </div>
      </>,
    ],
  ];

  const last = STEPS.length - 1;

  return (
    <div className="wel" onClick={close}>
      <div className="welbox" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <select value={step} onChange={(e) => setStep(+e.target.value)}>
            {STEPS.map(([t], i) => (
              <option key={t} value={i}>
                {i + 1}. {t.replace(/^\d+\.\s*/, "")}
              </option>
            ))}
          </select>
          <span className="hint" style={{ marginLeft: "auto" }}>
            {step + 1} of {STEPS.length}
          </span>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {STEPS.map(([t], i) => (
            <button
              key={t}
              title={t}
              aria-label={`Go to: ${t}`}
              onClick={() => setStep(i)}
              style={{
                flex: i === step ? 2 : 1,
                height: 8,
                padding: 0,
                borderRadius: 4,
                opacity: i <= step ? 1 : 0.35,
              }}
              className={i <= step ? "go" : ""}
            />
          ))}
        </div>

        <h2>{STEPS[step][0]}</h2>
        <div style={{ height: "52vh", overflowY: "auto", paddingRight: 6 }}>
          {STEPS[step][1]}
        </div>

        <div
          className="btns"
          style={{ justifyContent: "space-between", marginTop: 14 }}
        >
          <button onClick={close}>{step === last ? "Close" : "Skip"}</button>
          <span style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}>Back</button>
            )}
            {step < last ? (
              <button className="go" onClick={() => setStep(step + 1)}>
                Next
              </button>
            ) : (
              <button className="go" onClick={close}>
                Let's go
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
