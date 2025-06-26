// uiRenderer.js
// Handles all UI rendering for the character card preview and related blocks

export function updateStaticInfo(cardWrapper, mainInfo) {
    const fullName = (mainInfo.name || '').toUpperCase().trim();
    const cardFullName = cardWrapper.querySelector('#card-full-name');
    if (cardFullName) cardFullName.textContent = fullName;
    const attributeValues = {};
    const attributes = mainInfo.attributes || {};
    const attrList = ['constitution', 'attention', 'movement', 'mind', 'social', 'will'];
    attrList.forEach(attrName => {
        const value = attributes[attrName] || '';
        const cardAttr = cardWrapper.querySelector(`#card-attr-${attrName}`);
        if (cardAttr) {
            cardAttr.textContent = value;
        } else {
            console.warn(`Element #card-attr-${attrName} not found in cardWrapper`);
        }
        attributeValues[attrName] = parseInt(value) || 0;
    });
    calculateStats(cardWrapper, attributeValues);
}

export function calculateStats(cardWrapper, values) {
    const healthEl = cardWrapper.querySelector('#card-health');
    if (healthEl) healthEl.textContent = `× ${values.constitution * 6}`;
    const inspirationEl = cardWrapper.querySelector('#card-inspiration');
    if (inspirationEl) inspirationEl.textContent = `× ${values.will * 2}`;
    const rangeEl = cardWrapper.querySelector('#card-range');
    if (rangeEl) rangeEl.textContent = `× ${values.movement * 2}`;
    const capacityEl = cardWrapper.querySelector('#card-capacity');
    if (capacityEl) capacityEl.textContent = `× ${values.constitution * 20}`;
}

export function renderSkillCard(skill, templates) {
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
    return skillCardNode;
}

export function renderCategoryCard(cat, templates) {
    const catCardNode = templates.categoryCard.content.cloneNode(true);
    catCardNode.querySelector('.category-title').textContent = cat.name || 'Без категории';
    const skillsDisplayContainer = catCardNode.querySelector('.skills-in-category-display-container');
    cat.skills.forEach(skill => {
        skillsDisplayContainer.appendChild(renderSkillCard(skill, templates));
    });
    return catCardNode;
}

export function renderSkillsOnCard(cardWrapper, categories, templates) {
    const cardSkillsWrapper = cardWrapper.querySelector('#card-skills-list-wrapper');
    cardSkillsWrapper.innerHTML = '';
    categories.forEach(cat => {
        if (cat.skills.length === 0 && !cat.name) return;
        cardSkillsWrapper.appendChild(renderCategoryCard(cat, templates));
    });
}

export function updateUI(cardWrapper, dataManager, templates) {
    updateStaticInfo(cardWrapper, dataManager.mainInfo || {});
    const categories = dataManager.getCategories();
    renderSkillsOnCard(cardWrapper, categories, templates);
}

export function populateFormFieldsFromDataManager(dataManager, formWizardElement) {
    // Main Info
    const mainInfo = dataManager.getMainInfo() || {};
    const mainInfoPage = formWizardElement.querySelector('.form-page[data-page-type="main"]');
    if (mainInfoPage) {
        const nameInput = mainInfoPage.querySelector('#char-full-name');
        if (nameInput) nameInput.value = mainInfo.name || '';
        if (mainInfo.attributes) {
            for (const [attr, value] of Object.entries(mainInfo.attributes)) {
                const attrInput = mainInfoPage.querySelector(`#attr-${attr}`);
                if (attrInput) attrInput.value = value;
            }
        }
    }
    // Categories & Skills
    const categories = dataManager.getCategories();
    categories.forEach(category => {
        const catPage = formWizardElement.querySelector(`.form-page[data-page-type="category"][data-category-id="${category.id}"]`);
        if (catPage) {
            const catNameInput = catPage.querySelector('.category-name-input');
            if (catNameInput) catNameInput.value = category.name;
            // Skills
            category.skills.forEach(skill => {
                const skillBlock = catPage.querySelector(`.skill-form-block[data-skill-id="${skill.id}"]`);
                if (skillBlock) {
                    const skillNameInput = skillBlock.querySelector('.skill-name-input');
                    if (skillNameInput) skillNameInput.value = skill.name;
                    const skillDescInput = skillBlock.querySelector('.skill-desc-input');
                    if (skillDescInput) skillDescInput.value = skill.description;
                    const skillLevelInput = skillBlock.querySelector('.skill-level-input');
                    if (skillLevelInput) skillLevelInput.value = skill.level;
                }
            });
        }
    });
}
