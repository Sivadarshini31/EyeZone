# 📁 Project Structure - EyeZone

Understanding the codebase organization.

## Directory Overview

```
eyezone-low-vision-assistant/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── utils/              # Helper functions and utilities
├── dist/               # Production build output (generated)
├── node_modules/       # Dependencies (generated)
└── [config files]      # Configuration files
```

---

## 📂 Detailed Structure

### `/components/` - UI Components

All React components for the application interface.

```
components/
├── AiChatModal.tsx          # AI assistant chat interface
├── IconButton.tsx           # Reusable icon button component
├── MainScreen.tsx           # Home screen with Gallery/Camera/PDF options
├── PlaybackControls.tsx     # Audio playback controls (play/pause/stop)
├── SettingsModal.tsx        # Settings configuration modal
├── Spinner.tsx              # Loading spinner with messages
└── ViewerScreen.tsx         # Document/image viewer with text display
```

**Key Components:**

- **MainScreen**: Entry point, handles file selection
- **ViewerScreen**: Main viewing interface with OCR results
- **AiChatModal**: Voice-activated AI assistant
- **SettingsModal**: All app configuration options
- **PlaybackControls**: TTS playback management

### `/hooks/` - Custom Hooks

Reusable React hooks for complex functionality.

```
hooks/
├── useSpeech.ts            # Text-to-speech with highlighting
└── useVoiceCommands.ts     # Voice recognition and command processing
```

**Hook Details:**

- **useSpeech**: 
  - Manages TTS playback
  - Handles Gemini audio or browser fallback
  - Provides word-by-word highlighting
  - Controls play/pause/resume/stop

- **useVoiceCommands**:
  - Continuous voice recognition
  - Multi-language command matching
  - Automatic restart on errors
  - Permission handling

### `/services/` - External Services

API integrations and external service handlers.

```
services/
└── geminiService.ts        # Google Gemini AI integration
```

**Service Functions:**

- `extractTextFromFile()`: OCR for images and PDFs
- `describeImage()`: AI image description
- `generateSpeech()`: High-quality TTS generation
- `translateText()`: Text translation (English ↔ Tamil)
- `getAiChatResponse()`: AI chat assistant responses

### `/utils/` - Utilities

Helper functions and utility modules.

```
utils/
└── helpers.ts              # Common utility functions
```

**Utility Functions:**

- `encode()` / `decode()`: Base64 encoding/decoding
- `decodeAudioData()`: PCM audio buffer creation
- `fileToBase64()`: File to base64 conversion
- `resizeImage()`: Image optimization
- `speakText()`: Simple TTS wrapper

---

## 🔧 Configuration Files

### Root Level Files

```
├── .env.local              # Environment variables (API keys)
├── .env.local.example      # Environment template
├── .gitignore              # Git ignore rules
├── index.html              # HTML entry point
├── index.tsx               # React entry point
├── App.tsx                 # Main App component
├── types.ts                # TypeScript type definitions
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── README.md               # Main documentation
├── QUICKSTART.md           # Quick start guide
├── INSTALLATION.md         # Detailed installation guide
└── PROJECT_STRUCTURE.md    # This file
```

### Configuration Details

**`vite.config.ts`**
- React plugin setup
- Environment variable injection
- Dev server configuration (port 3000)
- Path aliases

**`tsconfig.json`**
- TypeScript compiler options
- Module resolution settings
- JSX configuration
- Path mappings

**`package.json`**
- Project metadata
- Dependencies (React, Gemini AI, etc.)
- Scripts (dev, build, preview)
- Version information

---

## 📝 Type Definitions

### `types.ts` - Core Types

```typescript
// Contrast modes for accessibility
enum ContrastMode {
  Light, Dark, YellowDark, BlueDark
}

// Supported languages
enum Language {
  English = 'en-US',
  Tamil = 'ta-IN'
}

// Reading speed options
enum ReadingRate {
  Slow = 0.75,
  Normal = 1,
  Fast = 1.5
}

// File representation
type AppFile = {
  name: string;
  type: 'image' | 'pdf';
  content: string; // base64
}

// Processed document data
type ProcessedData = {
  file: AppFile;
  extractedText: string;
}

// Text highlighting info
type HighlightInfo = {
  startIndex: number;
  endIndex: number;
}

// Voice command definition
type Command = {
  keywords: string[];
  callback: () => void;
  feedback: string;
}
```

---

## 🔄 Data Flow

### File Upload Flow

```
User selects file
    ↓
MainScreen.handleFileChange()
    ↓
Convert to base64 + resize (if image)
    ↓
App.handleFileSelect()
    ↓
geminiService.extractTextFromFile()
    ↓
Set processedData state
    ↓
Navigate to ViewerScreen
```

