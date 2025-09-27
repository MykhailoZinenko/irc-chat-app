<template>
  <q-page class="flex flex-center">
    <q-card style="width: 400px" class="q-pa-md">
      <q-card-section class="text-center">
        <div class="text-h4 q-mb-md">Create Account</div>
        <div class="text-subtitle1 text-grey-7">Join our IRC community</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleSubmit" class="q-gutter-md">
          <div class="row" style="gap: 12px;">
            <q-input
              v-model="form.firstName"
              label="First Name (optional)"
              outlined
              class="col"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>

            <q-input
              v-model="form.lastName"
              label="Last Name (optional)"
              outlined
              class="col"
            />
          </div>

          <q-input
            v-model="form.nickName"
            label="Nickname"
            outlined
            :rules="[
              val => !!val || 'Nickname is required',
              val => val.length >= 2 || 'Nickname must be at least 2 characters',
              val => val.length <= 50 || 'Nickname must be less than 50 characters'
            ]"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="alternate_email" />
            </template>
          </q-input>

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
            :rules="[
              val => !!val || 'Password is required',
              val => val.length >= 8 || 'Password must be at least 8 characters'
            ]"
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

          <q-input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Confirm Password"
            outlined
            :rules="[
              val => !!val || 'Please confirm password',
              val => val === form.password || 'Passwords do not match'
            ]"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <div v-if="errors" class="q-mb-md">
            <div v-for="(error, field) in errors" :key="field" class="text-negative text-center">
              {{ error }}
            </div>
          </div>

          <div class="q-gutter-sm">
            <q-btn
              type="submit"
              label="Create Account"
              color="primary"
              class="full-width"
              :loading="authStore.isLoading"
              size="md"
            />

            <q-btn
              label="Already have an account? Login"
              flat
              color="primary"
              class="full-width"
              @click="$router.push('/auth/login')"
              :disable="authStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  firstName: '',
  lastName: '',
  nickName: '',
  email: '',
  password: ''
})

const confirmPassword = ref('')
const showPassword = ref(false)
const errors = ref<Record<string, string> | null>(null)

const handleSubmit = async () => {
  errors.value = null

  const result = await authStore.register({
    ...(form.value.firstName && { firstName: form.value.firstName }),
    ...(form.value.lastName && { lastName: form.value.lastName }),
    nickName: form.value.nickName,
    email: form.value.email,
    password: form.value.password
  })

  if (result.success) {
    await router.push('/')
  } else {
    console.log(result)
    errors.value = result.errors || { general: 'Registration failed' }
  }
}
</script>