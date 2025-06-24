import { handleThemeChange, applyCustomStylesFromJson, applyStylesFromJson, getTheme, getCustomStyles, setTheme, setCustomStyles } from './themeManager.js';
import { addCategoryAndNavigate, rebuildCategoryPages, navigate, showPage, createSkillFormBlock } from './formWizard.js';
import { dataManager } from './dataManager.js';
import { updateStaticInfo, renderSkillsOnCard } from './uiRenderer.js';
import { saveDataToJson, loadDataFromJson, saveCardAsPng, loadCardFromPng } from './fileManager.js';

// Constants
const exampleDataPath = '/data/sarah-connor.json';
const pngJsonChunkKey = 'VitruviumData';

document.addEventListener('DOMContentLoaded', () => {
    // --- ШАБЛОНЫ ---
    const templates = {
        mainCard: document.getElementById('main-card-template'),
        mainInfoPage: document.getElementById('main-info-page-template'),
        categoryPage: document.getElementById('skill-category-page-template'),
        skillForm: document.getElementById('skill-form-template'),
        categoryCard: document.getElementById('skill-category-card-template'),
        skillCard: document.getElementById('skill-card-template')
    };

    // --- ЭЛЕМЕНТЫ DOM ---
    const cardWrapper = document.getElementById('character-card-wrapper');
    const cardNode = templates.mainCard.content.cloneNode(true);
    const formWizard = document.getElementById('form-wizard');
    const form = document.querySelector('.form-container');
    const downloadBtn = document.getElementById('download-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const loadFileInput = document.getElementById('load-file-input');
    const uploadPngBtn = document.getElementById('upload-png-btn');
    const uploadPngInput = document.getElementById('upload-png-input');    
    const themeSelect = document.getElementById('style-theme'); // Get the theme dropdown
    const jsonStyleContainer = document.getElementById('custom-style-json-container');
    const themeControlsContainer = document.getElementById('theme-controls-container'); // Get the theme controls container
    const jsonInputArea = document.getElementById('json-style-input'); // Get the JSON textarea
    const formTitle = document.getElementById('form-title');

    // --- ИНИЦИАЛИЗАЦИЯ ---
    function init() {
        cardWrapper.appendChild(cardNode);
        // Fix: characterCard must be selected after cardNode is appended
        const characterCard = cardWrapper.querySelector('.character-card');
        const mainInfoPage = templates.mainInfoPage.content.cloneNode(true);
        formWizard.appendChild(mainInfoPage);
        
        addCategoryBtn.addEventListener('click', () => addCategoryAndNavigate(
            (name, skills) => dataManager.addCategory(name, skills),
            () => rebuildCategoryPages(dataManager.getCategories(), templates, formWizard),
            (i) => showPage(i, formWizard, formTitle, prevBtn, nextBtn, themeControlsContainer, jsonStyleContainer, themeSelect),
            updateUI,
            formWizard
        ));
        // Use event delegation for input and click events
        form.addEventListener('input', handleFormInput);
        form.addEventListener('click', handleFormClick);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadCard);
        if (saveBtn) saveBtn.addEventListener('click', saveDataToJsonHandler);
        if (loadBtn) loadBtn.addEventListener('click', () => loadFileInput.click());
        if (loadFileInput) loadFileInput.addEventListener('change', loadDataFromJsonHandler);
        if (uploadPngBtn) uploadPngBtn.addEventListener('click', () => uploadPngInput.click());
        if (uploadPngInput) uploadPngInput.addEventListener('change', uploadCardFromPng);
        if (prevBtn) prevBtn.addEventListener('click', () => {
            dataManager.setCurrentPageIndex(navigate(
                dataManager.getCurrentPageIndex(),
                -1,
                (i) => showPage(i, formWizard, formTitle, prevBtn, nextBtn, themeControlsContainer, jsonStyleContainer, themeSelect)
            ));
        });
        if (nextBtn) nextBtn.addEventListener('click', () => {
            dataManager.setCurrentPageIndex(navigate(
                dataManager.getCurrentPageIndex(),
                1,
                (i) => showPage(i, formWizard, formTitle, prevBtn, nextBtn, themeControlsContainer, jsonStyleContainer, themeSelect)
            ));
        });
        if (themeSelect) themeSelect.addEventListener('change', (event) => handleThemeChange(event, characterCard, jsonStyleContainer, themeSelect, jsonInputArea, applyStylesFromJson));
        if (jsonInputArea) jsonInputArea.addEventListener('input', () => applyCustomStylesFromJson(jsonInputArea, characterCard, applyStylesFromJson));
        if (jsonStyleContainer) jsonStyleContainer.style.display = 'none';
        loadExampleData();
        rebuildCategoryPages(dataManager.getCategories(), templates, formWizard);
        showPage(0, formWizard, formTitle, prevBtn, nextBtn, themeControlsContainer, jsonStyleContainer, themeSelect);
        updateUI();
    }

    async function loadExampleData() {
        try {
            const response = await fetch(exampleDataPath);
            if (!response.ok) throw new Error(`Failed to load ${exampleDataPath}`);
            const data = await response.json();
            applyLoadedData(data);
        } catch (error) {
            console.error('Error loading example data:', error);
        }
    }

    // --- ОБНОВЛЕНИЕ ПРЕВЬЮ ---
    function updateUI() {
        updateStaticInfo(cardWrapper, dataManager.mainInfo || {});
        renderSkillsOnCard(cardWrapper, dataManager.getCategories(), templates);
    }

    function collectCharacterData() {
        // Use dataManager as the source of truth
        const mainInfo = dataManager.getMainInfo();
        const styles = {
            theme: getTheme(),
            customStyles: getCustomStyles()
        };
        const simplifiedCategoriesData = dataManager.getCategories().map(cat => ({
            name: cat.name,
            skills: cat.skills.map(skill => ({
                name: skill.name,
                description: skill.description,
                level: skill.level
            }))
        }));
        return {
            mainInfo,
            styles,
            skillCategories: simplifiedCategoriesData
        };
    }

    function saveDataToJsonHandler() {
        const characterData = collectCharacterData();
        const charName = (dataManager.getMainInfo().name || 'character').toLowerCase().replace(/ /g, '-');
        saveDataToJson(characterData, `${charName}-data.json`);
    }

    function loadDataFromJsonHandler(event) {
        const file = event.target.files[0];
        loadDataFromJson(file, applyLoadedData, (error) => {
            console.error('Error parsing JSON:', error);
            alert('Ошибка при загрузке файла. Убедитесь, что это корректный JSON файл.');
        });
        // Clear the file input value so the change event fires even if the same file is selected again
        loadFileInput.value = '';
    }

    function downloadCard() {
        const characterData = collectCharacterData();
        const charName = (dataManager.getMainInfo().name || 'character').toLowerCase().replace(/ /g, '-');
        // Fix: get characterCard from DOM at call time
        const characterCard = cardWrapper.querySelector('.character-card');
        saveCardAsPng(characterCard, characterData, `${charName}-card.png`, pngJsonChunkKey);
    }

    function uploadCardFromPng(event) {
        const file = event.target.files[0];
        loadCardFromPng(file, pngJsonChunkKey, applyLoadedData, (error) => {
            if (error.message && error.message.includes('No character data')) {
                alert('В этом PNG файле не найдено данных персонажа.');
            } else {
                alert('Ошибка при обработке PNG файла. Убедитесь, что это корректный PNG файл.');
            }
            console.error('Error processing PNG:', error);
        });
        uploadPngInput.value = '';
    }

    // --- LOAD DATA INTO APP ---
    function applyLoadedData(data) {
        // Update dataManager and UI from loaded data
        dataManager.updateFromLoadedData(data);
        // Apply theme/styles if present
        if (data.styles) {
            if (data.styles.theme === 'custom') {
                setTheme(data.styles.theme);
                setCustomStyles(data.styles.customStyles);
                if (themeSelect) themeSelect.value = data.styles.theme;
                if (jsonInputArea) jsonInputArea.value = JSON.stringify(data.styles.customStyles, null, 2);
                // characterCard must be selected after cardNode is appended
                const characterCard = cardWrapper.querySelector('.character-card');
                handleThemeChange({ target: { value: data.styles.theme } }, characterCard, jsonStyleContainer, themeSelect, jsonInputArea, applyStylesFromJson);
            } else {
                setTheme(data.styles.theme);
                if (themeSelect) themeSelect.value = data.styles.theme;
                const characterCard = cardWrapper.querySelector('.character-card');
                handleThemeChange({ target: { value: data.styles.theme } }, characterCard, jsonStyleContainer, themeSelect, jsonInputArea, applyStylesFromJson);
            }
        }
        rebuildCategoryPages(dataManager.getCategories(), templates, formWizard);
        showPage(0, formWizard, formTitle, prevBtn, nextBtn, themeControlsContainer, jsonStyleContainer, themeSelect);
        updateUI();
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function handleFormInput(e) {
        const target = e.target;
        const page = target.closest('.form-page');
        if (!page) return;
        
        if (page.dataset.pageType === 'main') {
            // Update main info in dataManager
            if (target.id === 'char-full-name') {
                dataManager.mainInfo = dataManager.mainInfo || {};
                dataManager.mainInfo.name = target.value;
            } else if (target.classList.contains('attribute-select')) {
                dataManager.mainInfo = dataManager.mainInfo || {};
                dataManager.mainInfo.attributes = dataManager.mainInfo.attributes || {};
                const attrName = target.id.split('-')[1];
                dataManager.mainInfo.attributes[attrName] = parseInt(target.value);
            }
            updateUI();
            return;
        }

        const catId = parseInt(page.dataset.categoryId);
        const category = dataManager.getCategories().find(c => c.id === catId);
        if (!category) return;
        
        if (target.classList.contains('category-name-input')) {
            category.name = target.value;
        } else {
            const skillBlock = target.closest('.skill-form-block');
            if (skillBlock) {
                const skillId = parseInt(skillBlock.dataset.skillId);
                const skill = category.skills.find(s => s.id === skillId);
                if (skill) {
                    if (target.classList.contains('skill-name-input')) skill.name = target.value;
                    if (target.classList.contains('skill-desc-input')) skill.description = target.value;
                    if (target.classList.contains('skill-level-input')) {
                        let level = parseInt(target.value);
                        if (isNaN(level)) {
                            level = 0; // Default to 0 if input is not a number
                        }
                        skill.level = Math.max(0, Math.min(5, level)); // Clamp between 0 and 5
                        target.value = skill.level; // Update the input field to reflect the clamped value
                    }
                }
            }
        }
        updateUI();
    }

    function handleFormClick(e) {
        const button = e.target.closest('button');
        if (!button) return;
        
        const page = button.closest('.form-page');
        if (!page || page.dataset.pageType !== 'category') return;

        const catId = parseInt(page.dataset.categoryId);
        
        if (button.classList.contains('remove-category-btn')) {
            dataManager.removeCategory(catId);
            // Clamp current page index to available pages after removal
            const totalPages = formWizard.querySelectorAll('.form-page').length - 1;
            const newPageIndex = Math.max(0, Math.min(dataManager.getCurrentPageIndex(), totalPages - 1));
            dataManager.setCurrentPageIndex(newPageIndex);
            rebuildCategoryPages(dataManager.getCategories(), templates, formWizard);
            showPage(newPageIndex, formWizard, formTitle, prevBtn, nextBtn, themeControlsContainer, jsonStyleContainer, themeSelect);
            updateUI();
        } else if (button.classList.contains('add-skill-btn')) {
            const category = dataManager.getCategories().find(c => c.id === catId);
            if (category) {
                const newSkill = dataManager.addSkill(catId, '', '', 1);
                page.querySelector('.skills-in-category-container').appendChild(createSkillFormBlock(newSkill, templates));
                updateUI();
            }
        } else if (button.classList.contains('remove-skill-btn')) {
            const skillBlock = button.closest('.skill-form-block');
            const skillId = parseInt(skillBlock.dataset.skillId);
            dataManager.removeSkill(catId, skillId);
            skillBlock.remove();
            updateUI();
        }
    }

    // --- ЗАПУСК ---
    init();
});
