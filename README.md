<div align="center">
<img width="1200" height="475" alt="EyeZone Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EyeZone: Low Vision Assistant

A comprehensive accessibility application designed to help people with low vision interact with images, PDFs, and text using AI-powered features, voice commands, and high-contrast interfaces.

## 🌟 Features

### Core Functionality
- **📸 Image Text Extraction**: Upload images from gallery or camera to extract text using OCR
- **📄 PDF Text Extraction**: Extract text from PDF documents with intelligent parsing
- **🎨 Image Description**: AI-powered image descriptions for visually impaired users
- **🔊 Text-to-Speech**: High-quality audio generation using Google Gemini TTS
- **🌐 Multi-language Support**: English and Tamil (தமிழ்) language support
- **🗣️ Voice Commands**: Hands-free control with voice recognition
- **💬 AI Chat Assistant**: Interactive AI assistant for questions and help

### Accessibility Features
- **🎨 High Contrast Themes**: 
  - Light Mode (White background, Black text)
  - Dark Mode (Black background, White text)
  - Yellow on Black Mode
  - Blue on Black Mode
- **🔍 Magnification Control**: Zoom from 1x to 3x for better readability
- **⚡ Reading Rate Control**: Adjust speech speed (0.75x, 1x, 1.5x)
- **📖 Text Highlighting**: Real-time word highlighting during speech playback
- **🎯 Focus Management**: Screen reader friendly with proper ARIA labels

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Google Gemini API Key** (free tier available)

### Installation

1. **Clone or download this repository**
   ```bash
   cd /path/to/eyezone-low-vision-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your Gemini API Key**
   
   a. Get your free API key from: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   
   b. Open the `.env.local` file in the project root
   
   c. Replace `your_gemini_api_key_here` with your actual API key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to: [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Main Screen

When you first open the application, you'll see three main options:

1. **Gallery** 📷
   - Click to select an image from your device
   - Supports: JPG, PNG, GIF, WEBP, and other image formats

2. **Camera** 📸
   - Click to take a photo using your device camera
   - Perfect for capturing documents, signs, or labels

3. **PDF** 📄
   - Click to select a PDF document
   - Extracts text from both digital and scanned PDFs

### Viewer Screen

After selecting a file, you'll see:

**Left Panel**: Preview of your image/PDF with magnification controls
- Use **+** and **-** buttons to zoom in/out
- Pinch to zoom on touch devices

**Right Panel**: Extracted text and controls
- **Read English**: Reads the text in English with high-quality TTS
- **Read Tamil**: Translates and reads in Tamil (தமிழ்)
- **Describe Image**: AI describes what's in the image (images only)
- **Pause/Resume**: Control playback
- **Stop**: Stop reading and reset

### Voice Commands

Enable voice commands in Settings to use hands-free control:

#### English Commands
- **"gallery"** / **"open gallery"** - Open gallery picker
- **"camera"** / **"open camera"** - Open camera
- **"pdf"** / **"open pdf"** - Open PDF picker
- **"read"** / **"read english"** - Read text in English
- **"read tamil"** - Read text in Tamil
- **"describe image"** / **"what is this"** - Describe the image
- **"pause"** - Pause reading
- **"resume"** / **"continue"** - Resume reading
- **"stop"** - Stop reading
- **"back"** / **"go back"** - Return to main screen
- **"zoom in"** / **"increase magnification"** - Zoom in
- **"zoom out"** / **"decrease magnification"** - Zoom out
- **"read faster"** / **"increase speed"** - Speed up reading
- **"read slower"** / **"decrease speed"** - Slow down reading
- **"settings"** / **"open settings"** - Open settings
- **"ask ai"** / **"hey assistant"** - Open AI chat
- **"light mode"** / **"dark mode"** / **"yellow mode"** / **"blue mode"** - Change contrast

#### Tamil Commands (தமிழ் கட்டளைகள்)
- **"கேலரி"** - Open gallery
- **"கேமரா"** - Open camera
- **"பிடிஎஃப்"** - Open PDF
- **"படி"** / **"ஆங்கிலத்தில் படி"** - Read in English
- **"தமிழில் படி"** - Read in Tamil
- **"படத்தை விவரி"** - Describe image
- **"இடைநிறுத்தம்"** - Pause
- **"தொடரவும்"** - Resume
- **"நிறுத்து"** - Stop
- **"பின்னால்"** - Go back
- And more...

### Settings

Access settings by clicking the ⚙️ icon in the top-right corner:

- **App Language**: Switch between English and Tamil
- **Voice Commands**: Enable/disable voice control
- **Command Feedback**: Toggle voice feedback for commands
- **Contrast Mode**: Choose your preferred color scheme
- **Magnification**: Adjust zoom level (1x - 3x)
- **Reading Rate**: Adjust speech speed (0.75x - 1.5x)

### AI Chat Assistant

Click **"Ask AI"** or use voice command to open the AI assistant:
- Ask questions about anything
- Get help with the app
- Enable **Thinking Mode** for complex questions (uses more powerful AI model)
- Speak naturally - the assistant will listen and respond

## 🛠️ Build for Production

To create a production-ready build:

```bash
npm run build
```

The optimized files will be in the `dist` folder. You can preview the production build:

```bash
npm run preview
```

## 🔧 Troubleshooting

### API Key Issues
- **Error: "API_KEY environment variable not set"**
  - Make sure you've created the `.env.local` file
  - Verify your API key is correctly pasted
  - Restart the development server after adding the key

### Microphone Access
- **Voice commands not working**
  - Check browser permissions for microphone access
  - HTTPS is required for microphone in production (localhost works in development)
  - Try refreshing the page and allowing microphone access

### PDF Processing
- **PDF text extraction fails**
  - The app will automatically fall back to AI-based extraction
  - Scanned PDFs may take longer to process
  - Very large PDFs may need to be split into smaller files

### Browser Compatibility
- **Best experience**: Chrome, Edge, Safari (latest versions)
- **Voice commands**: Requires browser with Web Speech API support
- **Text-to-Speech**: Works in all modern browsers

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variable:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Import your repository on [Netlify](https://netlify.com)
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variable in Netlify dashboard:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key
5. Deploy!

## 📱 Mobile Support

EyeZone is fully responsive and works great on mobile devices:
- Touch-friendly interface
- Camera access on mobile devices
- Pinch-to-zoom support
- Mobile-optimized voice commands

## 🔐 Privacy & Security

- All processing happens through Google Gemini API
- No data is stored on our servers
- Images and PDFs are processed in real-time
- API key is stored locally in your environment

## 🤝 Contributing

This project was created to help people with low vision. Contributions are welcome!

## 📄 License

This project is open source and available for educational and personal use.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful AI capabilities
- **PDF.js** for PDF processing
- **React** and **Vite** for the development framework
- **Tailwind CSS** for styling

## 📞 Support

If you encounter any issues or have questions:
1. Check the Troubleshooting section above
2. Review the [Google Gemini API documentation](https://ai.google.dev/docs)
3. Open an issue on the project repository

---

<div align="center">
Made with ❤️ for accessibility
</div>
