# 🦸‍♂️ Community Hero — Hyperlocal Civic Issue Platform

Built for the **Coding Ninjas x Google for Developers Vibe2Ship Hackathon 2026**.

**Community Hero** is a next-generation civic tracking application designed to eliminate administrative friction in municipal maintenance. By simply clicking a coordinates location canvas map and uploading an operational image, citizens can report hazardous local infrastructure. The entire categorization, urgency assessment, and operational dispatch process is automated in real-time by artificial intelligence.

---

## 🚀 Live Demo & Repository
## 🚀 Live Demo & Repository
- **Live Production URL:** https://community-hero-abhijeet-iiit.vercel.app
- **GitHub Repository:** https://github.com/Abhijeet-iiit/community-hero
---

## 🧠 Core Engineering & AI Architecture

The entire stack is optimized for production-ready, serverless execution:

1. **Geospatial Processing Engine:** Utilizing a custom React wrapper around the **Leaflet Mapping Interface** to dynamically capture crosshair coordinate arrays (`latitude`, `longitude`) directly from browser mouse clicks, with automated SSR-bypass mechanisms.
2. **Multimodal API Pipeline:** A Next.js API edge route accepts image file payloads converted via `FileReader` into `Base64` strings alongside geographic metrics.
3. **Structured AI Reasoning (Google AI Studio):** Powered by **Gemini 1.5 Flash** using the official `@google/genai` SDK. The model processes the visual data using rigid **JSON Schemas** to prevent predictive drift, enforcing deterministic outputs for data typing.
4. **Relational Data Persistence:** Live structured objects are securely injected directly into a **Supabase PostgreSQL** instance, automatically updating the active global application state hook.

---

## 🛠️ The Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Core system application architecture |
| **Language** | TypeScript | Total application type safety & compile checks |
| **Intelligence** | Gemini 1.5 Flash | Multimodal image processing & structure extraction |
| **Database** | Supabase (PostgreSQL) | Live cloud asset logging & tracking |
| **Map Rendering** | Leaflet Engine | Client-side geospatial coordinate projection |
| **Styling** | Tailwind CSS | Responsive dark-mode telemetry interface |

---

## ✨ Features that Drive Impact

* **Instant Multimodal Inspection:** Gemini automatically detects infrastructure damage types (e.g., Roadwork, Waste Management, Public Safety).
* **Automated Risk Prioritization:** Issues are triaged programmatically from `LOW` to `CRITICAL` based on visible public danger.
* **Operational Dispatch Generation:** Automatically generates precise actionable instructions for city maintenance dispatch crews.
* **Live Telemetry Aggregation:** Active dashboard telemetry recalculates live metrics (Total Hazards, Critical Risks) the second a record is committed.

---

## 🔒 Security & Compliance
All sensitive developer credentials, database paths, and API tokens are fully isolated using server-side environment configurations (`.env.local`). Private tokens are rigorously filtered via root level `.gitignore` protocols, ensuring zero security leaks to public repositories.