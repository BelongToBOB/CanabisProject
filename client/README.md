# Cannabis Shop Management System - Frontend

This is the frontend application for the Cannabis Shop Management System, built with React, TypeScript, and Vite.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form management
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components (routes)
├── services/       # API service layer
├── contexts/       # React context providers
├── utils/          # Utility functions
└── assets/         # Static assets
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_API_URL=http://localhost:3000/api
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## API Configuration

The API URL is configured via the `VITE_API_URL` environment variable. This should point to your backend server's API endpoint.

## Development Guidelines

- Use TypeScript for all new files
- Follow the existing folder structure
- Use Tailwind CSS for styling
- Use React Hook Form for form management
- Use Axios for API calls through the services layer
- Implement proper error handling
- Add loading states for async operations
