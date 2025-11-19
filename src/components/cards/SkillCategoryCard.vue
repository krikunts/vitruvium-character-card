<template>
    <div class="skill-category-display-block">
        <h2 class="category-title">{{ category.name || 'Без категории' }}</h2>
        <div class="skills-in-category-display-container">
            <SkillCard v-for="skill in category.skills" :key="skill.id" :skill="skill" />
        </div>
    </div>
</template>

<script setup lang="ts">
import SkillCard from './SkillCard.vue';
import type { SkillCategory } from '../../types/character';

const { category } = defineProps<{ category: SkillCategory }>();
</script>

<style scoped>
/* Component-specific styles will go here */
</style>
