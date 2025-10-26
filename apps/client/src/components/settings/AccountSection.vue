<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <q-input
            v-model="email"
            outlined
            type="email"
            class="custom-input"
          >
            <template #prepend>
              <q-icon name="mail" color="grey-5" />
            </template>
          </q-input>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <q-input
            v-model="phone"
            outlined
            type="tel"
            class="custom-input"
          >
            <template #prepend>
              <q-icon name="phone" color="grey-5" />
            </template>
          </q-input>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-200 pt-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
          <q-input
            v-model="currentPassword"
            outlined
            type="password"
            placeholder="••••••••"
            class="custom-input"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <q-input
            v-model="newPassword"
            outlined
            type="password"
            placeholder="••••••••"
            class="custom-input"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
          <q-input
            v-model="confirmPassword"
            outlined
            type="password"
            placeholder="••••••••"
            class="custom-input"
          />
        </div>
        <q-btn
          unelevated
          color="blue"
          label="Update Password"
          class="w-full"
          padding="12px"
        />
      </div>
    </div>
    <div class="border-t border-gray-200 pt-6">
      <h3 class="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
      <p class="text-sm text-gray-600 mb-4">Once you delete your account, there is no going back.</p>
      <q-btn
        outline
        color="red"
        label="Delete Account"
        padding="12px 24px"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const email = ref('john@example.com')
const phone = ref('+1 234 567 8900')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
</script>
<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}
.border-t {
  border-top-width: 1px;
}
.border-gray-200 {
  border-color: #e5e7eb;
}
.text-gray-800 {
  color: #1f2937;
}
.text-gray-700 {
  color: #374151;
}
.text-gray-600 {
  color: #4b5563;
}
.text-red-600 {
  color: #dc2626;
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
