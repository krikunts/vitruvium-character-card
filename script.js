import { handleThemeChange, applyCustomStylesFromJson, applyStylesFromJson, getTheme, getCustomStyles, setTheme, setCustomStyles } from './themeManager.js';
import { dataURLtoUint8Array, uint8ArrayToDataURL, extractChunks, encodeChunks, createTextChunk, extractJsonFromChunks } from './pngMeta.js';
import { addCategoryAndNavigate, rebuildCategoryPages, navigate, showPage, createSkillFormBlock } from './formWizard.js';
import { dataManager } from './dataManager.js';

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
    cardWrapper.appendChild(cardNode);

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
    const characterCard = cardWrapper.querySelector('.character-card'); // Get the actual card element
    const themeSelect = document.getElementById('style-theme'); // Get the theme dropdown
    const jsonStyleContainer = document.getElementById('custom-style-json-container');
    const themeControlsContainer = document.getElementById('theme-controls-container'); // Get the theme controls container
    const jsonInputArea = document.getElementById('json-style-input'); // Get the JSON textarea
    const formTitle = document.getElementById('form-title');

    // --- ИНИЦИАЛИЗАЦИЯ ---
    function init() {
        const formWizard = document.getElementById('form-wizard');
        
        const mainInfoPage = templates.mainInfoPage.content.cloneNode(true);
        formWizard.appendChild(mainInfoPage);
        
        addCategoryBtn.addEventListener('click', () => addCategoryAndNavigate(
            (name, skills) => dataManager.addCategory(name, skills),
            () => rebuildCategoryPages(dataManager.getCategories(), templates, formWizard),
            (i) => showPage(i, formWizard, formTitle, prevBtn, nextBtn, themeControlsContainer, jsonStyleContainer, themeSelect),
            updateUI,
            formWizard
        ));
        saveBtn.addEventListener('click', saveDataToJson);
        loadBtn.addEventListener('click', () => loadFileInput.click());
        loadFileInput.addEventListener('change', loadDataFromJson);
        uploadPngBtn.addEventListener('click', () => uploadPngInput.click());
        uploadPngInput.addEventListener('change', uploadCardFromPng);
        form.addEventListener('input', handleFormInput);
        form.addEventListener('click', handleFormClick);        
        if (downloadBtn) downloadBtn.addEventListener('click', downloadCard); // check if button exists
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
        if (jsonInputArea) jsonInputArea.addEventListener('input', () => applyCustomStylesFromJson(jsonInputArea, characterCard, applyStylesFromJson)); // Listen for input on the JSON area
        
        if (jsonStyleContainer) jsonStyleContainer.style.display = 'none'; // Hide JSON input initially

        loadExampleData(); // Or load from local storage if implemented later
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
        updateStaticInfo();
        renderSkillsOnCard();
    }

    function updateStaticInfo() {
        const fullName = document.getElementById('char-full-name').value.toUpperCase().trim();
        cardWrapper.querySelector('#card-full-name').textContent = fullName;
        
        const attributeValues = {};
        document.querySelectorAll('.attribute-select').forEach(select => {
            const attrName = select.id.split('-')[1];
            const value = select.value;
            cardWrapper.querySelector(`#card-attr-${attrName}`).textContent = value;
            attributeValues[attrName] = parseInt(value);
        });
        
        calculateStats(attributeValues);
    }

    function renderSkillsOnCard() {
        const cardSkillsWrapper = cardWrapper.querySelector('#card-skills-list-wrapper');
        cardSkillsWrapper.innerHTML = '';
        dataManager.getCategories().forEach(cat => {
            if (cat.skills.length === 0 && !cat.name) return;
            const catCardNode = templates.categoryCard.content.cloneNode(true);
            catCardNode.querySelector('.category-title').textContent = cat.name || 'Без категории';

            const skillsDisplayContainer = catCardNode.querySelector('.skills-in-category-display-container');
            cat.skills.forEach(skill => {
                const skillCardNode = templates.skillCard.content.cloneNode(true);
                skillCardNode.querySelector('.skill-name').textContent = skill.name;
                const formattedDescription = skill.description.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
                skillCardNode.querySelector('.skill-description').innerHTML = formattedDescription;
                
                const dotsContainer = skillCardNode.querySelector('.skill-dots');
                dotsContainer.innerHTML = '';
                for (let i = 0; i < 5; i++) {
                    const dot = document.createElement('span');
                    dot.classList.add('dot', i < skill.level ? 'filled' : 'empty');
                    dotsContainer.appendChild(dot);
                }
                skillsDisplayContainer.appendChild(skillCardNode);
            });
            cardSkillsWrapper.appendChild(catCardNode);
        });
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function handleFormInput(e) {
        const target = e.target;
        const page = target.closest('.form-page');
        if (!page) return;
        
        if (page.dataset.pageType === 'main') {
            updateUI(); // Обновляем все, если меняются статы
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
        renderSkillsOnCard(); // Обновляем только карточку-превью, чтобы не терять фокус
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

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

    function calculateStats(values) {
        cardWrapper.querySelector('#card-health').textContent = `× ${values.constitution * 6}`;
        cardWrapper.querySelector('#card-inspiration').textContent = `× ${values.will * 2}`;
        cardWrapper.querySelector('#card-range').textContent = `× ${values.movement * 2}`;
        cardWrapper.querySelector('#card-capacity').textContent = `× ${values.constitution * 20}`;
    }

    function collectCharacterData() {
        const mainInfo = {
            name: document.getElementById('char-full-name').value,
            attributes: {}
        };
        document.querySelectorAll('.attribute-select').forEach(select => {
            const attrName = select.id.split('-')[1];
            mainInfo.attributes[attrName] = parseInt(select.value);
        });

        const styles = {
            theme: getTheme(),
            customStyles: getCustomStyles()
        }
        // Create a simplified structure for saving, excluding skill IDs and counters
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

    function saveDataToJson() {
        const characterData = collectCharacterData();
        const jsonData = JSON.stringify(characterData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        const charName = document.getElementById('char-full-name').value.toLowerCase().replace(/ /g, '-') || 'character';
        link.download = `${charName}-data.json`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url); // Clean up the URL object
    }

    function loadDataFromJson(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                applyLoadedData(loadedData);
            } catch (error) {
                console.error("Error parsing JSON:", error);
                alert("Ошибка при загрузке файла. Убедитесь, что это корректный JSON файл.");
            } finally {
                // Clear the file input value so the change event fires even if the same file is selected again
                loadFileInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    function applyLoadedData(data) {
        // Load main info
        if (data.mainInfo) {
            const fullNameInput = document.getElementById('char-full-name');
            if (data.mainInfo.name || data.mainInfo.nickname || data.mainInfo.surname) {
                // Backward compatibility: concatenate old fields
                fullNameInput.value = [
                    data.mainInfo.name || '',
                    data.mainInfo.nickname || '',
                    data.mainInfo.surname || ''
                ].join(' ').trim();
            } else if (data.mainInfo.name !== undefined) {
                // Load new single name field
                fullNameInput.value = data.mainInfo.name || '';
            }

            if (data.mainInfo.attributes) {
                document.querySelectorAll('.attribute-select').forEach(select => {
                    const attrName = select.id.split('-')[1];
                    if (data.mainInfo.attributes[attrName] !== undefined) {
                        select.value = data.mainInfo.attributes[attrName];
                    }
                });
            }
        }

        if (data.styles) {
            if (data.styles.theme == 'custom') {
                setTheme(data.styles.theme);
                setCustomStyles(data.styles.customStyles);
                themeSelect.value = data.styles.theme;
                jsonInputArea.value = JSON.stringify(data.styles.customStyles, null, 2);
                handleThemeChange({ target: { value: data.styles.theme } }, characterCard, jsonStyleContainer, themeSelect, jsonInputArea, applyStylesFromJson);
            }
            else {
                setTheme(data.styles.theme);
                themeSelect.value = data.styles.theme;
                handleThemeChange({ target: { value: data.styles.theme } }, characterCard, jsonStyleContainer, themeSelect, jsonInputArea, applyStylesFromJson);
            }
        }
        dataManager.updateFromLoadedData(data); // Update data manager with loaded categories and skills
        rebuildCategoryPages(dataManager.getCategories(), templates, formWizard);
        showPage(0, formWizard, formTitle, prevBtn, nextBtn, themeControlsContainer, jsonStyleContainer, themeSelect);
        updateUI();
    }

    function downloadCard() {
        html2canvas(characterCard, { scale: 2, backgroundColor: null, useCORS: true })
            .then(canvas => {
                const characterData = collectCharacterData();
                const jsonData = JSON.stringify(characterData);
                const dataUrl = canvas.toDataURL('image/png');
                const originalPngBytes = dataURLtoUint8Array(dataUrl);
                const chunks = extractChunks(originalPngBytes);
                // Use utility to create tEXt chunk
                const tEXtChunk = createTextChunk(pngJsonChunkKey, jsonData);
                // Insert before IEND
                const iendIndex = chunks.findIndex(chunk => chunk.name === 'IEND');
                if (iendIndex !== -1) {
                    chunks.splice(iendIndex, 0, tEXtChunk);
                } else {
                    chunks.push(tEXtChunk);
                }
                const newPngBytes = encodeChunks(chunks);
                const newPngDataUrl = uint8ArrayToDataURL(newPngBytes, 'image/png');
                const link = document.createElement('a');
                const charName = document.getElementById('char-full-name').value.toLowerCase().replace(/ /g, '-') || 'character';
                link.download = `${charName}-card.png`;
                link.href = newPngDataUrl;
                link.click();
            });
    }

    function uploadCardFromPng(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            try {
                const pngBytes = dataURLtoUint8Array(dataUrl);
                const chunks = extractChunks(pngBytes);
                // Use utility to extract JSON from tEXt chunk
                const foundData = extractJsonFromChunks(chunks, pngJsonChunkKey);
                if (foundData) {
                    applyLoadedData(foundData);
                } else {
                    alert("В этом PNG файле не найдено данных персонажа.");
                }
            } catch (error) {
                console.error("Error processing PNG:", error);
                alert("Ошибка при обработке PNG файла. Убедитесь, что это корректный PNG файл.");
            } finally {
                uploadPngInput.value = '';
            }
        };
        reader.readAsDataURL(file);
    }

    // --- ЗАПУСК ---
    init();
});
