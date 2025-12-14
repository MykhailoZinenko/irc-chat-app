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
        :error="errors.email"
        @enter="handleSubmit"
      />

      <!-- Password Field -->
      <PasswordField
        v-model="form.password"
        label="Password"
        placeholder="Enter your password"
        :error="errors.password"
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
      <PrimaryButton @click="handleSubmit" :disabled="authStore.isLoading">
        <span v-if="!authStore.isLoading">Sign In</span>
        <span v-else class="flex items-center justify-center">
          <q-spinner size="20px" color="white" class="mr-2" />
          Signing in...
        </span>
      </PrimaryButton>
    </div>

    <!-- Social Login -->
    <SocialLogin
      @google="handleGoogleLogin"
      @github="handleGithubLogin"
    />
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
import { Notify } from 'quasar';
import { useOAuth } from 'src/composables/useOAuth';

const router = useRouter()
const authStore = useAuthStore()
const { openOAuthPopup } = useOAuth()

const form = ref({
  email: '',
  password: ''
})
const rememberMe = ref(false);
const errors = ref({
  email: '',
  password: ''
});

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateForm = (): boolean => {
  errors.value = { email: '', password: '' };
  let isValid = true;

  // Email validation
  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required';
    isValid = false;
  } else if (!validateEmail(form.value.email)) {
    errors.value.email = 'Please enter a valid email address';
    isValid = false;
  }

  // Password validation
  if (!form.value.password) {
    errors.value.password = 'Password is required';
    isValid = false;
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    Notify.create({
      type: 'negative',
      message: 'Please fix the errors below',
      position: 'top',
      timeout: 3000
    });
    return;
  }

  const result = await authStore.login(form.value.email, form.value.password)

  if (result.success) {
    void router.push('/chat')
  } else {
    Notify.create({
      type: 'negative',
      message: result.message || 'Login failed. Please check your credentials.',
      position: 'top',
      timeout: 4000
    });
  }
};

const handleGoogleLogin = () => {
  openOAuthPopup('google');
};

const handleGithubLogin = () => {
  openOAuthPopup('github');
};

</script>

<style scoped>
input:focus {
  outline: none;
}

input[type="checkbox"] {
  accent-color: var(--app-primary);
}

button:active {
  transform: scale(0.98);
}
</style>
