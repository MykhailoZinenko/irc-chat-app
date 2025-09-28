<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h5 q-mb-md">My Contacts</div>

            <q-input
              v-model="filterQuery"
              placeholder="Filter contacts..."
              outlined
              clearable
              class="q-mb-md"
              v-if="contactStore.contacts.length > 0"
            >
              <template v-slot:prepend>
                <q-icon name="filter_list" />
              </template>
            </q-input>
          </q-card-section>

          <q-separator />

          <q-card-section v-if="contactStore.isLoading" class="text-center q-py-xl">
            <q-spinner-dots size="50px" color="primary" />
            <div class="q-mt-md text-grey-7">Loading contacts...</div>
          </q-card-section>

          <q-card-section v-else-if="contactStore.contacts.length === 0" class="text-center q-py-xl">
            <q-icon name="contacts" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No contacts yet</div>
          </q-card-section>

          <q-card-section v-else-if="filteredContacts.length === 0" class="text-center q-py-xl">
            <q-icon name="search_off" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No contacts match your filter</div>
          </q-card-section>

          <q-card-section v-else class="q-pa-none">
            <q-list separator>
              <UserResultItem
                v-for="contact in filteredContacts"
                :key="contact.id"
                :user="contact.user"
                :is-in-contacts="true"
                :is-removing-contact="loadingStates[contact.user.id]?.removing || false"
                @click="handleContactClick"
                @remove-contact="handleRemoveContact"
                @copy-nickname="handleCopyNickname"
                @view-profile="handleViewProfile"
              />
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Confirm Removal Dialog -->
    <q-dialog v-model="showRemoveDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Remove Contact</div>
        </q-card-section>

        <q-card-section>
          <div class="text-body2">
            Are you sure you want to remove <strong>{{ userToRemove?.fullName || userToRemove?.nickName }}</strong> from your contacts?
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="showRemoveDialog = false" />
          <q-btn
            flat
            label="Remove"
            color="negative"
            @click="confirmRemoveContact"
            :loading="removingContact"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore, type PublicUser } from 'src/stores/contact-store'
import { useAuthStore } from 'src/stores/auth-store'
import UserResultItem from 'src/components/UserResultItem.vue'

const router = useRouter()
const authStore = useAuthStore()
const contactStore = useContactStore()

const filterQuery = ref('')
const showRemoveDialog = ref(false)
const userToRemove = ref<PublicUser | null>(null)
const removingContact = ref(false)
const loadingStates = ref<Record<number, { removing?: boolean }>>({})

const filteredContacts = computed(() => {
  if (!filterQuery.value.trim()) {
    return contactStore.contacts
  }

  const query = filterQuery.value.toLowerCase().trim()
  return contactStore.contacts.filter(contact =>
    contact.user.nickName.toLowerCase().includes(query) ||
    contact.user.firstName?.toLowerCase().includes(query) ||
    contact.user.lastName?.toLowerCase().includes(query) ||
    contact.user.fullName.toLowerCase().includes(query)
  )
})

const handleContactClick = async (user: PublicUser) => {
  await router.push(`/profile/${user.id}`)
}

const handleRemoveContact = (user: PublicUser) => {
  userToRemove.value = user
  showRemoveDialog.value = true
}

const confirmRemoveContact = async () => {
  if (!userToRemove.value) return

  removingContact.value = true
  try {
    const success = await contactStore.removeContact(userToRemove.value.id)
    if (success) {
      showRemoveDialog.value = false
      userToRemove.value = null
    }
  } finally {
    removingContact.value = false
  }
}

const handleCopyNickname = (nickname: string) => {
  contactStore.copyNickname(nickname)
}

const handleViewProfile = async (user: PublicUser) => {
  await router.push(`/profile/${user.id}`)
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await router.push('/auth/login')
    return
  }

  await contactStore.fetchContacts()
})
</script>