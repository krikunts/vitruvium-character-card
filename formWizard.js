// formWizard.js
// Handles form wizard navigation and category/skill page management

export class FormWizard {
    constructor(formWizardElement, formTitleElement, prevBtnElement, nextBtnElement, themeControlsContainerElement, jsonStyleContainerElement, themeSelectElement, templates, dataManager) {
        this.formWizardElement = formWizardElement;
        this.formTitleElement = formTitleElement;
        this.prevBtnElement = prevBtnElement;
        this.nextBtnElement = nextBtnElement;
        this.themeControlsContainerElement = themeControlsContainerElement;
        this.jsonStyleContainerElement = jsonStyleContainerElement;
        this.themeSelectElement = themeSelectElement;
        this.themeSelectElement = themeSelectElement;
        this.templates = templates;
        this.dataManager = dataManager;
        this.currentPageIndex = 0;
    }

    showPage(index) {
        const pages = this.formWizardElement.querySelectorAll('.form-page');
        if (index < 0 || index >= pages.length) {
            console.log('Invalid page index:', index);
            return;
        }
        pages.forEach((page, i) => page.classList.toggle('active', i === index));
        if (this.formTitleElement) {
            if (index === 0) {
                this.formTitleElement.textContent = "Основная информация";
                this.formTitleElement.style.display = 'block';
            } else {
                this.formTitleElement.textContent = "";
                this.formTitleElement.style.display = 'none';
            }
            this.prevBtnElement.disabled = index === 0;
            this.nextBtnElement.disabled = index === pages.length - 1;
            this.themeControlsContainerElement.style.display = index === 0 ? 'block' : 'none';
            if (this.jsonStyleContainerElement) {
                if (index !== 0 || (this.themeSelectElement && this.themeSelectElement.value !== 'custom')) {
                    this.jsonStyleContainerElement.style.display = 'none';
                }
            }
        }
    }

    navigate(direction) {
        const newIndex = this.currentPageIndex + direction;
        this.showPage(newIndex);
        this.currentPageIndex = newIndex;
        return newIndex;
    }

    rebuildCategoryPages(skillCategories) {
        this.formWizardElement.querySelectorAll('.form-page[data-page-type="category"]').forEach(p => p.remove());
        skillCategories.forEach(cat => {
            const pageNode = this.templates.categoryPage.content.cloneNode(true);
            const pageEl = pageNode.querySelector('.form-page');
            pageEl.dataset.categoryId = cat.id;
            pageEl.querySelector('.category-name-input').value = cat.name;
            const skillsContainer = pageEl.querySelector('.skills-in-category-container');
            cat.skills.forEach(skill => {
                skillsContainer.appendChild(createSkillFormBlock(skill, this.templates));
            });
            this.formWizardElement.appendChild(pageNode);
        });
    }

    addCategoryAndNavigate(_addCategory, updateUI) {
        _addCategory('Новая категория');
        this.rebuildCategoryPages(this.dataManager.getCategories());
        this.showPage(this.formWizardElement.querySelectorAll('.form-page').length - 1);
        updateUI();
    }

    removeCategoryAndUpdate(catId, updateUI) {
        const newCategories = this.dataManager.getCategories().filter(cat => cat.id !== catId);
        console.log('FormWizard.removeCategoryAndUpdate: newCategories', newCategories);
        this.dataManager.setCategories(newCategories);
        const newPageIndex = Math.max(0, this.currentPageIndex - 1);
        console.log('FormWizard.removeCategoryAndUpdate: newPageIndex', newPageIndex);
        this.rebuildCategoryPages(newCategories);
        this.showPage(newPageIndex);
        this.currentPageIndex = newPageIndex;
        updateUI();
    }
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

