<template>
    <div>
        <button
            @click="removeCategory"
            class="remove-category-btn"
            title="Удалить эту категорию и страницу"
        >
            ×
        </button>
        <div class="form-section">
            <div class="form-group category-name-group">
                <label>Название категории</label>
                <input
                    type="text"
                    class="category-name-input"
                    placeholder="Например, Тактика выживания"
                    v-model="categoryName"
                />
            </div>
        </div>
        <div class="form-section">
            <h3>Навыки</h3>
            <div class="skills-in-category-container">
                <SkillFormBlock
                    v-for="skill in category.skills"
                    :key="skill.id"
                    :skill="skill"
                    :categoryId="category.id"
                />
            </div>
            <button @click="addSkill" class="add-skill-btn">
                <i class="fa-solid fa-plus-circle"></i> Добавить навык
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '../../stores/character';
import SkillFormBlock from './SkillFormBlock.vue';
import { ref, watch } from 'vue';
import type { SkillCategory } from '../../types/character';

const props = defineProps<{ category: SkillCategory }>();

const characterStore = useCharacterStore();

const categoryName = ref(props.category.name);

watch(categoryName, (newName) => {
    characterStore.updateCategoryName(props.category.id, newName);
});

const addSkill = () => {
    characterStore.addSkill(props.category.id, '', '', 1);
};

const removeCategory = () => {
    characterStore.removeCategory(props.category.id);
};
</script>

<style scoped>
/* Component-specific styles will go here */
</style>
