# NextGen WOM - Specify Memory Index

This directory contains the core documentation and guidelines for the NextGen WOM (Work Order Management) system.

## Documentation Structure

### 📋 Core System Documentation
- **[constitution.md](./constitution.md)** - Foundational principles, architectural constraints, and non-negotiable requirements
- **[brand-kit-guidelines.md](./brand-kit-guidelines.md)** - Complete brand identity, color palette, typography, and design system

### 🎨 Brand & Design System
The **Brand Kit Guidelines** provide comprehensive documentation for:

#### Visual Identity
- Color palette with hex codes, RGB, and HSL values
- Typography hierarchy and font specifications
- Logo usage and brand application guidelines

#### Component Design System
- Button styles and interactive states
- Navigation and header specifications
- Form elements and input field styles
- Status indicators and badge designs

#### Implementation Guidelines
- CSS custom properties and Tailwind configuration
- Accessibility compliance (WCAG AA/AAA standards)
- Mobile and PWA design principles
- Code examples and component patterns

#### Quality Assurance
- Color contrast verification
- Implementation checklists
- Maintenance and update procedures

### 🏗️ System Architecture
The **Constitution** establishes:

#### Core Principles
- Mobile-First Design (Non-negotiable)
- Progressive Web App Requirements
- Integration Integrity with n8n workflow
- Multi-Client Data Isolation
- Security & Data Protection

#### Technical Standards
- Database design constraints
- API endpoint specifications
- Authentication and authorization requirements
- Email notification standards
- Offline functionality requirements

#### Development Workflow
- Feature development lifecycle
- Testing and validation procedures
- Deployment and maintenance guidelines
- P1 MVP validation patterns

## Quick Reference

### Brand Colors
- **Deep Navy**: `#0e2640` - Headers, navigation, primary brand elements
- **NextGen Green**: `#8bc63b` - CTAs, accents, success states
- **Rich Black**: `#010308` - Body text, high contrast elements  
- **Pure White**: `#ffffff` - Backgrounds, cards, negative space

### Key Principles
1. **Mobile-First**: All features must work on smartphones first
2. **Multi-Client**: Complete data isolation between organizations
3. **Offline-Capable**: Core functionality must work without internet
4. **Integration-Safe**: Never break the n8n webhook workflow
5. **Accessible**: Meet WCAG AA standards minimum

### Component Implementation
```jsx
// Primary Button
<button className="bg-nextgen-green hover:bg-nextgen-green-dark text-pure-white px-4 py-2 rounded-md font-medium">
  Action
</button>

// Header
<header className="bg-deep-navy text-pure-white">
  NextGen WOM
</header>

// Status Badge
<span className="bg-nextgen-green/10 text-nextgen-green px-2 py-1 rounded-full text-sm">
  Completed
</span>
```

## Maintenance

### Review Schedule
- **Constitution**: Updated as needed for architectural changes
- **Brand Guidelines**: Quarterly review for consistency
- **Component Library**: Continuous updates with new features

### Change Process
1. Propose changes via design/architecture review
2. Update relevant documentation files
3. Update implementation (CSS, components)
4. Test across all breakpoints and devices
5. Deploy and monitor for issues

### Version Control
- Constitution: v1.0.1 (Last updated: October 2025)
- Brand Guidelines: v1.0.0 (Created: October 2025)

---

*This documentation serves as the single source of truth for NextGen WOM development, ensuring consistency, quality, and maintainability across all system components.*