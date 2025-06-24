// dataManager.js
// Centralized manager for all card data and related operations

class DataManager {
    constructor() {
        this.skillCategories = [];
        this.nextCategoryId = 0;
        this.nextSkillId = 0;
        this.currentPageIndex = 0;
        this.mainInfo = { name: '', attributes: {} };
    }

    reset() {
        this.skillCategories = [];
        this.nextCategoryId = 0;
        this.nextSkillId = 0;
        this.currentPageIndex = 0;
        this.mainInfo = { name: '', attributes: {} };
    }

    setMainInfo(mainInfo) {
        this.mainInfo = mainInfo;
    }

    getMainInfo() {
        return this.mainInfo;
    }

    addCategory(name, skills = []) {
        const newCategory = { id: this.nextCategoryId++, name, skills: [] };
        this.skillCategories.push(newCategory);
        skills.forEach(skill => {
            this.addSkill(newCategory.id, skill.name, skill.desc, skill.level);
        });
        return newCategory;
    }

    addSkill(catId, name, desc, level) {
        const category = this.skillCategories.find(cat => cat.id === catId);
        if (category) {
            const newSkill = { id: this.nextSkillId++, name, description: desc, level };
            category.skills.push(newSkill);
            return newSkill;
        }
        return null;
    }

    removeCategory(catId) {
        this.skillCategories = this.skillCategories.filter(cat => cat.id !== catId);
    }

    removeSkill(catId, skillId) {
        const category = this.skillCategories.find(cat => cat.id === catId);
        if (category) {
            category.skills = category.skills.filter(s => s.id !== skillId);
        }
    }

    updateFromLoadedData(data) {
        // For use in applyLoadedData
        if (data.mainInfo) {
            this.mainInfo = {
                name: data.mainInfo.name || '',
                attributes: { ...data.mainInfo.attributes }
            };
        } else {
            this.mainInfo = { name: '', attributes: {} };
        }
        if (Array.isArray(data.skillCategories)) {
            let currentMaxCategoryId = -1;
            let currentMaxSkillId = -1;
            this.skillCategories = data.skillCategories.map(cat => {
                const newCat = { ...cat };
                if (newCat.id === undefined) {
                    newCat.id = this.nextCategoryId++;
                }
                if (newCat.id > currentMaxCategoryId) currentMaxCategoryId = newCat.id;
                if (Array.isArray(newCat.skills)) {
                    newCat.skills = newCat.skills.map(skill => {
                        const newSkill = { ...skill };
                        if (newSkill.id === undefined) {
                            newSkill.id = this.nextSkillId++;
                        }
                        if (newSkill.id > currentMaxSkillId) currentMaxSkillId = newSkill.id;
                        return newSkill;
                    });
                } else {
                    newCat.skills = [];
                }
                return newCat;
            });
            this.nextCategoryId = Math.max(this.nextCategoryId, currentMaxCategoryId + 1);
            this.nextSkillId = Math.max(this.nextSkillId, currentMaxSkillId + 1);
        } else {
            this.reset();
        }
        this.currentPageIndex = 0;
    }

    getNextCategoryId() {
        return this.nextCategoryId;
    }

    getNextSkillId() {
        return this.nextSkillId;
    }

    setNextCategoryId(id) {
        this.nextCategoryId = id;
    }

    setNextSkillId(id) {
        this.nextSkillId = id;
    }
    
    setCategories(categories) {
        this.skillCategories = categories;
    }

    getCategories() {
        return this.skillCategories;
    }

    setCurrentPageIndex(idx) {
        this.currentPageIndex = idx;
    }

    getCurrentPageIndex() {
        return this.currentPageIndex;
    }
}

export const dataManager = new DataManager();
