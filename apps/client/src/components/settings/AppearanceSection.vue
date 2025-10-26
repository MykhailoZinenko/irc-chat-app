<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 mb-1">Appearance Settings</h3>
      <p class="text-sm text-gray-600 mb-6">Customize how the app looks</p>
      <div class="space-y-4">
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p class="font-medium text-gray-800">Dark Mode</p>
            <p class="text-sm text-gray-500">Use dark theme throughout the app</p>
          </div>
          <q-toggle
            v-model="darkMode"
            color="blue"
          />
        </div>
        <div class="py-3 border-b border-gray-200">
          <p class="font-medium text-gray-800 mb-3">Message Text Size</p>
          <div class="flex gap-2">
            <q-btn
              :outline="textSize !== 'small'"
              :unelevated="textSize === 'small'"
              :color="textSize === 'small' ? 'blue' : 'grey-7'"
              label="Small"
              no-caps
              padding="8px 16px"
              class="text-sm"
              @click="textSize = 'small'"
            />
            <q-btn
              :outline="textSize !== 'medium'"
              :unelevated="textSize === 'medium'"
              :color="textSize === 'medium' ? 'blue' : 'grey-7'"
              label="Medium"
              no-caps
              padding="8px 16px"
              @click="textSize = 'medium'"
            />
            <q-btn
              :outline="textSize !== 'large'"
              :unelevated="textSize === 'large'"
              :color="textSize === 'large' ? 'blue' : 'grey-7'"
              label="Large"
              no-caps
              padding="8px 16px"
              class="text-lg"
              @click="textSize = 'large'"
            />
          </div>
        </div>
        <div class="py-3 border-b border-gray-200">
          <p class="font-medium text-gray-800 mb-3">Chat Background</p>
          <div class="grid grid-cols-4 gap-3">
            <button
              class="aspect-square rounded-lg bg-gray-50 border-2 transition-colors"
              :class="chatBg === 'gray' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'"
              @click="chatBg = 'gray'"
            />
            <button
              class="aspect-square rounded-lg bg-blue-50 border-2 transition-colors"
              :class="chatBg === 'blue' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'"
              @click="chatBg = 'blue'"
            />
            <button
              class="aspect-square rounded-lg bg-purple-50 border-2 transition-colors"
              :class="chatBg === 'purple' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'"
              @click="chatBg = 'purple'"
            />
            <button
              class="aspect-square rounded-lg bg-green-50 border-2 transition-colors"
              :class="chatBg === 'green' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'"
              @click="chatBg = 'green'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const darkMode = ref(false)
const textSize = ref('medium')
const chatBg = ref('gray')
</script>
<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}
.border-b {
  border-bottom-width: 1px;
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
.bg-blue-50 {
  background-color: #eff6ff;
}
.bg-purple-50 {
  background-color: #faf5ff;
}
.bg-green-50 {
  background-color: #f0fdf4;
}
.border-blue-500 {
  border-color: #3b82f6;
}
.border-transparent {
  border-color: transparent;
}
.hover\:border-gray-300:hover {
  border-color: #d1d5db;
}
.grid {
  display: grid;
}
.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.gap-2 {
  gap: 0.5rem;
}
.gap-3 {
  gap: 0.75rem;
}
.aspect-square {
  aspect-ratio: 1 / 1;
}
</style>
