<template>
  <div class="space-y-6">
    <!-- Profile Header -->
    <div class="flex items-center gap-6 pb-6 border-b border-gray-200">
      <div class="relative">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-4xl">
          😊
        </div>
        <q-icon
          name="edit"
          size="14px"
          color="blue-5"
          class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5"
        />
      </div>
      <div>
        <h3 class="text-xl font-semibold text-gray-800">John Doe</h3>
        <p class="text-gray-500">@johndoe</p>
        <p class="text-sm text-gray-400 mt-1">Online</p>
      </div>
    </div>
    <!-- Profile Fields -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <q-input
          v-model="fullName"
          outlined
          class="custom-input"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
        <q-input
          v-model="username"
          outlined
          class="custom-input"
        />
        <p class="text-xs text-gray-500 mt-1">Your unique username for the platform</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Bio</label>
        <q-input
          v-model="bio"
          outlined
          type="textarea"
          :rows="3"
          class="custom-input"
        />
        <p class="text-xs text-gray-500 mt-1">Any details about yourself</p>
      </div>
    </div>
    <q-btn
      unelevated
      color="blue"
      label="Save Changes"
      class="w-full"
      padding="12px"
    />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const fullName = ref('John Doe')
const username = ref('johndoe')
const bio = ref('Product designer | Coffee enthusiast ☕')
</script>
<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}
.border-b {
  border-bottom-width: 1px;
}
.border-gray-200 {
  border-color: #e5e7eb;
}
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, #60a5fa, #a78bfa);
}
.text-gray-800 {
  color: #1f2937;
}
.text-gray-700 {
  color: #374151;
}
.text-gray-500 {
  color: #6b7280;
}
.text-gray-400 {
  color: #9ca3af;
}
.custom-input :deep(.q-field__control) {
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  min-height: 48px;
}
.custom-input :deep(.q-field__control):before {
  border-color: #d1d5db;
}
.custom-input :deep(.q-field__control):hover:before {
  border-color: #3b82f6;
}
.custom-input :deep(.q-field__control):after {
  border-color: #3b82f6;
}
.w-full {
  width: 100%;
}
</style>
