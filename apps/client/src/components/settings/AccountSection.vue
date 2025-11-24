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
        <q-btn
          unelevated
          color="blue"
          label="Update Email"
          class="w-full"
          padding="12px"
          :loading="isLoadingEmail"
          @click="handleUpdateEmail"
        />
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
          :loading="isLoadingPassword"
          @click="handleUpdatePassword"
        />
      </div>
    </div>
    <div class="border-t border-gray-200 pt-6">
      <h3 class="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
      <p class="text-sm text-gray-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
      <q-btn
        outline
        color="red"
        label="Delete Account"
        padding="12px 24px"
        @click="showDeleteConfirmation"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'
import { Notify, useQuasar } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const email = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoadingEmail = ref(false)
const isLoadingPassword = ref(false)

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }

  if (authStore.user) {
    email.value = authStore.user.email || ''
  }
})

const handleUpdateEmail = async () => {
  if (!email.value.trim()) {
    Notify.create({
      type: 'negative',
      message: 'Email is required'
    })
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    Notify.create({
      type: 'negative',
      message: 'Please enter a valid email address'
    })
    return
  }

  isLoadingEmail.value = true
  try {
    const result = await authStore.updateProfile({
      email: email.value.trim()
    })

    if (result.success) {
      Notify.create({
        type: 'positive',
        message: 'Email updated successfully'
      })
    }
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to update email'
    })
  } finally {
    isLoadingEmail.value = false
  }
}

const handleUpdatePassword = async () => {
  if (!currentPassword.value) {
    Notify.create({
      type: 'negative',
      message: 'Current password is required'
    })
    return
  }

  if (!newPassword.value) {
    Notify.create({
      type: 'negative',
      message: 'New password is required'
    })
    return
  }

  if (newPassword.value.length < 8) {
    Notify.create({
      type: 'negative',
      message: 'Password must be at least 8 characters'
    })
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    Notify.create({
      type: 'negative',
      message: 'Passwords do not match'
    })
    return
  }

  isLoadingPassword.value = true
  try {
    const result = await authStore.updatePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })

    if (result.success) {
      Notify.create({
        type: 'positive',
        message: 'Password updated successfully'
      })
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    }
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to update password'
    })
  } finally {
    isLoadingPassword.value = false
  }
}

const showDeleteConfirmation = () => {
  $q.dialog({
    title: 'Delete Account',
    message: 'This action cannot be undone. All your data will be permanently deleted. Please enter your password to confirm.',
    prompt: {
      model: '',
      type: 'password',
      isValid: (val: string) => val.length > 0,
      placeholder: 'Enter your password'
    },
    cancel: {
      label: 'Cancel',
      flat: true,
      color: 'grey'
    },
    ok: {
      label: 'Delete Account',
      color: 'negative',
      flat: true
    },
    persistent: true,
    color: 'negative'
  }).onOk((password: string) => {
    if (!password) {
      Notify.create({
        type: 'negative',
        message: 'Password is required'
      })
      return
    }

    void authStore.deleteAccount(password).then((result) => {
      if (result.success) {
        void router.push('/login')
      }
    }).catch((error: any) => {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to delete account'
      })
    })
  })
}
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
