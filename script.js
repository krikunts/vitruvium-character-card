import {
    handleThemeChange,
    applyCustomStylesFromJson,
    applyStylesFromJson,
    getTheme,
    getCustomStyles,
    setTheme,
    setCustomStyles,
    setNotifier as setThemeManagerNotifier,
} from './themeManager.js';
import { FormWizard, createSkillFormBlock } from './formWizard.js';
import { dataManager } from './dataManager.js';
import { updateUI, populateFormFieldsFromDataManager } from './uiRenderer.js';
import {
    saveDataToJson,
    loadDataFromJson,
    saveCardAsPng,
    loadCardFromPng,
    setNotifier as setFileManagerNotifier,
} from './fileManager.js';
import { SKILL_LEVEL_MIN, SKILL_LEVEL_MAX } from './constants.js';

// --- CONSTANTS ---
const SELECTORS = {
    mainCard: '#main-card-template',
    mainInfoPage: '#main-info-page-template',
    categoryPage: '#skill-category-page-template',
    skillForm: '#skill-form-template',
    categoryCard: '#skill-category-card-template',
    skillCard: '#skill-card-template',
    cardWrapper: '#character-card-wrapper',
    formWizard: '#form-wizard',
    form: '.form-container',
    downloadBtn: '#download-btn',
    prevBtn: '#prev-btn',
    nextBtn: '#next-btn',
    addCategoryBtn: '#add-category-btn',
    saveBtn: '#save-btn',
    loadBtn: '#load-btn',
    loadFileInput: '#load-file-input',
    uploadPngBtn: '#upload-png-btn',
    uploadPngInput: '#upload-png-input',
    themeSelect: '#style-theme',
    jsonStyleContainer: '#custom-style-json-container',
    themeControlsContainer: '#theme-controls-container',
    jsonInputArea: '#json-style-input',
    formTitle: '#form-title',
    skillNameInput: '.skill-name-input',
    skillDescInput: '.skill-desc-input',
    skillLevelInput: '.skill-level-input',
    categoryNameInput: '.category-name-input',
    skillFormBlock: '.skill-form-block',
    skillsInCategoryContainer: '.skills-in-category-container',
    formPage: '.form-page',
    characterCard: '.character-card',
};

// --- EXTERNAL DEPENDENCIES (loaded via index.html) ---
// - jQuery (via cash-dom)
// - Notyf (for notifications)
// - html2canvas (for PNG export)
// - crc-32 (for PNG metadata CRC calculation)
// - Lodash (for debouncing, optional)

