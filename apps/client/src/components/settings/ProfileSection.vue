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
        <h3 class="text-xl font-semibold text-gray-800">{{ displayName }}</h3>
        <p class="text-gray-500">@{{ displayUsername }}</p>
      </div>
    </div>
    <!-- Profile Fields -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
        <q-input
          v-model="firstName"
          outlined
          class="custom-input"
          placeholder="John"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
        <q-input
          v-model="lastName"
          outlined
          class="custom-input"
          placeholder="Doe"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Nickname</label>
        <q-input
          v-model="nickName"
          outlined
          class="custom-input"
          placeholder="johndoe"
        />
        <p class="text-xs text-gray-500 mt-1">Your unique username for the platform</p>
      </div>
    </div>
    <q-btn
      unelevated
      color="blue"
      label="Save Changes"
      class="w-full"
      padding="12px"
      :loading="isLoading"
      @click="handleSaveProfile"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth-store'
import { Notify } from 'quasar'

const authStore = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const nickName = ref('')
const isLoading = ref(false)

const displayName = computed(() => {
  return authStore.user?.fullName || authStore.user?.nickName || 'User'
})

const displayUsername = computed(() => {
  return authStore.user?.nickName || 'username'
})

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }

  if (authStore.user) {
    firstName.value = authStore.user.firstName || ''
    lastName.value = authStore.user.lastName || ''
    nickName.value = authStore.user.nickName || ''
  }
})

const handleSaveProfile = async () => {
  if (!nickName.value.trim()) {
    Notify.create({
      type: 'negative',
      message: 'Nickname is required'
    })
    return
  }

  isLoading.value = true
  try {
    const updateData: {
      firstName?: string
      lastName?: string
      nickName: string
    } = {
      nickName: nickName.value.trim()
    }

    if (firstName.value.trim()) {
      updateData.firstName = firstName.value.trim()
    }

    if (lastName.value.trim()) {
      updateData.lastName = lastName.value.trim()
    }

    const result = await authStore.updateProfile(updateData)

    if (result.success) {
      Notify.create({
        type: 'positive',
        message: 'Profile updated successfully'
      })
    }
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to update profile'
    })
  } finally {
    isLoading.value = false
  }
}
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
