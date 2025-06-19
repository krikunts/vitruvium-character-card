// formWizard.js
// Handles form wizard navigation and category/skill page management

export function addCategoryAndNavigate(_addCategory, rebuildCategoryPages, showPage, updateUI, formWizard) {
    _addCategory('Новая категория');
    rebuildCategoryPages();
    showPage(formWizard.querySelectorAll('.form-page').length - 1);
    updateUI();
}

export function removeCategoryAndUpdate(skillCategories, catId, setSkillCategories, currentPageIndex, rebuildCategoryPages, showPage, updateUI) {
    const newCategories = skillCategories.filter(cat => cat.id !== catId);
    setSkillCategories(newCategories);
    const newPageIndex = Math.max(0, currentPageIndex - 1);
    rebuildCategoryPages();
    showPage(newPageIndex);
    updateUI();
}

export function createSkillFormBlock(skill, templates) {
    const skillFormNode = templates.skillForm.content.cloneNode(true);
    const skillBlock = skillFormNode.querySelector('.skill-form-block');
    skillBlock.dataset.skillId = skill.id;
    skillBlock.querySelector('.skill-name-input').value = skill.name;
    skillBlock.querySelector('.skill-desc-input').value = skill.description;
    skillBlock.querySelector('.skill-level-input').value = skill.level;
    return skillFormNode;
}


export function rebuildCategoryPages(skillCategories, templates, formWizard) {
    formWizard.querySelectorAll('.form-page[data-page-type="category"]').forEach(p => p.remove());
    skillCategories.forEach(cat => {
        const pageNode = templates.categoryPage.content.cloneNode(true);
        const pageEl = pageNode.querySelector('.form-page');
        pageEl.dataset.categoryId = cat.id;
        pageEl.querySelector('.category-name-input').value = cat.name;
        const skillsContainer = pageEl.querySelector('.skills-in-category-container');
        cat.skills.forEach(skill => {
            skillsContainer.appendChild(createSkillFormBlock(skill, templates));
        });
        formWizard.appendChild(pageNode);
    });
}

export function navigate(currentPageIndex, direction, showPage) {
    const newIndex = currentPageIndex + direction;
    showPage(newIndex);
    return newIndex; // Return the new index so the caller can update their state
}

export function showPage(index, formWizard, formTitle, prevBtn, nextBtn, themeControlsContainer, jsonStyleContainer, themeSelect) {
    const pages = formWizard.querySelectorAll('.form-page');
    if (index < 0 || index >= pages.length) {
        console.log('Invalid page index:', index);
        return;
    }
    pages.forEach((page, i) => page.classList.toggle('active', i === index));
    if (formTitle) {
        if(index === 0) {
            formTitle.textContent = "Основная информация";
            formTitle.style.display = 'block';
        } else {
            formTitle.textContent = "";
            formTitle.style.display = 'none';
        }
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === pages.length - 1;
        themeControlsContainer.style.display = index === 0 ? 'block' : 'none';
        if (jsonStyleContainer) {
            if (index !== 0 || (themeSelect && themeSelect.value !== 'custom')) {
                jsonStyleContainer.style.display = 'none';
            }
        }
    }
}
