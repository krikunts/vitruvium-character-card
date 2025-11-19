import {
    dataURLtoUint8Array,
    uint8ArrayToDataURL,
    extractChunks,
    encodeChunks,
    createTextChunk,
    extractJsonFromChunks,
} from './pngMeta';
import { useCharacterStore } from '../stores/character';
import { useThemeStore } from '../stores/theme';
import type { MainInfo, ExportCharacterData } from '../types/character.ts';
import type { Chunk } from './pngMeta.ts';

const pngJsonChunkKey = 'VitruviumData';

export function saveDataToJson(fileName: string = 'character-data.json') {
    const characterStore = useCharacterStore();
    const themeStore = useThemeStore();

    const characterData: ExportCharacterData = {
        mainInfo: characterStore.getMainInfo as MainInfo,
        styles: {
            theme: themeStore.getTheme as string,
            customStyles: themeStore.getCustomStyles as { [key: string]: string },
        },
        skillCategories: characterStore.getCategories.map((cat) => ({
            name: cat.name,
            skills: cat.skills.map((skill) => ({
                name: skill.name,
                description: skill.description,
                level: skill.level,
            })),
        })),
    };

    const jsonData = JSON.stringify(characterData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

export function loadDataFromJson(file: File): Promise<ExportCharacterData> {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const loadedData: ExportCharacterData = JSON.parse(
                    e.target && e.target.result ? e.target.result.toString() : '',
                );
                const characterStore = useCharacterStore();
                const themeStore = useThemeStore();

                characterStore.updateFromLoadedData(loadedData);
                if (loadedData.styles) {
                    themeStore.setTheme(loadedData.styles.theme);
                    themeStore.setCustomStyles(loadedData.styles.customStyles);
                }
                resolve(loadedData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsText(file);
    });
}

export function saveCardAsPng(
    characterCard: HTMLElement,
    fileName: string = 'character-card.png',
): Promise<void> {
    const characterStore = useCharacterStore();
    const themeStore = useThemeStore();

    const characterData: ExportCharacterData = {
        mainInfo: characterStore.getMainInfo as MainInfo,
        styles: {
            theme: themeStore.getTheme as string,
            customStyles: themeStore.getCustomStyles as { [key: string]: string },
        },
        skillCategories: characterStore.getCategories.map((cat) => ({
            name: cat.name,
            skills: cat.skills.map((skill) => ({
                name: skill.name,
                description: skill.description,
                level: skill.level,
            })),
        })),
    };

    return (window as any)
        .html2canvas(characterCard, { scale: 2, backgroundColor: null, useCORS: true })
        .then((canvas: HTMLCanvasElement) => {
            const jsonData = JSON.stringify(characterData);
            const dataUrl = canvas.toDataURL('image/png');
            const originalPngBytes = dataURLtoUint8Array(dataUrl);
            const chunks = extractChunks(originalPngBytes);
            const tEXtChunkRaw = createTextChunk(pngJsonChunkKey, jsonData);
            // Ensure tEXtChunk conforms to Chunk interface by adding crc if missing
            const tEXtChunk: Chunk = {
                name: tEXtChunkRaw.name,
                data: tEXtChunkRaw.data,
                length: tEXtChunkRaw.length,
                crc: 0, // CRC will be calculated during encoding
            };
            const iendIndex = chunks.findIndex((chunk) => chunk.name === 'IEND');
            if (iendIndex !== -1) {
                chunks.splice(iendIndex, 0, tEXtChunk);
            } else {
                chunks.push(tEXtChunk);
            }
            const newPngBytes = encodeChunks(chunks);
            const newPngDataUrl = uint8ArrayToDataURL(newPngBytes, 'image/png');
            const link = document.createElement('a');
            link.download = fileName;
            link.href = newPngDataUrl;
            link.click();
        });
}

export function loadCardFromPng(file: File): Promise<ExportCharacterData> {
    console.log('loadCardFromPng: Starting...', file);
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const dataUrl = e.target && e.target.result ? e.target.result.toString() : '';
            console.log('loadCardFromPng: FileReader loaded dataUrl length:', dataUrl.length);
            try {
                const pngBytes = dataURLtoUint8Array(dataUrl);
                console.log('loadCardFromPng: Converted to pngBytes length:', pngBytes.length);
                const chunks = extractChunks(pngBytes);
                console.log('loadCardFromPng: Extracted chunks:', chunks);
                const foundData: ExportCharacterData | null = extractJsonFromChunks(
                    chunks,
                    pngJsonChunkKey,
                );
                console.log('loadCardFromPng: Found data:', foundData);
                if (foundData) {
                    const characterStore = useCharacterStore();
                    const themeStore = useThemeStore();
                    characterStore.updateFromLoadedData(foundData);
                    if (foundData.styles) {
                        themeStore.setTheme(foundData.styles.theme);
                        themeStore.setCustomStyles(foundData.styles.customStyles);
                    }
                    resolve(foundData);
                } else {
                    reject(new Error('No character data found in PNG.'));
                }
            } catch (error) {
                console.error('loadCardFromPng: Error during processing:', error);
                reject(error);
            }
        };
        reader.onerror = (error) => {
            console.error('loadCardFromPng: FileReader error:', error);
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}
