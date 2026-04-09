# MAX Registration System 3.0

> A modern, user-centric redesign of the PASSHE (MAX/Banner) university course registration system. Built as the capstone semester project for **ITAN 440: Human-Computer Interaction** at Millersville University.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)

## Design & Research
* **Figma Prototype:** [View the original UI/UX Design](https://www.figma.com/design/QyS9gZH7ZuSmkajD9fq5xW/Course-Registration-Dashboard)
* **Contextual Inquiry:** Based on user interviews and a quantitative survey of 31 undergraduate students identifying critical usability flaws in the legacy system.

---

## The Problem: Cognitive Overload
The current legacy registration system relies on a "database-first" architecture that severely limits the student experience. Through our HCI research, we identified several major friction points:
* **Workflow Fragmentation:** 75% of surveyed students keep 3 or more browser tabs open simultaneously just to build a schedule. 
* **High Cognitive Load:** Text-based scheduling forces students to do mental math to check for time conflicts, or rely on external tools like Apple Calendar and physical paper.
* **Delayed Error Feedback:** 71% of users reported that crucial errors (like missing prerequisites or advising holds) occur too late in the workflow, often not triggering until checkout.

## Our Solution: The Unified Dashboard
MAX 3.0 redesigns the registration flow into a single, cohesive workspace that prioritizes visual planning and proactive error prevention. 

### Key HCI Features
* **Split-Pane Architecture:** A searchable course library lives on the left, while a live weekly schedule grid sits on the right. No more tab-jumping.
* **Visual Scheduling:** Students can add courses and immediately see them populated as color-coded blocks on the calendar grid. 
* **Global Action Banners:** A persistent, dismissible alert banner proactively warns students of active Advising Holds *before* registration opens.
* **Smart Format Badges:** Clear visual indicators (e.g., "🌐 Online" vs "🏫 In-Person") prevent students from accidentally registering for the wrong course format.
* **Intelligent Error Prevention:** Visual padlocks and real-time conflict warnings replace intrusive, jargon-heavy pop-up modals.

---

## Tech Stack
This high-fidelity interactive prototype is built with modern web technologies:
* **Framework:** React / Next.js
* **Styling:** Tailwind CSS (Custom Millersville University brand configuration)
* **Icons:** Lucide-react
* **Interactions:** `@dnd-kit/core` (for drag-and-drop scheduling logic)

## Getting Started

### Prerequisites
- **Node.js** (version 16 or higher) — [Download here](https://nodejs.org/)
- **Visual Studio Code** — [Download here](https://code.visualstudio.com/)
- **Git** (optional, for cloning the repository)

### Opening the Project in VS Code

1. **Clone or download the repository:**
   ```bash
   git clone <repository-url>
   cd "MU Registration 3.0"
   ```
   Or simply open the folder in VS Code by dragging it to the VS Code window.

2. **Open the project in VS Code:**
   - Launch VS Code
   - Use `File > Open Folder...` and select the project directory
   - Or use the terminal: `code .`

3. **Install dependencies:**
   Open the integrated terminal in VS Code (`Ctrl+`` or `Cmd+`` on Mac) and run:
   ```bash
   npm install
   ```
   This installs React, Vite, and all required dependencies.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will automatically open in your browser at **http://localhost:5173**

5. **View and edit the code:**
   - The main app component is located in `src/App.jsx`
   - Styles are in `src/styles.css`
   - Any changes you make will automatically refresh in the browser (hot module reloading enabled)

### Build for Production
To create an optimized production build:
```bash
npm run build
```
The output will be in the `dist/` folder.
 ITAN 440 Project Deliverables
This repository houses the prototype for our course milestone deliverables:

[x] Milestone 1: Contextual Inquiry & Personas

[x] Milestone 2: Design Exploration & Storyboarding

[x] Milestone 3: Early Interactive Prototype (This codebase)

[ ] Milestone 4: Final Presentation & Usability Study

# The Team
Tyler Brown

Norah Symone

Natalie Henry

Dana Maxwell

Nick Filemyr
