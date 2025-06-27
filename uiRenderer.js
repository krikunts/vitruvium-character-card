// uiRenderer.js
// Handles all UI rendering for the character card preview and related blocks

export function updateStaticInfo(cardWrapper, mainInfo) {
    const fullName = (mainInfo.name || '').toUpperCase().trim();
    const cardFullName = cardWrapper.querySelector('#card-full-name');
    if (cardFullName) cardFullName.textContent = fullName;
    const attributeValues = {};
    const attributes = mainInfo.attributes || {};
    const attrList = ['constitution', 'attention', 'movement', 'mind', 'social', 'will'];
    attrList.forEach((attrName) => {
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
    const categoryDisplayBlock = catCardNode.querySelector('.skill-category-display-block');
    if (cat.id !== undefined) {
        categoryDisplayBlock.dataset.categoryId = cat.id;
    }
    categoryDisplayBlock.querySelector('.category-title').textContent = cat.name || 'Без категории';
    const skillsDisplayContainer = categoryDisplayBlock.querySelector(
        '.skills-in-category-display-container',
    );
    cat.skills.forEach((skill) => {
        const skillCard = renderSkillCard(skill, templates);
        if (skill.id !== undefined) {
            skillCard.querySelector('.skill-display-block').dataset.skillId = skill.id;
        }
        skillsDisplayContainer.appendChild(skillCard);
    });
    return catCardNode;
}

export function renderSkillsOnCard(cardWrapper, categories, templates) {
    const cardSkillsWrapper = cardWrapper.querySelector('#card-skills-list-wrapper');
    const existingCategoryCards = cardSkillsWrapper.querySelectorAll(
        '.skill-category-display-block',
    );
    const existingCategoryMap = new Map();
    existingCategoryCards.forEach((card) => {
        const categoryId = card.dataset.categoryId
            ? parseInt(card.dataset.categoryId)
            : card.querySelector('.category-title').textContent;
        existingCategoryMap.set(categoryId, card);
    });

    const newCategoryIds = new Set(categories.map((cat) => cat.id || cat.name));

    existingCategoryMap.forEach((card, categoryId) => {
        if (!newCategoryIds.has(categoryId)) {
            card.remove();
        }
    });

    categories.forEach((cat) => {
        const categoryIdentifier = cat.id || cat.name;
        let categoryCardEl = existingCategoryMap.get(categoryIdentifier);

        if (categoryCardEl) {
            categoryCardEl.querySelector('.category-title').textContent =
                cat.name || 'Без категории';
            const skillsDisplayContainer = categoryCardEl.querySelector(
                '.skills-in-category-display-container',
            );
            updateSkillsInCardContainer(skillsDisplayContainer, cat.skills, templates);
        } else {
            if (cat.skills.length === 0 && !cat.name) return;
            const newCategoryCardNode = renderCategoryCard(cat, templates);
            if (cat.id !== undefined) {
                newCategoryCardNode.querySelector(
                    '.skill-category-display-block',
                ).dataset.categoryId = cat.id;
            }
            cardSkillsWrapper.appendChild(newCategoryCardNode);
        }
    });
}

export function updateSkillsInCardContainer(skillsDisplayContainer, skills, templates) {
    const existingSkillCards = skillsDisplayContainer.querySelectorAll('.skill-display-block');
    const existingSkillMap = new Map();
    existingSkillCards.forEach((card) => {
        const skillId = card.dataset.skillId
            ? parseInt(card.dataset.skillId)
            : card.querySelector('.skill-name').textContent;
        existingSkillMap.set(skillId, card);
    });

    const newSkillIds = new Set(skills.map((skill) => skill.id || skill.name));

    existingSkillMap.forEach((card, skillId) => {
        if (!newSkillIds.has(skillId)) {
            card.remove();
        }
    });

    skills.forEach((skill) => {
        const skillIdentifier = skill.id || skill.name;
        let skillCardEl = existingSkillMap.get(skillIdentifier);

        if (skillCardEl) {
            skillCardEl.querySelector('.skill-name').textContent = skill.name;
            const formattedDescription = skill.description.replace(
                /\*(.*?)\*/g,
                '<strong>$1</strong>',
            );
            skillCardEl.querySelector('.skill-description').innerHTML = formattedDescription;
            const dotsContainer = skillCardEl.querySelector('.skill-dots');
            dotsContainer.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const dot = document.createElement('span');
                dot.classList.add('dot', i < skill.level ? 'filled' : 'empty');
                dotsContainer.appendChild(dot);
            }
        } else {
            const newSkillCardNode = renderSkillCard(skill, templates);
            if (skill.id !== undefined) {
                newSkillCardNode.querySelector('.skill-display-block').dataset.skillId = skill.id;
            }
            skillsDisplayContainer.appendChild(newSkillCardNode);
        }
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
    categories.forEach((category) => {
        const catPage = formWizardElement.querySelector(
            `.form-page[data-page-type="category"][data-category-id="${category.id}"]`,
        );
        if (catPage) {
            const catNameInput = catPage.querySelector('.category-name-input');
            if (catNameInput) catNameInput.value = category.name;
            // Skills
            category.skills.forEach((skill) => {
                const skillBlock = catPage.querySelector(
                    `.skill-form-block[data-skill-id="${skill.id}"]`,
                );
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
