# Release 2.11.0 - Desktop Sidebar Navigation & Unified Headers

**Release Date:** March 27, 2026
**Type:** Minor Version Update

## Summary
Version 2.11.0 adds a persistent desktop sidebar navigation for screens 1024px and wider, providing always-visible navigation links to Dashboard, Work Orders, Quotes, and Settings. The sidebar is collapsible and integrates with the existing mobile bottom navigation (which remains for smaller screens). This release also unifies page headers across all Quote pages and fixes a critical scroll freeze bug.

## New Features

### Desktop Sidebar Navigation
- **Persistent sidebar**: Fixed 240px sidebar visible on screens >= 1024px (lg: breakpoint)
- **Collapsible**: Toggle button to expand/collapse, reclaiming screen space when needed
- **Active route highlighting**: Current page highlighted with nextgen-green accent
- **4 navigation links**: Dashboard, Work Orders, Quotes, Settings

### Unified Page Headers
- **Quote List Page**: Added back button navigating to Dashboard
- **Quote Detail Page**: Added back button navigating to Quotes list
- **Quote Request Form**: Added back button navigating to Quotes list (both new and edit modes)

### Scroll Freeze Fix
- Removed `overflow-x: hidden` rules from `index.html` and `index.css`
- Per CSS spec, `overflow-x: hidden` implicitly sets `overflow-y: auto`, creating nested scroll containers that trap scroll events
- Replaced with `width: 100%` + `max-width: 100%` which already prevents horizontal overflow

## Technical Details

### New Files
| File | Description |
|------|-------------|
| `frontend/src/components/layout/DesktopSidebar.jsx` | 240px fixed sidebar component with nav links and collapse toggle |
| `frontend/src/components/layout/MainLayout.jsx` | Wrapper integrating sidebar, header, content area, and mobile nav |
| `frontend/src/context/SidebarContext.jsx` | React context for shared sidebar open/close state |
| `frontend/src/hooks/useSidebar.js` | Hook with safe defaults when used outside SidebarProvider |

### Files Modified
| File | Change |
|------|--------|
| `frontend/src/App.jsx` | Wrapped routes with SidebarProvider and MainLayout |
| `frontend/src/components/layout/AppHeader.jsx` | Responsive header with sidebar integration |
| `frontend/src/components/layout/MobileNavigation.jsx` | Added `lg:hidden` to hide on desktop |
| `frontend/src/pages/Quotes/QuoteListPage.jsx` | Added showBackButton and onBackClick |
| `frontend/src/pages/Quotes/QuoteDetailPage.jsx` | Added showBackButton and onBackClick |
| `frontend/src/pages/Quotes/QuoteRequestForm.jsx` | Added showBackButton and onBackClick |
| `frontend/src/index.css` | Removed overflow-x:hidden rules |
| `frontend/index.html` | Removed overflow-x:hidden from inline CSS |
| 10 page files | Removed duplicate MobileNavigation imports |

### No Breaking Changes
- No database migrations required
- No API response changes
- Mobile bottom navigation unchanged
- Existing page behavior preserved
