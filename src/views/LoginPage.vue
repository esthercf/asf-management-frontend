<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <div class="logo-icon">📚</div>
        <div>
          <div class="logo-name">StudySpace</div>
          <div class="logo-tagline">Room Booking System</div>
        </div>
      </div>

      <h1 class="login-heading">Welcome back<span class="accent">.</span></h1>
      <p class="login-sub">Choose how you'd like to sign in today.</p>

      <div class="role-cards">
        <button class="role-card" :class="{ selected: role === 'user' }" @click="role = 'user'">
          <span class="role-emoji">🎓</span>
          <span class="role-label">Student / User</span>
          <span class="role-desc">Browse and book rooms</span>
        </button>
        <button class="role-card" :class="{ selected: role === 'staff' }" @click="role = 'staff'">
          <span class="role-emoji">🏛️</span>
          <span class="role-label">Staff</span>
          <span class="role-desc">Manage rooms & bookings</span>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" type="email" v-model="email" placeholder="you@university.edu" />
      </div>
      <div class="form-group" style="margin-bottom: 1.75rem">
        <label class="form-label">Password</label>
        <input class="form-input" type="password" v-model="password" placeholder="••••••••" />
      </div>

      <button class="btn btn-primary" style="width:100%; justify-content:center; padding:.85rem;" @click="login">
        Sign in as {{ role === 'staff' ? 'Staff' : 'Student' }} →
      </button>

      <p class="demo-note">💡 This is a demo – any credentials work.</p>
    </div>

    <div class="login-art">
      <div class="art-blob blob1"></div>
      <div class="art-blob blob2"></div>
      <div class="art-blob blob3"></div>
      <div class="art-text">
        <p class="art-quote">"A quiet space to think clearly."</p>
        <p class="art-rooms">6 rooms · 2 floors · Always available</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const role     = ref('user')
const email    = ref('')
const password = ref('')

function login() {
  router.push(role.value === 'staff' ? '/staff' : '/user')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 480px 1fr;
}

.login-card {
  background: var(--white);
  padding: 3rem 3.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1.5px solid var(--border);
}

.login-logo {
  display: flex;
  align-items: center;
  gap: .9rem;
  margin-bottom: 3rem;
}
.login-logo .logo-icon {
  width: 46px; height: 46px;
  background: var(--gold-100);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
}
.logo-name { font-family: var(--font-display); font-size: 1.3rem; }
.logo-tagline { font-size: .72rem; color: var(--muted); font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }

.login-heading { font-family: var(--font-display); font-size: 2.4rem; margin-bottom: .3rem; }
.accent { color: var(--amber); }
.login-sub { color: var(--muted); font-weight: 600; margin-bottom: 2rem; }

.role-cards { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; margin-bottom: 2rem; }
.role-card {
  background: var(--warm-50);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .2rem;
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
}
.role-card:hover { border-color: var(--navy); background: var(--sage-light); }
.role-card.selected { border-color: var(--navy); background: var(--sage-light); box-shadow: 0 0 0 3px rgba(13,51,73,.15); }
.role-emoji { font-size: 1.5rem; margin-bottom: .25rem; }
.role-label { font-weight: 800; font-size: .9rem; color: var(--ink); }
.role-desc  { font-size: .75rem; color: var(--muted); font-weight: 600; }

.demo-note {
  text-align: center;
  font-size: .78rem;
  color: var(--muted);
  font-weight: 600;
  margin-top: 1.25rem;
  padding: .6rem;
  background: var(--warm-100);
  border-radius: var(--radius-sm);
}

/* ── Art panel ─────── */
.login-art {
  position: relative;
  background: var(--navy-deep);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  padding: 3rem;
}
.art-blob {
  position: absolute;
  border-radius: 50%;
  opacity: .55;
}
.blob1 { width: 420px; height: 420px; background: var(--amber); top: -100px; right: -100px; }
.blob2 { width: 320px; height: 320px; background: var(--gold);  bottom: 0px;  left: -60px;  opacity: .45; }
.blob3 { width: 220px; height: 220px; background: var(--red);   top: 38%; right: 40px;    opacity: .5; }

.art-text { position: relative; z-index: 1; }
.art-quote { font-family: var(--font-display); font-size: 1.8rem; color: var(--white); font-style: italic; line-height: 1.3; max-width: 320px; }
.art-rooms { margin-top: .75rem; font-size: .85rem; color: rgba(255,255,255,.6); font-weight: 700; }

@media (max-width: 768px) {
  .login-page { grid-template-columns: 1fr; }
  .login-art { display: none; }
  .login-card { padding: 2rem 1.5rem; }
}
</style>
