# Ajoti Frontend

A minimal, clean, and scalable React + TypeScript boilerplate for fintech applications.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool and dev server |
| **Mantine UI** | Component library (buttons, cards, forms, etc.) |
| **Tailwind CSS** | Layout utilities and custom styling |
| **React Router** | Client-side routing |
| **ESLint + Prettier** | Code quality and formatting |
| **pnpm** | Package manager |

## Stack Choices

- **Mantine over Material UI**: Mantine provides a cleaner API, better TypeScript support, and is more lightweight. It's ideal for fintech applications that need a professional, neutral aesthetic.
- **Tailwind for layout only**: Mantine handles component styling; Tailwind is used for layout utilities (flex, grid, spacing, responsive design).
- **Vite over CRA**: Faster development experience with instant HMR and optimized builds.
- **pnpm over npm**: Faster installs, better disk space efficiency, strict dependency management.

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server at http://localhost:5173 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm format` | Format code with Prettier |

## Project Structure

```
src/
├── components/     # Reusable UI components
│   └── index.ts    # Component exports
├── layouts/        # Page layouts (AppShell, etc.)
│   ├── AppLayout.tsx
│   └── index.ts
├── pages/          # Page components
│   ├── Home.tsx
│   └── index.ts
├── styles/         # Global styles and theme
│   ├── index.css   # Tailwind + Mantine imports
│   └── theme.ts    # Mantine theme configuration
├── types/          # TypeScript type definitions
│   └── index.ts
├── utils/          # Utility functions
│   └── index.ts
├── App.tsx         # Root component with routing
└── main.tsx        # Entry point with providers
```

## Using Mantine + Tailwind Together

Mantine handles component styling; use Tailwind for layout:

```tsx
import { Card, Title, Text, Button } from '@mantine/core'

function Example() {
  return (
    // Tailwind for layout
    <div className="mx-auto max-w-4xl p-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Mantine for components */}
        <Card withBorder>
          <Title order={3}>Card Title</Title>
          <Text c="dimmed">Card description</Text>
          <Button mt="md">Action</Button>
        </Card>
      </div>
    </div>
  )
}
```

## Absolute Imports

Use `@/` to import from the `src` directory:

```tsx
import { AppLayout } from '@/layouts'
import { Home } from '@/pages'
import { theme } from '@/styles/theme'
```

## Theme Customization

Edit `src/styles/theme.ts` to customize the Mantine theme:

```tsx
import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'primary',
  // Add your customizations
})
```

## Adding New Pages

1. Create a new component in `src/pages/`
2. Export it from `src/pages/index.ts`
3. Add a route in `src/App.tsx`

## Adding New Components

1. Create a new component in `src/components/`
2. Export it from `src/components/index.ts`
3. Import using `@/components`

## License

Private
