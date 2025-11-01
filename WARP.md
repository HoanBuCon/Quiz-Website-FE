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

---

## Sharing & Visibility (Public/Private) Logic

This section documents how sharing and visibility work for Class and Quiz across frontend and backend.

### Concepts
- Class.isPublic (boolean): class discoverability for others.
- Quiz.published (boolean): whether a quiz is accessible by non-owners.
- Ownership: Class/Quiz bound to `ownerId`; owner-only operations enforced.
- Short ID (share code): deterministic code like `ABC123456789` from a stable hash of the id.

### Data model (Prisma)
- Class: has `isPublic`.
- Quiz: has `published`, belongs to a Class and an Owner.
  - File: `quiz-backend/prisma/schema.prisma` (Class: lines 23-33, Quiz: lines 35-48)

### Backend enforcement
- All routes require JWT auth (`quiz-backend/middleware/auth.js`).

Classes API (`quiz-backend/routes/classes.js`)
- GET `/classes?mine=true` → list owner’s classes only.
- GET `/classes` → list public classes only (`isPublic=true`).
- PUT `/classes/:id` and DELETE `/classes/:id` → owner only.
- POST `/classes/import` → clone by id:
  - Import class: source must be public or owned by requester; creates a new private class and clones quizzes as private. (lines 78-87)
  - Import quiz: source quiz’s class must be public or owned; creates a new private class and a private clone of that quiz. (lines 89-96)

Quizzes API (`quiz-backend/routes/quizzes.js`)
- GET `/quizzes/by-class/:classId` → allowed if (owner) OR (class is public). Returns all quizzes of the class (backend does not filter by `published`). (lines 5-15)
- GET `/quizzes/:id` → fetch by exact id OR by short code (compares `buildShortId(q.id)`):
  - Owner: always allowed.
  - Non-owner: allowed only if `published=true` (else 403 “Quiz chưa xuất bản”). (lines 17-58)
- POST `/quizzes` and PUT `/quizzes/:id` → owner only; create/update quiz + questions. (create: 60-89; update: 91-121)

Share utilities (backend): `quiz-backend/utils/share.js` (short code generation/validation).

### Frontend behavior

Sharing artefacts
- Short code generation: `src/utils/share.ts` (`buildShortId`, `isShortIdCode`).
- Share links built in `src/pages/ClassesPage.tsx`:
  - Class link: `/class/:id` (uses full id; short code shown separately in modal). (lines 252-257, 1115-1141)
  - Quiz link: `/quiz/:id` (full id; backend also accepts short code).

Owner toggles (Classes page)
- Toggle Class public/private: `handleToggleClassPublic` updates class and then sets ALL quizzes in that class so `published = class.isPublic` (publish all on public; unpublish all on private). (lines 84-114, 95-108)
- Toggle a single Quiz published/draft: `handleToggleQuizPublished` flips only that quiz; if turning ON while class is private → also sets the class to public; does not change other quizzes. (lines 126-160)

Viewing access
- Class view route `/class/:classIdOrShort`: `src/pages/ClassViewPage.tsx`
  - Resolves id or short by scanning mine + public lists. (lines 16-32)
  - Loads quizzes via `/quizzes/by-class/:classId` and, if not owner, filters to only `published` quizzes on the client. (line 32)
- Quiz route `/quiz/:quizIdOrShort`: `src/pages/QuizPage.tsx`
  - Calls `/quizzes/:id` (supports id or short). Owner always allowed; non-owner only if `published`. (lines 22-63)

Importing by ID/Link/Short code (Classes page)
- Parser supports raw short codes, raw ids, and links containing `/class/` or `/quiz/`.
- Primary: POST `/classes/import` with `{ classId? | quizId? }`.
- Fallback: client-side clone (`doClientClone`):
  - Clone Class → create new private class and copy all quizzes as private. (lines 287-306)
  - Clone Quiz → fetch via `QuizzesAPI.getById` (id or short), require accessibility (owner or published), create new private class, copy that quiz as private. (lines 307-325)
  - File: `src/pages/ClassesPage.tsx` (lines 259-409)

### Interplay and UX summary
- Class → public: all quizzes become published.
- Class → private: all quizzes become unpublished.
- Single quiz → publish while class is private: class becomes public; other quizzes unchanged.
- Non-owners:
  - Can list public classes.
  - See only published quizzes on a class page.
  - Can open a quiz link only if that quiz is published.
- Owners can access/edit regardless of visibility (subject to endpoint checks).

### Notable implications
- Backend returns all quizzes in `/quizzes/by-class/:classId` for public classes; client filters unpublished for non-owners. Consider server-side filtering for stronger guarantees.
- All shared links still require authentication; FE redirects unauthenticated users.
