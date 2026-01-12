# WealthTrack Pro - Agent Guidelines

This document provides guidelines for agentic coding assistants working on the WealthTrack Pro codebase.

## Project Overview

WealthTrack Pro is a multi-user wealth management system built with React 19 + TypeScript + Vite (frontend) and Node.js + Express (backend). The application tracks assets across multiple wallets, currencies, and investment paths with AI-powered portfolio analysis.

## Development Commands

```bash
# Development
npm run dev              # Start frontend dev server (Vite on port 3000)
npm run dev:server       # Start backend server (Express on port 3001) 
npm run dev:all          # Start both frontend and backend concurrently

# Production
npm run build            # Build production bundle
npm run preview          # Preview production build locally
npm run start:server     # Start backend server in production mode
```

**Note:** There are no dedicated lint/test commands currently. The project relies on TypeScript for type checking and Vite for build validation.

## Architecture

### Frontend (React 19 + Vite)
- **Framework:** React 19 with functional components and hooks
- **Language:** TypeScript with strict typing
- **Styling:** Tailwind CSS (utility-first approach)
- **Charts:** Recharts for data visualization
- **Icons:** Lucide React for consistent iconography
- **Build Tool:** Vite 6 with React plugin

### Backend (Node.js + Express)
- **Runtime:** Node.js with Express framework
- **Storage:** File system (JSON files in `user-data/` directory)
- **API:** RESTful endpoints with JSON responses
- **AI Integration:** Google Gemini API for portfolio analysis

## Code Style Guidelines

### File Organization
```
/
├── App.tsx                    # Main application component
├── components/
│   └── Icon.tsx              # Reusable icon component
├── services/
│   ├── geminiService.ts      # AI analysis service
│   └── serverStorageService.ts # Server storage service
├── types.ts                  # TypeScript type definitions
├── constants.tsx             # Application constants
├── server.js                 # Express backend server
└── vite.config.ts           # Vite configuration
```

### Import Conventions
```typescript
// React imports first
import React, { useState, useEffect, useMemo } from 'react';

// External libraries (alphabetical)
import { PieChart, Pie, Cell } from 'recharts';
import { GoogleGenAI } from '@google/genai';

// Internal imports (absolute paths with @ alias)
import { Asset, Currency } from './types';
import { analyzePortfolio } from './services/geminiService';
import Icon from './components/Icon';
```

### TypeScript Practices
- Use interfaces for object shapes, enums for constants
- Always type function parameters and return values
- Prefer `React.FC` for functional components
- Use generic types where appropriate (`ServerResponse<T>`)
- Maintain strict null safety with optional operators

### Component Structure
```typescript
interface ComponentProps {
  // Define props here
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 1. State declarations
  const [state, setState] = useState<Type>();
  
  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 3. Computed values
  const computedValue = useMemo(() => {
    // Expensive calculations
  }, [dependencies]);
  
  // 4. Event handlers
  const handleClick = () => {
    // Handle events
  };
  
  // 5. Render
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  );
};
```

### Naming Conventions
- **Components:** PascalCase (e.g., `UserProfile`, `AssetForm`)
- **Functions:** camelCase (e.g., `analyzePortfolio`, `uploadToServer`)
- **Variables:** camelCase (e.g., `activeUserId`, `currencyDistribution`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `INITIAL_CURRENCIES`, `COLORS`)
- **Files:** kebab-case for components (e.g., `user-profile.tsx`), PascalCase for utilities
- **Types/Interfaces:** PascalCase with descriptive names (e.g., `PortfolioStats`, `ServerResponse`)

### Error Handling
```typescript
// API calls with try-catch
try {
  const result = await apiCall();
  return result.data;
} catch (error) {
  console.error('API Error:', error);
  throw new Error('User-friendly error message');
}

// Optional chaining for safe property access
const currency = currencies.find(c => c.code === asset.currencyCode);
const rate = currency?.rateToCNY || 1;
```

### State Management
- Use React hooks for local state (`useState`, `useEffect`, `useMemo`)
- Persist critical data to `localStorage`
- Server communication through dedicated service functions
- Keep state normalized and flat when possible

## API Design Patterns

### Response Format
```typescript
interface ServerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: number;
}
```

### Service Function Pattern
```typescript
export async function serviceFunction(params: Type): Promise<ReturnType> {
  try {
    const response = await fetch(`${API_BASE}/endpoint`, {
      method: 'HTTP_METHOD',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    const result: ServerResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Operation failed');
    }
    
    return result.data;
  } catch (error) {
    console.error('Service Error:', error);
    throw new Error('User-friendly error message');
  }
}
```

## Configuration

### Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key for AI analysis
- `VITE_API_URL`: Backend API URL (default: `http://localhost:3001/api`)
- `PORT`: Backend server port (default: 3001)

### Vite Configuration
- Frontend runs on port 3000 with host `0.0.0.0`
- Path alias: `@` points to project root
- React plugin enabled with SWC

## Security Considerations

- Never commit `.env.local` or actual API keys
- User data stored in `user-data/` directory (gitignored)
- Validate all user inputs on both client and server
- Use HTTPS in production environments

## Development Workflow

1. Always run `npm run dev:all` for full-stack development
2. Test both frontend and backend functionality
3. Verify data persistence across browser sessions
4. Test AI features with valid Gemini API key
5. Ensure cross-device sync works with backend running

## Common Patterns

### Async Data Loading
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchFromApi();
      setData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadData();
}, [dependencies]);
```

### Form Handling
```typescript
const [formData, setFormData] = useState<FormData>({});

const handleChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await submitData(formData);
    // Reset form or show success
  } catch (error) {
    // Show error message
  }
};
```

## Testing Notes

Currently no automated tests are configured. When implementing tests:
- Use React Testing Library for component tests
- Use Jest/Vitest for unit tests
- Test API endpoints with Supertest
- Focus on critical business logic (data calculations, API integration)

## Deployment

The project includes deployment scripts for VPS deployment:
- `deploy-full.sh`: Complete deployment with PM2 and Nginx
- `deploy-simple.sh`: Basic deployment without Nginx
- `deploy.sh`: Nginx configuration only

Always test deployment scripts locally before production use.