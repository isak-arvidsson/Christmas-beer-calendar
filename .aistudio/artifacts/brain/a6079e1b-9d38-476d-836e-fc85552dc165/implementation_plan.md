# Julölskalendern — Christmas Beer Tasting Calendar & Leaderboard

A warm, festive Scandinavian Christmas beer advent calendar application for Isak, Ingrid, Gustav, and Louise to taste, rate (0.0–10.0), and rank 24 Swedish holiday beers throughout December, complete with a real-time chromatic rating slider, Google Sheet sync, and a live leaderboard.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following requirements and user clarifications guide this implementation:

- **Google Sheet Sync**: Configured for automatic and on-demand synchronization via a public Google Sheet CSV export web link, with pre-loaded defaults for all 24 beers from the attached Systembolaget list.
- **Calendar Navigation**: Flexible navigation allows jumping to any day (1–24) at any time to inspect beers or backfill/preview ratings, while highlighting the current December day.
- **Tasting Granularity**: Ratings feature a 0.0–10.0 decimal slider that changes color from frosty cool blues (0.0–4.0) to warm golds (4.1–7.0) to deep Christmas berry reds (7.1–10.0), paired with optional flavor tags and tasting notes.
- **Participants**: Pre-configured profiles for the 4 testers: **Isak**, **Ingrid**, **Gustav**, and **Louise**, with one-click switcher and completion indicators showing when all 4 have rated a beer.

---

## 1. Overview & Core Concept

- **What It Does**: A 24-day advent calendar where the 4 friends log their daily Christmas beer scores, compare individual tastes, discover beer profiles from Swedish craft breweries, and see which brew claims the Christmas crown on the Leaderboard.
- **Target Audience**: The tasting quartet (Isak, Ingrid, Gustav, Louise) tasting beers together or logging asynchronously from their phones and laptops.
- **Key Value**: Replaces chaotic group chats with a dedicated, festive, real-time advent dashboard that tracks every sip, computes fair average scores, and keeps the beer roster synchronized with a Google Sheet.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **User Identity Selection**:
   - On opening the app, a prominent persona switcher lets the user pick who is tasting (Isak, Ingrid, Gustav, Louise) or switch seamlessly at any time from the top bar.
2. **Daily Tasting (Day View)**:
   - Displays the selected day's beer (e.g., Day 6: *Kosta Julöl*), brewery name, style, ABV %, Systembolaget link, and high-res festive imagery.
   - Real-time 0.1-step slider (0.0 to 10.0) with dynamic intensity visualization:
     - `0.0 – 3.9`: Frosty Nordic Ice Blue (`#38bdf8` to `#0284c7`)
     - `4.0 – 6.9`: Warm Spiced Amber & Festive Gold (`#f59e0b` to `#d97706`)
     - `7.0 – 10.0`: Deep Scandinavian Holiday Red & Crimson (`#e11d48` to `#991b1b`)
   - Optional quick flavor tags (e.g., *Malty, Spiced, Roasted, Caramel, Pine, Citrus, Dark Fruit, Chocolate, Smoked*) and short tasting notes.
   - Shows other testers' scores once submitted (or live toggle to reveal/hide to avoid bias before tasting).
3. **Advent Calendar Overview**:
   - 24-door advent grid view with card states:
     - Day number, beer name, brewery, and bottle artwork.
     - Average score badge (e.g. `8.4 / 10.0`).
     - "Rated by Everyone" indicator (4 avatar checkmarks: Isak, Ingrid, Gustav, Louise).
     - Filter tabs: All (24), Fully Rated, Pending My Rating, Top Rated.
4. **Leaderboard View**:
   - Podium for Top 3 Christmas beers (Gold, Silver, Bronze crown motifs).
   - Ranked list of all 24 beers sorted by average score, showing breakdown of Isak, Ingrid, Gustav, and Louise's individual scores, standard deviation / agreement rating, and favorite flavor notes.
5. **Google Sheets Sync Hub**:
   - Modal/drawer to inspect sync status, configure the public Google Sheet CSV URL, preview columns (`Day, Brewery, BeerName, Style, ABV, ImageUrl, Notes, SystembolagetUrl`), and trigger instant sync or export current ratings.

### Visual Identity & Theme

- **Aesthetic Direction**: *Nordic Hygge & Festive Brewcraft* — rich, cozy Scandinavian winter warmth with dark slate/forest green depths, warm paper card surfaces, gold/amber highlights, and festive crimson accents.
- **Color Palette**:
  - Dominant Canvas (60%): Deep Pine Charcoal (`#0c1412` to `#111b18`) with subtle frosted glass surfaces.
  - Structural Surfaces (30%): Rich dark spruce containers (`#162320`) with hairline golden/amber borders (`rgba(245, 158, 11, 0.15)`).
  - Accent Budget (10%): Warm Nordic Red (`#dc2626`), Spiced Gold (`#f59e0b`), and Frost Ice (`#38bdf8`) strictly at interactive touchpoints.
