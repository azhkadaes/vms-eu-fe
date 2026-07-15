# Data Layer

Backend swap plan:

1. Create `src/data/http/<resource>Repo.ts` implementing the same interface
   from `src/data/types.ts` with `fetch(import.meta.env.VITE_API_BASE_URL + ...)`.
2. Swap the `mockRepositories` import inside `src/app/RepositoriesContext.tsx`
   for the HTTP repos bundle.
3. Replace `sessionRepo.current()` with a real login + JWT-decoded session.

Nothing in `src/components/` or `src/routes/` needs to change — pages
consume repos via `useRepos()`.
