# 📦 Installation Guide - EyeZone

Complete installation instructions for different scenarios.

## Table of Contents
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Docker Installation](#docker-installation-optional)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

Before you begin, ensure you have:
- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** v9.0.0 or higher (comes with Node.js)
- **Git** (optional, for cloning)
- A **Google Gemini API Key** ([Get one free](https://aistudio.google.com/app/apikey))

### Step-by-Step Installation

#### 1. Get the Code

**Option A: Clone with Git**
```bash
git clone <repository-url>
cd eyezone-low-vision-assistant
```

**Option B: Download ZIP**
- Download and extract the project ZIP file
- Navigate to the extracted folder in terminal

#### 2. Install Dependencies

```bash
npm install
```

This will install:
- React 19.2.0
- Google Gemini AI SDK
- Vite (build tool)
- TypeScript
- All other required dependencies

**Expected output:**
```
added 200+ packages in 30s
```

#### 3. Configure Environment Variables

**Create your environment file:**

```bash
cp .env.local.example .env.local
```

**Edit `.env.local`:**

Open the file in your text editor and add your API key:

```env
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

**How to get your API key:**
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in `.env.local`

#### 4. Start Development Server

```bash
npm run dev
```

**Expected output:**
```
VITE v6.4.1  ready in 154 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

#### 5. Open in Browser

Navigate to: **http://localhost:3000**

You should see the EyeZone main screen with three buttons: Gallery, Camera, and PDF.

---

## Production Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

**Expected output:**
```
✓ built in 1.34s
dist/index.html                  1.40 kB
dist/assets/index-CXmx8REw.js  454.02 kB
```

### Preview Production Build Locally

```bash
npm run preview
```

Opens the production build at http://localhost:4173

### Deploy to Vercel

**Method 1: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variable
vercel env add GEMINI_API_KEY
```

**Method 2: Vercel Dashboard**

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variable:
   - Name: `GEMINI_API_KEY`
   - Value: Your API key
6. Click "Deploy"

### Deploy to Netlify

**Method 1: Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

**Method 2: Netlify Dashboard**

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Environment variables:
   - Key: `GEMINI_API_KEY`
   - Value: Your API key
7. Click "Deploy site"

### Deploy to Other Platforms

The app is a static site and can be deployed to:
- **GitHub Pages**: Use `gh-pages` package
- **AWS S3 + CloudFront**: Upload `dist` folder
- **Firebase Hosting**: Use `firebase deploy`
- **Cloudflare Pages**: Connect GitHub repo

---

## Docker Installation (Optional)

If you prefer using Docker:

**Create `Dockerfile`:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Create `docker-compose.yml`:**

```yaml
version: '3.8'
services:
  eyezone:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - .:/app
      - /app/node_modules
```

**Run with Docker:**

```bash
# Build and start
docker-compose up

# Or with docker directly
docker build --build-arg GEMINI_API_KEY=your_key -t eyezone .
docker run -p 3000:3000 eyezone
```

---

## Troubleshooting

### Installation Issues

**Problem: `npm install` fails**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Problem: Node version too old**

```bash
# Check your Node version
node --version

# Should be v18.0.0 or higher
# Update Node.js from https://nodejs.org/
```

### Build Issues

**Problem: Build fails with TypeScript errors**

```bash
# Run type checking
npm run type-check

# This will show specific errors
```

**Problem: "API_KEY environment variable not set"**

- Ensure `.env.local` exists in project root
- Verify the file contains: `GEMINI_API_KEY=your_key`
- Restart the dev server after adding the key

### Runtime Issues

**Problem: Port 3000 already in use**

```bash
# Find and kill the process using port 3000
# On Linux/Mac:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port:
npm run dev -- --port 3001
```

**Problem: Microphone not working**

- Check browser permissions (click lock icon in address bar)
- HTTPS is required in production (localhost works in dev)
- Try a different browser (Chrome/Edge recommended)

**Problem: Camera not working on mobile**

- Ensure HTTPS is enabled (required for camera access)
- Check mobile browser permissions
- Try using the Gallery option instead

### API Issues

**Problem: "Failed to analyze the file"**

- Verify your API key is correct
- Check if you have API quota remaining
- Try with a smaller file
- Check browser console for detailed errors

**Problem: Slow performance**

- Large files take longer to process
- Image description uses AI and may take 3-5 seconds
- Consider resizing images before upload
- Check your internet connection

### Browser Compatibility

**Recommended browsers:**
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Firefox 88+

**Features requiring specific support:**
- Voice commands: Web Speech API (Chrome, Edge, Safari)
- Camera access: getUserMedia API (all modern browsers)
- Text-to-speech: SpeechSynthesis API (all modern browsers)

---

## Verification Checklist

After installation, verify everything works:

- [ ] Application loads at http://localhost:3000
- [ ] No console errors in browser DevTools
- [ ] Can upload an image from gallery
- [ ] Text extraction works
- [ ] Text-to-speech plays audio
- [ ] Settings modal opens
- [ ] Contrast modes change colors
- [ ] Magnification controls work
- [ ] Voice commands work (if enabled)
- [ ] AI chat assistant responds

---

## Getting Help

If you're still having issues:

1. **Check the logs**: Look at browser console (F12) for errors
2. **Review documentation**: See [README.md](./README.md) for features
3. **API documentation**: Visit [Google AI Studio](https://ai.google.dev/docs)
4. **Community support**: Open an issue on the project repository

---

## Next Steps

Once installed successfully:

1. Read the [QUICKSTART.md](./QUICKSTART.md) for a quick tour
2. Review [README.md](./README.md) for complete feature documentation
3. Try uploading a test image with text
4. Explore voice commands and AI features
5. Customize settings for your needs

---

**Happy coding! 🚀**
