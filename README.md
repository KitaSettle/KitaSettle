# KitaSettle Alpha

KitaSettle is an Executive Intelligence Platform for busy founders and professionals.

Its first product is the Executive Brief: a daily command-centre view that reduces cognitive load, improves decision quality, and helps the founder focus on what matters.

## Alpha Goal

Build a simple web application with:
1. Login page
2. Executive Dashboard
3. Executive Brief
4. Knowledge area
5. Clean premium user experience

## Product Philosophy

KitaSettle is not an AI chatbot.

KitaSettle helps professionals feel that they are no longer carrying everything alone.

Every feature must:
- Reduce cognitive load
- Improve decision confidence
- Protect focus
- Preserve knowledge
- Be something users would pay for

## Founder

Dan

## Working Product Name

KitaSettle Alpha

## Run Locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Sign in with any email and password — Alpha uses mock authentication.

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Premium sign-in screen |
| `/dashboard` | Executive Brief command centre |
| `/knowledge` | Knowledge placeholder (Beta preview) |

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## Project Structure

```
app/           # Pages and layouts
components/    # UI and layout components
data/          # Mock executive brief data
lib/           # Auth, types, helpers
docs/          # Product specifications
```

