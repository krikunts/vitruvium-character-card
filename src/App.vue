<template>
    <div class="page-container">
        <!-- Left Column: Form Container -->
        <div class="form-container">
            <div id="export-buttons">
                <button @click="saveDataToJsonHandler" class="nav-btn">
                    <i class="fa fa-download"></i> JSON
                </button>
                <input
                    type="file"
                    id="load-file-input"
                    accept=".json"
                    @change="loadDataFromJsonHandler"
                    style="display: none"
                />
                <button @click="triggerLoadJson" class="nav-btn">
                    <i class="fa fa-upload"></i> JSON
                </button>
                <button @click="downloadCard" class="nav-btn-download">
                    <i class="fa fa-download"></i> PNG
                </button>
                <input
                    type="file"
                    id="upload-png-input"
                    accept="image/png"
                    @change="uploadCardFromPng"
                    style="display: none"
                />
                <button @click="triggerUploadPng" class="nav-btn">
                    <i class="fa fa-upload"></i> PNG
                </button>
            </div>

            <div class="form-group" id="theme-selector">
                <label for="style-theme">Тема:</label>
                <select id="style-theme" v-model="selectedTheme" @change="handleThemeChange">
                    <option value="themes/dark.json">Черная</option>
                    <option value="themes/light.json">Белая</option>
                    <option value="custom">Пользовательская</option>
                </select>
                <div
                    v-if="selectedTheme === 'custom'"
                    class="form-group"
                    id="custom-style-json-container"
                >
                    <label for="json-style-input">JSON стили:</label>
                    <textarea
                        id="json-style-input"
                        v-model="customStylesInput"
                        @input="applyCustomStyles"
                        rows="14"
                    ></textarea>
                </div>
            </div>

            <h2 id="form-title">Создание персонажа</h2>

            <div id="form-wizard">
                <div class="form-page" :class="{ active: currentPageIndex === 0 }">
                    <MainInfoForm />
                </div>
                <div
                    v-for="(category, index) in characterStore.skillCategories"
                    :key="category.id"
                    class="form-page"
                    :class="{ active: currentPageIndex === index + 1 }"
                >
                    <SkillCategoryForm :category="category" />
                </div>
            </div>

            <div id="form-navigation">
                <button
                    @click="navigate(-1)"
                    :disabled="currentPageIndex === 0"
                    class="nav-btn"
                    id="prev-btn"
                >
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <button @click="addCategory" class="add-btn nav-btn" id="add-category-btn">
                    <i class="fa-solid fa-plus"></i> Категория
                </button>
                <button
                    @click="navigate(1)"
                    :disabled="currentPageIndex === totalPages - 1"
                    class="nav-btn"
                    id="next-btn"
                >
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>

            <div class="form-footer">
                <p>
                    Неофициальный инструмент для системы
                    <a href="https://gryadut.ru/vitruvium" target="_blank" rel="noopener noreferrer"
                        >Витрувий</a
                    >.
                </p>
                <p>Все права принадлежат авторам.</p>
            </div>
        </div>

        <!-- Right Column: Character Card Preview -->
        <div class="card-preview-container">
            <CharacterCard v-if="mainInfo.name" ref="characterCardRef" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useCharacterStore } from './stores/character';
import { useThemeStore } from './stores/theme';
import { storeToRefs } from 'pinia';

import MainInfoForm from './components/forms/MainInfoForm.vue';
import SkillCategoryForm from './components/forms/SkillCategoryForm.vue';
import CharacterCard from './components/CharacterCard.vue';

import {
    saveDataToJson,
    loadDataFromJson,
    saveCardAsPng,
    loadCardFromPng,
} from './utils/fileManager';
import { loadExampleData } from './utils/exampleData';

// Define the exposed interface from CharacterCard component
interface CharacterCardExposed {
    root: HTMLElement | null;
}

// Stores
const characterStore = useCharacterStore();
const themeStore = useThemeStore();
const { mainInfo, skillCategories, currentPageIndex } = storeToRefs(characterStore);
const { theme, customStyles } = storeToRefs(themeStore);

// Refs
const characterCardRef = ref<CharacterCardExposed | null>(null);
const customStylesInput = ref(JSON.stringify(customStyles.value, null, 2));

// Computed Properties
const totalPages = computed(() => 1 + skillCategories.value.length);
const selectedTheme = computed({
    get: () => theme.value,
    set: (value: string) => themeStore.setTheme(value),
});

// Functions
const navigate = (direction: number) => {
    const newIndex = characterStore.currentPageIndex + direction;
    if (newIndex >= 0 && newIndex < totalPages.value) {
        characterStore.setCurrentPageIndex(newIndex);
    }
};

const addCategory = () => {
    characterStore.addCategory('Новая категория');
    characterStore.setCurrentPageIndex(totalPages.value - 1); // Navigate to the new category page
};

const handleThemeChange = async () => {
    if (selectedTheme.value === 'custom') {
        applyCustomStyles();
    } else {
        try {
            const response = await fetch(selectedTheme.value);
            const styles = await response.json();
            applyStylesToCharacterCard(styles);
            themeStore.setCustomStyles({}); // Clear custom styles when not using custom theme
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    }
};

const applyCustomStyles = () => {
    try {
        const styles = JSON.parse(customStylesInput.value);
        applyStylesToCharacterCard(styles);
        themeStore.setCustomStyles(styles);
    } catch (error) {
        console.error('Error parsing or applying custom styles JSON:', error);
    }
};

const applyStylesToCharacterCard = (styles: { [key: string]: string }) => {
    if (!characterCardRef.value?.root) return;
    for (const key in styles) {
        if (Object.prototype.hasOwnProperty.call(styles, key)) {
            const value = styles[key];
            const cssVarName = '--' + key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
            (characterCardRef.value.root as HTMLElement).style.setProperty(cssVarName, value);
        }
    }
};

const saveDataToJsonHandler = () => {
    saveDataToJson();
    // TODO: Add notification
};

const triggerLoadJson = () => {
    document.getElementById('load-file-input')?.click();
};

const loadDataFromJsonHandler = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        try {
            await loadDataFromJson(file);
            await handleThemeChange();
            // TODO: Add success notification
        } catch (error) {
            console.error('Error loading JSON file:', error);
            // TODO: Add error notification
        }
    }
};

const downloadCard = () => {
    if (characterCardRef.value?.root) {
        saveCardAsPng(characterCardRef.value.root as HTMLElement);
        // TODO: Add notification
    }
};

const triggerUploadPng = () => {
    document.getElementById('upload-png-input')?.click();
};

const uploadCardFromPng = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        try {
            await loadCardFromPng(file);
            await handleThemeChange();
            // TODO: Add success notification
        } catch (error) {
            console.error('Error uploading PNG:', error);
            // TODO: Add error notification
        }
    }
};

// Lifecycle Hooks
onMounted(async () => {
    await nextTick(async () => {
        await handleThemeChange();
        loadExampleData();
    });
});

// Watchers
watch(theme, (newTheme) => {
    if (newTheme !== 'custom') {
        customStylesInput.value = '{}'; // Clear custom styles input when theme changes from custom
    }
});

watch(
    customStyles,
    (newStyles) => {
        customStylesInput.value = JSON.stringify(newStyles, null, 2);
    },
    { deep: true },
);
</script>

<style scoped>
.form-page {
    display: none;
    padding: 5px;
    position: relative;
}

.form-page.active {
    display: block;
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
