<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 mb-1">Help & Support</h3>
      <p class="text-sm text-gray-600 mb-6">Get help and provide feedback</p>
      <div class="space-y-3">
        <q-btn flat no-caps class="help-item-btn">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <q-icon name="help" size="20px" color="grey-6" />
              <span class="font-medium text-gray-800">Help Center</span>
            </div>
            <q-icon name="chevron_right" size="20px" color="grey-4" />
          </div>
        </q-btn>
        <q-btn flat no-caps class="help-item-btn">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <q-icon name="mail" size="20px" color="grey-6" />
              <span class="font-medium text-gray-800">Contact Support</span>
            </div>
            <q-icon name="chevron_right" size="20px" color="grey-4" />
          </div>
        </q-btn>
        <q-btn flat no-caps class="help-item-btn">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <q-icon name="language" size="20px" color="grey-6" />
              <span class="font-medium text-gray-800">Privacy Policy</span>
            </div>
            <q-icon name="chevron_right" size="20px" color="grey-4" />
          </div>
        </q-btn>
        <q-btn flat no-caps class="help-item-btn">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <q-icon name="language" size="20px" color="grey-6" />
              <span class="font-medium text-gray-800">Terms of Service</span>
            </div>
            <q-icon name="chevron_right" size="20px" color="grey-4" />
          </div>
        </q-btn>
      </div>
    </div>
    <div class="pt-6 border-t border-gray-200">
      <p class="text-sm text-gray-500 text-center">Version 1.0.0</p>
    </div>
  </div>
</template>
<script setup lang="ts">
</script>
<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
.space-y-3 > * + * {
  margin-top: 0.75rem;
}
.border {
  border-width: 1px;
}
.border-t {
  border-top-width: 1px;
}
.border-gray-200 {
  border-color: #e5e7eb;
}
.text-gray-800 {
  color: #1f2937;
}
.text-gray-600 {
  color: #4b5563;
}
.text-gray-500 {
  color: #6b7280;
}
.bg-gray-50 {
  background-color: #f9fafb;
}
.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}
.w-full {
  width: 100%;
}

.help-item-btn {
  width: 100%;
  border: 1px solid #e5e7eb !important;
  border-radius: 0.5rem !important;
  justify-content: flex-start !important;
  padding: 16px !important;
  min-height: 56px;
}

.help-item-btn:hover {
  background-color: #f9fafb !important;
}

.help-item-btn :deep(.q-btn__content) {
  width: 100%;
  justify-content: flex-start;
}
</style>
