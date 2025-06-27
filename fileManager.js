// fileManager.js
// Handles file I/O: JSON and PNG load/save for character data

import {
    dataURLtoUint8Array,
    uint8ArrayToDataURL,
    extractChunks,
    encodeChunks,
    createTextChunk,
    extractJsonFromChunks,
} from './pngMeta.js';

const pngJsonChunkKey = 'VitruviumData';

let _notify = null;

export function setNotifier(notifier) {
    _notify = notifier;
}

export function saveDataToJson(data, fileName = 'character-data.json') {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

export function loadDataFromJson(file, onLoad) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const loadedData = JSON.parse(e.target.result);
            onLoad(loadedData);
        } catch (error) {
            if (_notify)
                _notify(
                    'error',
                    'Ошибка при загрузке файла. Убедитесь, что это корректный JSON файл.',
                );
            console.error('Ошибка обработки JSON файла:', error);
        }
    };
    reader.readAsText(file);
}

export function saveCardAsPng(characterCard, data, fileName = 'character-card.png') {
    return window
        .html2canvas(characterCard, { scale: 2, backgroundColor: null, useCORS: true })
        .then((canvas) => {
            const jsonData = JSON.stringify(data);
            const dataUrl = canvas.toDataURL('image/png');
            const originalPngBytes = dataURLtoUint8Array(dataUrl);
            const chunks = extractChunks(originalPngBytes);
            const tEXtChunk = createTextChunk(pngJsonChunkKey, jsonData);
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

export function loadCardFromPng(file, onLoad) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        try {
            const pngBytes = dataURLtoUint8Array(dataUrl);
            const chunks = extractChunks(pngBytes);
            const foundData = extractJsonFromChunks(chunks, pngJsonChunkKey);
            if (foundData) {
                onLoad(foundData);
            } else {
                if (_notify) _notify('error', 'В этом PNG файле не найдено данных персонажа.');
            }
        } catch (error) {
            if (_notify)
                _notify(
                    'error',
                    'Ошибка при обработке PNG файла. Убедитесь, что это корректный PNG файл.',
                );
            console.error('Ошибка при обработке PNG файла:', error);
        }
    };
    reader.readAsDataURL(file);
}
