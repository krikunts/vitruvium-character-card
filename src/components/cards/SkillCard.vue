<template>
  <div class="skill-display-block">
    <div class="skill-item">
      <span class="skill-name">{{ skill.name }}</span>
      <div class="skill-dots">
        <template v-for="i in 5" :key="i">
          <div class="dot" :class="{ filled: i <= skill.level, empty: i > skill.level }"></div>
        </template>
      </div>
    </div>
    <div class="skill-description" v-html="formattedDescription"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { Skill } from '../../types/character';

const props = defineProps<{ skill: Skill }>();

const formattedDescription = computed(() => {
  return props.skill.description.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
});
</script>

<style scoped>
/* Component-specific styles will go here */
</style>
