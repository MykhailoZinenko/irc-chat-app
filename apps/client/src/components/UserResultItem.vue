<template>
  <q-item
    clickable
    @click="$emit('click', user)"
    class="user-result-item"
  >
    <q-item-section avatar>
      <q-avatar color="primary" text-color="white" size="md">
        {{ getInitials() }}
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ user.fullName || user.nickName }}</q-item-label>
      <q-item-label caption>@{{ user.nickName }}</q-item-label>
      <q-item-label caption class="text-grey-6">
        Member since {{ formatDate(user.createdAt) }}
      </q-item-label>
    </q-item-section>

    <q-item-section side v-if="showActions" class="action-section">
      <div class="action-buttons">
        <q-btn
          v-if="!isInContacts"
          round
          flat
          dense
          icon="person_add"
          color="positive"
          size="sm"
          @click.stop="$emit('add-contact', user)"
          :loading="isAddingContact"
          class="action-btn"
        >
          <q-tooltip>Add to contacts</q-tooltip>
        </q-btn>

        <q-btn
          v-else
          round
          flat
          dense
          icon="person_remove"
          color="negative"
          size="sm"
          @click.stop="$emit('remove-contact', user)"
          :loading="isRemovingContact"
          class="action-btn"
        >
          <q-tooltip>Remove from contacts</q-tooltip>
        </q-btn>

        <q-btn
          round
          flat
          dense
          icon="more_vert"
          color="grey-6"
          size="sm"
          class="action-btn"
        >
          <q-tooltip>More actions</q-tooltip>
          <q-menu>
            <q-list dense>
              <q-item clickable @click="$emit('copy-nickname', user.nickName)">
                <q-item-section avatar>
                  <q-icon name="content_copy" size="sm" />
                </q-item-section>
                <q-item-section>Copy username</q-item-section>
              </q-item>
              <q-item clickable @click="$emit('view-profile', user)">
                <q-item-section avatar>
                  <q-icon name="info" size="sm" />
                </q-item-section>
                <q-item-section>View profile</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PublicUser } from 'src/stores/contact-store'

interface Props {
  user: PublicUser
  isInContacts?: boolean
  showActions?: boolean
  isAddingContact?: boolean
  isRemovingContact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isInContacts: false,
  showActions: true,
  isAddingContact: false,
  isRemovingContact: false,
})

defineEmits<{
  click: [user: PublicUser]
  'add-contact': [user: PublicUser]
  'remove-contact': [user: PublicUser]
  'copy-nickname': [nickname: string]
  'view-profile': [user: PublicUser]
}>()

const getInitials = () => {
  const firstName = props.user.firstName || ''
  const lastName = props.user.lastName || ''

  if (firstName && lastName && firstName.length > 0 && lastName.length > 0) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  } else if (firstName && firstName.length > 0) {
    return firstName.charAt(0).toUpperCase()
  } else if (props.user.nickName && props.user.nickName.length > 0) {
    return props.user.nickName.charAt(0).toUpperCase()
  }

  return '??'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  })
}
</script>

<style scoped>
.user-result-item {
  padding: 12px 16px;
  border-radius: 0;
  transition: background-color 0.2s ease;
  min-height: 72px;
}

.user-result-item:hover {
  background-color: #f4f7fa;
}

.action-section {
  margin-left: 12px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

.action-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.action-btn:hover {
  opacity: 1;
}

:deep(.q-item__section--avatar) {
  min-width: 48px;
}

:deep(.q-item__label) {
  font-weight: 500;
  color: #2c2c2c;
  line-height: 1.4;
}

:deep(.q-item__label--caption) {
  color: #8e8e93;
  font-size: 13px;
  margin-top: 2px;
}
</style>