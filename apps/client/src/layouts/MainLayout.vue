<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
</script>

<style scoped>
.telegram-layout {
  background: #f1f3f4;
}

.main-content {
  background: white;
}

@media (max-width: 767px) {
  .main-content {
    padding-top: 64px;
  }
}
</style>
