# StudySpace – Room Booking Frontend

A Vue 3 frontend for a study room booking system, with a **User Dashboard** and a **Staff Dashboard**.

## Tech stack

| Tool | Purpose |
|------|---------|
| Vue 3 (Composition API) | UI framework |
| Vue Router 4 | Client-side routing |
| Pinia | State management (shared rooms & bookings) |
| Vite | Dev server & build tool |

## Project structure

```
src/
├── assets/
│   └── main.css          # Global design tokens & utility classes
├── router/
│   └── index.js          # Routes: /login, /user, /staff
├── stores/
│   └── roomStore.js      # Pinia store: rooms & bookings state + actions
├── views/
│   ├── LoginPage.vue     # Role selector (User vs Staff)
│   ├── UserDashboard.vue # Browse rooms · Book · My Bookings · Cancel
│   └── StaffDashboard.vue# Overview · Room CRUD · All Bookings · Add booking
└── main.js               # App entry point
```

## Getting started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Then open http://localhost:5173 in your browser.

## Connecting to your backend

All data is currently mocked inside `src/stores/roomStore.js`. To wire up your real API:

1. Open `roomStore.js`
2. Replace the mock `rooms` and `bookings` arrays with `fetch()` calls to your API
3. Update each action (`addBooking`, `cancelBooking`, `addRoom`, `updateRoom`, `deleteRoom`) to call the corresponding API endpoint

Example:
```js
// Instead of:
rooms.value = [ /* mock data */ ]

// Do:
const res = await fetch('/api/rooms')
rooms.value = await res.json()
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | LoginPage | Role selector |
| `/user` | UserDashboard | Student view |
| `/staff` | StaffDashboard | Staff admin view |

## Features

### User Dashboard
- Browse all rooms with availability status
- Filter by availability and capacity
- Book a room (date, time, purpose)
- View and cancel upcoming bookings

### Staff Dashboard
- Overview with live stats and quick room status toggle
- Full room management: add, edit, delete rooms
- All bookings table with search
- Create a booking on behalf of any user
- Cancel any booking
