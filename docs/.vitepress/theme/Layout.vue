<script setup>
import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import { nextTick, watch, ref, onMounted, onUnmounted } from 'vue'
import './medium-zoom.css'

const { Layout } = DefaultTheme
const route = useRoute()
const zoomSrc = ref('')
const zoomVisible = ref(false)

const openZoom = (e) => {
  const img = e.target
  if (img.tagName !== 'IMG') return
  zoomSrc.value = img.src
  zoomVisible.value = true
  document.body.style.overflow = 'hidden'
}

const closeZoom = (e) => {
  if (e) e.stopPropagation()
  zoomVisible.value = false
  document.body.style.overflow = ''
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && zoomVisible.value) {
    closeZoom()
  }
}

const addListeners = () => {
  document.addEventListener('keydown', handleKeydown)
}

const removeListeners = () => {
  document.removeEventListener('keydown', handleKeydown)
}

const setupImages = () => {
  document.querySelectorAll('.VPDoc .content img').forEach(img => {
    img.style.cursor = 'zoom-in'
    img.addEventListener('click', openZoom)
  })
}

const teardownImages = () => {
  document.querySelectorAll('.VPDoc .content img').forEach(img => {
    img.style.cursor = ''
    img.removeEventListener('click', openZoom)
  })
}

watch(
  () => route.path,
  () => nextTick(() => {
    teardownImages()
    setupImages()
  }),
  { immediate: true }
)

onMounted(() => {
  addListeners()
})

onUnmounted(() => {
  removeListeners()
})
</script>

<template>
  <Layout>
    <template #doc-after>
      <teleport to="body">
        <div
          v-if="zoomVisible"
          class="image-zoom-overlay"
          @click.self="closeZoom"
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
        >
          <img :src="zoomSrc" alt="预览图片" />
        </div>
      </teleport>
    </template>
  </Layout>
</template>
