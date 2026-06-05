# The Date Crew (TDC) Matchmaker Dashboard & CRM MVP

A premium, full-stack internal CRM dashboard and algorithmic matchmaking portal designed for **The Date Crew (TDC)** matchmakers to queue assigned clients, evaluate candidate pool compatibility, track matrimonial stages, and draft AI-powered personalized email introductions.

---

## 🚀 Deliverables

* **Live Hosted Link**: [https://data-crew-task.vercel.app](https://data-crew-task.vercel.app/) 
* **GitHub Repository**: [https://github.com/SanjayKetham/Data_Crew_Task](https://github.com/SanjayKetham/Data_Crew_Task)
* **Sample Login Credentials**:
  * **Username**: `matchmaker@datecrew.com`
  * **Password**: `password123`

---

## 📝 Technical Write-up

### Tech Choices
The application is built on a modern React frontend powered by **Vite** for optimized build performance and hot-module reloading. The UI layout uses premium custom Vanilla CSS properties allowing for a curated design system supporting instant light/dark modes and a collapsible sidebar state. The backend is powered by a **Node.js/Express** server storing JSON database records in `db.json` and managing configurations with `dotenv`. 
Crucially, the architecture features a **dual-mode synchronization engine** in `apiClient.js`—meaning if the backend API goes offline, the frontend seamlessly transitions to **Client-Side Local Storage Mode**, executing the compatibility matching rules and local OpenAI API queries directly in the client browser without interrupting the matchmaking workflow.

### Matching Logic & Algorithmic Heuristics
The matching system implements specialized, gender-tailored compatibility algorithms that score matches between 0% and 100%, classifying candidates into *High, Moderate, or Low fit*:
* **For Male Clients**: The rules reward age differences (bias towards slightly younger candidates), height alignment (bias towards shorter candidates), traditional household income margins, aligned values regarding children, diet choices (vegetarian preferences), and geographic proximity/relocation openness.
* **For Female Clients**: The heuristics emphasize career and designation alignment (such as software engineers matching with tech professionals, or product managers with business leaders), academic synergy, family value models (Liberal, Moderate, Traditional), location, diet lifestyle, pet friendliness, and cultural compatibility (religious alignment, caste compatibility, and Manglik astrological status harmony).

### How AI is Used
AI is integrated to automate and personalize the matching communication workflow. The portal invokes OpenAI's `gpt-4o-mini` API to draft highly polished, warm, and tailored matrimonial email introductions. When a matchmaker selects a candidate, the system compiles comprehensive profiles of both the client and the candidate (covering biography summaries, occupations, education, religion/caste, diet, and location) and prompts the LLM to write a bespoke email explaining exactly why the two are compatible. 
If no OpenAI API key is configured or the backend is offline, the application instantly falls back to a custom **Natural Language Generation (NLG) engine** that programmatically constructs personalized email templates client-side.

### Assumptions Made
* **Demographics**: Assumed premium metropolitan Indian matrimonial preferences (utilizing Lakhs Per Annum (LPA) for income, regional caste compatibility, mother tongue preferences, and Manglik astrological checks).
* **CRM Access**: Assumed the system functions as a dashboard for specialized matchmakers (rather than end-users), requiring demo security credentials to access client profiles.
* **API Key Prioritization**: Assumed that if a matchmaker enters a custom OpenAI key in the frontend settings panel, it overrides the server's `.env` configuration to offer flexibility and account control.

---

## 🛠️ Local Installation & Run

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/SanjayKetham/Data_Crew_Task.git
   cd Data_Crew_Task
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run Backend Server**:
   ```bash
   npm run server
   ```

5. **Run Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.
