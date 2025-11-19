import { setActivePinia, createPinia } from 'pinia';
import { useCharacterStore } from '../character';
import { describe, beforeEach, it, expect } from 'vitest';
import type { ExportCharacterData } from '@/types/character';

describe('Character Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with default values', () => {
    const store = useCharacterStore();
    expect(store.mainInfo).toEqual({ name: '', attributes: {} });
    expect(store.skillCategories).toEqual([]);
    expect(store.nextCategoryId).toBe(0);
    expect(store.nextSkillId).toBe(0);
    expect(store.currentPageIndex).toBe(0);
  });

  it('sets main info correctly', () => {
    const store = useCharacterStore();
    const newMainInfo = {
      name: 'Test Character',
      attributes: { constitution: 3, attention: 2 },
    };
    store.setMainInfo(newMainInfo);
    expect(store.mainInfo).toEqual(newMainInfo);
  });

  it('adds a category correctly', () => {
    const store = useCharacterStore();
    store.addCategory('Combat Skills');
    expect(store.skillCategories.length).toBe(1);
    expect(store.skillCategories[0].name).toBe('Combat Skills');
    expect(store.skillCategories[0].id).toBe(0);
    expect(store.nextCategoryId).toBe(1);
  });

  it('adds a skill to a category', () => {
    const store = useCharacterStore();
    store.addCategory('Combat Skills');
    const categoryId = store.skillCategories[0].id;
    store.addSkill(categoryId, 'Punch', 'A strong punch', 3);
    expect(store.skillCategories[0].skills.length).toBe(1);
    expect(store.skillCategories[0].skills[0].name).toBe('Punch');
    expect(store.skillCategories[0].skills[0].id).toBe(0);
    expect(store.nextSkillId).toBe(1);
  });

  it('removes a category correctly', () => {
    const store = useCharacterStore();
    store.addCategory('Combat Skills');
    store.addCategory('Social Skills');
    const categoryIdToRemove = store.skillCategories[0].id;
    store.removeCategory(categoryIdToRemove);
    expect(store.skillCategories.length).toBe(1);
    expect(store.skillCategories[0].name).toBe('Social Skills');
  });

  it('removes a skill from a category', () => {
    const store = useCharacterStore();
    store.addCategory('Combat Skills');
    const categoryId = store.skillCategories[0].id;
    store.addSkill(categoryId, 'Punch', 'A strong punch', 3);
    store.addSkill(categoryId, 'Kick', 'A strong kick', 4);
    const skillIdToRemove = store.skillCategories[0].skills[0].id;
    store.removeSkill(categoryId, skillIdToRemove);
    expect(store.skillCategories[0].skills.length).toBe(1);
    expect(store.skillCategories[0].skills[0].name).toBe('Kick');
  });

  it('updates from loaded data correctly', () => {
    const store = useCharacterStore();
    const loadedData: ExportCharacterData = {
      mainInfo: { name: 'Loaded Char', attributes: { constitution: 5 } },
      styles: {theme: 'themes/white.json', customStyles: {}},
      skillCategories: [
        { name: 'Loaded Category', skills: [{ name: 'Loaded Skill', description: '', level: 1 }] },
      ],
    };
    store.updateFromLoadedData(loadedData);
    expect(store.mainInfo.name).toBe('Loaded Char');
    expect(store.skillCategories.length).toBe(1);
    expect(store.skillCategories[0].name).toBe('Loaded Category');
    expect(store.skillCategories[0].skills[0].name).toBe('Loaded Skill');
    expect(store.nextCategoryId).toBe(1); // Max ID + 1
    expect(store.nextSkillId).toBe(1); // Max ID + 1
  });

  it('sets current page index', () => {
    const store = useCharacterStore();
    store.setCurrentPageIndex(2);
    expect(store.currentPageIndex).toBe(2);
  });
});
