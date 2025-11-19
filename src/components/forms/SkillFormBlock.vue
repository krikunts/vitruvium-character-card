<template>
    <div class="skill-form-block">
        <button @click="removeSkill" class="remove-skill-btn" title="Удалить навык">×</button>
        <div class="form-grid">
            <div class="form-group">
                <label>Название навыка</label><input type="text" v-model="skillName" />
            </div>
            <div class="form-group">
                <label>Уровень (0-5)</label
                ><input type="number" v-model.number="skillLevel" min="0" max="5" value="1" />
            </div>
        </div>
        <div class="form-group">
            <label>Описание</label
            ><textarea v-model="skillDesc" class="skill-desc-input" rows="2"></textarea>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '../../stores/character';
import { ref, watch } from 'vue';
import type { Skill } from '../../types/character';

const props = defineProps<{ skill: Skill; categoryId: number }>();

const characterStore = useCharacterStore();

const skillName = ref(props.skill.name);
const skillDesc = ref(props.skill.description);
const skillLevel = ref(props.skill.level);

watch(skillName, (newVal) => {
    characterStore.updateSkill(props.categoryId, props.skill.id, newVal);
});

watch(skillDesc, (newVal) => {
    characterStore.updateSkill(props.categoryId, props.skill.id, undefined, newVal);
});

watch(skillLevel, (newVal) => {
    characterStore.updateSkill(props.categoryId, props.skill.id, undefined, undefined, newVal);
});

const removeSkill = () => {
    characterStore.removeSkill(props.categoryId, props.skill.id);
};
</script>

<style scoped>
/* Component-specific styles will go here */
</style>
