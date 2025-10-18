# NextGen WOM - Brand Kit Guidelines

## Brand Identity Overview

NextGen WOM (Work Order Management) is a professional, multi-client work order management system designed for modern property maintenance operations. The brand conveys trust, innovation, and operational excellence.

## Core Brand Values
- **Trust & Reliability**: Professional service delivery
- **Innovation**: Next-generation technology solutions  
- **Efficiency**: Streamlined workflow management
- **Growth**: Scalable multi-client platform
- **Accessibility**: User-friendly for all stakeholders

---

## Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | HSL | Usage |
|------------|----------|-----|-----|-------|
| **Deep Navy** | `#0e2640` | RGB(14, 38, 64) | HSL(213, 64%, 15%) | Headers, navigation, primary brand elements |
| **NextGen Green** | `#8bc63b` | RGB(139, 198, 59) | HSL(85, 57%, 50%) | CTAs, accents, success states, highlights |
| **Rich Black** | `#010308` | RGB(1, 3, 8) | HSL(223, 78%, 2%) | Body text, icons, high contrast elements |
| **Pure White** | `#ffffff` | RGB(255, 255, 255) | HSL(0, 0%, 100%) | Backgrounds, cards, negative space |

### Color Variants (Tailwind Implementation)

```css
/* Deep Navy Variants */
deep-navy: #0e2640
deep-navy-light: #1a3a5c
deep-navy-dark: #081a2d

/* NextGen Green Variants */
nextgen-green: #8bc63b
nextgen-green-light: #a5d662
nextgen-green-dark: #6fa52a

/* Rich Black Variants */
rich-black: #010308
rich-black-light: #1a1d23
rich-black-dark: #000000
```

### Semantic Color Mapping

```css
/* Primary Actions */
primary: Deep Navy (#0e2640)
primary-hover: Deep Navy Light (#1a3a5c)
primary-active: Deep Navy Dark (#081a2d)

/* Secondary Actions */
secondary: NextGen Green (#8bc63b)
secondary-hover: NextGen Green Light (#a5d662)
secondary-active: NextGen Green Dark (#6fa52a)

/* Text Hierarchy */
text-primary: Rich Black (#010308)
text-secondary: Gray 600 (#4b5563)
text-muted: Gray 500 (#6b7280)

/* Backgrounds */
bg-primary: Pure White (#ffffff)
bg-secondary: Gray 50 (#f9fafb)
bg-accent: Gray 100 (#f3f4f6)
```

---

## Typography Guidelines

### Font Hierarchy

```css
/* Primary Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Headings */
h1: 2rem (32px) - font-bold - text-rich-black
h2: 1.5rem (24px) - font-semibold - text-rich-black
h3: 1.25rem (20px) - font-semibold - text-rich-black
h4: 1.125rem (18px) - font-medium - text-rich-black

/* Body Text */
body: 1rem (16px) - font-normal - text-rich-black
small: 0.875rem (14px) - font-normal - text-gray-600
caption: 0.75rem (12px) - font-normal - text-gray-500
```

### Text Usage Rules

