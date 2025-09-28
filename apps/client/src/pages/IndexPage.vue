<template>
  <q-page class="index-page">
    <div class="empty-main">
      <div class="empty-content">
        <q-icon name="chat" size="80px" color="grey-4" />
        <div class="text-h5 text-grey-6 q-mt-md">Welcome to IRC Chat</div>
        <div class="text-grey-5 q-mt-sm">Search for users in the sidebar to start a conversation</div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// Empty page - just shows welcome message
</script>

<style scoped>
.index-page {
  height: 100vh;
  padding: 0;
}

.empty-main {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.empty-content {
  text-align: center;
  max-width: 400px;
  padding: 40px;
}

/* Profile View Styles */
.profile-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #e4e6ea;
  background: white;
  height: 64px; /* Same as sidebar header */
  min-height: 64px;
}

.profile-content {
  flex: 1;
  padding: 24px;
  background: #f8f9fa;
  overflow-y: auto;
}

.profile-info {
  max-width: 600px;
  margin: 0 auto;
}

.info-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f3f4;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #8e8e93;
  min-width: 120px;
}

.info-value {
  color: #2c2c2c;
  font-weight: 500;
}

.username-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #1976d2;
  font-weight: 500;
}

.profile-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  min-width: 140px;
  height: 44px;
  border-radius: 22px;
  font-weight: 500;
}
</style>