document.addEventListener('DOMContentLoaded', () => {
    // --- ШАБЛОНЫ ---
    const templates = {
        mainCard: $(SELECTORS.mainCard)[0],
        mainInfoPage: $(SELECTORS.mainInfoPage)[0],
        categoryPage: $(SELECTORS.categoryPage)[0],
        skillForm: $(SELECTORS.skillForm)[0],
        categoryCard: $(SELECTORS.categoryCard)[0],
        skillCard: $(SELECTORS.skillCard)[0],
    };

    // --- ЭЛЕМЕНТЫ DOM ---
    const cardWrapper = $(SELECTORS.cardWrapper)[0];
    const cardNode = $(SELECTORS.mainCard)[0].content.cloneNode(true);
    const formWizard = $(SELECTORS.formWizard)[0];
    const form = $(SELECTORS.form)[0];
    const downloadBtn = $(SELECTORS.downloadBtn)[0];
    const prevBtn = $(SELECTORS.prevBtn)[0];
    const nextBtn = $(SELECTORS.nextBtn)[0];
    const addCategoryBtn = $(SELECTORS.addCategoryBtn)[0];
    const saveBtn = $(SELECTORS.saveBtn)[0];
    const loadBtn = $(SELECTORS.loadBtn)[0];
    const loadFileInput = $(SELECTORS.loadFileInput)[0];
    const uploadPngBtn = $(SELECTORS.uploadPngBtn)[0];
    const uploadPngInput = $(SELECTORS.uploadPngInput)[0];
    const themeSelect = $(SELECTORS.themeSelect)[0];
    const jsonStyleContainer = $(SELECTORS.jsonStyleContainer)[0];
    const themeControlsContainer = $(SELECTORS.themeControlsContainer)[0];
    const jsonInputArea = $(SELECTORS.jsonInputArea)[0];
    const formTitle = $(SELECTORS.formTitle)[0];

    let formWizardInstance; // Declare formWizardInstance here

    // --- NOTIFICATION SETUP ---
    const notyf = window.Notyf ? new Notyf() : null;

    function notify(type, message) {
        if (notyf) {
            if (type === 'success') notyf.success(message);
            else if (type === 'error') notyf.error(message);
            else notyf.open({ type, message });
        } else {
            alert(message);
        }
    }

    function init() {
        cardWrapper.appendChild(cardNode);
        // Fix: characterCard must be selected after cardNode is appended
        const characterCard = cardWrapper.querySelector(SELECTORS.characterCard);
        const mainInfoPage = templates.mainInfoPage.content.cloneNode(true);
        formWizard.appendChild(mainInfoPage);

        formWizardInstance = new FormWizard(formWizard, templates, dataManager);

        addCategoryBtn.addEventListener('click', () =>
            formWizardInstance.addCategoryAndNavigate(
                (name, skills) => dataManager.addCategory(name, skills),
                () => {
                    updateUI(cardWrapper, dataManager, templates);
                    updateFormWizardUI();
                },
            ),
        );
        // Use event delegation for input and click events
        form.addEventListener('input', handleFormInput);
        form.addEventListener('click', (e) => handleFormClick(e, formWizardInstance));
        if (downloadBtn) downloadBtn.addEventListener('click', downloadCard);
        if (saveBtn) saveBtn.addEventListener('click', saveDataToJsonHandler);
        if (loadBtn) loadBtn.addEventListener('click', () => loadFileInput.click());
        if (loadFileInput)
            loadFileInput.addEventListener('change', (event) =>
                loadDataFromJsonHandler(event, formWizardInstance),
            );
        if (uploadPngBtn) uploadPngBtn.addEventListener('click', () => uploadPngInput.click());
        if (uploadPngInput)
            uploadPngInput.addEventListener('change', (event) =>
                uploadCardFromPng(event, formWizardInstance),
            );
        setFileManagerNotifier(notify);
        setThemeManagerNotifier(notify);

        if (prevBtn)
            prevBtn.addEventListener('click', () => {
                const { currentPageIndex, totalPages } = formWizardInstance.navigate(-1);
                dataManager.setCurrentPageIndex(currentPageIndex);
                updateFormWizardUI();
            });
        if (nextBtn)
            nextBtn.addEventListener('click', () => {
                const { currentPageIndex, totalPages } = formWizardInstance.navigate(1);
                dataManager.setCurrentPageIndex(currentPageIndex);
                updateFormWizardUI();
            });
        if (themeSelect)
            themeSelect.addEventListener('change', (event) =>
                handleThemeChange(
                    event,
                    characterCard,
                    jsonStyleContainer,
                    jsonInputArea,
                    applyStylesFromJson,
                ),
            );
        if (jsonInputArea)
            jsonInputArea.addEventListener('input', () =>
                applyCustomStylesFromJson(jsonInputArea, characterCard, applyStylesFromJson),
            );
        if (jsonStyleContainer) jsonStyleContainer.style.display = 'none';
        loadExampleData(formWizardInstance);
        formWizardInstance.rebuildCategoryPages(dataManager.getCategories());
        formWizardInstance.showPage(0);
        updateFormWizardUI();
        updateUI(cardWrapper, dataManager, templates);
    }

    function updateFormWizardUI() {
        const { currentPageIndex, totalPages } = formWizardInstance.showPage(
            dataManager.getCurrentPageIndex(),
        );
        if (formTitle) {
            if (currentPageIndex === 0) {
                formTitle.textContent = 'Основная информация';
                formTitle.style.display = 'block';
            } else {
                formTitle.textContent = '';
                formTitle.style.display = 'none';
            }
        }
        if (prevBtn) prevBtn.disabled = currentPageIndex === 0;
        if (nextBtn) nextBtn.disabled = currentPageIndex === totalPages - 1;
        if (themeControlsContainer)
            themeControlsContainer.style.display = currentPageIndex === 0 ? 'block' : 'none';
        if (jsonStyleContainer) {
            if (currentPageIndex !== 0 || (themeSelect && themeSelect.value !== 'custom')) {
                jsonStyleContainer.style.display = 'none';
            }
        }
    }

    async function loadExampleData(formWizardInstance) {
        const exampleDataPath = '/data/sarah-connor.json';
        try {
            const response = await fetch(exampleDataPath);
            if (!response.ok) throw new Error(`Failed to load ${exampleDataPath}`);
            const data = await response.json();
            applyLoadedData(data, formWizardInstance);
        } catch (error) {
            console.log('Error loading example data:', error);
        }
    }

    function collectCharacterData() {
        // Use dataManager as the source of truth
        const mainInfo = dataManager.getMainInfo();
        const styles = {
            theme: getTheme(),
            customStyles: getCustomStyles(),
        };
        const simplifiedCategoriesData = dataManager.getCategories().map((cat) => ({
            name: cat.name,
            skills: cat.skills.map((skill) => ({
                name: skill.name,
                description: skill.description,
                level: skill.level,
            })),
        }));
        return {
            mainInfo,
            styles,
            skillCategories: simplifiedCategoriesData,
        };
    }

    function saveDataToJsonHandler() {
        const characterData = collectCharacterData();
        const charName = (dataManager.getMainInfo().name || 'character')
            .toLowerCase()
            .replace(/ /g, '-');
        saveDataToJson(characterData, `${charName}-data.json`);
        notify('success', 'Данные успешно сохранены в JSON!');
    }

    function loadDataFromJsonHandler(event, formWizardInstance) {
        const file = event.target.files[0];
        loadDataFromJson(
            file,
            (data) => applyLoadedData(data, formWizardInstance),
            (error) => {
                console.error('Ошибка обработки JSON файла:', error);
                notify(
                    'error',
                    'Ошибка при загрузке файла. Убедитесь, что это корректный JSON файл.',
                );
            },
        );
        // Clear the file input value so the change event fires even if the same file is selected again
        loadFileInput.value = '';
    }

    function downloadCard() {
        const characterData = collectCharacterData();
        const charName = (dataManager.getMainInfo().name || 'character')
            .toLowerCase()
            .replace(/ /g, '-');
        // Fix: get characterCard from DOM at call time
        const characterCard = cardWrapper.querySelector(SELECTORS.characterCard);
        saveCardAsPng(characterCard, characterData, `${charName}-card.png`);
        notify('success', 'PNG с карточкой успешно скачан!');
    }

    function uploadCardFromPng(event, formWizardInstance) {
        const file = event.target.files[0];
        loadCardFromPng(
            file,
            (data) => applyLoadedData(data, formWizardInstance),
            (error) => {
                if (error.message && error.message.includes('No character data')) {
                    notify('error', 'В этом PNG файле не найдено данных персонажа.');
                } else {
                    notify(
                        'error',
                        'Ошибка при обработке PNG файла. Убедитесь, что это корректный PNG файл.',
                    );
                }
                console.log('Error processing PNG:', error);
            },
        );
        uploadPngInput.value = '';
    }

    // --- LOAD DATA INTO APP ---
    function applyLoadedData(data, formWizardInstance) {
        // Update dataManager and UI from loaded data
        dataManager.updateFromLoadedData(data);
        // Apply theme/styles if present
        if (data.styles) {
            if (data.styles.theme === 'custom') {
                setTheme(data.styles.theme);
                setCustomStyles(data.styles.customStyles);
                if (themeSelect) themeSelect.value = data.styles.theme;
                if (jsonInputArea)
                    jsonInputArea.value = JSON.stringify(data.styles.customStyles, null, 2);
                // characterCard must be selected after cardNode is appended
                const characterCard = cardWrapper.querySelector(SELECTORS.characterCard);
                handleThemeChange(
                    { target: { value: data.styles.theme } },
                    characterCard,
                    jsonStyleContainer,
                    jsonInputArea,
                    applyStylesFromJson,
                );
            } else {
                setTheme(data.styles.theme);
                if (themeSelect) themeSelect.value = data.styles.theme;
                const characterCard = cardWrapper.querySelector(SELECTORS.characterCard);
                handleThemeChange(
                    { target: { value: data.styles.theme } },
                    characterCard,
                    jsonStyleContainer,
                    jsonInputArea,
                    applyStylesFromJson,
                );
            }
        }
        formWizardInstance.rebuildCategoryPages(dataManager.getCategories());
        formWizardInstance.showPage(0);
        updateFormWizardUI();
        updateUI(cardWrapper, dataManager, templates);
        populateFormFieldsFromDataManager(dataManager, formWizardInstance.formWizardElement); // Ensure form fields reflect loaded data
    }

    // Debounce updateUI to avoid excessive re-rendering on rapid input
    const debouncedUpdateUI = window._
        ? _.debounce(() => updateUI(cardWrapper, dataManager, templates), 100)
        : (...args) => updateUI(cardWrapper, dataManager, templates);

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function handleMainInfoInput(target) {
        if (target.id === 'char-full-name') {
            dataManager.mainInfo = dataManager.mainInfo || {};
            dataManager.mainInfo.name = target.value;
        } else if (target.classList.contains('attribute-select')) {
            dataManager.mainInfo = dataManager.mainInfo || {};
            dataManager.mainInfo.attributes = dataManager.mainInfo.attributes || {};
            const attrName = target.id.split('-')[1];
            dataManager.mainInfo.attributes[attrName] = parseInt(target.value);
        }
    }

    function handleCategorySkillInput(target, page) {
        const catId = parseInt(page.dataset.categoryId);
        const category = dataManager.getCategories().find((c) => c.id === catId);
        if (!category) return;

        if (target.classList.contains('category-name-input')) {
            category.name = target.value;
        } else {
            const skillBlock = target.closest('.skill-form-block');
            if (skillBlock) {
                const skillId = parseInt(skillBlock.dataset.skillId);
                const skill = category.skills.find((s) => s.id === skillId);
                if (skill) {
                    if (target.classList.contains('skill-name-input')) skill.name = target.value;
                    if (target.classList.contains('skill-desc-input'))
                        skill.description = target.value;
                    if (target.classList.contains('skill-level-input')) {
                        let level = parseInt(target.value);
                        if (isNaN(level)) {
                            level = 0; // Default to 0 if input is not a number
                        }
                        skill.level = Math.max(SKILL_LEVEL_MIN, Math.min(SKILL_LEVEL_MAX, level)); // Clamp between 0 and 5
                        target.value = skill.level; // Update the input field to reflect the clamped value
                    }
                }
            }
        }
    }

    function handleFormInput(e) {
        const target = e.target;
        const page = target.closest(SELECTORS.formPage);
        if (!page) return;

        if (page.dataset.pageType === 'main') {
            handleMainInfoInput(target);
        } else {
            handleCategorySkillInput(target, page);
        }
        debouncedUpdateUI();
    }

    function handleRemoveCategoryClick(catId, formWizardInstance) {
        formWizardInstance.removeCategoryAndUpdate(catId, () => {
            updateUI(cardWrapper, dataManager, templates);
            updateFormWizardUI();
        });
        dataManager.setCurrentPageIndex(formWizardInstance.currentPageIndex);
        debouncedUpdateUI();
    }

    function handleAddSkillClick(catId, formWizardInstance, page) {
        const category = dataManager.getCategories().find((c) => c.id === catId);
        if (category) {
            const newSkill = dataManager.addSkill(catId, '', '', 1);
            page.querySelector(SELECTORS.skillsInCategoryContainer).appendChild(
                createSkillFormBlock(newSkill, templates),
            );
            debouncedUpdateUI();
        }
    }

    function handleRemoveSkillClick(catId, skillBlock, formWizardInstance) {
        const skillId = parseInt(skillBlock.dataset.skillId);
        dataManager.removeSkill(catId, skillId);
        formWizardInstance.rebuildCategoryPages(dataManager.getCategories());
        formWizardInstance.showPage(formWizardInstance.currentPageIndex);
        updateFormWizardUI();
        debouncedUpdateUI();
    }

    function handleFormClick(e, formWizardInstance) {
        const button = e.target.closest('button');
        if (!button) return;

        const page = button.closest(SELECTORS.formPage);
        if (!page || page.dataset.pageType !== 'category') return;

        const catId = parseInt(page.dataset.categoryId);

        if (button.classList.contains('remove-category-btn')) {
            handleRemoveCategoryClick(catId, formWizardInstance);
        } else if (button.classList.contains('add-skill-btn')) {
            handleAddSkillClick(catId, formWizardInstance, page);
        } else if (button.classList.contains('remove-skill-btn')) {
            handleRemoveSkillClick(catId, button.closest('.skill-form-block'), formWizardInstance);
        }
    }

    // --- initialization on page load ---
    init();
});
