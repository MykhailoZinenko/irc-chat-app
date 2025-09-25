<!-- src/pages/IndexPage.vue - Replace the content -->
<template>
  <q-page class="row items-center justify-evenly">
    <div class="column items-center q-gutter-md">
      <h3>IRC Chat App</h3>

      <ExampleComponent />

      <!-- Loading state -->
      <div v-if="loading">
        <q-spinner color="primary" size="3em" />
        <p>Connecting to backend...</p>
      </div>

      <!-- Success state -->
      <div v-else-if="data" class="q-pa-md">
        <q-card class="q-pa-md">
          <h5>{{ data.message }}</h5>
          <p>{{ data.timestamp }}</p>

          <div class="q-mt-md">
            <h6>User: {{ data.user.nickname }} ({{ data.user.status }})</h6>
          </div>

          <div class="q-mt-md">
            <h6>Available Channels:</h6>
            <q-list>
              <q-item v-for="channel in data.channels" :key="channel.id">
                <q-item-section>
                  <q-item-label>#{{ channel.name }}</q-item-label>
                  <q-item-label caption>{{ channel.memberCount }} members</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card>

        <q-btn @click="fetchData" color="primary" class="q-mt-md" :loading="loading">
          Refresh Data
        </q-btn>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center">
        <q-icon name="error" color="negative" size="3em" />
        <h6 class="text-negative">Connection Error</h6>
        <p>{{ error }}</p>
        <q-btn @click="fetchData" color="primary">Retry</q-btn>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import ExampleComponent from 'src/components/ExampleComponent.vue';

// Reactive data
const loading = ref(false);
const data = ref<DataType | null>(null);
const error = ref('');

// Backend URL
const API_URL = 'http://localhost:3333';

type DataType = {
  message: string;
  channels: { id: string; name: string; memberCount: number }[];
  timestamp: string;
  user: {
    nickname: string;
    status: string;
  };
};

// Fetch data from backend
const fetchData = async () => {
  loading.value = true;
  error.value = '';
  data.value = null;

  try {
    const response = await axios.get(`${API_URL}/api/test`);
    data.value = response.data;
    console.log('Backend response:', response.data as DataType);
  } catch (err: any) {
    console.error('Backend error:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to connect to backend';
  } finally {
    loading.value = false;
  }
};

// Load data when component mounts
onMounted(() => {
  fetchData().catch((err) => console.error(err));
});
</script>
