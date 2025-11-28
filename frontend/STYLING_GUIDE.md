# Styling Guide - How to Re-style the Application

## Architecture Overview

The frontend has been refactored to separate **structure** from **styling**, making it easy to re-style the entire application without touching component code.

## File Structure

```
frontend/
├── styles/
│   └── tokens.css          # Design tokens (colors, spacing, typography, etc.)
├── app/
│   ├── globals.css         # Global styles using tokens
│   ├── page.module.css     # Main page styles
│   └── asset/[symbol]/
│       └── page.module.css # Asset detail page styles
└── components/
    └── Dashboard/
        ├── Ticker.js
        ├── Ticker.module.css      # Ticker component styles
        ├── AssetManager.js
        └── AssetManager.module.css # AssetManager component styles
```

## How It Works

### 1. Design Tokens (`styles/tokens.css`)

All design values are centralized in CSS variables:

- **Colors**: `--color-primary`, `--color-text-primary`, etc.
- **Spacing**: `--spacing-md`, `--spacing-card-padding`, etc.
- **Typography**: `--font-size-xl`, `--font-weight-bold`, etc.
- **Effects**: `--glass-bg`, `--shadow-lg`, `--gradient-primary`, etc.

**To change the theme**, simply modify values in `tokens.css`.

### 2. CSS Modules

Each component has its own `.module.css` file with semantic class names:

```css
/* Ticker.module.css */
.card {
  padding: var(--spacing-card-padding);
}

.symbol {
  font-size: var(--font-size-2xl);
  color: hsl(var(--color-text-primary));
}
```

Components use these classes:
```jsx
<div className={styles.card}>
  <h3 className={styles.symbol}>{symbol}</h3>
</div>
```

**To re-style a component**, edit its `.module.css` file.

### 3. Global Styles (`globals.css`)

Contains reusable utility classes like `.glass-panel`, `.container`, `.grid-dashboard` that use design tokens.

## How to Re-style the Application

### Option 1: Change Theme (Quick)

Edit `styles/tokens.css` to change:
- Colors (all components will update)
- Spacing (padding, margins, gaps)
- Typography (font sizes, weights)
- Effects (shadows, gradients, glass effects)

**Example**: To change the primary color:
```css
:root {
  --color-primary: 221 100% 50%; /* Change this value */
}
```

### Option 2: Re-style Individual Components

Edit the component's `.module.css` file:

**Example**: To change Ticker card padding:
```css
/* components/Dashboard/Ticker.module.css */
.card {
  padding: 4rem; /* Change from var(--spacing-card-padding) */
}
```

### Option 3: Complete Theme Overhaul

1. Create a new theme file: `styles/themes/dark.css` or `styles/themes/custom.css`
2. Override design tokens:
   ```css
   :root {
     --color-background: 220 13% 9%;
     --color-foreground: 0 0% 100%;
     /* ... other overrides */
   }
   ```
3. Import in `app/layout.js`:
   ```js
   import "../styles/themes/dark.css";
   ```

### Option 4: Swap CSS Modules

To completely change a component's style:
1. Create a new CSS Module file: `Ticker.alternative.module.css`
2. Update the import in `Ticker.js`:
   ```js
   import styles from './Ticker.alternative.module.css';
   ```

## Design Token Reference

### Colors
- `--color-primary`: Primary brand color
- `--color-text-primary`: Main text color
- `--color-text-secondary`: Secondary text color
- `--color-positive`: Green for positive changes
- `--color-negative`: Red for negative changes
- `--color-border`: Border color

### Spacing
- `--spacing-xs` through `--spacing-3xl`: Standard spacing scale
- `--spacing-card-padding`: Card internal padding
- `--spacing-container-padding-x/y`: Container padding
- `--spacing-grid-gap`: Grid gap between items

### Typography
- `--font-size-xs` through `--font-size-5xl`: Font size scale
- `--font-weight-normal/bold/semibold`: Font weights
- `--font-family-base`: Base font family

### Effects
- `--glass-bg`: Glass panel background
- `--shadow-sm/md/lg/xl`: Shadow presets
- `--gradient-primary`: Primary gradient
- `--gradient-background`: Page background gradient

## Benefits

✅ **Separation of Concerns**: Structure (JSX) is separate from styling (CSS)  
✅ **Easy Theming**: Change tokens to update entire app  
✅ **Component Isolation**: Each component's styles are scoped  
✅ **Maintainable**: Clear organization and semantic naming  
✅ **Reusable**: Design tokens ensure consistency  

## Migration Notes

- Tailwind classes are still available but not used in refactored components
- Inline styles have been moved to CSS Modules
- All hardcoded values now use design tokens
- Responsive breakpoints are handled in `tokens.css` media queries

