<!-- src/components/ToastContainer.vue -->
<template>
    <Teleport to="body">
        <div class="toast-stack">
            <div v-for="t in toast.toasts" :key="t.id" class="toast" :class="t.type" @click="toast.dismiss(t.id)">
                {{ t.type === 'error' ? '⚠️' : '✅' }} {{ t.message }}
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { useToastStore } from '../stores/toast.store';

const toast = useToastStore()
</script>

<style scoped>
.toast-stack {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: .6rem;
    max-width: 380px;
}

.toast {
    padding: .85rem 1.25rem;
    border-radius: 8px;
    font-weight: 700;
    font-size: .85rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, .15);
    animation: slideIn .2s ease;
}

.toast.error {
    background: #fee;
    color: #c00;
    border: 1.5px solid #c00;
}

.toast.success {
    background: #e6f9ed;
    color: #1a7f4e;
    border: 1.5px solid #1a7f4e;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}
</style>