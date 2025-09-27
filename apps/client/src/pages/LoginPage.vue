<template>
  <q-page class="flex flex-center">
    <div style="width: 100%; max-width: 800px; padding: 20px;">
      <!-- Original Login Form -->
      <q-card style="width: 400px; margin: 0 auto;" class="q-pa-md">
        <q-card-section class="text-center">
          <div class="text-h4 q-mb-md">IRC Chat Login</div>
          <div class="text-subtitle1 text-grey-7">Sign in to continue</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleSubmit" class="q-gutter-md">
            <q-input
              v-model="form.email"
              type="email"
              label="Email"
              outlined
              :rules="[val => !!val || 'Email is required', val => /.+@.+\..+/.test(val) || 'Invalid email']"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="mail" />
              </template>
            </q-input>

            <q-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              label="Password"
              outlined
              :rules="[val => !!val || 'Password is required']"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <div v-if="error" class="text-negative text-center q-mb-md">
              {{ error }}
            </div>

            <div class="q-gutter-sm">
              <q-btn
                type="submit"
                label="Login"
                color="primary"
                class="full-width"
                :loading="authStore.isLoading"
                size="md"
              />

              <q-btn
                label="Don't have an account? Register"
                flat
                color="primary"
                class="full-width"
                @click="$router.push('/auth/register')"
                :disable="authStore.isLoading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const showPassword = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''

  const result = await authStore.login(form.value.email, form.value.password)

  if (result.success) {
    await router.push('/')
  } else {
    error.value = result.message || 'Login failed'
  }
}
</script>