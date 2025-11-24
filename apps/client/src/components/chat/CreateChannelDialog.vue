<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 450px; max-width: 500px">
      <q-card-section>
        <div class="text-h6">Create Channel</div>
      </q-card-section>

      <q-card-section class="q-pt-none space-y-4">
        <DialogInputField
          v-model="channelName"
          label="Channel Name"
          icon="tag"
          placeholder="e.g., general, announcements"
        />

        <DialogInputField
          v-model="channelDescription"
          label="Description (optional)"
          icon="description"
          type="textarea"
          placeholder="What's this channel about?"
          :rows="3"
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Channel Type
          </label>
          <q-option-group
            v-model="channelType"
            :options="[
              { label: 'Private - Invite only', value: 'private' },
              { label: 'Public - Anyone can join', value: 'public' }
            ]"
            color="primary"
            class="channel-type-options"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancel" color="grey" @click="onDialogCancel" />
        <q-btn
          unelevated
          label="Create"
          color="primary"
          :disable="!channelName.trim()"
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import DialogInputField from './DialogInputField.vue'

// Declare dialog emits so listeners don't fall through to QDialog and double-trigger hide
defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const channelName = ref('')
const channelDescription = ref('')
const channelType = ref<'private' | 'public'>('private')

const onOKClick = () => {
  if (!channelName.value.trim()) return

  onDialogOK({
    type: channelType.value,
    name: channelName.value.trim(),
    description: channelDescription.value.trim()
  })
}
</script>

<style scoped>
.space-y-4 > * + * {
  margin-top: 1rem;
}

.text-gray-700 {
  color: #374151;
}

:deep(.channel-type-options .q-radio) {
  margin-bottom: 0.5rem;
}
</style>
