<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup lang="ts">
import ToastContainer from '@/components/ToastContainer.vue'
import { RouterView } from 'vue-router'
</script>
