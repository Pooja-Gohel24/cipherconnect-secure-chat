## Pull Request Description

### Title
```
feat: Implement black and white design for login and registration pages
```

### Body
```
## Summary
This PR implements a clean black and white (monochromatic) design for the login and registration pages in CipherConnect, replacing the previous gradient-based color scheme with a minimalist black and white theme.

CipherConnect is a secure end-to-end encrypted messaging application built with FastAPI, PostgreSQL, and React (TypeScript).

## Changes Made

### Files Modified
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`

### LoginPage.tsx Changes
- Page background: Changed from gradient (`from-indigo-500 via-purple-500 to-pink-500`) to solid black (`bg-black`)
- Form container: Changed from `bg-white/95 backdrop-blur-sm` to solid white (`bg-white`) with black border
- Icon container: Changed from gradient (`bg-gradient-to-br from-indigo-500 to-purple-600`) to solid black (`bg-black`)
- Text colors: Changed from gray variants (`text-gray-800`, `text-gray-600`) to black (`text-black`)
- Input borders: Changed from `border-gray-300` to `border-black`
- Focus states: Changed from `focus:border-indigo-500 focus:ring-indigo-200` to `focus:border-black focus:ring-black`
- Button: Changed from gradient (`from-indigo-600 to-purple-600`) to solid black (`bg-black`)
- Links: Changed from `text-indigo-600` to `text-black` with hover underline

### RegisterPage.tsx Changes
- Same black and white design changes as LoginPage
- Password strength indicators: Changed from green (`bg-green-500`) to black (`bg-black`)
- All icons changed from gray to black

## Design Specifications
| Element | Before | After |
|---------|--------|-------|
| Page Background | Gradient (indigo-purple-pink) | Black (#000000) |
| Form Container | White 95% opacity + blur | White (#FFFFFF) |
| Form Border | White 20% opacity | Black |
| Icon Background | Gradient | Black |
| Buttons | Gradient (indigo-purple) | Black |
| Input Borders | Gray (#D1D5DB) | Black |
| Text | Gray variants | Black |
| Focus Ring | Indigo | Black |

## Testing Checklist
- [x] Login page renders correctly
- [x] Registration page renders correctly
- [x] Form validation works
- [x] Password visibility toggle works
- [x] Password strength indicator displays correctly
- [x] Responsive design maintained
- [x] No breaking changes to functionality

## Project Context
- **Project**: CipherConnect - A secure end-to-end encrypted messaging application
- **Backend**: FastAPI with PostgreSQL
- **Frontend**: React with TypeScript, TailwindCSS, Vite
- **Authentication**: JWT (Access/Refresh tokens)

## Checklist
- [x] Code follows project conventions
- [x] No breaking changes
- [x] Tested locally
- [x] TailwindCSS classes updated correctly

## Related Documentation
- Frontend docs: `docs/frontend.md`
- Login module: `docs/login-module.md`
- Registration module: `docs/registration-module.md`

---
