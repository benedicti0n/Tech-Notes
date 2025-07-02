# Advanced Plasmo Concepts

This document covers the advanced features and concepts we've implemented in our Plasmo learning project.

## 1. Content Script UI (`content-ui.tsx`)

**What it is**: Inject React components directly into web pages using Plasmo's Content Script UI feature.

**Key Features**:

- Renders React components in the context of web pages
- Uses Shadow DOM for style isolation
- Can interact with page elements and modify DOM
- Configurable injection points with `getInlineAnchor`

**Use Cases**:

- Page overlays and floating widgets
- In-page analysis tools
- Interactive page annotations
- Custom UI elements on specific websites

**Important Concepts**:

```typescript
// Configure where to inject the UI
export const getInlineAnchor: PlasmoGetInlineAnchor = () => {
  return document.querySelector("body");
};

// Shadow DOM isolation
export const getShadowHostId = () => "plasmo-inline-example";
```

## 2. Advanced Messaging (`messaging.ts`)

**What it is**: Type-safe, structured messaging system between different parts of your extension.

**Key Features**:

- Type-safe message definitions
- Centralized message handling
- Error handling and async support
- Background script message routing

**Message Flow**:

1. Popup/Content Script → Background Script
2. Background Script processes and responds
3. Response sent back to caller

**Benefits**:

- Consistent error handling
- Type safety across extension parts
- Centralized business logic in background script
- Easy to test and maintain

## 3. Storage Management (`storage-manager.ts`)

**What it is**: Sophisticated storage system with caching, type safety, and data management.

**Key Features**:

- Singleton pattern for consistent access
- In-memory caching for performance
- Type-safe interfaces for data structures
- Storage quota monitoring
- Data import/export functionality

**Storage Areas**:

- `chrome.storage.sync`: Settings (synced across devices)
- `chrome.storage.local`: User data (local only, larger quota)

**Advanced Features**:

```typescript
// Automatic cache invalidation
chrome.storage.onChanged.addListener((changes, areaName) => {
  Object.keys(changes).forEach(key => {
    this.cache.delete(key)
  })
})

// Storage usage monitoring
async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }>
```

## 4. New Tab Page (`newtab.tsx`)

**What it is**: Custom new tab page that replaces the browser's default new tab.

**Key Features**:

- Real-time clock and date display
- Quick links to frequently used sites
- Recent bookmarks integration
- Search functionality
- Beautiful gradient design

**Plasmo Configuration**:

- Automatically detected by filename `newtab.tsx`
- Requires `chrome_url_overrides` permission in manifest
- Full-page React application

## 5. Side Panel (`sidepanel.tsx`)

**What it is**: Chrome's new Side Panel API integration for persistent UI alongside web pages.

**Key Features**:

- Always visible alongside web content
- Page analysis tools
- Note-taking functionality
- Quick access to browser features
- Real-time tab information

**Chrome Side Panel API**:

- Available in Chrome 114+
- Persistent across tab navigation
- Can be opened/closed programmatically
- Perfect for productivity tools

## 6. Advanced Project Structure

```
Plasmo/
├── popup.tsx              # Extension popup
├── content.ts             # Basic content script
├── content-ui.tsx         # React UI injection
├── background.ts          # Service worker
├── options.tsx            # Settings page
├── newtab.tsx            # New tab replacement
├── sidepanel.tsx         # Side panel UI
├── messaging.ts          # Message handling system
├── storage-manager.ts    # Advanced storage
├── assets/               # Static resources
└── styles/               # CSS files
```

## 7. Key Plasmo Features Demonstrated

### Hot Reloading

- Instant updates during development
- Preserves extension state when possible
- Works across all extension contexts

### TypeScript Integration

- Full type safety for Chrome APIs
- Custom type definitions for extension data
- IntelliSense support in VS Code

### Asset Handling

```typescript
// Different import methods
import iconUrl from "data-base64:~assets/icon.png";
import dataFile from "~assets/data.json";
import styleUrl from "url:~assets/style.css";
```

### Automatic Manifest Generation

- Plasmo generates manifest.json automatically
- Permissions inferred from code usage
- Custom manifest fields in package.json

### Cross-Browser Support

- Single codebase for Chrome, Firefox, Edge, Safari
- Automatic polyfills for API differences
- Browser-specific builds

## 8. Development Best Practices

### State Management

- Use React hooks for UI state
- Storage manager for persistent data
- Message passing for cross-context communication

### Performance Optimization

- Lazy loading of heavy components
- Efficient storage caching
- Minimal content script footprint

### Security Considerations

- Content Security Policy compliance
- Secure message passing
- Input validation and sanitization

### Testing Strategies

- Unit tests for utility functions
- Integration tests for message passing
- Manual testing across browsers

## 9. Deployment and Distribution

### Building for Production

```bash
# Build optimized version
plasmo build

# Package for store submission
plasmo package
```

### Store Submission

- Chrome Web Store
- Firefox Add-ons
- Edge Add-ons
- Safari App Store (with additional steps)

### Version Management

- Semantic versioning in package.json
- Automated builds with CI/CD
- Beta testing with unpacked extensions

## 10. Advanced Use Cases

### Enterprise Extensions

- Policy-based configuration
- SSO integration
- Custom deployment methods

### Developer Tools

- DevTools panel integration
- Code analysis and debugging
- Performance monitoring

### Productivity Extensions

- Workflow automation
- Data synchronization
- Cross-platform integration

This advanced setup demonstrates how Plasmo can handle complex extension requirements while maintaining clean, maintainable code structure.