### Text-to-Speech Flow

```
User clicks "Read English/Tamil"
    ↓
ViewerScreen.handleRead()
    ↓
Translate if needed (Tamil)
    ↓
geminiService.generateSpeech()
    ↓
useSpeech.speak()
    ↓
Play audio + highlight words
```

### Voice Command Flow

```
User speaks command
    ↓
useVoiceCommands (continuous listening)
    ↓
Match transcript to keywords
    ↓
Execute command callback
    ↓
Speak feedback (if enabled)
    ↓
Continue listening
```

---

## 🎨 Styling Approach

### Tailwind CSS

The app uses Tailwind CSS via CDN (loaded in `index.html`).

**Theme System:**
- CSS custom properties for colors
- Theme classes applied to `<html>` element
- Dynamic theme switching via JavaScript

**Custom Properties:**
```css
--bg-color: Background color
--text-color: Text color
--accent-color: Accent/primary color
```

**Responsive Design:**
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`
- Grid layouts for main screens
- Flexbox for components

---

## 🔌 External Dependencies

### Production Dependencies

```json
{
  "react": "^19.2.0",           // UI framework
  "react-dom": "^19.2.0",       // React DOM renderer
  "@google/genai": "^1.29.0"    // Gemini AI SDK
}
```

### Development Dependencies

```json
{
  "@types/node": "^22.14.0",           // Node.js types
  "@vitejs/plugin-react": "^5.0.0",    // Vite React plugin
  "typescript": "~5.8.2",              // TypeScript compiler
  "vite": "^6.2.0"                     // Build tool
}
```

### CDN Dependencies (loaded in HTML)

- **Tailwind CSS**: Styling framework
- **PDF.js**: PDF parsing library

---

## 🚀 Build Process

### Development Build

```bash
npm run dev
```

1. Vite starts dev server
2. Hot module replacement enabled
3. Environment variables loaded from `.env.local`
4. TypeScript compiled on-the-fly
5. Serves at http://localhost:3000

### Production Build

```bash
npm run build
```

1. TypeScript compilation
2. React optimization
3. Code splitting
4. Minification
5. Asset optimization
6. Output to `dist/` folder

**Build Output:**
```
dist/
├── index.html              # Entry HTML
└── assets/
    └── index-[hash].js     # Bundled JavaScript
```

---

## 🧪 Testing Strategy

### Type Checking

```bash
npm run type-check
```

Runs TypeScript compiler without emitting files to catch type errors.

### Manual Testing Checklist

- [ ] File upload (image, PDF)
- [ ] Text extraction accuracy
- [ ] Text-to-speech playback
- [ ] Voice commands recognition
- [ ] Settings persistence
- [ ] Theme switching
- [ ] Magnification controls
- [ ] Multi-language support
- [ ] AI chat functionality
- [ ] Mobile responsiveness

---

## 🔐 Security Considerations

### API Key Protection

- ✅ API key stored in `.env.local` (not committed)
- ✅ `.gitignore` includes `*.local` files
- ✅ Environment variables injected at build time
- ✅ No API key in client-side code

### Data Privacy

- ✅ No data stored on servers
- ✅ All processing via Gemini API
- ✅ Files processed in real-time
- ✅ No persistent storage

### Browser Permissions

- Microphone: Required for voice commands
- Camera: Required for camera capture
- File access: Required for file uploads

---

## 📊 Performance Optimization

### Image Optimization

- Resize images to max 1920x1080
- Convert to JPEG with 80% quality
- Base64 encoding for API transmission

### Audio Optimization

- Use Gemini TTS for high-quality audio
- Fallback to browser TTS if needed
- Cache generated audio per language

### Code Splitting

- Vite automatically splits code
- Lazy loading for heavy components
- Tree shaking for unused code

---

## 🛠️ Development Tips

### Adding a New Component

1. Create file in `/components/`
2. Define TypeScript interface for props
3. Use functional component with hooks
4. Add proper ARIA labels for accessibility
5. Import and use in parent component

### Adding a Voice Command

1. Open `App.tsx`
2. Find the `commands` object
3. Add new command with keywords and callback
4. Add to both English and Tamil sections
5. Test with voice recognition

### Adding a New Theme

1. Open `index.html`
2. Add new theme class in `<style>` section
3. Define CSS custom properties
4. Add to `ContrastMode` enum in `types.ts`
5. Add option in `SettingsModal.tsx`

### Debugging Tips

- Use React DevTools for component inspection
- Check browser console for errors
- Use `console.log()` in service functions
- Test API calls in isolation
- Verify environment variables are loaded

---

## 📚 Further Reading

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Questions?** Check the [README.md](./README.md) or [INSTALLATION.md](./INSTALLATION.md)
