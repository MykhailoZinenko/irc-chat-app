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
      />

      <InputField
        v-model="form.nickName"
        label="Nickname"
        icon="person"
        type="text"
        placeholder="johndoe"
      />

      <!-- Email Field -->
      <InputField
        v-model="form.email"
        label="Email Address"
        icon="mail"
        type="email"
        placeholder="your@email.com"
      />

      <!-- Password Field -->
      <div>
        <PasswordField
          v-model="form.password"
          label="Password"
          placeholder="Create a password"
        />
        <p class="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
      </div>

      <!-- Confirm Password Field -->
      <PasswordField
        v-model="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm your password"
        
        @enter="handleSubmit"
      />

      <!-- Terms & Conditions -->
      <label class="flex items-start cursor-pointer select-none">
        <input
          v-model="agreeToTerms"
          type="checkbox"
          class="w-4 h-4 mt-0.5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />
        <span class="ml-2 text-sm text-gray-600">
          I agree to the <router-link to="/terms-and-conditions" class="text-blue-500 hover:text-blue-600">Terms & Conditions</router-link>
        </span>
      </label>

      <!-- Register Button -->
      <PrimaryButton @click="handleSubmit" :disabled="!agreeToTerms">
        Create Account
      </PrimaryButton>
    </div>

    <!-- Social Login -->
    <SocialLogin 
      @google="handleGoogleLogin"
      @facebook="handleFacebookLogin"
    />
  </AuthPageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AuthPageLayout from '@/components/auth/AuthPageLayout.vue';
import InputField from '@/components/auth/InputField.vue';
import PasswordField from '@/components/auth/PasswordField.vue';
import PrimaryButton from '@/components/auth/PrimaryButton.vue';
import SocialLogin from '@/components/auth/SocialLogin.vue';
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store';

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  fullName: '',
  nickName: '',
  email: '',
  password: ''
})

const confirmPassword = ref('');
const agreeToTerms = ref(false);

const handleSubmit = async () => {
  if (form.value.password !== confirmPassword.value) {
    alert('Passwords do not match!');
    return;
  }
  if (!agreeToTerms.value) {
    alert('Please agree to the terms and conditions');
    return;
  }

  const [firstName, lastName] = form.value.fullName.split(' ');

  const result = await authStore.register({
    firstName: firstName!,
    lastName: lastName!,
    nickName: form.value.nickName,
    email: form.value.email,
    password: form.value.password
  })

  if (result.success) {
    console.log('Registration successful')
    void router.push('/login')
  } else {
    console.log('Registration failed:', result.errors || "Unknown error")
  }
};

const handleGoogleLogin = () => {
  console.log('Google register');
};

const handleFacebookLogin = () => {
  console.log('Facebook register');
};
</script>

<style scoped>
input[type="checkbox"] {
  accent-color: #3b82f6;
}
</style>