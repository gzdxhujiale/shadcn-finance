<script setup>
import { Construction } from 'lucide-vue-next'
</script>

<template>
  <div class="h-full flex items-center justify-center bg-muted/30">
    <div class="text-center p-12 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm max-w-md">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <Construction class="h-10 w-10 text-amber-600" />
      </div>
      <h2 class="text-2xl font-bold mb-3">功能维护中</h2>
      <p class="text-muted-foreground leading-relaxed">
        该功能正在开发完善中，敬请期待
      </p>
    </div>
  </div>
</template>
