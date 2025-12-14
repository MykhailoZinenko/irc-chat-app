<template>
  <AuthPageLayout
    title="Forgot Password"
    subtitle="Enter your email to reset your password"
    footer-text="Remember your password?"
    footer-link-text="Sign in"
    footer-link-href="/login"
  >
    <div class="space-y-5">
      <!-- Email Field -->
      <InputField
        v-model="email"
        label="Email Address"
        icon="mail"
        type="email"
        placeholder="your@email.com"
        @enter="handleSubmit"
      />

      <!-- Info Message -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <q-icon name="info" size="20px" class="text-blue-500 mt-0.5" />
          <p class="text-sm text-gray-700">
            We'll send you a link to reset your password. Please check your email inbox and spam folder.
          </p>
        </div>
      </div>

      <!-- Submit Button -->
      <Button @click="handleSubmit">
        Send Reset Link
      </Button>
    </div>
  </AuthPageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AuthPageLayout from '@/components/auth/AuthPageLayout.vue';
import InputField from '@/components/ui/InputField.vue';
import Button from '@/components/ui/CustomButton.vue';

const email = ref('');

const handleSubmit = () => {
  console.log('Reset password for:', email.value);
};
</script>
