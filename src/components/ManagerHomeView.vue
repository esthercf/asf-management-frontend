<template>
    <div class="page-header">
        <h1>{{ t('manager.home.title') }}</h1>
        <p class="subtitle">{{ t('manager.home.subtitle') }}</p>
    </div>

    <div v-if="error" class="error-banner" style="margin-bottom:1.5rem;">
        <span>⚠️ {{ error }}</span>
    </div>

    <div v-if="loading" style="padding:2rem; text-align:center;">
        <InlineSpinner />
    </div>

    <template v-else-if="stats">
        <p class="home-note" :class="{ 'home-warn': !stats.festivalDayKnown }">
            {{ stats.festivalDayKnown ? t('manager.home.agesOnFestival', { date: referenceLabel }) : '⚠️ ' +
                t('manager.home.agesOnToday', { date: referenceLabel }) }}
        </p>
        <div v-if="stats.total === 0" class="card" style="padding:1.5rem;">{{ t('manager.home.empty') }}</div>

        <section v-for="c in stats.categories" :key="c.bookingType ?? 'all'" class="card home-card">
            <h2 class="home-card-title">
                {{ c.bookingType ?? t('manager.home.allContestants') }}
                <span class="badge badge-lav">{{ c.total }}</span>
            </h2>
            <div class="home-grid">
                <div v-for="block in blocks(c)" :key="block.title">
                    <h3 class="home-block-title">{{ block.title }}</h3>
                    <div v-for="row in block.rows" :key="row.label" class="home-row">
                        <span class="home-label">{{ row.label }}</span>
                        <span class="home-bar"><span
                                :style="{ width: (row.count / block.max) * 100 + '%' }"></span></span>
                        <span class="home-count">{{ row.count }}</span>
                    </div>
                </div>
            </div>
        </section>
    </template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CategoryStatistics, useManagerUserApi, UserStatistics } from '../composables/useManagerUserApi'
import { useCountryNames } from '../composables/useCountryNames'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'

const { t, locale } = useI18n()
const userApi = useManagerUserApi()
const { countryLabel } = useCountryNames()

const stats = ref<UserStatistics | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
    try {
        stats.value = await userApi.getUserStatistics()
    } catch (e) {
        error.value = extractErrorMessage(e)
    } finally {
        loading.value = false
    }
})

const referenceLabel = computed(() => {
    const day = stats.value?.referenceDate
    if (!day) return ''
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(day + 'T00:00:00Z'))
})

interface Block { title: string; max: number; rows: { label: string; count: number }[] }

/** The four tables of one category. Ages are bands of one completed year: 8 is shown as "8–9". */
function blocks(c: CategoryStatistics): Block[] {
    const unknown = t('manager.home.unknown')
    const make = (title: string, rows: { label: string; count: number }[]): Block => ({ title, rows, max: Math.max(1, ...rows.map(r => r.count)) })
    return [
        make(t('manager.home.gender'), c.gender.map(g => ({ label: g.key ? t(`manager.home.genders.${g.key}`) : unknown, count: g.count }))),
        make(t('manager.home.age'), c.age.map(a => ({ label: a.age === null ? unknown : `${a.age}–${a.age + 1}`, count: a.count }))),
        make(t('manager.home.country'), c.country.map(k => ({ label: k.key ? countryLabel(k.key) : unknown, count: k.count }))),
        make(t('manager.home.teacher'), c.teacher.map(k => ({ label: k.key ?? t('manager.home.noTeacher'), count: k.count }))),
    ]
}
</script>

<style scoped>
.home-note {
    margin: 0 0 .5rem;
    font-size: .9rem;
    color: var(--navy-mid);
}

.home-warn {
    color: #9a5b00;
}

.home-card {
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.25rem;
}

.home-card-title {
    display: flex;
    align-items: center;
    gap: .6rem;
    margin: 0 0 1rem;
    font-size: 1.15rem;
}

.home-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1.5rem;
}

.home-block-title {
    margin: 0 0 .5rem;
    font-size: .8rem;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--navy-mid);
}

.home-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 70px 2.2rem;
    align-items: center;
    gap: .5rem;
    font-size: .88rem;
    padding: .15rem 0;
}

.home-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.home-bar {
    height: 6px;
    background: var(--gold-50, #fdf1e3);
    border-radius: 3px;
    overflow: hidden;
}

.home-bar span {
    display: block;
    height: 100%;
    background: var(--gold, #f2a649);
}

.home-count {
    text-align: right;
    font-weight: 700;
}
</style>