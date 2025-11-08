# 🔧 Troubleshooting Guide

## Problem: "I can't enter anything"

### Solution 1: Use the Browser, Not the Editor
- The app runs in your **web browser**, not in the code editor
- Open `http://localhost:5173` in your browser
- Type in the textarea on the first screen

### Solution 2: Start the Dev Server
```bash
cd /Users/alisadergal/hackathon/rest-quest
npm run dev
```
Wait for the message: "Local: http://localhost:5173"
Then open that URL in your browser.

### Solution 3: Check the Port
If you see a different port in the terminal (like 3002), use that port instead:
- Terminal says: "Local: http://localhost:3002"
- Open: http://localhost:3002

## Problem: "The file is not displayed because it is a directory"

### Solution: Open Files, Not Folders
- ❌ Don't click on folders like `src/` or `components/`
- ✅ Click on files like `App.jsx` or `EmotionalSanctuary.jsx`
- The editor can only open files, not directories

## Problem: Dev Server Won't Start

### Solution 1: Kill Existing Processes
```bash
pkill -f vite
npm run dev
```

### Solution 2: Check Node Version
```bash
node --version  # Should be 18+
```

### Solution 3: Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Problem: Can't Type in the Textarea

### Solution 1: Check Browser Console
- Open browser DevTools (F12 or Cmd+Option+I)
- Check for errors in the Console tab
- Fix any JavaScript errors

### Solution 2: Clear Browser Cache
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Or clear browser cache

### Solution 3: Check Component File
Make sure `src/components/EmotionalSanctuary.jsx` exists and has the textarea code.

## Problem: Port Conflicts

### Solution: Let Vite Auto-Select Port
The vite.config.js is set to port 5173, but if that's taken, vite will try:
- 5173 (preferred)
- 5174
- 5175
- etc.

Just use whatever port vite shows in the terminal.

## Quick Fix Checklist

- [ ] Dev server is running (`npm run dev`)
- [ ] Browser is open to the correct URL
- [ ] No errors in browser console
- [ ] Textarea is visible on the first screen
- [ ] You're typing in the browser, not the editor

## Still Not Working?

1. **Check terminal output** - Look for error messages
2. **Check browser console** - Look for JavaScript errors
3. **Try a different browser** - Chrome, Firefox, Safari
4. **Restart everything**:
   ```bash
   pkill -f vite
   npm run dev
   ```

---

**Most Common Issue**: Trying to use the app in the code editor instead of the browser!
**Solution**: Always use the browser at http://localhost:5173 (or whatever port vite shows)

