<script setup lang="ts">
const props = defineProps({
  imageSrc: {
    type: String,
    required: true,
    default: null,
  },
  thumbnail: {
    type: String,
    required: true,
    default: null,
  },
})

const showPreview = ref(false)
</script>

<template>
  <div class="relative w-full">
    <img
      :src="thumbnail"
      alt="Thumbnail"
      class="cursor-pointer transition duration-300 ease-in-out rounded"
      @click="showPreview = true"
    />
  </div>

  <div
    v-if="showPreview"
    class="absolute inset-0 flex items-center justify-center p-16 bg-opacity-50 bg-black z-50"
    @click="showPreview = false"
  >
    <img
      :src="imageSrc"
      alt="Preview"
      class="max-h-full max-w-full rounded"
    />
  </div>
</template>

<style scoped>

</style>