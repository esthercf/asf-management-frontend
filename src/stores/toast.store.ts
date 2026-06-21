
import { defineStore } from 'pinia'

interface Toast {
    id: number
    message: string
    type: 'error' | 'success'
}

export const useToastStore = defineStore('toast', {
    state: () => ({
        toasts: [] as Toast[],
    }),
    actions: {
        show(message: string, type: 'error' | 'success' = 'error') {
            const id = Date.now() + Math.random()
            this.toasts.push({ id, message, type })
            setTimeout(() => this.dismiss(id), 5000)
        },
        dismiss(id: number) {
            this.toasts = this.toasts.filter(t => t.id !== id)
        },
    },
})