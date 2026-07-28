<template>
  <div class="page">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">📚</div>
        <div>
          <div class="logo-text">StudySpace</div>
          <div class="logo-sub">{{ t('staff.panel') }}</div>
        </div>
      </div>

      <span class="nav-section-label">{{ t('staff.manage') }}</span>
      <div class="nav-item" :class="{ active: view === 'overview' }" @click="view = 'overview'">
        <span class="nav-icon">📊</span> {{ t('staff.nav.overview') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'rooms' }" @click="view = 'rooms'; loadRooms()">
        <span class="nav-icon">🏠</span> {{ t('staff.nav.rooms') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'bookings' }" @click="view = 'bookings'; loadBookings()">
        <span class="nav-icon">📅</span> {{ t('staff.nav.bookings') }}
        <span v-if="bookings.length" class="badge badge-lav" style="margin-left:auto; padding:.15rem .55rem;">
          {{ bookings.length }}
        </span>
      </div>
      <div class="nav-item" :class="{ active: view === 'users' }" @click="view = 'users'; loadUsers()">
        <span class="nav-icon">👥</span> {{ t('staff.users.title') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'newbooking' }" @click="startNewBooking">
        <span class="nav-icon">➕</span> {{ t('staff.nav.newBooking') }}
      </div>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar avatar-coral">JS</div>
          <div class="user-chip-info">
            <div class="name">{{ t('staff.nav.staffLabel') }}</div>
            <div class="role">{{ t('staff.nav.adminLabel') }}</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:.75rem; justify-content:center;"
          @click="$router.push('/login')">
          ← {{ t('staff.nav.switchRole') }}
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">

      <!-- ── Overview ── -->
      <div v-if="view === 'overview'">
        <div class="page-header">
          <h1>{{ t('staff.overview.greeting') }}</h1>
          <p class="subtitle">{{ t('staff.overview.subtitle') }}</p>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">🏠</div>
            <div class="stat-value">{{ rooms.length }}</div>
            <div class="stat-label">{{ t('staff.overview.totalRooms') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ totalFreeSlots }}</div>
            <div class="stat-label">{{ t('staff.overview.freeSlots') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-value">{{ bookings.length }}</div>
            <div class="stat-label">{{ t('staff.overview.totalBookings') }}</div>
          </div>
        </div>

        <div class="section-row">
          <h2 class="section-title">{{ t('staff.overview.availabilityTitle') }}</h2>
          <button class="btn btn-primary btn-sm" @click="startNewBooking">
            + {{ t('staff.nav.newBooking') }}
          </button>
        </div>

        <div v-if="loadingAvailability" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>{{ t('common.loading') }}</p>
        </div>
        <div v-else class="room-grid">
          <div v-for="room in availability" :key="room.id" class="card room-card">
            <div class="room-card-header">
              <div>
                <div class="room-name">{{ room.name }}</div>
                <div class="room-floor">
                  Room #{{ room.roomNumber }}{{ room.floor != null ? ' · Floor ' + room.floor : '' }}
                </div>
              </div>
              <div class="room-emoji">{{ sizeEmoji(room.size) }}</div>
            </div>
            <div class="room-details">
              <span class="room-detail">{{ (room.available ?? []).length }} {{ t('staff.overview.freeSlots') }}</span>
              <span v-if="room.windows" class="room-detail">· 🪟 Windows</span>
            </div>
            <div class="room-card-footer">
              <span class="badge" :class="(room.available ?? []).length > 0 ? 'badge-green' : 'badge-coral'">
                {{ (room.available ?? []).length > 0 ? '✓ Has slots' : '✗ Full' }}
              </span>
              <span class="badge badge-sky">{{ room.size ?? 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Rooms management ── -->
      <div v-if="view === 'rooms'">
        <div class="page-header">
          <h1>{{ t('room.title') }}</h1>
          <p class="subtitle">{{ t('staff.rooms.subtitle') }}</p>
        </div>

        <div class="section-row">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input :placeholder="t('common.search') + ' ' + t('room.title').toLowerCase() + '…'" v-model="roomSearch" />
          </div>
          <button class="btn btn-primary" @click="openAddRoom">+ {{ t('room.create') }}</button>
        </div>

        <div v-if="loadingRooms" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>{{ t('common.loading') }}</p>
        </div>
        <div v-else class="card" style="overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('room.fields.name') }}</th>
                <th>{{ t('room.fields.roomNumber') }}</th>
                <th>{{ t('room.fields.floor') }}</th>
                <th>{{ t('booking.fields.size') }}</th>
                <th>{{ t('staff.rooms.windows') }}</th>
                <th>{{ t('staff.rooms.comments') }}</th>
                <th>{{ t('staff.users.columns.status') }}</th>
                <th>{{ t('staff.users.columns.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="room in filteredRooms" :key="room.id">
                <td><strong>{{ sizeEmoji(room.size) }} {{ room.name }}</strong></td>
                <td>#{{ room.roomNumber }}</td>
                <td>{{ room.floor ?? '—' }}</td>
                <td>{{ room.size ?? 'N/A' }}</td>
                <td>{{ room.windows ? '🪟 Yes' : 'No' }}</td>
                <td>{{ room.comments || '—' }}</td>
                <td>
                  <span class="badge" :class="room.active ? 'badge-green' : 'badge-coral'">
                    {{ room.active ? t('staff.users.active') : t('staff.users.inactive') }}
                  </span>
                </td>
                <td>
                  <div style="display:flex; gap:.5rem;">
                    <button class="btn btn-secondary btn-sm" @click="openEditRoom(room)">
                      {{ t('common.edit') }}
                    </button>
                    <button class="btn btn-danger btn-sm" @click="removeRoom(room.id)">
                      {{ t('common.delete') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredRooms.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>{{ t('room.empty') }}</p>
          </div>
        </div>
      </div>

      <!-- ── Users management ── -->
      <div v-if="view === 'users'">
        <div class="page-header">
          <h1>{{ t('staff.users.title') }}</h1>
          <p class="subtitle">{{ t('staff.users.subtitle') }}</p>
        </div>

        <div class="section-row">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input :placeholder="t('staff.users.searchPlaceholder')" v-model="userTextFilter"
              @input="debouncedUserReload" />
          </div>

          <select class="form-input filter-select" v-model="userActiveFilter" @change="loadUsers">
            <option :value="undefined">{{ t('staff.users.filters.allStatus') }}</option>
            <option :value="FilterActiveEnum.Active">{{ t('staff.users.filters.active') }}</option>
            <option :value="FilterActiveEnum.Inactive">{{ t('staff.users.filters.inactive') }}</option>
          </select>

          <select class="form-input filter-select" v-model="userRoleFilter" @change="loadUsers">
            <option :value="undefined">{{ t('staff.users.filters.allRoles') }}</option>
            <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
          </select>

          <select class="form-input filter-select" v-model="userBookingTypeFilter" @change="loadUsers">
            <option :value="undefined">{{ t('staff.users.filters.allBookingTypes') }}</option>
            <option v-for="bt in bookingTypeOptions" :key="bt" :value="bt">{{ bookingTypeLabel(bt) }}</option>
          </select>
        </div>

        <div v-if="loadingUsers" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>{{ t('common.loading') }}</p>
        </div>

        <div v-else class="card users-table-card">
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('staff.users.columns.name') }}</th>
                  <th>{{ t('staff.users.columns.email') }}</th>
                  <th>{{ t('staff.users.columns.country') }}</th>
                  <th>{{ t('staff.users.columns.language') }}</th>
                  <th>{{ t('staff.users.columns.phone') }}</th>
                  <th>{{ t('staff.users.columns.tshirt') }}</th>
                  <th>{{ t('staff.users.columns.bookingType') }}</th>
                  <th>{{ t('staff.users.columns.status') }}</th>
                  <th>{{ t('staff.users.columns.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.id">
                  <td>
                    <div style="display:flex; align-items:center; gap:.6rem;">
                      <div class="avatar avatar-sage" style="width:28px; height:28px; font-size:.7rem;">
                        {{ (u.firstnames[0] ?? '') + (u.surnames[0] ?? '') }}
                      </div>
                      <strong>{{ u.firstnames }} {{ u.surnames }}</strong>
                    </div>
                  </td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.countryCode }}</td>
                  <td>{{ u.language }}</td>
                  <td>{{ formatPhone(u) }}</td>
                  <td>{{ u.tshirtEnum ?? '—' }}</td>
                  <td>
                    <div class="bt-tags">
                      <span v-for="bt in u.bookingTypeEnum" :key="bt" class="badge badge-lav bt-tag">
                        {{ bookingTypeLabel(bt) }}
                      </span>
                      <span v-if="!u.bookingTypeEnum?.length" class="muted-text">—</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" :class="u.active ? 'badge-green' : 'badge-coral'">
                      {{ u.active ? t('staff.users.active') : t('staff.users.inactive') }}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:.4rem;">
                      <button class="btn btn-secondary btn-sm" @click="openBookingTypeModal(u)">
                        {{ t('staff.users.editBookingType') }}
                      </button>
                      <button class="btn btn-sm" :class="u.active ? 'btn-danger' : 'btn-primary'"
                        @click="toggleUserActive(u)">
                        {{ u.active ? t('staff.users.deactivate') : t('staff.users.activate') }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="users.length === 0" class="empty-state">
            <div class="empty-icon">👤</div>
            <p>{{ t('staff.users.empty') }}</p>
          </div>
        </div>

        <div v-if="userTotalPages > 1" class="pagination-row">
          <button class="btn btn-secondary btn-sm" :disabled="userPage <= 1"
            @click="goToUserPage(userPage - 1)">←</button>
          <span class="pagination-label">{{ userPage }} / {{ userTotalPages }}</span>
          <button class="btn btn-secondary btn-sm" :disabled="userPage >= userTotalPages"
            @click="goToUserPage(userPage + 1)">→</button>
        </div>
      </div>

      <!-- ── All Bookings ── -->
      <div v-if="view === 'bookings'">
        <div class="page-header">
          <h1>{{ t('staff.bookings.title') }}</h1>
          <p class="subtitle">{{ t('staff.bookings.subtitle') }}</p>
        </div>

        <div class="section-row">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input :placeholder="t('staff.bookings.searchPlaceholder')" v-model="bookingSearch" @input="loadBookings" />
          </div>
          <select class="form-input filter-select" v-model="bookingTypeFilterForList" @change="loadBookings">
            <option :value="undefined">{{ t('staff.bookings.filters.allBookingTypes') }}</option>
            <option v-for="bt in bookingTypeOptions" :key="bt" :value="bt">{{ bookingTypeLabel(bt) }}</option>
          </select>
          <button class="btn btn-primary" @click="startNewBooking">+ {{ t('staff.nav.newBooking') }}</button>
        </div>

        <div v-if="loadingBookings" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>{{ t('common.loading') }}</p>
        </div>
        <div v-else class="card" style="overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('staff.bookings.columns.user') }}</th>
                <th>{{ t('staff.bookings.columns.room') }}</th>
                <th>{{ t('staff.bookings.columns.date') }}</th>
                <th>{{ t('staff.bookings.columns.time') }}</th>
                <th>{{ t('staff.bookings.columns.usage') }}</th>
                <th>{{ t('staff.bookings.columns.bookingType') }}</th>
                <th>{{ t('staff.bookings.columns.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="booking in filteredBookings" :key="booking.id">
                <td>
                  <div v-if="booking.user" style="display:flex; align-items:center; gap:.6rem;">
                    <div class="avatar avatar-sage" style="width:28px; height:28px; font-size:.7rem;">
                      {{ (booking.user.firstnames[0] ?? '') + (booking.user.surnames[0] ?? '') }}
                    </div>
                    {{ booking.user.firstnames }} {{ booking.user.surnames }}
                  </div>
                  <span v-else class="badge badge-coral">{{ t('staff.bookings.unassigned') }}</span>
                </td>
                <td><strong>{{ booking.name || 'Room #' + booking.roomNumber }}</strong></td>
                <td>{{ formatDate(booking.date) }}</td>
                <td>{{ formatMinutes(booking.startTime) }} – {{ formatMinutes(booking.endTime) }}</td>
                <td><span class="badge badge-sky">{{ booking.usage }}</span></td>
                <td>
                  <span v-if="booking.bookingTypeEnum" class="badge badge-lav">
                    {{ bookingTypeLabel(booking.bookingTypeEnum) }}
                  </span>
                  <span v-else class="muted-text">—</span>
                </td>
                <td>
                  <div style="display:flex; flex-direction:column; gap:.4rem;">
                    <button :disabled="!!booking.userId"
                      :title="booking.user ? t('staff.bookings.alreadyAssigned') : t('staff.bookings.assignUserTooltip')"
                      class="btn btn-secondary btn-sm" @click="openAssignUserModal(booking)">
                      {{ booking.user ? t('staff.bookings.reassignUser') : t('staff.bookings.assignUser') }}
                    </button>
                    <button class="btn btn-danger btn-sm" :disabled="isPastBooking(booking)"
                      :title="isPastBooking(booking) ? t('staff.bookings.cannotCancelPast') : ''"
                      @click="removeBooking(booking.id)">
                      {{ t('common.cancel') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredBookings.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>{{ t('booking.empty') }}</p>
          </div>
        </div>
      </div>

      <!-- ── New Booking (Staff flow) ── -->
      <div v-if="view === 'newbooking'">
        <div class="page-header">
          <h1>{{ t('staff.newBooking.title') }}</h1>
          <p class="subtitle">{{ t('staff.newBooking.subtitle') }}</p>
        </div>

        <div class="steps-row">
          <div class="step" :class="{ active: nbStep >= 1, done: nbStep > 1 }">
            <div class="step-num">{{ nbStep > 1 ? '✓' : '1' }}</div>
            <div class="step-label">{{ t('staff.newBooking.steps.day') }}</div>
          </div>
          <div class="step-line" :class="{ active: nbStep > 1 }"></div>
          <div class="step" :class="{ active: nbStep >= 2, done: nbStep > 2 }">
            <div class="step-num">{{ nbStep > 2 ? '✓' : '2' }}</div>
            <div class="step-label">{{ t('staff.newBooking.steps.slot') }}</div>
          </div>
          <div class="step-line" :class="{ active: nbStep > 2 }"></div>
          <div class="step" :class="{ active: nbStep >= 3, done: nbStep > 3 }">
            <div class="step-num">{{ nbStep > 3 ? '✓' : '3' }}</div>
            <div class="step-label">{{ t('staff.newBooking.steps.room') }}</div>
          </div>
          <div class="step-line" :class="{ active: nbStep > 3 }"></div>
          <div class="step" :class="{ active: nbStep >= 4 }">
            <div class="step-num">4</div>
            <div class="step-label">{{ t('staff.newBooking.steps.confirm') }}</div>
          </div>
        </div>

        <!-- Step 1: Day -->
        <div v-if="nbStep === 1" class="step-panel">
          <button class="back-btn" @click="view = 'overview'">← {{ t('common.cancel') }}</button>
          <h2 class="section-title">{{ t('staff.newBooking.selectDay') }}</h2>
          <div class="day-grid">
            <button v-for="d in availableDays" :key="d.iso" class="day-card"
              :class="{ selected: nbDay?.iso === d.iso, disabled: d.slotsCount === 0 }" :disabled="d.slotsCount === 0"
              @click="nbSelectDay(d)">
              <div class="day-card-weekday">{{ d.weekday }}</div>
              <div class="day-card-num">{{ d.dayNum }}</div>
              <div class="day-card-month">{{ d.month }}</div>
              <div class="day-card-slots">
                <span v-if="d.slotsCount > 0" class="badge badge-green">{{ d.slotsCount }}</span>
                <span v-else class="badge badge-coral">{{ t('staff.newBooking.full') }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 2: Slot -->
        <div v-if="nbStep === 2" class="step-panel">
          <button class="back-btn" @click="nbStep = 1">← {{ t('common.back') }}</button>
          <h2 class="section-title">
            {{ t('staff.newBooking.availableSlots') }} — {{ nbDay?.weekday }}, {{ nbDay?.dayNum }} {{ nbDay?.month }}
          </h2>
          <div class="slot-grid">
            <button v-for="slot in nbSlotsForDay" :key="slot.key" class="slot-card"
              :class="{ selected: nbSlot?.startTime === slot.startTime }" @click="nbSelectSlot(slot)">
              <div class="slot-time">{{ formatMinutes(slot.startTime) }}</div>
              <div class="slot-dash">–</div>
              <div class="slot-time">{{ formatMinutes(slot.endTime) }}</div>
              <div class="slot-rooms-count">
                {{ slot.roomCount }} {{ slot.roomCount !== 1 ? t('room.title').toLowerCase() :
                  t('staff.newBooking.room') }}
              </div>
            </button>
          </div>
          <div v-if="nbSlotsForDay.length === 0" class="empty-state">
            <div class="empty-icon">🕐</div>
            <p>{{ t('staff.newBooking.noSlots') }}</p>
          </div>
        </div>

        <!-- Step 3: Room -->
        <div v-if="nbStep === 3" class="step-panel">
          <button class="back-btn" @click="nbStep = 2">← {{ t('common.back') }}</button>
          <h2 class="section-title">{{ t('staff.newBooking.chooseRoom') }}</h2>
          <div class="room-grid">
            <button v-for="room in nbRoomsForSlot" :key="room.id" class="card room-card room-select-card"
              :class="{ selected: nbRoom?.id?.toString() === room.id?.toString() }" @click="nbSelectRoom(room)">
              <div class="room-card-header">
                <div>
                  <div class="room-name">{{ room.name }}</div>
                  <div class="room-floor">
                    Room #{{ room.roomNumber }}{{ room.floor != null ? ' · Floor ' + room.floor : '' }}
                  </div>
                </div>
                <div class="room-emoji">{{ sizeEmoji(room.size) }}</div>
              </div>
              <div class="room-details">
                <span v-if="room.windows" class="room-detail">🪟 Windows</span>
                <span class="room-detail">{{ room.size ?? 'N/A' }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 4: Confirm -->
        <div v-if="nbStep === 4" class="step-panel">
          <button class="back-btn" @click="nbStep = 3">← {{ t('common.back') }}</button>
          <h2 class="section-title">{{ t('staff.newBooking.confirmTitle') }}</h2>

          <div class="confirm-card card">
            <div class="confirm-row">
              <span class="confirm-icon">📅</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.date') }}</div>
                <div class="confirm-value">{{ nbDay?.weekday }}, {{ nbDay?.dayNum }} {{ nbDay?.month }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🕐</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.time') }}</div>
                <div class="confirm-value">
                  {{ formatMinutes(nbSlot?.startTime) }} – {{ formatMinutes(nbSlot?.endTime) }}
                </div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🏠</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.room') }}</div>
                <div class="confirm-value">{{ nbRoom?.name }} (#{{ nbRoom?.roomNumber }})</div>
              </div>
            </div>
          </div>

          <div class="form-row" style="margin-top:1.5rem; max-width:480px;">
            <UserSelector v-model="nbSelectedUserId" :options="usersSelector"
              :label="t('staff.newBooking.assignUser')" />
            <div class="form-group">
              <label class="form-label">{{ t('booking.fields.usage') }}</label>
              <select class="form-input" v-model="nbUsage">
                <option v-for="usage in usageOptions" :key="usage" :value="usage">
                  {{ usageLabel(usage) }}
                </option>
              </select>
            </div>
          </div>

          <div class="modal-footer" style="justify-content:flex-start; margin-top:1.5rem; padding:0;">
            <button class="btn btn-secondary" @click="view = 'overview'">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" :disabled="nbConfirming" @click="nbConfirm">
              {{ nbConfirming ? t('common.loading') : t('staff.newBooking.createBooking') }}
            </button>
          </div>
        </div>

        <!-- Step 5: Success -->
        <div v-if="nbStep === 5" class="step-panel success-panel">
          <div class="success-icon">✅</div>
          <h2 class="section-title">{{ t('staff.newBooking.successTitle') }}</h2>
          <div class="confirm-card card" style="margin-top:1.5rem; max-width:420px;">
            <div class="confirm-row">
              <span class="confirm-icon">📅</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.date') }}</div>
                <div class="confirm-value">{{ nbLastBooking?.dateLabel }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🕐</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.time') }}</div>
                <div class="confirm-value">{{ nbLastBooking?.timeLabel }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🏠</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.room') }}</div>
                <div class="confirm-value">{{ nbLastBooking?.roomName }}</div>
              </div>
            </div>
          </div>
          <div style="display:flex; gap:.75rem; margin-top:1.75rem;">
            <button class="btn btn-primary" @click="startNewBooking">
              + {{ t('staff.newBooking.anotherBooking') }}
            </button>
            <button class="btn btn-secondary" @click="view = 'bookings'; loadBookings()">
              {{ t('staff.newBooking.viewAllBookings') }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Add/Edit Room Modal -->
    <Teleport to="body">
      <div v-if="roomModal" class="modal-overlay" @click.self="roomModal = false">
        <div class="modal">
          <h2 class="modal-title">{{ editingRoom ? t('room.edit') : t('room.create') }}</h2>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ t('room.fields.name') }}</label>
              <input class="form-input" v-model="roomForm.name" placeholder="The Birch Room" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('room.fields.roomNumber') }}</label>
              <input class="form-input" type="number" v-model.number="roomForm.roomNumber" placeholder="101" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ t('room.fields.floor') }}</label>
              <input class="form-input" type="number" v-model.number="roomForm.floor" placeholder="1" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('booking.fields.size') }}</label>
              <select class="form-input" v-model="roomForm.size">
                <option v-for="size in roomSizeOptions" :key="size" :value="size">
                  {{ sizeLabel(size) }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('staff.rooms.bookingType') }}</label>
              <select class="form-input" v-model="roomForm.bookingTypeEnum">
                <option :value="undefined">{{ t('staff.rooms.bookingTypeNone') }}</option>
                <option v-for="bt in bookingTypeOptions" :key="bt" :value="bt">
                  {{ bookingTypeLabel(bt) }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('staff.rooms.comments') }}</label>
            <input class="form-input" v-model="roomForm.comments" :placeholder="t('staff.rooms.commentsPlaceholder')" />
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex; align-items:center; gap:.5rem;">
              <input type="checkbox" v-model="roomForm.windows" style="width:auto;" />
              {{ t('staff.rooms.hasWindows') }}
            </label>
          </div>
          <div v-if="roomError" class="error-banner">⚠️ {{ roomError }}</div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="roomModal = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="saveRoom">
              {{ editingRoom ? t('common.save') : t('room.create') }} →
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit User Booking Type Modal -->
    <Teleport to="body">
      <div v-if="bookingTypeModal" class="modal-overlay" @click.self="bookingTypeModal = false">
        <div class="modal">
          <h2 class="modal-title">
            {{ t('staff.users.editBookingTypeFor') }}
            {{ editingUser?.firstnames }} {{ editingUser?.surnames }}
          </h2>
          <div class="form-group">
            <label class="form-label">{{ t('staff.users.columns.bookingType') }}</label>
            <div class="checkbox-grid">
              <label v-for="bt in bookingTypeOptions" :key="bt" class="checkbox-row">
                <input type="checkbox" :value="bt" v-model="bookingTypeForm" />
                {{ bookingTypeLabel(bt) }}
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="bookingTypeModal = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="saveBookingType">{{ t('common.save') }} →</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Assign User to Booking Modal -->
    <AssignUserModal v-model="assignUserModalOpen" :booking-id="assigningBookingId" @assigned="onUserAssigned" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingApi } from '../composables/useBookingApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import { BookingTypeEnum, RoomSizeEnum, UsageEnum } from '../enums/booking.enum'
import { RoleType } from '../enums/roles.enum'
import { FilterActiveEnum } from '../enums/user.enum'
import type { UserDto } from '../types/user.types'
import type {
  RoomDto,
  BookingDto,
  AvailableRoomDto,
  BookingDayOption,
  BookingSlotOption,
  UserBaseDto,
} from '../types/booking.types'
import AssignUserModal from '@/components/AssignUserModal.vue'
import UserSelector from '@/components/UserSelector.vue'
import { useRoomApi } from '../composables/useRoomApi'
import { useUserApi } from '../composables/useUserApi'
import { RoomFormState } from '../types/room.types'


// ── i18n ──────────────────────────────────────────────────────────────────
const { t } = useI18n()

// ── API ───────────────────────────────────────────────────────────────────


const userApi = useUserApi();
const roomApi = useRoomApi();
const bookingApi = useBookingApi();

// ── Enum option arrays ────────────────────────────────────────────────────
const roomSizeOptions = Object.values(RoomSizeEnum)
const bookingTypeOptions = Object.values(BookingTypeEnum)
const usageOptions = Object.values(UsageEnum)
const roleOptions = Object.values(RoleType)
const usersSelector = ref<UserBaseDto[]>([])
// ── View state ────────────────────────────────────────────────────────────
type ViewName = 'overview' | 'rooms' | 'bookings' | 'newbooking' | 'users'
const view = ref<ViewName>('overview')

// ── Data refs ─────────────────────────────────────────────────────────────
const rooms = ref<RoomDto[]>([])
const bookings = ref<BookingDto[]>([])
const availability = ref<AvailableRoomDto[]>([])
const users = ref<UserDto[]>([])

const loadingRooms = ref(false)
const loadingBookings = ref(false)
const loadingAvailability = ref(false)
const loadingUsers = ref(false)

// ── Filter state ──────────────────────────────────────────────────────────
const roomSearch = ref('')
const bookingSearch = ref('')
const bookingTypeFilterForList = ref<BookingTypeEnum | undefined>(undefined)

const userPage = ref(1)
const userLimit = 20
const userTotalPages = ref(1)
const userTextFilter = ref('')
const userActiveFilter = ref<FilterActiveEnum | undefined>(undefined)
const userRoleFilter = ref<RoleType | undefined>(undefined)
const userBookingTypeFilter = ref<BookingTypeEnum | undefined>(undefined)

// ── Error state ───────────────────────────────────────────────────────────
const roomError = ref('')

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => {
  loadUsersSelector();
  loadAvailability();
  loadRooms();
  loadBookings();
})

// ── Load functions ────────────────────────────────────────────────────────
async function loadAvailability() {
  loadingAvailability.value = true
  try {
    availability.value = await bookingApi.getAvailability({ page: 1, limit: 1000 }) ?? []
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  } finally {
    loadingAvailability.value = false
  }
}

async function loadRooms() {
  loadingRooms.value = true
  try {
    const data = await roomApi.getRooms({ limit: 200 })
    rooms.value = data?.data ?? []
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  } finally {
    loadingRooms.value = false
  }
}

async function loadBookings() {
  loadingBookings.value = true
  try {
    const data = await bookingApi.getBookings({
      page: 1,
      limit: 200,
      textFilter: bookingSearch.value || undefined,
      bookingTypeEnum: bookingTypeFilterForList.value,
    })
    bookings.value = data?.data ?? []
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  } finally {
    loadingBookings.value = false
  }
}

async function loadUsers() {
  loadingUsers.value = true
  try {
    const data = await userApi.getUsers({
      page: userPage.value,
      limit: userLimit,
      textFilter: userTextFilter.value || undefined,
      active: userActiveFilter.value,
      roleType: userRoleFilter.value,
      bookingTypeEnum: userBookingTypeFilter.value,
    })
    users.value = data?.data ?? []
    userTotalPages.value = data?.metadata?.totalPages ?? 1
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  } finally {
    loadingUsers.value = false
  }
}
async function loadUsersSelector() {
  loadingAvailability.value = true
  try {
    usersSelector.value = await userApi.getUserSelectorOptions()
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  } finally {
    loadingAvailability.value = false
  }
}
// ── Debounced user search ─────────────────────────────────────────────────
let userDebounceTimer: ReturnType<typeof setTimeout> | undefined
function debouncedUserReload() {
  if (userDebounceTimer) clearTimeout(userDebounceTimer)
  userDebounceTimer = setTimeout(() => {
    userPage.value = 1
    loadUsers()
  }, 350)
}

function goToUserPage(p: number) {
  userPage.value = p
  loadUsers()
}

// ── Computed lists ────────────────────────────────────────────────────────
const totalFreeSlots = computed(() =>
  availability.value.reduce((sum, r) => sum + (r.available?.length ?? 0), 0)
)

const filteredRooms = computed(() =>
  rooms.value.filter(r => r.name?.toLowerCase().includes(roomSearch.value.toLowerCase()))
)

const filteredBookings = computed(() => {
  const q = bookingSearch.value.toLowerCase()
  return bookings.value.filter(b =>
    (b.user?.firstnames ?? '').toLowerCase().includes(q) ||
    (b.user?.surnames ?? '').toLowerCase().includes(q) ||
    (b.name ?? '').toLowerCase().includes(q)
  )
})

// ── Room CRUD ─────────────────────────────────────────────────────────────
const roomModal = ref(false)
const editingRoom = ref<RoomDto | null>(null)
const roomForm = ref<RoomFormState>({
  name: '', roomNumber: null, floor: null,
  size: RoomSizeEnum.MEDIUM, comments: '', windows: false, bookingTypeEnum: undefined,
})

function openAddRoom() {
  editingRoom.value = null
  roomForm.value = {
    name: '', roomNumber: null, floor: null,
    size: RoomSizeEnum.MEDIUM, comments: '', windows: false, bookingTypeEnum: undefined,
  }
  roomError.value = ''
  roomModal.value = true
}

function openEditRoom(room: RoomDto) {
  editingRoom.value = room
  roomForm.value = {
    name: room.name,
    roomNumber: room.roomNumber,
    floor: room.floor ?? null,
    size: room.size ?? RoomSizeEnum.MEDIUM,
    comments: room.comments ?? '',
    windows: !!room.windows,
    bookingTypeEnum: room.bookingTypeEnum ?? undefined,
  }
  roomError.value = ''
  roomModal.value = true
}

function toApiPayload(form: RoomFormState) {
  return {
    name: form.name,
    roomNumber: form.roomNumber ?? undefined,
    floor: form.floor ?? undefined,
    size: form.size,
    comments: form.comments || undefined,
    windows: form.windows,
    bookingTypeEnum: form.bookingTypeEnum ?? undefined,
  }
}

async function saveRoom() {
  roomError.value = ''
  try {
    const payload = toApiPayload(roomForm.value)
    if (editingRoom.value) {
      await roomApi.updateRoom(editingRoom.value.id, payload)
    } else {
      await roomApi.createRoom(payload)
    }
    roomModal.value = false
    await loadRooms()
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  }
}

async function removeRoom(id: string) {
  if (!confirm(t('staff.rooms.deleteConfirm'))) return
  try {
    await roomApi.deleteRoom(id)
    await loadRooms()
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  }
}

async function removeBooking(id: string) {
  if (!confirm(t('staff.bookings.cancelConfirm'))) return
  try {
    await bookingApi.deleteBooking(id)
    await loadBookings()
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  }
}

// ── User management ───────────────────────────────────────────────────────
async function toggleUserActive(u: UserDto) {
  const nextActive = !u.active
  try {
    await userApi.updateUserActiveByEmail(u.email, nextActive)
    u.active = nextActive
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  }
}

// ── User booking type modal ───────────────────────────────────────────────
const bookingTypeModal = ref(false)
const editingUser = ref<UserDto | null>(null)
const bookingTypeForm = ref<BookingTypeEnum[]>([])

function openBookingTypeModal(u: UserDto) {
  editingUser.value = u
  bookingTypeForm.value = [...(u.bookingTypeEnum ?? [])]
  bookingTypeModal.value = true
}

async function saveBookingType() {
  if (!editingUser.value) return
  try {
    const updated = await userApi.updateUser(editingUser.value.id, {
      bookingTypeEnum: bookingTypeForm.value,
    })
    const idx = users.value.findIndex(u => u.id === editingUser.value!.id)
    if (idx !== -1) users.value[idx] = updated
    bookingTypeModal.value = false
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  }
}

// ── Assign user to booking modal ──────────────────────────────────────────
const assignUserModalOpen = ref(false)
const assigningBookingId = ref<string | null>(null)

function openAssignUserModal(booking: BookingDto) {
  assigningBookingId.value = booking.id
  assignUserModalOpen.value = true
}

function onUserAssigned(user: UserDto) {
  const booking = bookings.value.find(b => b.id === assigningBookingId.value)
  if (booking) {
    booking.user = {
      id: user.id,
      email: user.email,
      firstnames: user.firstnames,
      surnames: user.surnames,
    }
    booking.userId = user.id
  }
}

// ── New Booking flow ──────────────────────────────────────────────────────
const nbStep = ref(1)
const nbDay = ref<BookingDayOption | null>(null)
const nbSlot = ref<BookingSlotOption | null>(null)
const nbRoom = ref<AvailableRoomDto | null>(null)
const nbUsage = ref<UsageEnum>(UsageEnum.STUDY)
const nbConfirming = ref(false)
const nbSelectedUserId = ref<string | null>(null)
const nbLastBooking = ref<{ dateLabel: string; timeLabel: string; roomName: string } | null>(null)

function startNewBooking() {
  nbStep.value = 1
  nbDay.value = null
  nbSlot.value = null
  nbRoom.value = null
  nbUsage.value = UsageEnum.STUDY
  nbSelectedUserId.value = null
  view.value = 'newbooking'
  loadAvailability()
}

const availableDays = computed<BookingDayOption[]>(() => {
  const dayMap = new Map<string, BookingDayOption>()
  for (const room of availability.value) {
    for (const slot of (room.available ?? [])) {
      const key = slot.date
      if (!dayMap.has(key)) {
        const d = new Date(slot.date + 'T00:00:00')
        dayMap.set(key, {
          iso: slot.date,
          weekday: d.toLocaleDateString('en', { weekday: 'short' }),
          dayNum: slot.day,
          month: d.toLocaleDateString('en', { month: 'short' }),
          slotsCount: 0,
        })
      }
      dayMap.get(key)!.slotsCount++
    }
  }
  return Array.from(dayMap.values()).sort((a, b) => a.iso.localeCompare(b.iso))
})

const nbSlotsForDay = computed<BookingSlotOption[]>(() => {
  if (!nbDay.value) return []
  const slotMap = new Map<number, BookingSlotOption>()
  for (const room of availability.value) {
    for (const slot of (room.available ?? [])) {
      if (slot.date !== nbDay.value.iso) continue
      const key = slot.startTime
      if (!slotMap.has(key)) {
        slotMap.set(key, { ...slot, roomCount: 0, key })
      }
      slotMap.get(key)!.roomCount++
    }
  }
  return Array.from(slotMap.values()).sort((a, b) => a.startTime - b.startTime)
})

const nbRoomsForSlot = computed<AvailableRoomDto[]>(() => {
  if (!nbDay.value || !nbSlot.value) return []
  return availability.value.filter(room =>
    room.available?.some(s => s.date === nbDay.value!.iso && s.startTime === nbSlot.value!.startTime)
  )
})

function nbSelectDay(day: BookingDayOption) {
  nbDay.value = day
  nbSlot.value = null
  nbRoom.value = null
  nbStep.value = 2
}

function nbSelectSlot(slot: BookingSlotOption) {
  nbSlot.value = slot
  nbRoom.value = null
  nbStep.value = 3
}

function nbSelectRoom(room: AvailableRoomDto) {
  nbRoom.value = room
  nbStep.value = 4
}

async function nbConfirm() {
  if (!nbDay.value || !nbSlot.value || !nbRoom.value) return
  nbConfirming.value = true
  try {
    await bookingApi.lockSlot(nbRoom.value.id.toString(), nbSlot.value.date, nbSlot.value.startTime)
    await bookingApi.createBooking({
      roomId: nbRoom.value.id,
      date: nbSlot.value.date + 'T00:00:00.000Z',
      hour: nbSlot.value.hour,
      minutes: nbSlot.value.minutes,
      usage: nbUsage.value,
      userId: nbSelectedUserId.value ? nbSelectedUserId.value :  undefined,
    })
    nbLastBooking.value = {
      dateLabel: `${nbDay.value.weekday}, ${nbDay.value.dayNum} ${nbDay.value.month}`,
      timeLabel: `${formatMinutes(nbSlot.value.startTime)} – ${formatMinutes(nbSlot.value.endTime)}`,
      roomName: `${nbRoom.value.name} (#${nbRoom.value.roomNumber})`,
    }
    nbStep.value = 5
    loadBookings()
    loadAvailability()
  } catch (e) {
    roomError.value = extractErrorMessage(e)
  } finally {
    nbConfirming.value = false
  }
}

// ── Helper functions ──────────────────────────────────────────────────────
function formatMinutes(mins: number | undefined | null): string {
  if (mins == null) return ''
  return `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPhone(u: UserDto): string {
  if (!u.phoneNumber) return '—'
  return u.phoneCode ? `+${u.phoneCode} ${u.phoneNumber}` : u.phoneNumber
}

function sizeLabel(size: RoomSizeEnum): string {
  const labels: Record<RoomSizeEnum, string> = {
    [RoomSizeEnum.SMALL]: 'Small',
    [RoomSizeEnum.MEDIUM]: 'Medium',
    [RoomSizeEnum.BIG]: 'Big',
    [RoomSizeEnum.BNAIG]: 'N/A',
  }
  return labels[size]
}

function sizeEmoji(size: RoomSizeEnum | undefined): string {
  const emojis: Record<RoomSizeEnum, string> = {
    [RoomSizeEnum.SMALL]: '🟢',
    [RoomSizeEnum.MEDIUM]: '🔵',
    [RoomSizeEnum.BIG]: '🟣',
    [RoomSizeEnum.BNAIG]: '🏠',
  }
  return size ? (emojis[size] ?? '🏠') : '🏠'
}

function bookingTypeLabel(bt: BookingTypeEnum): string {
  return t(`staff.users.bookingTypes.${bt}`)
}

function usageLabel(usage: UsageEnum): string {
  return t(`booking.usage.${usage}`)
}

function isPastBooking(booking: BookingDto): boolean {
  const bookingDate = new Date(booking.date + 'T00:00:00')
  bookingDate.setMinutes(booking.endTime)
  return bookingDate < new Date()
}
</script>

<style scoped>
.steps-row {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 2.5rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .4rem;
}

.step-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: .85rem;
  color: var(--muted);
  transition: var(--transition);
}

.step.active .step-num {
  border-color: var(--navy);
  background: var(--navy);
  color: var(--white);
}

.step.done .step-num {
  border-color: var(--gold);
  background: var(--gold);
  color: var(--navy-deep);
}

.step-label {
  font-size: .75rem;
  font-weight: 700;
  color: var(--muted);
}

.step.active .step-label {
  color: var(--navy);
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 .75rem;
  margin-bottom: 1.2rem;
  transition: var(--transition);
}

.step-line.active {
  background: var(--gold);
}

.step-panel {
  animation: fadeIn .2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-btn {
  font-size: .82rem;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  margin-bottom: 1.25rem;
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  transition: var(--transition);
}

.back-btn:hover {
  color: var(--navy);
}

.day-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.day-card {
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  min-width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .35rem;
  cursor: pointer;
  transition: var(--transition);
  font-family: var(--font-body);
}

.day-card:hover:not(.disabled) {
  border-color: var(--navy);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.day-card.selected {
  border-color: var(--navy);
  background: var(--navy);
}

.day-card.selected .day-card-weekday,
.day-card.selected .day-card-month {
  color: rgba(255, 255, 255, .65);
}

.day-card.selected .day-card-num {
  color: var(--white);
}

.day-card.disabled {
  opacity: .45;
  cursor: not-allowed;
}

.day-card-weekday {
  font-size: .75rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .06em;
}

.day-card-num {
  font-family: var(--font-display);
  font-size: 2rem;
  line-height: 1;
  color: var(--ink);
}

.day-card-month {
  font-size: .78rem;
  font-weight: 700;
  color: var(--muted);
}

.day-card-slots {
  margin-top: .4rem;
}

.slot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: .85rem;
  margin-bottom: 1.5rem;
}

.slot-card {
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .2rem;
  cursor: pointer;
  transition: var(--transition);
  font-family: var(--font-body);
  min-width: 120px;
}

.slot-card:hover {
  border-color: var(--navy);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.slot-card.selected {
  border-color: var(--gold);
  background: var(--gold-100);
}

.slot-time {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--ink);
}

.slot-dash {
  color: var(--muted);
  font-weight: 700;
  font-size: .8rem;
}

.slot-rooms-count {
  font-size: .72rem;
  font-weight: 700;
  color: var(--muted);
}

.room-select-card {
  cursor: pointer;
  text-align: left;
}

.room-select-card:hover {
  border-color: var(--navy);
  transform: translateY(-2px);
}

.room-select-card.selected {
  border-color: var(--gold);
  background: var(--gold-50);
  box-shadow: 0 0 0 3px rgba(232, 184, 75, .2);
}

.confirm-card {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 480px;
}

.confirm-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.confirm-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.confirm-label {
  font-size: .75rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .05em;
}

.confirm-value {
  font-weight: 700;
  font-size: .95rem;
  color: var(--ink);
  margin-top: .1rem;
}

.success-panel {
  text-align: left;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: .75rem;
}

.filter-select {
  max-width: 200px;
}

.bt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: .3rem;
  max-width: 220px;
}

.bt-tag {
  font-size: .68rem;
  padding: .15rem .5rem;
}

.muted-text {
  color: var(--muted);
  font-size: .82rem;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.25rem;
}

.pagination-label {
  font-size: .82rem;
  font-weight: 700;
  color: var(--muted);
}

.checkbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .6rem;
  margin-top: .4rem;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
}

.checkbox-row input {
  width: auto;
}

.users-table-card {
  overflow: visible;
}

.table-scroll {
  overflow-x: auto;
}
</style>