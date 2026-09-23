# The Miselems — Save the Date

An interactive save-the-date experience for Diana and Elias.

## Preview locally

Serve this folder with any static web server, then open `index.html` through that server.

The RSVP currently uses two temporary names (`Dunia Valle` and `Lincoln Espinal`) and saves a test response in the browser. The guest search and submission layer is intentionally isolated in `script.js` so it can be replaced with Supabase when the final guest list and project access are available.

## Later integration

- Replace `demoGuests` with a privacy-safe Supabase name search.
- Replace the `localStorage` write with a protected RSVP submission.
- Enable Row Level Security and expose only the minimum guest lookup fields.
- Connect the repository to Vercel after the GitHub repository and accounts are provided.
