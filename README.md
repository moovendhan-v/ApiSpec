# API Spec Documentation Package

A Next.js package that renders OpenAPI specifications in a beautiful, dark-themed UI similar to Swagger UI.

## Features

- 🎨 Dark theme UI matching the design specification
- 📱 Responsive three-column layout
- 🔍 Search functionality for endpoints
- 📝 Interactive endpoint documentation
- 💻 Code examples in multiple languages (cURL, JavaScript, Java, Swift)
- 🔐 Authorization documentation
- 📋 Request/Response examples

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
.
├── app/
│   ├── api/
│   │   └── spec/
│   │       └── route.ts      # API route to serve spec.yml
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page component
├── components/
│   ├── Header.tsx            # Top header with logo and navigation
│   ├── Sidebar.tsx           # Left sidebar with endpoint navigation
│   ├── ContentArea.tsx        # Middle content area with endpoint details
│   └── CodePanel.tsx         # Right panel with code examples
├── lib/
│   └── openapi-parser.ts     # OpenAPI spec parser utilities
└── spec.yml                  # Your OpenAPI specification file
```

## Usage

1. Place your OpenAPI specification file (`spec.yml`) in the root directory
2. The app will automatically load and parse the spec file
3. Navigate through endpoints using the left sidebar
4. View endpoint details, parameters, and code examples

## Customization

### Colors

The color scheme can be customized in `tailwind.config.js`:

```javascript
colors: {
  'dark-bg': '#1a1a1a',
  'dark-sidebar': '#252525',
  'dark-content': '#2a2a2a',
  'dark-border': '#333333',
}
```

### Styling

Global styles are in `app/globals.css`. Component-specific styles use Tailwind CSS classes.

## Requirements

- Node.js 18+ 
- npm or yarn

## License

MIT

