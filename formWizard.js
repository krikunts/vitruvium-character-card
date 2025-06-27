// formWizard.js
// Handles form wizard navigation and category/skill page management

export class FormWizard {
    constructor(formWizardElement, templates, dataManager) {
        this.formWizardElement = formWizardElement;
        this.templates = templates;
        this.dataManager = dataManager;
        this.currentPageIndex = 0;
    }

    showPage(index) {
        const pages = this.formWizardElement.querySelectorAll('.form-page');
        if (index < 0 || index >= pages.length) {
            console.log('Invalid page index:', index);
            return { currentPageIndex: this.currentPageIndex, totalPages: pages.length }; // Return current state on invalid index
        }
        pages.forEach((page, i) => page.classList.toggle('active', i === index));
        this.currentPageIndex = index; // Update internal current page index
        return { currentPageIndex: this.currentPageIndex, totalPages: pages.length };
    }

    navigate(direction) {
        const newIndex = this.currentPageIndex + direction;
        return this.showPage(newIndex);
    }

    rebuildCategoryPages(skillCategories) {
        const existingPages = this.formWizardElement.querySelectorAll(
            '.form-page[data-page-type="category"]',
        );
        const existingPageMap = new Map();
        existingPages.forEach((page) => {
            existingPageMap.set(parseInt(page.dataset.categoryId), page);
        });

        const newCategoryIds = new Set(skillCategories.map((cat) => cat.id));

        // Remove pages that no longer have a corresponding category
        existingPageMap.forEach((page, categoryId) => {
            if (!newCategoryIds.has(categoryId)) {
                page.remove();
            }
        });

        // Add or update pages
        skillCategories.forEach((cat) => {
            let pageEl = existingPageMap.get(cat.id);

            if (pageEl) {
                // Update existing page
                pageEl.querySelector('.category-name-input').value = cat.name;
                const skillsContainer = pageEl.querySelector('.skills-in-category-container');
                this.updateSkillsInContainer(skillsContainer, cat.skills);
            } else {
                // Add new page
                const pageNode = this.templates.categoryPage.content.cloneNode(true);
                pageEl = pageNode.querySelector('.form-page');
                pageEl.dataset.categoryId = cat.id;
                pageEl.querySelector('.category-name-input').value = cat.name;
                const skillsContainer = pageEl.querySelector('.skills-in-category-container');
                cat.skills.forEach((skill) => {
                    skillsContainer.appendChild(createSkillFormBlock(skill, this.templates));
                });
                this.formWizardElement.appendChild(pageNode);
            }
        });
    }

    updateSkillsInContainer(skillsContainer, skills) {
        const existingSkillBlocks = skillsContainer.querySelectorAll('.skill-form-block');
        const existingSkillMap = new Map();
        existingSkillBlocks.forEach((block) => {
            existingSkillMap.set(parseInt(block.dataset.skillId), block);
        });

        const newSkillIds = new Set(skills.map((skill) => skill.id));

        // Remove skill blocks that no longer have a corresponding skill
        existingSkillMap.forEach((block, skillId) => {
            if (!newSkillIds.has(skillId)) {
                block.remove();
            }
        });

        // Add or update skill blocks
        skills.forEach((skill) => {
            let skillBlock = existingSkillMap.get(skill.id);
            if (skillBlock) {
                // Update existing skill block
                skillBlock.querySelector('.skill-name-input').value = skill.name;
                skillBlock.querySelector('.skill-desc-input').value = skill.description;
                skillBlock.querySelector('.skill-level-input').value = skill.level;
            } else {
                // Add new skill block
                skillsContainer.appendChild(createSkillFormBlock(skill, this.templates));
            }
        });
    }

    addCategoryAndNavigate(_addCategory, updateUI) {
        _addCategory('Новая категория');
        this.rebuildCategoryPages(this.dataManager.getCategories());
        const { currentPageIndex, totalPages } = this.showPage(
            this.formWizardElement.querySelectorAll('.form-page').length - 1,
        );
        this.dataManager.setCurrentPageIndex(currentPageIndex);
        updateUI();
    }

    removeCategoryAndUpdate(catId, updateUI) {
        const newCategories = this.dataManager.getCategories().filter((cat) => cat.id !== catId);
        console.log('FormWizard.removeCategoryAndUpdate: newCategories', newCategories);
        this.dataManager.setCategories(newCategories);
        const newPageIndex = Math.max(0, this.currentPageIndex - 1);
        console.log('FormWizard.removeCategoryAndUpdate: newPageIndex', newPageIndex);
        this.rebuildCategoryPages(newCategories);
        const { currentPageIndex, totalPages } = this.showPage(newPageIndex);
        this.currentPageIndex = currentPageIndex;
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
