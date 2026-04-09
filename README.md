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
To run this prototype locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/max-registration-3.0.git](https://github.com/yourusername/max-registration-3.0.git)
Install dependencies:

Bash
cd max-registration-3.0
npm install
Run the development server:

Bash
npm run dev

# View the application:
Open http://localhost:3000 in your browser.
 ITAN 440 Project Deliverables
This repository houses the prototype for our course milestone deliverables:

[x] Milestone 1: Contextual Inquiry & Personas

[x] Milestone 2: Design Exploration & Storyboarding

[x] Milestone 3: Early Interactive Prototype (This codebase)

[ ] Milestone 4: Final Presentation & Usability Study

# The Team
Tyler Brown

[Team Member 2 Name]

[Team Member 3 Name]

[Team Member 4 Name]

[Team Member 5 Name]
