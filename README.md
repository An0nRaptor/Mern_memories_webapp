# Memories

A social app for sharing travel moments: post a photo and a story, like and comment, discover places through tags, and follow people's profiles.

**Live demo:** https://create-memories-webapp.netlify.app. Use **Try the demo account** on the login page, or sign up.

## Features

- **Feed**: masonry layout with Latest / Popular / Liked-by-me tabs, pagination and loading skeletons
- **Search** across titles, stories and tags; **trending tags** sidebar
- **Posts**: photo upload (compressed in the browser), title, story and up to 8 tags; edit and delete your own
- **Likes**: optimistic UI. The heart updates instantly on every cached copy and rolls back if the request fails
- **Comments**: add yours; delete your own, or any comment on your post
- **Post pages** with share links and "You might also like" (related by tags)
- **Profiles**: bio, join date, stats (memories, likes received, comments) and the user's posts
- **Dark mode** (follows the system, toggle saved), responsive down to small phones

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, **Redux Toolkit + RTK Query** (caching, tag invalidation, optimistic updates), **Material UI v6**, React Router, Vite |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt, Multer |
| Database | MongoDB Atlas; photos in **GridFS** |
| Hosting | One Netlify site: static frontend + the Express API as a Netlify Function at `/api/*` |

### Security

- JWT signed with a secret from the environment (never in code), 7-day expiry
- Only a post's author can edit or delete it; only the comment's author or the post's owner can delete a comment
- Input is validated and normalised on the server: lengths, tag format, and photo URLs restricted to this app's own uploads
- Secrets live in Netlify environment variables. `.env` is git-ignored, and `.env.example` documents what's needed.

## Project structure

```
client/src/features/api.js     RTK Query endpoints + optimistic cache patches
client/src/features/authSlice  Session (persisted)
client/src/pages/              Feed, PostPage, Profile, AuthPage
client/src/components/         PostCard, PostEditor, Layout, ...
server/app.js                  Express API
server/models/                 User, Post (with embedded comments)
server/seed.js                 Demo memories, authors, likes, comments
netlify/functions/api.js       Express as a serverless function
```

## Running locally

```bash
npm install && npm --prefix client install
cp .env.example .env         # fill in MONGO_URL and JWT_SECRET
npm run seed                 # optional demo content
npm run dev:server           # API on :4000
npm run dev:client           # app on :5173 (proxies /api)
```

## API

| Method | Path | Auth | |
|---|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | | `{ token, user }` |
| GET / PATCH | `/api/auth/me` | ✓ | Current user / update name & bio |
| GET | `/api/posts?page&q&tag&author&sort=popular&liked=me` | optional | Paginated feed |
| GET | `/api/posts/:id`, `/api/posts/:id/related` | optional | Post with comments, related posts |
| POST / PATCH / DELETE | `/api/posts`, `/api/posts/:id` | ✓ | Create / edit / delete (author only) |
| POST | `/api/posts/:id/like` | ✓ | Toggle like |
| POST / DELETE | `/api/posts/:id/comments[/:commentId]` | ✓ | Add / delete comment |
| GET | `/api/tags`, `/api/users/:id` | | Trending tags, profile + stats |
| POST / GET | `/api/upload`, `/api/photos/:id` | ✓ / | Upload / serve photos |

Demo photos are public-domain / CC0 images from [Wikimedia Commons](https://commons.wikimedia.org). Demo people are fictional.
