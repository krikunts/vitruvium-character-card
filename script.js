document.addEventListener('DOMContentLoaded', () => {
    // --- ГЛОБАЛЬНЫЕ ДАННЫЕ И СОСТОЯНИЕ ---
    let skillCategories = [];
    let nextCategoryId = 0;
    let nextSkillId = 0;
    let currentPageIndex = 0;

    // --- ЭЛЕМЕНТЫ DOM ---
    const formWizard = document.getElementById('form-wizard');
    const form = document.querySelector('.form-container');
    const downloadBtn = document.getElementById('download-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const loadFileInput = document.getElementById('load-file-input');
    const cardWrapper = document.getElementById('character-card-wrapper');
    const formTitle = document.getElementById('form-title');

    // --- ШАБЛОНЫ ---
    const templates = {
        mainCard: document.getElementById('main-card-template'),
        mainInfoPage: document.getElementById('main-info-page-template'),
        categoryPage: document.getElementById('skill-category-page-template'),
        skillForm: document.getElementById('skill-form-template'),
        categoryCard: document.getElementById('skill-category-card-template'),
        skillCard: document.getElementById('skill-card-template')
    };
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    function init() {
        const cardNode = templates.mainCard.content.cloneNode(true);
        cardWrapper.appendChild(cardNode);
        
        const mainInfoPage = templates.mainInfoPage.content.cloneNode(true);
        formWizard.appendChild(mainInfoPage);
        
        prevBtn.addEventListener('click', () => navigate(-1));
        nextBtn.addEventListener('click', () => navigate(1));
        addCategoryBtn.addEventListener('click', addCategoryAndNavigate);
        saveBtn.addEventListener('click', saveDataToJson);
        loadBtn.addEventListener('click', () => loadFileInput.click());
        loadFileInput.addEventListener('change', loadDataFromJson);
        form.addEventListener('input', handleFormInput);
        form.addEventListener('click', handleFormClick);
        downloadBtn.addEventListener('click', downloadCard);

        loadExampleData(); // Or load from local storage if implemented later
        rebuildCategoryPages();
        showPage(0);
        updateUI(); 
    }
    
    function loadExampleData() {
        _addCategory('Выживание', [            
            { name: 'Маскировка', desc: 'Потратьте 1 Вдохновение, чтобы быстро найти или обустроить временное безопасное укрытие. Добавьте 2 кубика к своей проверке Внимания для обнаружения потенциальных убежищ или скрытия следов.', level: 3 },

        ]);
        _addCategory('Боец', [
            { name: 'Тактическая Стрельба', desc: 'Потратьте 2 Вдохновения, чтобы совершить прицельный выстрел или быструю очередь. Добавьте 2 кубика к своей проверке Внимания для успешного попадания, игнорируя 1 пункт защиты цели.', level: 4 },

        ]);
        _addCategory('Несгибаемая воля', [
            { name: 'Железная Воля', desc: 'Вы невероятно стойки к боли и отчаянию. Потратьте 1 Вдохновение чтобы добавить 2 кубика при проверке Воли.', level: 3 },
        ]);

        _addCategory('Защитник будущего', [
            { name: 'Взгляд в будущее', desc: 'В начале боя с роботами получите 1 Вдохновение, знание о грядущем даёт вам сил для борьбы.', level: 1 },
            { name: 'Никакой судьбы', desc: 'Потратьте 2 Вдохновения, чтобы перебросить любой проваленный бросок — ваш или союзника.', level: 4 }
        ]);
    }

    // --- УПРАВЛЕНИЕ ДАННЫМИ ---
    function _addCategory(name, skills = []) {
        const newCategory = { id: nextCategoryId++, name, skills: [] };
        skillCategories.push(newCategory);
        skills.forEach(skill => {
            _addSkill(newCategory.id, skill.name, skill.desc, skill.level);
        });
    }
    
    function _addSkill(catId, name, desc, level) {
        const category = skillCategories.find(cat => cat.id === catId);
        if (category) {
            const newSkill = { id: nextSkillId++, name, description: desc, level };
            category.skills.push(newSkill);
            return newSkill;
        }
        return null;
    }

    // --- УПРАВЛЕНИЕ СТРАНИЦАМИ И UI ---
    function addCategoryAndNavigate() {
        _addCategory('Новая категория');
        rebuildCategoryPages();
        showPage(formWizard.querySelectorAll('.form-page').length - 1);
        updateUI();
    }

    function removeCategoryAndUpdate(catId) {
        skillCategories = skillCategories.filter(cat => cat.id !== catId);
        const newPageIndex = Math.max(0, currentPageIndex - 1);
        rebuildCategoryPages();
        showPage(newPageIndex);
        updateUI();
    }

    function rebuildCategoryPages() {
        formWizard.querySelectorAll('.form-page[data-page-type="category"]').forEach(p => p.remove());
        skillCategories.forEach(cat => {
            const pageNode = templates.categoryPage.content.cloneNode(true);
            const pageEl = pageNode.querySelector('.form-page');
            pageEl.dataset.categoryId = cat.id;
            pageEl.querySelector('.category-name-input').value = cat.name;

            const skillsContainer = pageEl.querySelector('.skills-in-category-container');
            cat.skills.forEach(skill => {
                skillsContainer.appendChild(createSkillFormBlock(skill));
            });
            formWizard.appendChild(pageNode);
        });
    }

    function createSkillFormBlock(skill) {
        const skillFormNode = templates.skillForm.content.cloneNode(true);
        const skillBlock = skillFormNode.querySelector('.skill-form-block');
        skillBlock.dataset.skillId = skill.id;
        skillBlock.querySelector('.skill-name-input').value = skill.name;
        skillBlock.querySelector('.skill-desc-input').value = skill.description;
        skillBlock.querySelector('.skill-level-input').value = skill.level;
        return skillFormNode;
    }

    function navigate(direction) {
        const newIndex = currentPageIndex + direction;
        showPage(newIndex);
    }

    function showPage(index) {
        const pages = formWizard.querySelectorAll('.form-page');
        if (index < 0 || index >= pages.length) return;
        
        currentPageIndex = index;
        pages.forEach((page, i) => page.classList.toggle('active', i === index));
        
        if(index === 0) {
            formTitle.textContent = "Шаг 1: Основная информация";
        } else {
            const catName = skillCategories[index - 1]?.name || "Новая категория";
            formTitle.textContent = `Шаг ${index + 1}: Категория "${catName}"`;
        }
        
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === pages.length - 1;
        // downloadBtn.style.display = (index === pages.length - 1) ? 'block' : 'none'; // Keep download button always visible
        nextBtn.style.display = (index === pages.length - 1) ? 'none' : 'block';
    }

    // --- ОБНОВЛЕНИЕ ПРЕВЬЮ ---
    function updateUI() {
        updateStaticInfo();
        renderSkillsOnCard();
    }

    function updateStaticInfo() {
        const fullName = [
            document.getElementById('char-name').value,
            document.getElementById('char-nickname').value,
            document.getElementById('char-surname').value
        ].join(' ').toUpperCase().trim();
        cardWrapper.querySelector('#card-full-name').textContent = fullName;
        
        const attributeValues = {};
        document.querySelectorAll('.attribute-select').forEach(select => {
            const attrName = select.id.split('-')[1];
            const value = select.value;
            cardWrapper.querySelector(`#card-attr-${attrName}`).textContent = value;
            attributeValues[attrName] = parseInt(value);
        });
        
        validateAndCalculateStats(attributeValues);
    }

    function renderSkillsOnCard() {
        const cardSkillsWrapper = cardWrapper.querySelector('#card-skills-list-wrapper');
        cardSkillsWrapper.innerHTML = '';
        skillCategories.forEach(cat => {
            if (cat.skills.length === 0 && !cat.name) return;
            const catCardNode = templates.categoryCard.content.cloneNode(true);
            catCardNode.querySelector('.category-title').textContent = cat.name || 'Без категории';

            const skillsDisplayContainer = catCardNode.querySelector('.skills-in-category-display-container');
            cat.skills.forEach(skill => {
                const skillCardNode = templates.skillCard.content.cloneNode(true);
                skillCardNode.querySelector('.skill-name').textContent = skill.name;
                skillCardNode.querySelector('.skill-description').textContent = skill.description;
                
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
        const category = skillCategories.find(c => c.id === catId);
        if (!category) return;
        
        if (target.classList.contains('category-name-input')) {
            category.name = target.value;
            formTitle.textContent = `Шаг ${currentPageIndex + 1}: Категория "${target.value}"`;
        } else {
            const skillBlock = target.closest('.skill-form-block');
            if (skillBlock) {
                const skillId = parseInt(skillBlock.dataset.skillId);
                const skill = category.skills.find(s => s.id === skillId);
                if (skill) {
                    if (target.classList.contains('skill-name-input')) skill.name = target.value;
                    if (target.classList.contains('skill-desc-input')) skill.description = target.value;
                    if (target.classList.contains('skill-level-input')) skill.level = target.value;
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
            removeCategoryAndUpdate(catId);
        } else if (button.classList.contains('add-skill-btn')) {
            const category = skillCategories.find(c => c.id === catId);
            if (category) {
                const newSkill = _addSkill(catId, '', '', 1);
                page.querySelector('.skills-in-category-container').appendChild(createSkillFormBlock(newSkill));
                updateUI();
            }
        } else if (button.classList.contains('remove-skill-btn')) {
            const skillBlock = button.closest('.skill-form-block');
            const skillId = parseInt(skillBlock.dataset.skillId);
            const category = skillCategories.find(c => c.id === catId);
            if (category) {
                category.skills = category.skills.filter(s => s.id !== skillId);
                skillBlock.remove();
                updateUI();
            }
        }
    }
    
    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    function validateAndCalculateStats(values) {
        cardWrapper.querySelector('#card-health').textContent = `× ${values.constitution * 6}`;
        cardWrapper.querySelector('#card-inspiration').textContent = `× ${values.will * 2}`;
        cardWrapper.querySelector('#card-range').textContent = `× ${values.movement * 2}`;
        cardWrapper.querySelector('#card-capacity').textContent = `× ${values.constitution * 20}`;
    }

    function collectCharacterData() {
        const mainInfo = {
            name: document.getElementById('char-name').value,
            nickname: document.getElementById('char-nickname').value,
            surname: document.getElementById('char-surname').value,
            attributes: {}
        };
        document.querySelectorAll('.attribute-select').forEach(select => {
            const attrName = select.id.split('-')[1];
            mainInfo.attributes[attrName] = parseInt(select.value);
        });

        // Simple deep copy to avoid modifying original skillCategories structure if needed later
        const categoriesData = JSON.parse(JSON.stringify(skillCategories));

        return {
            mainInfo,
            skillCategories: categoriesData,
            nextCategoryId,
            nextSkillId
        };
    }

    function saveDataToJson() {
        const characterData = collectCharacterData();
        const jsonData = JSON.stringify(characterData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        const charName = document.getElementById('char-name').value.toLowerCase().replace(/ /g, '-') || 'character';
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
            document.getElementById('char-name').value = data.mainInfo.name || '';
            document.getElementById('char-nickname').value = data.mainInfo.nickname || '';
            document.getElementById('char-surname').value = data.mainInfo.surname || '';
            if (data.mainInfo.attributes) {
                document.querySelectorAll('.attribute-select').forEach(select => {
                    const attrName = select.id.split('-')[1];
                    if (data.mainInfo.attributes[attrName] !== undefined) {
                        select.value = data.mainInfo.attributes[attrName];
                    }
                });
            }
        }

        // Load skill categories
        if (Array.isArray(data.skillCategories)) {
            skillCategories = data.skillCategories;
            // Ensure unique IDs and update nextId counters
            let maxCategoryId = -1;
            let maxSkillId = -1;
            skillCategories.forEach(cat => {
                if (cat.id > maxCategoryId) maxCategoryId = cat.id;
                if (Array.isArray(cat.skills)) {
                    cat.skills.forEach(skill => {
                        if (skill.id > maxSkillId) maxSkillId = skill.id;
                    });
                } else {
                    cat.skills = []; // Ensure skills is an array
                }
            });
            nextCategoryId = maxCategoryId + 1;
            nextSkillId = maxSkillId + 1;

            rebuildCategoryPages();
            showPage(0); // Go back to the first page after loading
            updateUI();
        } else {
             // If skillCategories is not an array, initialize with empty data
            skillCategories = [];
            nextCategoryId = 0;
            nextSkillId = 0;
            rebuildCategoryPages();
            showPage(0);
            updateUI();
        }
    }


    function downloadCard() {
        const cardElement = cardWrapper.querySelector('.character-card');
        html2canvas(cardElement, { scale: 2, backgroundColor: null, useCORS: true })
            .then(canvas => {
                const link = document.createElement('a');
                const charName = document.getElementById('char-name').value.toLowerCase().replace(/ /g, '-') || 'character';
                link.download = `${charName}-card.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
    }

    // --- ЗАПУСК ---
    init();
});