- **Typography & Hierarchy**:
  - Display Font: `Plus Jakarta Sans` / `Cinzel` serif accents for advent numerals and brand headers.
  - Body Font: `Plus Jakarta Sans` for clean, highly legible Scandinavian typography.
  - Tabular Numerals: Tabular figures (`tabular-nums font-mono`) for all scores (e.g. `8.7`, `10.0`).
- **Interactive Feedback**:
  - Tactile spring transitions when sliding ratings.
  - Confetti / snowfall burst animation when a beer is rated 10.0 or when all 4 participants complete a day.

---

## 3. Key Product Decisions & Trade-Offs

- **Google Sheets Integration**:
  - *Chosen Approach*: Direct parsing of Google Sheets Published-to-Web CSV URL, backed with an automatic fetcher, plus full offline-resilient local caching in `localStorage`.
  - *Why*: Gives instant, frictionless two-way compatibility without requiring Google Cloud Console API credentials or OAuth approval barriers from each user, while allowing the owner to edit beer metadata directly in Google Sheets.
  - *Seed Data*: Pre-populated with the 24 actual Swedish beers from the provided Systembolaget attachment, ensuring immediate out-of-the-box readiness even before any Google Sheet URL is entered.
- **Multi-User Rating Simulation on Shared Device & Persistence**:
  - *Chosen Approach*: Single-tap persona toggle in top bar (Isak, Ingrid, Gustav, Louise). Each user's rating is stored independently under their key.
  - *Why*: Advent beer tasting typically happens together around the table or passing a phone/laptop around, making rapid profile switching essential.
- **Anti-Bias Reveal Mode**:
  - *Chosen Approach*: Users can choose "Blind Tasting Mode" where other testers' scores for the day remain masked until the active user inputs their own score.
  - *Why*: Prevents score anchoring and keeps the competition exciting and honest.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Bar & Navigation                           │
│  [ Julölskalendern 2026 ] · [Calendar | Today | Leaderboard | Sync]    │
│  [ Active Persona Switcher: (Isak | Ingrid | Gustav | Louise) ]        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Day / Tasting  │      │  Advent Calendar │      │   Leaderboard    │
│       View       │      │     Overview     │      │     Ranking      │
│ ──────────────── │      │ ──────────────── │      │ ──────────────── │
│ • Prev/Next Day  │      │ • 24 Advent Doors│      │ • Top 3 Podium   │
│ • Beer Profile   │      │ • Average Score  │      │ • Full 24 Table  │
│ • 0.0-10.0 Slider│      │ • 4-Avatar Ticks │      │ • Tester Spreads │
│ • Color Gradient │      │ • Filter & Search│      │ • Best in Class  │
│ • Flavor Tags    │      └──────────────────┘      └──────────────────┘
│ • Notes & Reveal │
└─────────┬────────┘
          │
┌─────────▼──────────────────────────────────────────────────────────────┐
│                    State & Persistence Layer                           │
│  • LocalStorage (Ratings, Active User, Custom Beers, Tasting Notes)    │
│  • Google Sheets CSV Engine (Auto-fetch, schema mapper, export CSV)    │
│  • 24 Preloaded Swedish Beers (From Systembolaget attachment)          │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Types

```typescript
export type TesterId = 'isak' | 'ingrid' | 'gustav' | 'louise';

export interface Tester {
  id: TesterId;
  name: string;
  avatarColor: string;
  shortName: string;
}

export interface BeerDay {
  day: number; // 1 to 24
  brewery: string;
  name: string;
  style: string;
  abv: number;
  imageUrl?: string;
  systembolagetUrl: string;
  description?: string;
}

export interface UserRating {
  score: number; // 0.0 to 10.0
  notes?: string;
  flavorTags?: string[];
  ratedAt: string;
}

export interface DayRatingRecord {
  day: number;
  ratings: Partial<Record<TesterId, UserRating>>;
}
```

### Interactive Component & State Mapping

- **`ActivePersonaBar`**: Switches active user state; re-renders sliders and unrated badges instantly.
- **`RatingSlider`**: Controlled SVG/range track with dynamic CSS color interpolation (`cool blue -> amber gold -> holiday red`), numeric readout with `0.1` precision, and quick step buttons (`-0.5`, `+0.5`).
- **`DayNavigator`**: Fast prev/next day arrow controls and December date quick-jump picker.
- **`LeaderboardView`**: Recalculates averages dynamically upon rating changes, with sorting by overall average, highest single rating, or agreement index.
- **`GoogleSheetSyncModal`**: Handles custom sheet URL validation, CSV parsing with fallback error boundaries, and one-click data re-sync.
