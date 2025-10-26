<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 mb-1">Active Sessions</h3>
      <p class="text-sm text-gray-600 mb-6">Manage devices where you're logged in</p>
      <div class="space-y-3">
        <div class="p-4 border border-gray-200 rounded-lg">
          <div class="flex items-start justify-between">
            <div class="flex gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <q-icon name="smartphone" size="20px" color="blue" />
              </div>
              <div>
                <p class="font-medium text-gray-800">MacBook Pro</p>
                <p class="text-sm text-gray-500">Chrome • macOS</p>
                <p class="text-xs text-gray-400 mt-1">Active now • New York, US</p>
              </div>
            </div>
            <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Current</span>
          </div>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg">
          <div class="flex items-start justify-between">
            <div class="flex gap-3">
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <q-icon name="smartphone" size="20px" color="grey-6" />
              </div>
              <div>
                <p class="font-medium text-gray-800">iPhone 14</p>
                <p class="text-sm text-gray-500">iOS App • iPhone</p>
                <p class="text-xs text-gray-400 mt-1">2 hours ago • New York, US</p>
              </div>
            </div>
            <q-btn
              flat
              no-caps
              color="red"
              label="Terminate"
              size="sm"
              class="font-medium"
            />
          </div>
        </div>
      </div>
    </div>
    <q-btn
      outline
      color="red"
      label="Terminate All Other Sessions"
      class="w-full"
      padding="12px"
    />
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
.text-gray-400 {
  color: #9ca3af;
}
.text-red-600 {
  color: #dc2626;
}
.text-red-700 {
  color: #b91c1c;
}
.text-green-700 {
  color: #15803d;
}
.bg-blue-100 {
  background-color: #dbeafe;
}
.bg-gray-100 {
  background-color: #f3f4f6;
}
.bg-green-100 {
  background-color: #dcfce7;
}
.w-full {
  width: 100%;
}
</style>
