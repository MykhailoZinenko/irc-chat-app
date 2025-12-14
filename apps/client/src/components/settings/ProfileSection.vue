<template>
  <div class="space-y-6">
    <!-- Profile Header -->
    <div class="flex items-center gap-6 pb-6 border-b border-gray-200">
      <div class="relative">
        <div class="w-24 h-24 rounded-full app-gradient flex items-center justify-center text-4xl">
          😊
        </div>
        <q-icon
          name="edit"
          size="14px"
          color="primary"
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
        <InputField
          v-model="firstName"
          label="First Name"
          icon="person"
          placeholder="John"
        />
      </div>
      <div>
        <InputField
          v-model="lastName"
          label="Last Name"
          icon="badge"
          placeholder="Doe"
        />
      </div>
      <div>
        <InputField
          v-model="nickName"
          label="Nickname"
          icon="alternate_email"
          placeholder="johndoe"
        />
        <p class="text-xs text-gray-500 mt-1">Your unique username for the platform</p>
      </div>
    </div>
    <Button
      :loading="isLoading"
      :disabled="isLoading"
      @click="handleSaveProfile"
      variant="solid"
    >
      Save Changes
    </Button>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth-store'
import { Notify } from 'quasar'
import InputField from '@/components/ui/InputField.vue'
import Button from '@/components/ui/CustomButton.vue'

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
.w-full {
  width: 100%;
}
</style>
