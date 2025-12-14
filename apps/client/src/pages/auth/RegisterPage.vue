<template>
  <AuthPageLayout
    title="Create Account"
    subtitle="Sign up to get started"
    footer-text="Already have an account?"
    footer-link-text="Sign in"
    footer-link-href="/login"
  >
    <div class="space-y-5">
      <!-- Full Name Field -->
      <InputField
        v-model="form.fullName"
        label="Full Name"
        icon="person"
        type="text"
        placeholder="John Doe"
        :error="errors.fullName"
      />

      <InputField
        v-model="form.nickName"
        label="Nickname"
        icon="person"
        type="text"
        placeholder="johndoe"
        :error="errors.nickName"
      />

      <!-- Email Field -->
      <InputField
        v-model="form.email"
        label="Email Address"
        icon="mail"
        type="email"
        placeholder="your@email.com"
        :error="errors.email"
      />

      <!-- Password Field -->
      <PasswordField
        v-model="form.password"
        label="Password"
        placeholder="Create a password"
        :error="errors.password"
      />

      <!-- Confirm Password Field -->
      <PasswordField
        v-model="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm your password"
        :error="errors.confirmPassword"
        @enter="handleSubmit"
      />

      <!-- Terms & Conditions -->
      <q-checkbox
        v-model="agreeToTerms"
        dense
        color="blue"
        class="text-sm text-gray-600"
      >
        <template v-slot:default>
          <span class="text-sm text-gray-600">
            I agree to the <router-link to="/terms-and-conditions" class="text-blue-500 hover:text-blue-600">Terms & Conditions</router-link>
          </span>
        </template>
      </q-checkbox>

      <!-- Register Button -->
      <PrimaryButton @click="handleSubmit" :disabled="authStore.isLoading">
        <span v-if="!authStore.isLoading">Create Account</span>
        <span v-else class="flex items-center justify-center">
          <q-spinner size="20px" color="white" class="mr-2" />
          Creating account...
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
  fullName: '',
  nickName: '',
  email: '',
  password: ''
})

const confirmPassword = ref('');
const agreeToTerms = ref(false);
const errors = ref({
  fullName: '',
  nickName: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateNickname = (nickname: string): boolean => {
  // Nickname should be alphanumeric and 2-50 characters
  const nicknameRegex = /^[a-zA-Z0-9_]{2,50}$/;
  return nicknameRegex.test(nickname);
};

const validateForm = (): boolean => {
  errors.value = {
    fullName: '',
    nickName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  let isValid = true;

  // Full name validation
  if (!form.value.fullName.trim()) {
    errors.value.fullName = 'Full name is required';
    isValid = false;
  } else if (form.value.fullName.trim().length < 2) {
    errors.value.fullName = 'Full name must be at least 2 characters';
    isValid = false;
  }

  // Nickname validation
  if (!form.value.nickName.trim()) {
    errors.value.nickName = 'Nickname is required';
    isValid = false;
  } else if (!validateNickname(form.value.nickName)) {
    errors.value.nickName = 'Nickname must be 2-50 alphanumeric characters';
    isValid = false;
  }

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
  } else if (form.value.password.length < 8) {
    errors.value.password = 'Password must be at least 8 characters';
    isValid = false;
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.value.password)) {
    errors.value.password = 'Password must contain uppercase, lowercase, and number';
    isValid = false;
  }

  // Confirm password validation
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Please confirm your password';
    isValid = false;
  } else if (form.value.password !== confirmPassword.value) {
    errors.value.confirmPassword = 'Passwords do not match';
    isValid = false;
  }

  // Terms agreement
  if (!agreeToTerms.value) {
    Notify.create({
      type: 'warning',
      message: 'Please agree to the terms and conditions',
      position: 'top',
      timeout: 3000
    });
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

  const [firstName, ...lastNameParts] = form.value.fullName.split(' ');
  const lastName = lastNameParts.join(' ');

  const result = await authStore.register({
    firstName: firstName || '',
    lastName: lastName || '',
    nickName: form.value.nickName,
    email: form.value.email,
    password: form.value.password
  })

  if (result.success) {
    void router.push('/chat')
  } else {
    // Handle server-side validation errors
    if (result.errors) {
      const serverErrors = result.errors as any;

      // Map server errors to form fields
      if (serverErrors.email) {
        errors.value.email = Array.isArray(serverErrors.email)
          ? serverErrors.email[0]
          : serverErrors.email;
      }
      if (serverErrors.nickName || serverErrors.nick_name) {
        errors.value.nickName = Array.isArray(serverErrors.nickName || serverErrors.nick_name)
          ? (serverErrors.nickName || serverErrors.nick_name)[0]
          : (serverErrors.nickName || serverErrors.nick_name);
      }
      if (serverErrors.password) {
        errors.value.password = Array.isArray(serverErrors.password)
          ? serverErrors.password[0]
          : serverErrors.password;
      }

      // Show general error toast
      Notify.create({
        type: 'negative',
        message: serverErrors.general || 'Registration failed. Please check the errors below.',
        position: 'top',
        timeout: 4000
      });
    } else {
      Notify.create({
        type: 'negative',
        message: 'Registration failed. Please try again.',
        position: 'top',
        timeout: 4000
      });
    }
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
input[type="checkbox"] {
  accent-color: var(--app-primary);
}
</style>
