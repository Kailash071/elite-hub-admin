# Electronic Admin - Node.js TypeScript Project

A modern Node.js project with TypeScript and ES modules setup.

## Features

- 🔥 **TypeScript** - Type safety and modern JavaScript features
- 📦 **ES Modules** - Modern import/export syntax
- 🛠️ **Development Tools** - Hot reload with tsx
- 🏗️ **Build System** - Compile to JavaScript for production
- 📝 **Type Definitions** - Comprehensive type safety

## Project Structure

```
admin/
├── src/                 # TypeScript source files
│   ├── index.ts        # Main entry point
│   ├── utils.ts        # Utility functions
│   └── types.ts        # Type definitions
├── dist/               # Compiled JavaScript (generated)
├── package.json        # Project configuration
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Development

Run in development mode with hot reload:

```bash
npm run dev
```

### 3. Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### 4. Production

Run the compiled JavaScript:

```bash
npm start
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run compiled JavaScript in production
- `npm run clean` - Remove compiled files

## ES Modules Usage

This project uses ES modules with TypeScript. Here are examples:

### Named Exports/Imports

```typescript
// utils.ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export const APP_NAME = 'Electronic Admin';

// index.ts
import { greet, APP_NAME } from './utils.js';
```

### Default Exports/Imports

```typescript
// config.ts
const config = {
  apiUrl: 'https://api.example.com'
};

export default config;

// index.ts
import config from './config.js';
```

### Type Exports/Imports

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
}

// index.ts
import type { User } from './types.js';
```

## Important Notes

- **File Extensions**: When importing TypeScript files, use `.js` extension in import paths (not `.ts`)
- **ES Modules**: This project uses `"type": "module"` in package.json
- **Node.js Version**: Requires Node.js 18 or higher

## Dependencies

### Development Dependencies

- **typescript** - TypeScript compiler
- **@types/node** - Node.js type definitions
- **tsx** - TypeScript execution engine for development
- **rimraf** - Cross-platform file/directory removal

## TypeScript Configuration

The project uses modern TypeScript configuration with:

- **Target**: ES2022
- **Module**: ESNext
- **Strict Mode**: Enabled
- **Source Maps**: Enabled for debugging
- **Declaration Files**: Generated for libraries
