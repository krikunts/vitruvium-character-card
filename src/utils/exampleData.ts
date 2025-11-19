import type { CharacterData } from '@/types/character';
import { useCharacterStore } from '../stores/character';

export const loadExampleData = async () => {
    const characterStore = useCharacterStore();

    try {
        const response = await fetch('data/sarah-connor.json');
        const data: CharacterData = await response.json();

        characterStore.setMainInfo(data.mainInfo);
        characterStore.setCategories(data.skillCategories);
    } catch (error) {
        console.error('Error loading example data:', error);
    }
};
