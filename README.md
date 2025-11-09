# API Specification Viewer

A modern, interactive web application for viewing and exploring OpenAPI specifications. Built with Next.js, React, and TypeScript, this tool provides a clean, user-friendly interface to navigate through API documentation.

![API Specification Viewer](https://via.placeholder.com/1200x600?text=API+Specification+Viewer)

## Features

- **Interactive Documentation**: View and navigate through API endpoints with ease
- **Real-time Search**: Quickly find endpoints using the search functionality
- **Code Examples**: View request/response examples in multiple formats
- **Responsive Design**: Works on both desktop and mobile devices
- **Dark Mode**: Built-in dark theme for comfortable viewing
- **Export to Postman**: Export API collections directly to Postman

## Tech Stack

- **Frontend**:
  - Next.js 14
  - React 18
  - TypeScript
  - Tailwind CSS
  - Radix UI Components
  - React Syntax Highlighter

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/api-spec-viewer.git
   cd api-spec-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Add your OpenAPI specification:
   - Place your `spec.yml` or `spec.json` file in the root directory
   - Or configure the path in the application settings

### Running Locally

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
.
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main page component
├── components/          # Reusable components
│   ├── ui/             # UI components
│   ├── ContentArea.tsx  # Main content display
│   ├── Header.tsx       # Application header
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── RequestModel.tsx # Request/response model viewer
├── lib/                 # Utility functions
│   └── openapi-parser.ts# OpenAPI spec parsing logic
├── hooks/               # Custom React hooks
│   ├── handle-copy.tsx  # Copy to clipboard functionality
│   └── postman-export.tsx # Postman export functionality
└── spec.yml             # Example OpenAPI specification
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [OpenAPI Specification](https://www.openapis.org/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
