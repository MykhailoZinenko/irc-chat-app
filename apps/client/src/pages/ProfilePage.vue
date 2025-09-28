<template>
  <q-page>
    <div v-if="isLoading" class="loading-container">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md text-grey-7">Loading profile...</div>
    </div>
    <UserProfile v-else :user="user" :is-own-profile="isOwnProfile" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'
import { useContactStore, type PublicUser } from 'src/stores/contact-store'
import UserProfile from 'src/components/UserProfile.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const contactStore = useContactStore()

const user = ref<PublicUser | null>(null)
const isLoading = ref(false)

const isOwnProfile = computed(() => {
  if (!authStore.user || !user.value) return false
  return authStore.user.id === user.value.id
})

const loadUserProfile = async () => {
  if (!authStore.isAuthenticated) {
    await router.push('/auth/login')
    return
  }

  isLoading.value = true
  const userId = route.params.id

  try {
    if (userId === 'me' || !userId) {
      // My profile
      if (authStore.user) {
        user.value = {
          id: authStore.user.id,
          firstName: authStore.user.firstName,
          lastName: authStore.user.lastName,
          nickName: authStore.user.nickName,
          fullName: authStore.user.fullName,
          createdAt: authStore.user.createdAt
        }
      }
    } else {
      // Other user's profile
      const profile = await contactStore.fetchUserProfile(userId as string)
      if (profile) {
        user.value = profile
      } else {
        await router.push('/')
      }
    }
  } finally {
    isLoading.value = false
  }
}

// Watch for route parameter changes
watch(() => route.params.id, async () => {
  await loadUserProfile()
}, { immediate: false })

onMounted(async () => {
  await loadUserProfile()
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}
</style>