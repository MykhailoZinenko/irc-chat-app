<template>
  <div v-if="user" class="profile-container">
    <!-- Top Navigation Bar -->
    <div class="profile-topbar">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="primary"
        @click="handleBack"
      />
      <div class="topbar-title">Info</div>
      <q-btn
        v-if="isOwnProfile"
        flat
        round
        dense
        icon="edit"
        color="primary"
        @click="handleEdit"
      />
    </div>

    <!-- Profile Content -->
    <div class="profile-content">
      <!-- Main Profile Section -->
      <div class="profile-main">
        <q-avatar size="120px" color="primary" text-color="white" class="profile-avatar">
          <span class="text-h4">{{ getInitials(user) }}</span>
        </q-avatar>

        <div class="profile-name">{{ user.fullName || user.nickName }}</div>
        <div class="profile-status">last seen recently</div>

        <!-- Action Buttons -->
        <div class="profile-actions">
          <q-btn
            v-if="!isOwnProfile"
            unelevated
            color="primary"
            icon="message"
            label="Message"
            class="action-button"
            @click="handleMessage"
          />

          <q-btn
            v-if="!isOwnProfile"
            unelevated
            color="grey-5"
            icon="more_horiz"
            label="More"
            class="action-button"
          >
            <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
              <q-list style="min-width: 200px">
                <q-item
                  v-if="!contactStore.isUserInContacts(user.id)"
                  clickable
                  v-close-popup
                  @click="handleAddContact"
                  :disable="loadingStates.adding"
                >
                  <q-item-section avatar>
                    <q-icon name="person_add" color="primary" />
                  </q-item-section>
                  <q-item-section>Add to Contacts</q-item-section>
                  <q-item-section side v-if="loadingStates.adding">
                    <q-spinner size="16px" />
                  </q-item-section>
                </q-item>

                <q-item
                  v-else
                  clickable
                  v-close-popup
                  @click="handleRemoveContact"
                  :disable="loadingStates.removing"
                >
                  <q-item-section avatar>
                    <q-icon name="person_remove" color="negative" />
                  </q-item-section>
                  <q-item-section>Remove from Contacts</q-item-section>
                  <q-item-section side v-if="loadingStates.removing">
                    <q-spinner size="16px" />
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="handleBlockUser">
                  <q-item-section avatar>
                    <q-icon name="block" color="orange" />
                  </q-item-section>
                  <q-item-section>Block User</q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="handleReportUser">
                  <q-item-section avatar>
                    <q-icon name="report" color="red" />
                  </q-item-section>
                  <q-item-section>Report User</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <q-btn
            v-if="isOwnProfile"
            unelevated
            color="negative"
            icon="logout"
            label="Logout"
            class="action-button"
            @click="confirmLogout = true"
          />
        </div>
      </div>

      <!-- Info Cards -->
      <div class="info-cards">
        <!-- Username Card -->
        <q-card flat class="info-card">
          <q-card-section class="info-card-section" @click="handleCopyNickname(user.nickName)">
            <div class="info-content">
              <div class="info-left">
                <div class="info-label">username</div>
                <div class="info-value">@{{ user.nickName }}</div>
              </div>
              <q-btn
                flat
                round
                dense
                icon="content_copy"
                color="grey-6"
                class="copy-button"
                @click.stop="handleCopyNickname(user.nickName)"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Name Card (if exists) -->
        <q-card flat class="info-card" v-if="user.firstName || user.lastName">
          <q-card-section class="info-card-section">
            <div class="info-content">
              <div class="info-left">
                <div class="info-label">name</div>
                <div class="info-value">{{ user.firstName }} {{ user.lastName }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

      </div>
    </div>

    <!-- Logout Confirmation Dialog -->
    <q-dialog v-model="confirmLogout" persistent v-if="isOwnProfile">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Logout Confirmation</div>
        </q-card-section>

        <q-card-section>
          <div class="text-body2">
            Are you sure you want to logout? This will end your current session.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="confirmLogout = false" />
          <q-btn
            flat
            label="Logout"
            color="negative"
            @click="handleLogout"
            :loading="authStore.isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'
import { useContactStore, type PublicUser } from 'src/stores/contact-store'
import { getInitials } from 'src/utils/user'

interface Props {
  user: PublicUser | null
  isOwnProfile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOwnProfile: false
})

