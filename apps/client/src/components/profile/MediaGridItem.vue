<template>
  <div 
    @click="$emit('click')"
    class="aspect-square bg-gray-200 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
  >
    <q-icon name="image" size="24px" class="text-gray-400" />
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'click': [];
}>();
</script>