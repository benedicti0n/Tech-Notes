# Assets Directory

This directory contains static assets for your Plasmo extension:

## Icon Files

- `icon16.png` - 16x16 icon for browser toolbar
- `icon48.png` - 48x48 icon for extension management page
- `icon128.png` - 128x128 icon for Chrome Web Store

## Other Assets

- Images, fonts, and other static files
- Localization files (if using i18n)
- JSON data files
- CSS files that don't need processing

## Usage in Code

```typescript
// Import assets in your components
import iconUrl from "data-base64:~assets/icon48.png";
import dataFile from "~assets/data.json";

// Use in JSX
<img src={iconUrl} alt="Extension icon" />;
```

## Plasmo Asset Handling

Plasmo automatically processes assets and provides different import methods:

- `~assets/file.png` - Regular import
- `data-base64:~assets/file.png` - Base64 encoded
- `data-text:~assets/file.txt` - Text content
- `url:~assets/file.png` - URL reference