const router = useRouter()
const authStore = useAuthStore()
const contactStore = useContactStore()

const confirmLogout = ref(false)
const loadingStates = ref({ adding: false, removing: false })



const handleCopyNickname = (nickname: string) => {
  contactStore.copyNickname(nickname)
}

const handleAddContact = async () => {
  if (!props.user) return

  const userId = props.user.id
  loadingStates.value.adding = true
  try {
    await contactStore.addContact(userId)
  } finally {
    loadingStates.value.adding = false
  }
}

const handleRemoveContact = async () => {
  if (!props.user) return

  const userId = props.user.id
  loadingStates.value.removing = true
  try {
    await contactStore.removeContact(userId)
  } finally {
    loadingStates.value.removing = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  confirmLogout.value = false
  await router.push('/auth/login')
}

const handleBack = async () => {
  await router.push('/')
}

const handleEdit = () => {
  console.log('Edit profile')
}

const handleMessage = () => {
  console.log('Send message to', props.user?.nickName)
}

const handleBlockUser = () => {
  console.log('Block user:', props.user?.nickName)
}

const handleReportUser = () => {
  console.log('Report user:', props.user?.nickName)
}
</script>

<style scoped>
.profile-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #efeff4;
}

@media (max-width: 767px) {
  .profile-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
}

.profile-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e4e6ea;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
  position: relative;
}

.topbar-title {
  font-size: 18px;
  font-weight: 500;
  color: #2c2c2c;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.profile-content {
  flex: 1;
  overflow-y: auto;
}

.profile-main {
  background: #efeff4;
  padding: 32px 20px 24px;
  text-align: center;
}

.profile-avatar {
  margin: 0 auto 16px;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.profile-name {
  font-size: 22px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 6px;
  line-height: 1.2;
}

.profile-status {
  color: #86868b;
  font-size: 14px;
  margin-bottom: 24px;
  font-weight: 400;
}

.profile-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
}

.action-button {
  min-width: 110px;
  height: 40px;
  border-radius: 20px;
  font-weight: 500;
  text-transform: none;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button .q-btn__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.info-cards {
  margin: 20px auto 0;
  max-width: 600px;
  padding: 0 16px;
}

.info-card {
  background: white;
  margin-bottom: 8px;
  border-radius: 12px;
  overflow: hidden;
}

.info-card:last-child {
  margin-bottom: 0;
}

.info-card-section {
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.info-card-section:hover {
  background-color: #f1f3f4;
}

.info-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.info-left {
  flex: 1;
  min-width: 0;
}

.info-label {
  color: #007aff;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 3px;
  text-transform: lowercase;
  letter-spacing: 0.2px;
}

.info-value {
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 400;
  word-break: break-word;
  line-height: 1.3;
}

.copy-button {
  opacity: 0.6;
  transition: all 0.2s ease;
  margin-left: 8px;
  transform: scale(0.9);
}

.copy-button:hover {
  opacity: 1;
  transform: scale(1);
}


/* Responsive adjustments */
@media (max-width: 768px) {
  .profile-main {
    padding: 28px 16px 20px;
  }

  .action-button {
    min-width: 100px;
    font-size: 13px;
    height: 38px;
  }

  .info-cards {
    margin: 8px 16px 0;
    max-width: none;
  }

  .info-card-section {
    padding: 12px 16px;
  }

  .copy-button {
    margin-left: 4px;
  }

  .profile-name {
    font-size: 20px;
  }

  .profile-avatar {
    margin-bottom: 14px;
  }

  .dropdown-menu {
    min-width: 180px;
  }
}

@media (max-width: 480px) {
  .profile-actions {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .action-button {
    width: 180px;
    max-width: 100%;
  }

  .info-value {
    font-size: 14px;
  }

  .info-label {
    font-size: 12px;
  }

  .profile-main {
    padding: 24px 16px 18px;
  }
}
</style>