import { client } from '../services/http.client'
import { ContestTypeEnum } from './useContestSettingsApi'
import type { OrderScope } from './usePerformanceOrderApi'

export enum RehearsalOrderRowTypeEnum {
    REHEARSAL = 'rehearsal',
    PAUSE = 'pause',
}

export enum RehearsalOrderStatusEnum {
    PENDING_VALIDATION = 'pending_validation',
    VALIDATED = 'validated',
}

export interface RehearsalDay {
    date: string // 'YYYY-MM-DD'
    startTime: string // 'HH:MM'
}

/** The settings of one board (one per contest + round + category) */
export interface RehearsalBoardDto {
    id: string
    contestType: ContestTypeEnum
    round: string
    category: string | null
    days: RehearsalDay[]
    defaultSlotMinutes: number
    defaultPauseMinutes: number
    defaultRoomNumber: number | null
    rehearsalCategory: string | null // empty = the board's category (Youth) or 'solo'
}

/** One row of the board: a student's rehearsal or a pause */
export interface RehearsalOrderEntryDto {
    id: string
    position: number
    dayIndex: number | null // null = not placed on a day yet
    rowType: RehearsalOrderRowTypeEnum
    durationMinutes: number
    studentId: string | null
    studentFullName: string | null
    accompanistId: string | null
    accompanistName: string | null // typed name of a pianist who is not a user
    accompanistFullName: string | null // the name to show (user's or typed)
    roomNumber: number | null
    piece: string | null
    label: string | null
    startTime: string | null
    endTime: string | null
    status: RehearsalOrderStatusEnum
}

/** The whole board as the screen shows it */
export interface RehearsalBoardViewDto {
    board: RehearsalBoardDto
    days: { dayIndex: number; date: string; startTime: string; rows: RehearsalOrderEntryDto[] }[]
    unplaced: RehearsalOrderEntryDto[]
}

/** One rehearsal that overlaps something else of the same student (information only) */
export interface RehearsalCollisionDto {
    studentFullName: string
    date: string
    rehearsal: string // 'HH:MM–HH:MM'
    otherKind: 'performance' | 'rehearsal' | 'masterclass' | 'activity'
    otherLabel: string
    other: string // 'HH:MM–HH:MM'
}

/** Changes to one row; only the fields sent change, null clears the optional ones */
export interface UpdateRehearsalEntryPayload {
    durationMinutes?: number
    accompanistId?: string | null
    accompanistName?: string | null
    roomNumber?: number | null
    piece?: string | null
    label?: string | null
}

/** Matches the backend's rehearsal-order.controller.ts */
export function useRehearsalOrderApi() {
    function scopeQuery(scope: OrderScope): URLSearchParams {
        const q = new URLSearchParams({ contestType: scope.contestType, round: scope.round })
        if (scope.category) q.set('category', scope.category)
        return q
    }

    function getBoardView(scope: OrderScope): Promise<RehearsalBoardViewDto> {
        return client.get<RehearsalBoardViewDto>(`/rehearsal-order?${scopeQuery(scope)}`).then(r => r.data)
    }

    function updateBoard(scope: OrderScope, changes: Partial<Omit<RehearsalBoardDto, 'id' | 'contestType' | 'round' | 'category'>>): Promise<RehearsalBoardDto> {
        return client.patch<RehearsalBoardDto>(`/rehearsal-order/board?${scopeQuery(scope)}`, changes).then(r => r.data)
    }

    function generateFromPerformance(scope: OrderScope): Promise<{ count: number }> {
        return client.post<{ count: number }>(`/rehearsal-order/generate-from-performance?${scopeQuery(scope)}`).then(r => r.data)
    }

    function fillFromRehearsals(scope: OrderScope): Promise<{ count: number }> {
        return client.post<{ count: number }>(`/rehearsal-order/fill-from-rehearsals?${scopeQuery(scope)}`).then(r => r.data)
    }

    function moveEntry(id: string, targetDayIndex: number | null, targetPosition: number): Promise<void> {
        const body: { targetDayIndex?: number; targetPosition: number } = { targetPosition }
        if (targetDayIndex !== null) body.targetDayIndex = targetDayIndex
        return client.patch(`/rehearsal-order/${id}/move`, body).then(r => r.data)
    }

    function updateEntry(id: string, changes: UpdateRehearsalEntryPayload): Promise<void> {
        return client.patch(`/rehearsal-order/${id}`, changes).then(r => r.data)
    }

    function removeEntry(id: string): Promise<void> {
        return client.delete(`/rehearsal-order/${id}`).then(r => r.data)
    }

    function insertPause(scope: OrderScope, dayIndex: number, durationMinutes?: number, label?: string): Promise<void> {
        return client.post(`/rehearsal-order/insert-pause?${scopeQuery(scope)}`, { dayIndex, durationMinutes, label }).then(r => r.data)
    }

    function getCollisions(scope: OrderScope): Promise<RehearsalCollisionDto[]> {
        return client.get<RehearsalCollisionDto[]>(`/rehearsal-order/collisions?${scopeQuery(scope)}`).then(r => r.data)
    }

    function validateDay(scope: OrderScope, dayIndex: number): Promise<{ written: number }> {
        return client.post<{ written: number }>(`/rehearsal-order/validate?${scopeQuery(scope)}`, { dayIndex }).then(r => r.data)
    }

    function unvalidateDay(scope: OrderScope, dayIndex: number): Promise<void> {
        return client.post(`/rehearsal-order/unvalidate?${scopeQuery(scope)}`, { dayIndex }).then(r => r.data)
    }

    return {
        getBoardView, updateBoard, generateFromPerformance, fillFromRehearsals,
        moveEntry, updateEntry, removeEntry, insertPause, validateDay, unvalidateDay, getCollisions,
    }
}