# Integrating SMA Putra Nirmala Website Agenda ("Website")

Integrate live agenda items from `https://sma.putranirmala.sch.id/index.php/agenda` into the calendar and dashboard as a dedicated `Website` category with dedicated badges, banner cards, and calendar indicators.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Confirmed Fetch Strategy**: Backend scraper proxy (`/api/website-agenda`) fetching and parsing HTML live from SMA Putra Nirmala website with robust in-memory caching and fallback handling.
> - **Confirmed UI Display**: Dedicated Website agenda badges, banner cards (`WebsiteAgendaBanner`), and calendar indicator dots (`Website` indigo/cyan color accent).

---

## 1. Overview & Core Concept

- **What It Does**: Scrapes and parses the official SMA Putra Nirmala school agenda (`https://sma.putranirmala.sch.id/index.php/agenda`), extracts events with dates, categories, time, and descriptions, and integrates them seamlessly into the calendar and daily schedule view.
- **Key Value**: Keeps students synchronized with official school-wide events published on the school website without manual entry.

---

## 2. User Experience & Visual Design

- **Visual Theme**: Uses distinctive Indigo/Cyan styling (`bg-indigo-50 text-indigo-900 border-indigo-200`, indigo dot on calendar) to clearly distinguish official Website agenda items from iCal and SITATIB items.
- **Banner Component**: `WebsiteAgendaBanner.tsx` displays active website agenda items for the selected day with category tags, time ranges, and descriptions.
- **Calendar Indicator**: Adds a dedicated indigo indicator dot on calendar cells where website agenda items occur, plus tooltips.

---

## 3. Key Technical Architecture

```
┌─────────────────────────────────┐       ┌───────────────────────────────┐
│  Backend Scraper (/api/agenda)  │──────▶│ Parse HTML (<article class="..")│
└─────────────────────────────────┘       └──────────────┬────────────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────┐       ┌───────────────────────────────┐
│ Frontend App (websiteAgendaByDate)│◄────│ JSON Response w/ Parsed Items │
└─────────────────────────────────┘       └───────────────────────────────┘
```

- **Backend (`backend/server.js` or dedicated service)**: Fetches HTML from `https://sma.putranirmala.sch.id/index.php/agenda`, parses articles (`.agenda-detail`), dates, categories (`.agenda-category`), ranges (`.agenda-range`), titles (`h4`), and descriptions (`p`), returning structured JSON.
- **Frontend**: Adds `websiteAgendaByDate` to `ClassDataStore`, updates `CalendarSection` with a `Website` calendar indicator dot, and renders `WebsiteAgendaBanner` on the active schedule view.
