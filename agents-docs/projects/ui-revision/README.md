# UI Revision & Enhancement Project

Comprehensive overhaul of HTML, CSS, and UI components to improve layout robustness, responsiveness, accessibility, and user interactions across the Smart Campus application.

## Project Snapshot
- Variant: `HITL`
- Intent: **Modernize and bulletproof the UI layer with focus on HTML/CSS architecture**

## Objectives

### Primary Goals
1. **Fix Sensor Panel Behavior**: Panel should close when clicking outside or pressing +Sensors button again
2. **Improve Layout Robustness**: Cards and containers should be responsive and maintain structure across screen sizes
3. **Component Modernization**: Review and enhance all UI molecules/organisms for consistency
4. **CSS Architecture**: Consolidate styles, remove redundancies, establish clear component patterns

### Success Criteria
- [ ] Sensor panel closes on outside click
- [ ] +Sensors button toggles panel (second click closes)
- [ ] All cards maintain proper layout on mobile/tablet/desktop
- [ ] No layout breaks or overflow issues
- [ ] Consistent spacing and typography system
- [ ] Improved accessibility (ARIA labels, keyboard navigation)
- [ ] Documented component library

## Current Issues

### 1. Sensor Panel (Critical)
**File**: `src/main.js` + `src/lib/PanelBuilder.js`
**Problem**:
- Panel doesn't close when clicking outside
- +Sensors button doesn't toggle (only opens, never closes)
- No escape key support

**Status**: ✅ Fixed (click outside detection added in main.js:1875-1888)

### 1.5. Sensors Dashboard Page (High Priority)
**File**: `sensors.html` + `src/pages/sensors/main.js` + `src/lib/SensorDashboard.js`
**URL**: http://localhost:5173/sensors.html (verify port)
**Current State**:
- ✅ Live WebSocket connection to Home Assistant working
- ✅ Category-based filtering (scheduling, occupancy, environment, lighting, energy, people, global)
- ✅ Responsive grid layout with mobile breakpoints
- ✅ Real-time sensor updates with visual feedback

**Needs Improvement**:
- **Data Display**: Currently shows only basic state values (e.g., "25.5 °C"). Need richer context (location, description, last updated timestamp)
- **Categorization**: 7 categories defined but visual hierarchy could be clearer
- **Search/Filter**: No way to search for specific sensors by name or room
- **Data Formatting**: Timestamps, boolean states, and complex values need better formatting
- **Room Grouping**: Consider adding room/floor grouping alongside category filtering
- **Loading States**: Add skeleton loaders while connecting to Home Assistant
- **Error Handling**: Show meaningful error messages when sensors fail to load

**Status**: 🔍 Needs comprehensive review and enhancement (UIR-101)

### 2. Card Layout Responsiveness
**Files**: `src/styles/main.css`, `.hui-panel`, `.panel-strip`
**Problems**:
- Cards may break on mobile
- Horizontal scroll behavior inconsistent
- Panel indicators don't align properly on small screens

**Status**: 🔍 Needs investigation

### 3. Component Consistency
**Files**: Various UI components in `src/ui/components/`
**Problems**:
- Inconsistent button styles across app
- Mixed naming conventions (hui-panel vs panel-shell)
- No clear design system

**Status**: 📝 To document

## Architecture

### Current UI Structure
```
src/
├─ ui/
│  ├─ components/
│  │  ├─ atoms/        # Buttons, inputs, icons
│  │  ├─ molecules/    # Sensor panels, cards
│  │  └─ organisms/    # Toolbar, nav
│  └─ interactions/    # Room highlight, picking feedback
├─ styles/
│  └─ main.css         # Global styles + component styles (needs split)
└─ lib/
   └─ PanelBuilder.js  # Sensor panel generation
```

### Target State
- Modular CSS (CSS modules or BEM methodology)
- Component-scoped styles
- Design tokens (colors, spacing, typography)
- Responsive grid system
- Accessibility audit passing

## Key Files to Focus On

### HTML/Template Generation
- `src/lib/PanelBuilder.js` - Sensor panel HTML generation
- `src/molecules/SensorPanel.js` - Individual sensor cards
- `src/organisms/Toolbar.js` - Main navigation

### CSS Files
- `src/styles/main.css` - Global styles (needs refactoring)
- Component-specific styles (currently inline or in main.css)

### Interactive Components
- `src/main.js:1858-1888` - Panel toggle logic
- `src/ui/modules/NavigationControls.js` - Camera controls
- `src/ui/modules/LightingControls.js` - Lighting UI

## Design System Requirements

### Typography Scale
- Headings: h1-h6 with consistent sizing
- Body text: primary/secondary colors
- Monospace: for sensor values

### Color Palette
- Document existing colors
- Define semantic tokens (bg, surface, text, accent, error, success)
- Dark mode considerations

### Spacing Scale
- Define consistent spacing units (4px, 8px, 12px, 16px, 24px, 32px)
- Apply to margins, padding, gaps

### Component Library
- Button variants (primary, secondary, ghost)
- Card styles (elevated, flat, outlined)
- Input fields (text, select, checkbox)
- Modal/panel patterns

## Next Agent Instructions

**Focus**: HTML structure, CSS architecture, responsive design, accessibility

**Immediate Tasks**:
1. **Review sensors.html dashboard** (UIR-101) - High priority from user
   - Visit http://localhost:5173/sensors.html and assess current data presentation
   - Enhance sensor display with meaningful context (room, description, timestamps)
   - Improve category organization and visual hierarchy
   - Add search/filter functionality
   - Test responsive layout on mobile/tablet
2. Audit all `.hui-panel` styles for responsive breakpoints (UIR-102)
3. Create CSS variables for design tokens (UIR-103)
4. Test panel behavior on mobile devices
5. Document component patterns (UIR-105)
6. Fix any layout overflow issues (UIR-106)
7. Add Escape key to close sensor panel (UIR-104)

**Tools**:
- Browser DevTools (responsive design mode)
- Accessibility inspector
- CSS Grid/Flexbox debugging

**Deliverables**:
- Session log documenting CSS refactoring decisions
- Updated `main.css` with component-scoped sections
- List of breaking changes (if any)

## Folder Structure
- `README.md` — Project overview and architecture
- `tasks.yaml` — Task backlog
- `tasks.md` — Auto-generated task ledger
- `sessions/` — Session logs for UI work
- `qa/` — Visual regression testing notes

## Best Practices
- Test on mobile, tablet, desktop viewports
- Use semantic HTML5 elements
- Add ARIA labels where needed
- Avoid !important in CSS
- Use CSS Grid/Flexbox for layouts
- Document all component variants

> Tip: Take screenshots before/after changes for visual regression comparison
