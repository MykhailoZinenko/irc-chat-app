<template>
  <AuthPageLayout
    title="Welcome Back"
    subtitle="Sign in to continue to your account"
    footer-text="Don't have an account?"
    footer-link-text="Sign up"
    footer-link-href="/register"
  >
    <div class="space-y-5">
      <!-- Email Field -->
      <InputField
        v-model="form.email"
        label="Email Address"
        icon="mail"
        type="email"
        placeholder="your@email.com"
        @enter="handleSubmit"
      />

      <!-- Password Field -->
      <PasswordField
        v-model="form.password"
        label="Password"
        placeholder="Enter your password"
        @enter="handleSubmit"
      />

      <!-- Remember Me & Forgot Password -->
      <div class="flex items-center justify-between">
        <label class="flex items-center cursor-pointer select-none">
          <input
            v-model="rememberMe"
            type="checkbox"
            class="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <span class="ml-2 text-sm text-gray-600">Remember me</span>
        </label>
        <router-link to="/forgot-password" class="text-blue-500 hover:text-blue-600 font-semibold transition-colors">
          Forgot password?
        </router-link>
      </div>

      <!-- Login Button -->
      <Button @click="handleSubmit">
        Sign In
      </Button>
    </div>
  </AuthPageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AuthPageLayout from '@/components/auth/AuthPageLayout.vue';
import InputField from '@/components/ui/InputField.vue';
import PasswordField from '@/components/ui/PasswordField.vue';
import Button from '@/components/ui/CustomButton.vue';
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store';

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})
const rememberMe = ref(false);


const handleSubmit = async () => {
  const result = await authStore.login(form.value.email, form.value.password)

  if (result.success) {
    console.log('Login successful')
      void router.push('/chat')
  } else {
    console.log('Login failed:', result.message)
  }
};
</script>

<style scoped>
/* Tailwind-like utilities using standard CSS */
.min-h-screen {
  min-height: 100vh;
}

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.from-blue-50 {
  --tw-gradient-from: #eff6ff;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(239, 246, 255, 0));
}

.to-purple-50 {
  --tw-gradient-to: #faf5ff;
}

.from-blue-500 {
  --tw-gradient-from: #3b82f6;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0));
}

.to-purple-500 {
  --tw-gradient-to: #a855f7;
}

.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

input:focus {
  outline: none;
}

input[type="checkbox"] {
  accent-color: #3b82f6;
}

button:active {
  transform: scale(0.98);
}
</style>
