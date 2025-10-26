<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 mb-1">Privacy Settings</h3>
      <p class="text-sm text-gray-600 mb-6">Control who can see your information</p>
      <div class="space-y-5">
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">Last Seen</p>
            <p class="text-sm text-gray-500">Who can see when you were last online</p>
          </div>
          <q-select
            v-model="privacy.lastSeen"
            :options="privacyOptions"
            outlined
            class="privacy-select"
          />
        </div>
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">Profile Photo</p>
            <p class="text-sm text-gray-500">Who can see your profile photo</p>
          </div>
          <q-select
            v-model="privacy.profilePhoto"
            :options="privacyOptions"
            outlined
            class="privacy-select"
          />
        </div>
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">About</p>
            <p class="text-sm text-gray-500">Who can see your bio</p>
          </div>
          <q-select
            v-model="privacy.about"
            :options="privacyOptions"
            outlined
            class="privacy-select"
          />
        </div>
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">Groups</p>
            <p class="text-sm text-gray-500">Who can add you to groups</p>
          </div>
          <q-select
            v-model="privacy.groups"
            :options="privacyOptions"
            outlined
            class="privacy-select"
          />
        </div>
      </div>
    </div>
    <div class="pt-4">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Blocked Users</h3>
      <p class="text-sm text-gray-600 mb-3">You have no blocked users</p>
      <q-btn
        outline
        color="grey-7"
        label="Manage Blocked Users"
        padding="8px 24px"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const privacyOptions = ['Everyone', 'My Contacts', 'Nobody']
const privacy = ref({
  lastSeen: 'Everyone',
  profilePhoto: 'My Contacts',
  about: 'Everyone',
  groups: 'My Contacts',
})
</script>
<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
.space-y-5 > * + * {
  margin-top: 1.25rem;
}
.border-b {
  border-bottom-width: 1px;
}
.border-gray-200 {
  border-color: #e5e7eb;
}
.text-gray-800 {
  color: #1f2937;
}
.text-gray-600 {
  color: #4b5563;
}
.text-gray-500 {
  color: #6b7280;
}
.privacy-select {
  width: 160px;
}
.privacy-select :deep(.q-field__control) {
  border-radius: 0.5rem;
  min-height: 40px;
}
.privacy-select :deep(.q-field__control):before {
  border-color: #d1d5db;
}
</style>
