<template>
  <q-page class="flex flex-center">
    <div style="width: 100%; max-width: 800px; padding: 20px;">
      <q-card class="q-pa-md q-mb-lg">
        <q-card-section class="text-center">
          <div class="text-h4 q-mb-md">Quasar Input Components Demo</div>
          <div class="text-subtitle1 text-grey-7">All input styles showcase</div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <!-- Basic Text Inputs -->
            <div class="text-h6 q-mb-md">Text Inputs</div>

            <q-input
              v-model="demo.text"
              label="Basic Text Input"
              outlined
            />

            <q-input
              v-model="demo.textWithIcon"
              label="Text with Prepend Icon"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>

            <q-input
              v-model="demo.textWithBothIcons"
              label="Text with Both Icons"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append>
                <q-icon name="clear" class="cursor-pointer" />
              </template>
            </q-input>

            <!-- Email Input -->
            <q-input
              v-model="demo.email"
              type="email"
              label="Email"
              outlined
              :rules="[val => !!val || 'Email is required', val => /.+@.+\..+/.test(val) || 'Invalid email']"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="mail" />
              </template>
            </q-input>

            <!-- Password Input -->
            <q-input
              v-model="demo.password"
              :type="showPassword ? 'text' : 'password'"
              label="Password"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <!-- Number Input -->
            <q-input
              v-model.number="demo.number"
              type="number"
              label="Number Input"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="123" />
              </template>
            </q-input>

            <!-- URL Input -->
            <q-input
              v-model="demo.url"
              type="url"
              label="URL Input"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="link" />
              </template>
            </q-input>

            <!-- Dense Inputs -->
            <div class="text-h6 q-mb-md q-mt-lg">Dense Inputs</div>

            <q-input
              v-model="demo.dense"
              label="Dense Input"
              outlined
              dense
            />

            <q-input
              v-model="demo.denseWithIcon"
              label="Dense with Icon"
              outlined
              dense
            >
              <template v-slot:prepend>
                <q-icon name="star" />
              </template>
            </q-input>

            <!-- Textarea -->
            <div class="text-h6 q-mb-md q-mt-lg">Textarea</div>

            <q-input
              v-model="demo.textarea"
              label="Textarea"
              outlined
              type="textarea"
              rows="3"
            />

            <!-- Select -->
            <div class="text-h6 q-mb-md q-mt-lg">Select</div>

            <q-select
              v-model="demo.select"
              :options="selectOptions"
              label="Select Option"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="list" />
              </template>
            </q-select>

            <!-- File Input -->
            <div class="text-h6 q-mb-md q-mt-lg">File Input</div>

            <q-file
              v-model="demo.file"
              label="Pick a file"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <!-- Error States -->
            <div class="text-h6 q-mb-md q-mt-lg">Error States</div>

            <q-input
              v-model="demo.errorInput"
              label="Input with Error"
              outlined
              :rules="[() => 'This field has an error']"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="error" />
              </template>
            </q-input>

            <!-- Disabled States -->
            <div class="text-h6 q-mb-md q-mt-lg">Disabled States</div>

            <q-input
              v-model="demo.disabled"
              label="Disabled Input"
              outlined
              disable
            >
              <template v-slot:prepend>
                <q-icon name="block" />
              </template>
            </q-input>

            <!-- Readonly States -->
            <q-input
              v-model="demo.readonly"
              label="Readonly Input"
              outlined
              readonly
            >
              <template v-slot:prepend>
                <q-icon name="visibility" />
              </template>
            </q-input>

            <!-- Rounded and Square variants -->
            <div class="text-h6 q-mb-md q-mt-lg">Variants</div>

            <q-input
              v-model="demo.rounded"
              label="Rounded Input"
              outlined
              rounded
            />

            <q-input
              v-model="demo.square"
              label="Square Input"
              outlined
              square
            />

            <!-- Radio Buttons -->
            <div class="text-h6 q-mb-md q-mt-lg">Radio Buttons</div>
            <q-radio v-model="demo.radio" val="option1" label="Option 1" />
            <q-radio v-model="demo.radio" val="option2" label="Option 2" />
            <q-radio v-model="demo.radio" val="option3" label="Option 3" />

            <!-- Checkboxes -->
            <div class="text-h6 q-mb-md q-mt-lg">Checkboxes</div>
            <q-checkbox v-model="demo.checkbox1" label="Checkbox 1" />
            <q-checkbox v-model="demo.checkbox2" label="Checkbox 2" />
            <q-checkbox v-model="demo.checkbox3" label="Checkbox 3 (disabled)" disable />

            <!-- Toggle -->
            <div class="text-h6 q-mb-md q-mt-lg">Toggle</div>
            <q-toggle v-model="demo.toggle1" label="Toggle Option" />
            <q-toggle v-model="demo.toggle2" label="Toggle with Icon" icon="wifi" />

            <!-- Button Toggle -->
            <div class="text-h6 q-mb-md q-mt-lg">Button Toggle</div>
            <q-btn-toggle
              v-model="demo.btnToggle"
              :options="[
                {label: 'One', value: 'one'},
                {label: 'Two', value: 'two'},
                {label: 'Three', value: 'three'}
              ]"
            />

            <!-- Option Group -->
            <div class="text-h6 q-mb-md q-mt-lg">Option Group</div>
            <q-option-group
              v-model="demo.optionGroup"
              :options="[
                {label: 'Option A', value: 'a'},
                {label: 'Option B', value: 'b'},
                {label: 'Option C', value: 'c'}
              ]"
              color="primary"
              type="radio"
            />

            <!-- Slider -->
            <div class="text-h6 q-mb-md q-mt-lg">Slider</div>
            <q-slider
              v-model="demo.slider"
              :min="0"
              :max="50"
              label
              color="primary"
            />

            <!-- Range -->
            <div class="text-h6 q-mb-md q-mt-lg">Range</div>
            <q-range
              v-model="demo.range"
              :min="0"
              :max="50"
              label
              color="primary"
            />

            <!-- Time Picker -->
            <div class="text-h6 q-mb-md q-mt-lg">Time Picker</div>
            <q-input
              v-model="demo.time"
              label="Time"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="demo.time">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- Date Picker -->
            <div class="text-h6 q-mb-md q-mt-lg">Date Picker</div>
            <q-input
              v-model="demo.date"
              label="Date"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="demo.date">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- Color Picker -->
            <div class="text-h6 q-mb-md q-mt-lg">Color Picker</div>
            <q-input
              v-model="demo.color"
              label="Color"
              outlined
            >
              <template v-slot:append>
                <q-icon name="colorize" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-color v-model="demo.color" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- Rating -->
            <div class="text-h6 q-mb-md q-mt-lg">Rating</div>
            <q-rating
              v-model="demo.rating"
              :max="5"
              size="2em"
              color="primary"
            />

            <!-- Knob -->
            <div class="text-h6 q-mb-md q-mt-lg">Knob</div>
            <q-knob
              v-model="demo.knob"
              :min="0"
              :max="100"
              color="primary"
              track-color="grey-3"
              size="50px"
            />

            <!-- Multiple Select -->
            <div class="text-h6 q-mb-md q-mt-lg">Multiple Select</div>
            <q-select
              v-model="demo.multipleSelect"
              :options="selectOptions"
              label="Multiple Select"
              outlined
              multiple
              use-chips
            />

            <!-- Searchable Select -->
            <q-select
              v-model="demo.searchableSelect"
              :options="selectOptions"
              label="Searchable Select"
              outlined
              use-input
              input-debounce="0"
              @filter="filterFn"
            />

            <!-- Editor -->
            <div class="text-h6 q-mb-md q-mt-lg">Editor</div>
            <q-editor
              v-model="demo.editor"
              :dense="false"
              :toolbar="[
                ['bold', 'italic', 'underline'],
                ['quote', 'unordered', 'ordered'],
                ['undo', 'redo']
              ]"
              placeholder="Write something..."
            />

            <!-- Uploader -->
            <div class="text-h6 q-mb-md q-mt-lg">Uploader</div>
            <q-uploader
              label="Upload files"
              multiple
              outlined
              style="max-width: 300px"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Original Login Form -->
      <q-card style="width: 400px; margin: 0 auto;" class="q-pa-md">
        <q-card-section class="text-center">
          <div class="text-h4 q-mb-md">IRC Chat Login</div>
          <div class="text-subtitle1 text-grey-7">Sign in to continue</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleSubmit" class="q-gutter-md">
            <q-input
              v-model="form.email"
              type="email"
              label="Email"
              outlined
              :rules="[val => !!val || 'Email is required', val => /.+@.+\..+/.test(val) || 'Invalid email']"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="mail" />
              </template>
            </q-input>

            <q-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              label="Password"
              outlined
              :rules="[val => !!val || 'Password is required']"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <div v-if="error" class="text-negative text-center q-mb-md">
              {{ error }}
            </div>

            <div class="q-gutter-sm">
              <q-btn
                type="submit"
                label="Login"
                color="primary"
                class="full-width"
                :loading="authStore.isLoading"
                size="md"
              />

              <q-btn
                label="Don't have an account? Register"
                flat
                color="primary"
                class="full-width"
                @click="$router.push('/auth/register')"
                :disable="authStore.isLoading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const demo = ref({
  text: '',
  textWithIcon: '',
  textWithBothIcons: '',
  email: '',
  password: '',
  number: null,
  url: '',
  dense: '',
  denseWithIcon: '',
  textarea: '',
  select: null,
  file: null,
  errorInput: 'This input has an error',
  disabled: 'Disabled input value',
  readonly: 'Read-only input value',
  rounded: '',
  square: '',
  radio: 'option1',
  checkbox1: false,
  checkbox2: true,
  checkbox3: false,
  toggle1: false,
  toggle2: true,
  btnToggle: 'one',
  optionGroup: 'a',
  slider: 25,
  range: { min: 10, max: 40 },
  time: '10:30',
  date: '2024/01/15',
  color: '#3b82f6',
  rating: 3,
  knob: 50,
  multipleSelect: [],
  searchableSelect: null,
  editor: '<p>Sample rich text content</p>',
})

const selectOptions = ref(['Option 1', 'Option 2', 'Option 3', 'Option 4'])
const filteredOptions = ref([...selectOptions.value])

const filterFn = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    if (val === '') {
      filteredOptions.value = selectOptions.value
    } else {
      const needle = val.toLowerCase()
      filteredOptions.value = selectOptions.value.filter(
        v => v.toLowerCase().indexOf(needle) > -1
      )
    }
  })
}

const showPassword = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''

  const result = await authStore.login(form.value.email, form.value.password)

  if (result.success) {
    router.push('/')
  } else {
    error.value = result.message || 'Login failed'
  }
}
</script>