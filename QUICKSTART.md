# 🚀 Quick Start Guide - EyeZone

Get up and running in 3 minutes!

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

## Step 2: Get Your API Key (1 minute)

1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy your API key

## Step 3: Configure API Key (30 seconds)

Open `.env.local` and replace the placeholder:

```env
GEMINI_API_KEY=paste_your_actual_key_here
```

## Step 4: Run the App (30 seconds)

```bash
npm run dev
```

Open your browser to: **http://localhost:3000**

## ✅ You're Ready!

Try these features:
- 📸 Click **Gallery** to upload an image with text
- 📄 Click **PDF** to upload a PDF document
- 🔊 Click **Read English** to hear the extracted text
- 🎨 Click the ⚙️ icon to change contrast modes
- 🗣️ Enable **Voice Commands** in settings for hands-free control

## 🎯 First Time Tips

1. **Test with a simple image**: Take a photo of a book page or printed text
2. **Try voice commands**: Say "settings" to open settings, then enable voice commands
3. **Adjust for comfort**: Change contrast mode and magnification to suit your needs
4. **Ask the AI**: Say "ask AI" or click the AI button to get help

## 📱 Mobile Testing

To test on your phone:
1. Find your computer's IP address (shown in terminal after `npm run dev`)
2. On your phone, open: `http://YOUR_IP:3000`
3. Allow camera and microphone permissions

## 🛑 Stop the Server

Press `Ctrl + C` in the terminal

## 📚 Need More Help?

See the full [README.md](./README.md) for:
- Complete feature list
- Voice command reference
- Troubleshooting guide
- Deployment instructions

---

**Having issues?** Make sure:
- ✅ Node.js is installed (v18+)
- ✅ API key is correctly pasted in `.env.local`
- ✅ No other app is using port 3000
