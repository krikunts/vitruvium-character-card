import { defineStore } from 'pinia';
import type {
    MainInfo,
    Skill,
    SkillCategory,
    ExportCharacterData,
    ExportSkillCategory,
    ExportSkill,
    CharacterState,
} from '../types/character';

export const useCharacterStore = defineStore('character', {
    state: (): CharacterState => ({
        skillCategories: [],
        nextCategoryId: 0,
        nextSkillId: 0,
        currentPageIndex: 0,
        mainInfo: { name: '', attributes: {} },
    }),

    actions: {
        reset() {
            this.skillCategories = [];
            this.nextCategoryId = 0;
            this.nextSkillId = 0;
            this.currentPageIndex = 0;
            this.mainInfo = { name: '', attributes: {} };
        },

        setMainInfo(mainInfo: MainInfo) {
            this.mainInfo = mainInfo;
        },

        addCategory(name: string, skills: Skill[] = []) {
            const newCategory: SkillCategory = { id: this.nextCategoryId++, name, skills: [] };
            this.skillCategories.push(newCategory);
            skills.forEach((skill) => {
                this.addSkill(newCategory.id, skill.name, skill.description, skill.level);
            });
            return newCategory;
        },

        addSkill(catId: number, name: string, desc: string, level: number) {
            const category = this.skillCategories.find((cat) => cat.id === catId);
            if (category) {
                const newSkill: Skill = { id: this.nextSkillId++, name, description: desc, level };
                category.skills.push(newSkill);
                return newSkill;
            }
            return null;
        },

        removeCategory(catId: number) {
            this.skillCategories = this.skillCategories.filter((cat) => cat.id !== catId);
        },

        removeSkill(catId: number, skillId: number) {
            const category = this.skillCategories.find((cat) => cat.id === catId);
            if (category) {
                category.skills = category.skills.filter((s) => s.id !== skillId);
            }
        },

        updateCategoryName(catId: number, name: string) {
            const category = this.skillCategories.find((cat) => cat.id === catId);
            if (category) {
                category.name = name;
            }
        },

        updateSkill(
            catId: number,
            skillId: number,
            name?: string,
            description?: string,
            level?: number,
        ) {
            const category = this.skillCategories.find((cat) => cat.id === catId);
            if (category) {
                const skill = category.skills.find((s) => s.id === skillId);
                if (skill) {
                    if (name !== undefined) skill.name = name;
                    if (description !== undefined) skill.description = description;
                    if (level !== undefined) skill.level = level;
                }
            }
        },

        updateFromLoadedData(data: ExportCharacterData) {
            if (data.mainInfo) {
                this.mainInfo = {
                    name: data.mainInfo.name || '',
                    attributes: { ...data.mainInfo.attributes },
                };
            } else {
                this.mainInfo = { name: '', attributes: {} };
            }
            if (Array.isArray(data.skillCategories)) {
                let currentMaxCategoryId = -1;
                let currentMaxSkillId = -1;
                this.skillCategories = data.skillCategories.map((cat: ExportSkillCategory) => {
                    const categoryId = (cat as SkillCategory).id ?? this.nextCategoryId++;
                    const newCat: SkillCategory = { ...cat, id: categoryId, skills: [] };
                    if (categoryId > currentMaxCategoryId) currentMaxCategoryId = categoryId;
                    if (Array.isArray(cat.skills)) {
                        newCat.skills = cat.skills.map((skill: ExportSkill) => {
                            const skillId = (skill as Skill).id ?? this.nextSkillId++;
                            if (skillId > currentMaxSkillId) currentMaxSkillId = skillId;
                            return { ...skill, id: skillId };
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
        },

        setCategories(categories: SkillCategory[]) {
            this.skillCategories = categories;
        },

        setCurrentPageIndex(idx: number) {
            this.currentPageIndex = idx;
        },
    },

    getters: {
        getMainInfo: (state) => state.mainInfo,
        getCategories: (state) => state.skillCategories,
        getCurrentPageIndex: (state) => state.currentPageIndex,
    },
});
