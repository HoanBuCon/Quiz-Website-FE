# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: Create React App (react-scripts) + TypeScript + React Router + Tailwind CSS.
- Data layer: localStorage for classes/quizzes; Firebase is initialized but optional (env-driven) and not required to run locally.
- Styling: Tailwind (dark mode via class strategy). Theme and music playback are managed via React Context providers.

Common commands
- Install deps (Node 16+):
  ```bash path=null start=null
  npm install
  ```
- Start dev server (http://localhost:3000):
  ```bash path=null start=null
  npm start
  ```
- Build production assets:
  ```bash path=null start=null
  npm run build
  ```
- Run tests (Jest via react-scripts):
  ```bash path=null start=null
  npm test
  ```
- Run tests once (CI style) and show coverage:
  ```bash path=null start=null
  npm test -- --watchAll=false --coverage
  ```
- Run a single test file or test name:
  ```bash path=null start=null
  # By file pattern
  npm test -- App.test.tsx
  
  # By test name pattern
  npm test -- -t "renders learn react link"
  ```
- Linting: CRA runs ESLint during start/build. No standalone lint script is defined. If you need manual linting:
  ```bash path=null start=null
  # Optional (if ESLint is installed)
  npx eslint src --ext .ts,.tsx
  ```

Key architecture notes
- Application shell and routing
  - Entry: src/index.tsx renders <App/> inside React.StrictMode.
  - Router: BrowserRouter with Routes in src/App.tsx. Two layout patterns:
    - Layout: standard scrollable pages for Home, Classes, Create, Documents, EditQuiz, Quiz, Results.
    - FixedLayout: non-scroll container for EditClass.
  - Toasts: react-hot-toast customized by theme.
  - Background audio: persistent <BackgroundMusic/> mounted outside Routes to avoid resets on navigation.

- State management and theming
  - ThemeContext (src/context/ThemeContext.tsx): dark/light mode via documentElement.classList, persisted in localStorage (key: theme).
  - MusicContext (src/context/MusicContext.tsx): controls music player visibility and play state; Header exposes toggles.

- Data model and storage
  - Types in src/types/index.ts (ClassRoom, Quiz, Question, UploadedFile, etc.).
  - HomePage seeds demo public classes/quizzes at first load; quizzes are also saved to localStorage (key: quizzes) for accessibility across pages.
  - ClassesPage reads/writes classrooms in localStorage (key: classrooms) and maps quizIds to actual quizzes (key: quizzes). Deletions cascade to quizzes but intentionally NOT to documents.

- Document ingestion (quiz creation)
  - Users upload .txt/.json or .docx to generate questions on CreateClassPage/DocumentsPage.
  - Parsing pipeline:
    - src/utils/wordParser.ts: uses mammoth to extract raw text from .docx, normalizes text (cleans bullets/whitespace), and validates expected patterns.
    - src/utils/docsParser.ts: validates and parses canonical text format into ParsedQuestion[]; determines question type (single/multiple/text) based on number of correct answers.
  - Duplicate file handling: src/utils/fileUtils.ts provides checkDuplicateFileName, generateUniqueFileName, and showDuplicateModal to resolve name collisions in a11y-friendly, theme-aware modal.
  - Authoring guides (Vietnamese): HUONG_DAN_DINH_DANG_DOCS.md and HUONG_DAN_FILE_WORD.md detail supported formats and examples; DUPLICATE_FILES_FEATURE.md documents the duplicate UX.

- UI composition
  - Layout components: src/components/Layout/{Header,Footer,Layout,FixedLayout}. Header includes theme/music toggles, responsive navigation, and active route styling.
  - Media and music: src/components/{BackgroundMusic,MediaPlayer,MusicToggle} and assets in src/assets/.
  - Tailwind setup: tailwind.config.js (content: ./src/**/*.{js,jsx,ts,tsx}, darkMode: 'class'), postcss.config.js present.

- Firebase (optional)
  - src/firebase.ts initializes app + Firestore using env vars; not required for local runs without backend.
  - To enable, create .env.local with:
    ```bash path=null start=null
    REACT_APP_FIREBASE_API_KEY=...
    REACT_APP_FIREBASE_AUTH_DOMAIN=...
    REACT_APP_FIREBASE_PROJECT_ID=...
    REACT_APP_FIREBASE_STORAGE_BUCKET=...
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
    REACT_APP_FIREBASE_APP_ID=...
    ```

Testing
- Jest + React Testing Library are preconfigured (src/setupTests.ts imports @testing-library/jest-dom).
- Tests run via react-scripts; locate tests under src with .test.tsx.

Notes for future agents
- Local demo data: HomePage seeds public classes and persists quizzes to localStorage; keep this in mind when testing navigation or cleanup logic.
- ClassesPage supports both legacy quizIds and embedded quiz objects; helper mapping code normalizes to Quiz[].
- Deleting a class removes associated quizzes from localStorage but intentionally leaves uploaded documents intact.
