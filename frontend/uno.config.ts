import { defineConfig, presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

// UnoCSS 负责基础原子化样式能力，便于后续页面快速扩展。
export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  transformers: [transformerDirectives()],
})
