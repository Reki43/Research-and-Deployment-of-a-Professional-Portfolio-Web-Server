# GitHub Contributions Widget Integration

## 1. Widget Setup

### Script Integration
```html
<script type="module" defer src="https://cdn.jsdelivr.net/gh/imananoosheh/github-contributions-fetch@latest/github_calendar_widget.js"></script>
```
This script tag:
- Imports the GitHub contributions widget library
- Fetches from CDN for faster loading and caching

### HTML Structure
```html
<section id="github-activity" class="section github-activity-section" data-aos="fade-up">
  <div class="container">
    <h2>GitHub Contributions</h2>
    <div class="github-calendar-container">
      <div id="calendar-component" 
           username="Reki43" 
           theme-color="#00AEEF"
           background-color="#262626">
      </div>
    </div>
  </div>
</section>
```
The HTML structure:
- Creates a dedicated section for GitHub activity
- Implements fade-up animation on scroll
- Sets up container hierarchy for proper spacing
- Configures widget with username and theme colors
- Maintains consistent section styling

## 2. Styling Implementation

### Container Styling
```css
.github-calendar-container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px;
  background: linear-gradient(145deg, var(--secondary-color), #2b2b2b);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 174, 239, 0.1);
}
```
The container styling:
- Creates a responsive width container
- Centers the calendar horizontally
- Adds depth with gradient background
- Provides visual separation with shadow
- Maintains consistent rounded corners
- Uses semi-transparent border for subtle edge

### Calendar Component Styling
```css
#calendar-component {
  --calendar-bg: transparent;
  --calendar-text: var(--text-color);
  --calendar-grade-0: rgba(255, 255, 255, 0.05);
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  transform: scale(0.95);
  transform-origin: center;
}
```
The component styling:
- Sets up widget theming variables
- Makes background transparent for integration
- Matches text color with portfolio theme
- Scales widget for optimal display size
- Centers the calendar in container
- Ensures responsive behavior
- Uses transform for better performance











