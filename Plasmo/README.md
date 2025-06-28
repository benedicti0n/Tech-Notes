# Learning Plasmo Framework

Plasmo is a modern framework for building cross-platform browser extensions with React, TypeScript, and modern web technologies.

## What is Plasmo?

Plasmo simplifies browser extension development by providing:

- Hot reloading during development
- TypeScript support out of the box
- React/Vue/Svelte support
- Automatic manifest generation
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Built-in bundling and optimization

## Key Features

- **Zero Config**: Works out of the box with minimal setup
- **Modern Stack**: Built with Parcel, React, and TypeScript
- **Live Reloading**: Instant updates during development
- **Cross-Platform**: Deploy to multiple browser stores
- **Content Scripts**: Easy integration with web pages
- **Background Scripts**: Service worker support
- **Popup UI**: React-based popup interfaces

## Getting Started

```bash
# Install Plasmo CLI
npm install -g plasmo

# Create new extension
plasmo init my-extension

# Start development
plasmo dev

# Build for production
plasmo build
```

## Learning Resources

- [Official Documentation](https://docs.plasmo.com/)
- [GitHub Repository](https://github.com/PlasmoHQ/plasmo)
- [Examples](https://github.com/PlasmoHQ/examples)

## Project Structure

```
my-extension/
├── popup.tsx          # Extension popup UI
├── content.ts         # Content script
├── background.ts      # Background/service worker
├── options.tsx        # Options page
└── assets/           # Static assets
```
