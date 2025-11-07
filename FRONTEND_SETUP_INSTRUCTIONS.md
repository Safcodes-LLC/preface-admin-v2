# Installation Instructions for Frontend

## Required Dependencies

You need to install these packages in your **frontend Next.js project**:

```bash
npm install draft-js draft-js-export-html
```

or if you use yarn:

```bash
yarn add draft-js draft-js-export-html
```

or if you use pnpm:

```bash
pnpm add draft-js draft-js-export-html
```

## Changes Made

### 1. Updated `SingleContentContainer.tsx`
- Replaced `draftjs-to-html` with `draft-js-export-html` for better custom style support
- Added `customStyleMap` matching your admin panel configuration
- Properly converts Draft.js content to HTML with custom font weights and highlights

### 2. Created `article-content-styles.css`
- CSS to ensure custom styles display properly
- Dark mode support for highlights and font weights
- Import this file in your main CSS or layout file

## How to Import the CSS

Add this import to your main CSS file or global styles:

```css
@import './article-content-styles.css';
```

Or import it directly in your component:

```typescript
import './article-content-styles.css'
```

Or add the styles to your `globals.css` or `tailwind.css` file.

## Key Changes Explained

### Before (using draftjs-to-html):
```typescript
import draftToHtml from 'draftjs-to-html'
// ...
return draftToHtml(parsed as unknown as RawDraftContentState)
```

### After (using draft-js-export-html):
```typescript
import { convertFromRaw } from 'draft-js'
import { stateToHTML } from 'draft-js-export-html'
// ...
const contentState = convertFromRaw(rawContent)
return stateToHTML(contentState, options)
```

The new approach allows us to pass the `customStyleMap` which properly applies:
- ✅ Font weights (300, 400, 500, 600, 700, 800)
- ✅ Highlight colors (Yellow, Green, Blue, Pink, Orange, Purple)

## Testing

After installation, test with content that has:
1. Different font weights
2. Various highlight colors
3. Both in light and dark mode

The styles should now display correctly matching your admin panel editor!