- **Headers**: Always use Rich Black for maximum contrast
- **Body Text**: Use Rich Black for primary content, Gray 600 for secondary
- **Interactive Text**: Use NextGen Green for links and active states
- **Error Text**: Use Red 600 (#dc2626) for error messages
- **Success Text**: Use NextGen Green for success messages

---

## Component Design System

### Buttons

#### Primary Button
```css
background: nextgen-green (#8bc63b)
color: pure-white (#ffffff)
hover: nextgen-green-dark (#6fa52a)
padding: 12px 16px
border-radius: 6px
font-weight: 500
```

#### Secondary Button
```css
background: pure-white (#ffffff)
color: rich-black (#010308)
border: 1px solid gray-300
hover: gray-50 (#f9fafb)
padding: 12px 16px
border-radius: 6px
font-weight: 500
```

#### Dark Button
```css
background: deep-navy (#0e2640)
color: pure-white (#ffffff)
hover: deep-navy-light (#1a3a5c)
padding: 12px 16px
border-radius: 6px
font-weight: 500
```

### Navigation & Headers

#### App Header
```css
background: deep-navy (#0e2640)
color: pure-white (#ffffff)
height: 64px
box-shadow: 0 2px 4px rgba(0,0,0,0.1)
```

#### Navigation Items
```css
color: pure-white (#ffffff)
hover: deep-navy-light (#1a3a5c)
active: nextgen-green (#8bc63b)
padding: 8px 12px
border-radius: 4px
```

### Status Indicators

#### Status Colors
```css
/* Pending */
pending: amber-500 (#f59e0b)
pending-bg: amber-100 (#fef3c7)

/* In Progress */
in-progress: nextgen-green (#8bc63b)
in-progress-bg: nextgen-green/10 (rgba(139, 198, 59, 0.1))

/* Completed */
completed: nextgen-green (#8bc63b)
completed-bg: nextgen-green/10 (rgba(139, 198, 59, 0.1))

/* Cancelled */
cancelled: red-600 (#dc2626)
cancelled-bg: red-100 (#fee2e2)
```

### Form Elements

#### Input Fields
```css
border: 1px solid gray-300 (#d1d5db)
background: pure-white (#ffffff)
focus-border: nextgen-green (#8bc63b)
focus-ring: nextgen-green/20 (rgba(139, 198, 59, 0.2))
padding: 12px
border-radius: 6px
```

#### Focus States
```css
focus-ring: 2px solid nextgen-green/20
focus-border: nextgen-green (#8bc63b)
outline: none
```

---

## Layout Guidelines

### Spacing System
```css
/* Tailwind Spacing Scale */
xs: 4px (space-1)
sm: 8px (space-2)
md: 12px (space-3)
lg: 16px (space-4)
xl: 20px (space-5)
2xl: 24px (space-6)
3xl: 32px (space-8)
4xl: 48px (space-12)
```

### Grid System
- **Mobile First**: Start with single column layouts
- **Breakpoints**: sm(640px), md(768px), lg(1024px), xl(1280px)
- **Container**: Max-width with centered content
- **Gutters**: 16px on mobile, 24px on desktop

### Card Components
```css
background: pure-white (#ffffff)
border: 1px solid gray-200 (#e5e7eb)
border-radius: 8px
box-shadow: 0 1px 3px rgba(0,0,0,0.1)
padding: 24px
```

---

## Icon Guidelines

### Icon Style
- **Library**: Heroicons (outline style preferred)
- **Size**: 16px, 20px, 24px (consistent with text sizing)
- **Color**: Inherit from parent text color
- **Interactive Icons**: Use NextGen Green for active states

### Icon Usage
```css
/* Default Icons */
color: currentColor (inherits text color)
stroke-width: 1.5px

/* Interactive Icons */
hover: nextgen-green (#8bc63b)
active: nextgen-green-dark (#6fa52a)

/* Status Icons */
success: nextgen-green (#8bc63b)
warning: amber-500 (#f59e0b)
error: red-600 (#dc2626)
info: blue-600 (#2563eb)
```

---

## Mobile & PWA Guidelines

### Mobile Design Principles
- **Touch Targets**: Minimum 44px touch targets
- **Thumb-Friendly**: Place primary actions within thumb reach
- **Loading States**: Use NextGen Green for loading spinners
- **Safe Areas**: Respect device safe areas and notches

### PWA Branding
```css
/* Theme Colors */
theme-color: deep-navy (#0e2640)
background-color: pure-white (#ffffff)
status-bar-style: default

/* Splash Screen */
background: linear-gradient(135deg, deep-navy 0%, nextgen-green 100%)
logo-color: deep-navy (#0e2640) on white background
```

---

## Accessibility Guidelines

### Color Contrast Requirements
- **AA Standard**: 4.5:1 contrast ratio for normal text
- **AAA Standard**: 7:1 contrast ratio for enhanced accessibility
- **Large Text**: 3:1 minimum contrast ratio

### Color Contrast Verification
```css
/* High Contrast Combinations (AA/AAA Compliant) */
rich-black on pure-white: 21:1 ✅
deep-navy on pure-white: 8.2:1 ✅
nextgen-green on pure-white: 3.8:1 ⚠️ (use for large text only)
pure-white on deep-navy: 8.2:1 ✅
pure-white on nextgen-green: 3.8:1 ⚠️ (use for large text only)
```

### Focus Management
- **Focus Ring**: Always visible, 2px NextGen Green
- **Focus Order**: Logical tab order
- **Skip Links**: Provide skip navigation options

---

## Implementation Guidelines

### CSS Custom Properties
```css
:root {
  /* Brand Colors */
  --color-deep-navy: #0e2640;
  --color-nextgen-green: #8bc63b;
  --color-rich-black: #010308;
  --color-pure-white: #ffffff;
  
  /* Semantic Colors */
  --color-primary: var(--color-deep-navy);
  --color-secondary: var(--color-nextgen-green);
  --color-text: var(--color-rich-black);
  --color-background: var(--color-pure-white);
  
  /* Spacing */
  --spacing-unit: 8px;
  --border-radius: 6px;
  --box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

### Tailwind Configuration
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'deep-navy': {
          DEFAULT: '#0e2640',
          light: '#1a3a5c',
          dark: '#081a2d',
        },
        'nextgen-green': {
          DEFAULT: '#8bc63b',
          light: '#a5d662',
          dark: '#6fa52a',
        },
        'rich-black': {
          DEFAULT: '#010308',
          light: '#1a1d23',
          dark: '#000000',
        },
        'pure-white': {
          DEFAULT: '#ffffff',
        },
      },
    },
  },
}
```

### Component Examples
```jsx
// Primary Button
<button className="bg-nextgen-green hover:bg-nextgen-green-dark text-pure-white px-4 py-2 rounded-md font-medium">
  Submit
</button>

// Secondary Button  
<button className="bg-pure-white hover:bg-gray-50 text-rich-black border border-gray-300 px-4 py-2 rounded-md font-medium">
  Cancel
</button>

// Status Badge
<span className="bg-nextgen-green/10 text-nextgen-green px-2 py-1 rounded-full text-sm font-medium">
  Completed
</span>
```

---

## Brand Application Examples

### Logo Usage
- **Primary Logo**: "NextGen WOM" wordmark
- **Icon Version**: "NW" monogram in Deep Navy
- **Minimum Size**: 24px height for digital
- **Clear Space**: Minimum 1x logo height on all sides

### Marketing Materials
- **Headers**: Deep Navy backgrounds with Pure White text
- **Accents**: NextGen Green for highlights and CTAs
- **Body**: Rich Black text on Pure White backgrounds
- **Cards**: Pure White with subtle shadows

### Email Templates
- **Header**: Deep Navy background
- **Primary CTA**: NextGen Green button
- **Text**: Rich Black on Pure White
- **Footer**: Light gray background

---

## Quality Assurance Checklist

### Color Implementation ✅
- [ ] All headers use Deep Navy
- [ ] Primary actions use NextGen Green
- [ ] Body text uses Rich Black
- [ ] Backgrounds use Pure White or appropriate grays
- [ ] Status indicators follow defined color scheme

### Accessibility ✅
- [ ] Color contrast meets AA standards
- [ ] Focus states are clearly visible
- [ ] Text hierarchy is maintained
- [ ] Interactive elements have sufficient touch targets

### Consistency ✅
- [ ] Typography scale is consistent
- [ ] Spacing follows 8px grid system
- [ ] Component styles match design system
- [ ] Hover and active states are implemented

---

## Maintenance & Updates

### Version Control
- **Current Version**: 1.0.0
- **Last Updated**: October 2025
- **Review Schedule**: Quarterly
- **Approval Required**: For any color palette changes

### Change Process
1. Propose changes via design review
2. Update brand guidelines document
3. Update CSS/Tailwind configuration
4. Test across all components
5. Deploy and monitor for issues

### Documentation Updates
- Keep this document as source of truth
- Update component library documentation
- Sync with design system tools
- Maintain accessibility compliance records

---

*This brand kit ensures consistent, professional appearance across all NextGen WOM applications and materials while maintaining accessibility and usability standards.*