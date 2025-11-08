# 🚀 Setup Guide - MindfulTravel AI

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Make setup script executable (if not already)
chmod +x setup.sh

# Run setup script
./setup.sh
```

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# The app will be available at http://localhost:3000
```

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)

### Check Your Versions

```bash
node --version
npm --version
```

### Install Node.js

If you don't have Node.js installed:

1. **macOS/Linux**: Use [nvm](https://github.com/nvm-sh/nvm)
   ```bash
   nvm install 18
   nvm use 18
   ```

2. **Windows**: Download from [nodejs.org](https://nodejs.org/)

3. **Using .nvmrc** (if you have nvm):
   ```bash
   nvm use
   ```

## Project Structure

```
mindful-travel/
├── src/
│   ├── components/          # React components
│   │   ├── EmotionalSanctuary.jsx
│   │   ├── HealingCompass.jsx
│   │   ├── JourneyArchitect.jsx
│   │   └── TransformationGarden.jsx
│   ├── data/                # Mock data
│   │   └── mockDestinations.js
│   ├── styles/              # Global styles
│   │   └── globals.css
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── index.html               # HTML template
```

## Available Scripts

### Development

```bash
npm run dev
```
Starts the development server with hot-reload at `http://localhost:3000`

### Build

```bash
npm run build
```
Creates an optimized production build in the `dist/` directory

### Preview

```bash
npm run preview
```
Previews the production build locally

## Environment Setup

### Node Version Management

This project uses Node.js 18.20.0 (specified in `.nvmrc` and `.node-version`)

If you're using **nvm**:
```bash
nvm install
nvm use
```

If you're using **fnm** (Fast Node Manager):
```bash
fnm install
fnm use
```

## Troubleshooting

### Issue: Dependencies won't install

**Solution**: Clear npm cache and reinstall
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3000 is already in use

**Solution**: Change the port in `vite.config.js`:
```javascript
server: {
  port: 3001, // Change to any available port
  open: true
}
```

### Issue: Build fails

**Solution**: 
1. Ensure you're using Node.js 18+
2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Issue: Styles not loading

**Solution**: 
1. Ensure Tailwind is properly configured
2. Check that `globals.css` is imported in `main.jsx`
3. Restart the dev server

## Development Workflow

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Make changes** to files in `src/`

3. **See changes** automatically in the browser (hot-reload)

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build**:
   ```bash
   npm run preview
   ```

## Dependencies

### Core Dependencies
- **React 18.3.1**: UI framework
- **Vite 5.0.0**: Build tool and dev server
- **Framer Motion 11.0.0**: Animation library
- **Tailwind CSS 3.4.0**: Styling framework

### Key Libraries
- **@use-gesture/react**: Swipe gesture handling
- **recharts**: Data visualization
- **canvas-confetti**: Celebration effects
- **lucide-react**: Icon library

## Next Steps

1. ✅ Run `npm install` to install dependencies
2. ✅ Run `npm run dev` to start development
3. ✅ Open `http://localhost:3000` in your browser
4. ✅ Start building!

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Ensure all prerequisites are met
3. Verify Node.js version is 18+

---

**Happy Coding! 🎨✨**

