# Plasmo Project Files Explained

## Core Extension Files

### `popup.tsx` - Extension Popup

- **Purpose**: The UI that appears when users click the extension icon
- **Features**:
  - React component with state management
  - Communicates with content scripts via Chrome messaging API
  - Styled with CSS for a clean interface
- **Key Concepts**:
  - Uses `chrome.tabs.query()` to get active tab
  - Sends messages to content scripts with `chrome.tabs.sendMessage()`
  - React hooks for state management

### `content.ts` - Content Script

- **Purpose**: Runs in the context of web pages, can modify DOM
- **Features**:
  - Listens for messages from popup/background
  - Can manipulate page elements (like changing background color)
  - Adds floating button to demonstrate page interaction
- **Key Concepts**:
  - `PlasmoCSConfig` for configuration (which sites to run on)
  - `chrome.runtime.onMessage` for receiving messages
  - Direct DOM manipulation capabilities

### `background.ts` - Background Script (Service Worker)

- **Purpose**: Runs persistently, handles extension lifecycle and events
- **Features**:
  - Handles extension installation
  - Manages storage operations
  - Creates context menus
  - Monitors tab updates
- **Key Concepts**:
  - Service Worker in Manifest V3
  - `chrome.runtime.onInstalled` for setup
  - `chrome.storage.sync` for persistent data
  - `chrome.contextMenus` for right-click menus

### `options.tsx` - Options/Settings Page

- **Purpose**: Full-page settings interface for the extension
- **Features**:
  - React-based settings form
  - Theme switching (light/dark)
  - Persistent storage integration
  - Save/reset functionality
- **Key Concepts**:
  - Accessed via `chrome://extensions` → Extension Details → Options
  - Uses `chrome.storage.sync` for settings persistence
  - Responsive design with CSS

## Styling Files

### `style.css` - Popup Styles

- Clean, modern design for the popup interface
- Uses system fonts and Google-style colors
- Responsive button and input styling

### `options.css` - Options Page Styles

- Full-page layout with dark/light theme support
- Professional settings page design
- Organized sections and form styling

## Configuration Files

### `package.json` - Project Configuration

- **Dependencies**: Plasmo, React, TypeScript
- **Scripts**: Development, build, and packaging commands
- **Manifest**: Permissions and host permissions for the extension
- **Key Permissions**:
  - `storage`: For saving user settings
  - `activeTab`: For interacting with current tab
  - `contextMenus`: For right-click menu items

### `assets/` Directory

- Contains static files like icons, images, fonts
- Plasmo provides special import syntax for assets
- Different import methods for various use cases

## How They Work Together

1. **User clicks extension icon** → `popup.tsx` opens
2. **Popup sends message** → `content.ts` receives and acts on page
3. **Background script** manages storage, menus, and lifecycle events
4. **Options page** provides settings interface
5. **Assets** provide icons and static resources

## Development Workflow

```bash
# Start development with hot reloading
npm run dev

# Build for production
npm run build

# Package for store submission
npm run package
```

## Key Plasmo Features Demonstrated

- **Zero Config**: No webpack or build setup needed
- **Hot Reloading**: Changes appear instantly during development
- **TypeScript**: Full type safety with Chrome APIs
- **React Integration**: Modern component-based UI
- **Cross-Browser**: Works on Chrome, Firefox, Edge, Safari
- **Manifest V3**: Uses latest extension standards
