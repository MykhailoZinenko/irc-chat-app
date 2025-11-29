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
      <Button @click="handleSubmit" :disabled="!agreeToTerms">
        Create Account
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
import { Notify } from 'quasar';

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
    Notify.create({
      type: 'negative',
      message: 'Passwords do not match!'
    });
    return;
  }
  if (!agreeToTerms.value) {
    Notify.create({
      type: 'negative',
      message: 'Please agree to the terms and conditions'
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
    // Errors are already shown by the auth store
    console.log('Registration failed:', result.errors || "Unknown error")
  }
};
</script>

<style scoped>
input[type="checkbox"] {
  accent-color: #3b82f6;
}
</style>
