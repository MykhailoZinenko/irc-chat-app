<template>
  <q-header class="mobile-header">
    <!-- Search Header -->
    <q-toolbar v-if="searchOpen" class="search-toolbar">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="grey-8"
        @click="handleCloseSearch"
      />
      <q-input
        v-model="searchQuery"
        placeholder="Search users..."
        dense
        borderless
        class="mobile-search-input"
        @update:model-value="onSearchChange"
        autofocus
      >
        <template v-slot:append v-if="searchQuery">
          <q-btn
            flat
            round
            dense
            icon="clear"
            color="grey-6"
            size="xs"
            @click="handleClearSearch"
          />
        </template>
      </q-input>
    </q-toolbar>

    <!-- Normal Header -->
    <q-toolbar v-else class="mobile-toolbar">
      <q-btn
        flat
        round
        dense
        icon="menu"
        color="grey-8"
        @click="openDrawer"
      />

      <q-toolbar-title class="mobile-title">
        IRC Chat
      </q-toolbar-title>

      <q-btn
        flat
        round
        dense
        icon="search"
        color="grey-8"
        @click="openSearch"
      />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useContactStore } from 'src/stores/contact-store'
import { useMobile } from 'src/composables/useMobile'

const contactStore = useContactStore()
const { searchOpen, searchQuery, openSearch, closeSearch, clearSearch, openDrawer } = useMobile()

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const handleCloseSearch = () => {
  closeSearch()
  contactStore.clearSearchResults()
}

const handleClearSearch = () => {
  clearSearch()
  contactStore.clearSearchResults()
}

const onSearchChange = (value: string | number | null) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    void contactStore.searchUsers(String(value || ''))
  }, 300)
}

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
.mobile-header {
  background: white;
  border-bottom: 1px solid #e4e6ea;
  box-shadow: none;
}

.mobile-toolbar, .search-toolbar {
  height: 64px;
  min-height: 64px;
  padding: 0 8px;
}

.mobile-title {
  font-size: 16px;
  font-weight: 500;
}

.mobile-search-input {
  flex: 1;
  margin-left: 12px;
  font-size: 16px;
}
</style>