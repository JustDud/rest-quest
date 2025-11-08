# 🚀 START HERE - How to Run the App

## ⚠️ Important: Don't Open Directories in the Editor!

If you see an error saying "The file is not displayed in the text editor because it is a directory", you're trying to open a folder instead of a file.

## ✅ Correct Way to Run the App

### Step 1: Start the Development Server
Open your terminal and run:
```bash
cd /Users/alisadergal/hackathon/rest-quest
npm run dev
```

### Step 2: Open in Browser
The server will automatically open your browser at:
- **http://localhost:5173**

If it doesn't open automatically, manually go to:
- **http://localhost:5173** in your web browser

### Step 3: Use the App in the Browser
- You can now type in the textarea on the first screen
- The app runs in your browser, NOT in the code editor
- All interactions happen in the browser window

## 📝 Files to Edit (If Needed)

If you want to edit code, open these **files** (not folders):
- `src/App.jsx` - Main app component
- `src/components/EmotionalSanctuary.jsx` - First screen
- `src/components/HealingCompass.jsx` - Second screen
- `src/components/JourneyArchitect.jsx` - Third screen
- `src/components/TransformationGarden.jsx` - Fourth screen
- `src/styles/globals.css` - Styles

## 🎯 Quick Start Commands

```bash
# Navigate to project
cd /Users/alisadergal/hackathon/rest-quest

# Start dev server
npm run dev

# The app will open at http://localhost:5173
```

## ❌ Common Mistakes

1. **Trying to open folders in editor** - Open files instead
2. **Looking for input in the editor** - Use the browser
3. **Not running npm run dev** - You need the server running
4. **Wrong port** - Use port 5173 (or whatever vite shows)

## 🔧 Troubleshooting

### Port Already in Use?
If you see "Port X is in use", vite will try the next port. Check the terminal output for the actual port number.

### Can't Type in App?
- Make sure you're in the **browser**, not the editor
- Make sure the dev server is running
- Check that you're on the first screen (Emotional Sanctuary)
- Try refreshing the browser (Cmd+R or Ctrl+R)

### Server Won't Start?
```bash
# Kill existing processes
pkill -f vite

# Restart
npm run dev
```

## 🎉 Once It's Running

1. You'll see the first screen: "How does your soul feel?"
2. Type your feelings in the large textarea
3. After 50+ characters, a "Continue" button appears
4. Click it to proceed to the next screen

---

**Remember**: The app runs in your **browser**, not in the code editor!

