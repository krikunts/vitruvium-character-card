<template>
  <div ref="root" class="character-card">
    <div class="left-column">
      <div class="attributes-container">
        <div class="attribute-block">
          <div class="attribute-top"><i class="fa-solid fa-person attribute-icon"></i><span class="attribute-value">{{ mainInfo.attributes.constitution }}</span></div>
          <div class="attribute-label">Телосложение</div>
        </div>
        <div class="attribute-block">
          <div class="attribute-top"><i class="fa-solid fa-eye attribute-icon"></i><span class="attribute-value">{{ mainInfo.attributes.attention }}</span></div>
          <div class="attribute-label">Внимание</div>
        </div>
        <div class="attribute-block">
          <div class="attribute-top"><i class="fa-solid fa-person-running attribute-icon"></i><span class="attribute-value">{{ mainInfo.attributes.movement }}</span></div>
          <div class="attribute-label">Движение</div>
        </div>
        <div class="attribute-block">
          <div class="attribute-top"><i class="fa-solid fa-brain attribute-icon"></i><span class="attribute-value">{{ mainInfo.attributes.mind }}</span></div>
          <div class="attribute-label">Мышление</div>
        </div>
        <div class="attribute-block">
          <div class="attribute-top"><i class="fa-solid fa-masks-theater attribute-icon"></i><span class="attribute-value">{{ mainInfo.attributes.social }}</span></div>
          <div class="attribute-label">Общение</div>
        </div>
        <div class="attribute-block">
          <div class="attribute-top">
            <div class="custom-icon-wrapper"><i class="fa-solid fa-circle"></i><i class="fa-solid fa-user fa-inverse"></i></div>
            <span class="attribute-value">{{ mainInfo.attributes.will }}</span>
          </div>
          <div class="attribute-label">Воля</div>
        </div>
      </div>
    </div>
    <div class="right-column">
      <div class="header">
        <div class="name-block"><span class="name">{{ mainInfo.name.toUpperCase() }}</span></div>
        <div class="stats-line">
          <div class="stat-item"><i class="fa-solid fa-heart stat-icon"></i><span class="stat-value">× {{ health }}</span></div>
          <div class="stat-item"><i class="fa-solid fa-star stat-icon"></i><span class="stat-value">× {{ inspiration }}</span></div>
          <div class="stat-item"><i class="fa-solid fa-shoe-prints stat-icon"></i><span class="stat-value">× {{ range }}</span></div>
          <div class="stat-item"><i class="fa-solid fa-dumbbell stat-icon"></i><span class="stat-value">× {{ capacity }}</span></div>
        </div>
      </div>
      <div class="content">
        <div class="skills-list-wrapper">
          <SkillCategoryCard
            v-for="category in skillCategories"
            :key="category.id"
            :category="category"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCharacterStore } from '../stores/character';
import { storeToRefs } from 'pinia';
import SkillCategoryCard from './cards/SkillCategoryCard.vue';

const characterStore = useCharacterStore();
const { mainInfo, skillCategories } = storeToRefs(characterStore);

const root = ref<HTMLElement | null>(null);

const health = computed(() => (mainInfo.value.attributes.constitution || 0) * 6);
const inspiration = computed(() => (mainInfo.value.attributes.will || 0) * 2);
const range = computed(() => (mainInfo.value.attributes.movement || 0) * 2);
const capacity = computed(() => (mainInfo.value.attributes.constitution || 0) * 20);

defineExpose({
  root
});
</script>

<style scoped>
/* Component-specific styles will go here */
</style>
