document.addEventListener('DOMContentLoaded', () => {
    // --- ГЛОБАЛЬНЫЕ ДАННЫЕ И СОСТОЯНИЕ ---
    let skillCategories = [];
    let nextCategoryId = 0;
    let nextSkillId = 0;
    let currentPageIndex = 0;

    // --- ЭЛЕМЕНТЫ DOM ---
    const formWizard = document.getElementById('form-wizard');
    const form = document.querySelector('.form-container');
    const downloadBtn = document.getElementById('download-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const loadFileInput = document.getElementById('load-file-input');
    const uploadPngBtn = document.getElementById('upload-png-btn');
    const uploadPngInput = document.getElementById('upload-png-input');
    const cardWrapper = document.getElementById('character-card-wrapper');
    const formTitle = document.getElementById('form-title');

    // --- ШАБЛОНЫ ---
    const templates = {
        mainCard: document.getElementById('main-card-template'),
        mainInfoPage: document.getElementById('main-info-page-template'),
        categoryPage: document.getElementById('skill-category-page-template'),
        skillForm: document.getElementById('skill-form-template'),
        categoryCard: document.getElementById('skill-category-card-template'),
        skillCard: document.getElementById('skill-card-template')
    };
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    function init() {
        const cardNode = templates.mainCard.content.cloneNode(true);
        cardWrapper.appendChild(cardNode);
        
        const mainInfoPage = templates.mainInfoPage.content.cloneNode(true);
        formWizard.appendChild(mainInfoPage);
        
        prevBtn.addEventListener('click', () => navigate(-1));
        nextBtn.addEventListener('click', () => navigate(1));
        addCategoryBtn.addEventListener('click', addCategoryAndNavigate);
        saveBtn.addEventListener('click', saveDataToJson);
        loadBtn.addEventListener('click', () => loadFileInput.click());
        loadFileInput.addEventListener('change', loadDataFromJson);
        uploadPngBtn.addEventListener('click', () => uploadPngInput.click());
        uploadPngInput.addEventListener('change', uploadCardFromPng);
        form.addEventListener('input', handleFormInput);
        form.addEventListener('click', handleFormClick);
        downloadBtn.addEventListener('click', downloadCard);

        loadExampleData(); // Or load from local storage if implemented later
        rebuildCategoryPages();
        showPage(0);
        updateUI(); 
    }
    
    function loadExampleData() {
        _addCategory('Выживание', [            
            { name: 'Маскировка', desc: 'Потратьте *1 Вдохновение*, чтобы быстро найти или обустроить временное безопасное укрытие. Добавьте 2 кубика к своей проверке Внимания для обнаружения потенциальных убежищ или скрытия следов.', level: 3 },

        ]);
        _addCategory('Боец', [
            { name: 'Тактическая Стрельба', desc: 'Потратьте *2 Вдохновения*, чтобы совершить прицельный выстрел или быструю очередь. Добавьте 2 кубика к своей проверке Внимания для успешного попадания, игнорируя 1 пункт защиты цели.', level: 4 },

        ]);
        _addCategory('Несгибаемая воля', [
            { name: 'Железная Воля', desc: 'Вы невероятно стойки к боли и отчаянию. Потратьте *1 Вдохновение* чтобы добавить 2 кубика при проверке Воли.', level: 3 },
        ]);

        _addCategory('Защитник будущего', [
            { name: 'Взгляд в будущее', desc: 'В начале боя с роботами получите *1 Вдохновение*, знание о грядущем даёт вам сил для борьбы.', level: 1 },
            { name: 'Никакой судьбы', 'desc': 'Потратьте *2 Вдохновения*, чтобы перебросить любой проваленный бросок — ваш или союзника.', level: 4 }
        ]);
    }

    // --- УПРАВЛЕНИЕ ДАННЫМИ ---
    function _addCategory(name, skills = []) {
        const newCategory = { id: nextCategoryId++, name, skills: [] };
        skillCategories.push(newCategory);
        skills.forEach(skill => {
            _addSkill(newCategory.id, skill.name, skill.desc, skill.level);
        });
    }
    
    function _addSkill(catId, name, desc, level) {
        const category = skillCategories.find(cat => cat.id === catId);
        if (category) {
            const newSkill = { id: nextSkillId++, name, description: desc, level };
            category.skills.push(newSkill);
            return newSkill;
        }
        return null;
    }

    // --- УПРАВЛЕНИЕ СТРАНИЦАМИ И UI ---
    function addCategoryAndNavigate() {
        _addCategory('Новая категория');
        rebuildCategoryPages();
        showPage(formWizard.querySelectorAll('.form-page').length - 1);
        updateUI();
    }

    function removeCategoryAndUpdate(catId) {
        skillCategories = skillCategories.filter(cat => cat.id !== catId);
        const newPageIndex = Math.max(0, currentPageIndex - 1);
        rebuildCategoryPages();
        showPage(newPageIndex);
        updateUI();
    }

    function rebuildCategoryPages() {
        formWizard.querySelectorAll('.form-page[data-page-type="category"]').forEach(p => p.remove());
        skillCategories.forEach(cat => {
            const pageNode = templates.categoryPage.content.cloneNode(true);
            const pageEl = pageNode.querySelector('.form-page');
            pageEl.dataset.categoryId = cat.id;
            pageEl.querySelector('.category-name-input').value = cat.name;

            const skillsContainer = pageEl.querySelector('.skills-in-category-container');
            cat.skills.forEach(skill => {
                skillsContainer.appendChild(createSkillFormBlock(skill));
            });
            formWizard.appendChild(pageNode);
        });
    }

    function createSkillFormBlock(skill) {
        const skillFormNode = templates.skillForm.content.cloneNode(true);
        const skillBlock = skillFormNode.querySelector('.skill-form-block');
        skillBlock.dataset.skillId = skill.id;
        skillBlock.querySelector('.skill-name-input').value = skill.name;
        skillBlock.querySelector('.skill-desc-input').value = skill.description;
        skillBlock.querySelector('.skill-level-input').value = skill.level;
        return skillFormNode;
    }

    function navigate(direction) {
        const newIndex = currentPageIndex + direction;
        showPage(newIndex);
    }

    function showPage(index) {
        const pages = formWizard.querySelectorAll('.form-page');
        if (index < 0 || index >= pages.length) {
            console.log('Invalid page index:', index);
            return;
        }
        
        currentPageIndex = index;
        pages.forEach((page, i) => page.classList.toggle('active', i === index));
        
        if(index === 0) {
            formTitle.textContent = "Основная информация";
            formTitle.style.display = 'block';
        } else {
            formTitle.style.display = 'none';
        }
        
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === pages.length - 1;
    }

    // --- ОБНОВЛЕНИЕ ПРЕВЬЮ ---
    function updateUI() {
        updateStaticInfo();
        renderSkillsOnCard();
    }

    function updateStaticInfo() {
        const fullName = document.getElementById('char-full-name').value.toUpperCase().trim();
        cardWrapper.querySelector('#card-full-name').textContent = fullName;
        
        const attributeValues = {};
        document.querySelectorAll('.attribute-select').forEach(select => {
            const attrName = select.id.split('-')[1];
            const value = select.value;
            cardWrapper.querySelector(`#card-attr-${attrName}`).textContent = value;
            attributeValues[attrName] = parseInt(value);
        });
        
        validateAndCalculateStats(attributeValues);
    }

    function renderSkillsOnCard() {
        const cardSkillsWrapper = cardWrapper.querySelector('#card-skills-list-wrapper');
        cardSkillsWrapper.innerHTML = '';
        skillCategories.forEach(cat => {
            if (cat.skills.length === 0 && !cat.name) return;
            const catCardNode = templates.categoryCard.content.cloneNode(true);
            catCardNode.querySelector('.category-title').textContent = cat.name || 'Без категории';

            const skillsDisplayContainer = catCardNode.querySelector('.skills-in-category-display-container');
            cat.skills.forEach(skill => {
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
                skillsDisplayContainer.appendChild(skillCardNode);
            });
            cardSkillsWrapper.appendChild(catCardNode);
        });
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function handleFormInput(e) {
        const target = e.target;
        const page = target.closest('.form-page');
        if (!page) return;
        
        if (page.dataset.pageType === 'main') {
            updateUI(); // Обновляем все, если меняются статы
            return;
        }

        const catId = parseInt(page.dataset.categoryId);
        const category = skillCategories.find(c => c.id === catId);
        if (!category) return;
        
        if (target.classList.contains('category-name-input')) {
            category.name = target.value;
        } else {
            const skillBlock = target.closest('.skill-form-block');
            if (skillBlock) {
                const skillId = parseInt(skillBlock.dataset.skillId);
                const skill = category.skills.find(s => s.id === skillId);
                if (skill) {
                    if (target.classList.contains('skill-name-input')) skill.name = target.value;
                    if (target.classList.contains('skill-desc-input')) skill.description = target.value;
                    if (target.classList.contains('skill-level-input')) {
                        let level = parseInt(target.value);
                        if (isNaN(level)) {
                            level = 0; // Default to 0 if input is not a number
                        }
                        skill.level = Math.max(0, Math.min(5, level)); // Clamp between 0 and 5
                        target.value = skill.level; // Update the input field to reflect the clamped value
                    }
                }
            }
        }
        renderSkillsOnCard(); // Обновляем только карточку-превью, чтобы не терять фокус
    }
    
    function handleFormClick(e) {
        const button = e.target.closest('button');
        if (!button) return;
        
        const page = button.closest('.form-page');
        if (!page || page.dataset.pageType !== 'category') return;

        const catId = parseInt(page.dataset.categoryId);
        
        if (button.classList.contains('remove-category-btn')) {
            removeCategoryAndUpdate(catId);
        } else if (button.classList.contains('add-skill-btn')) {
            const category = skillCategories.find(c => c.id === catId);
            if (category) {
                const newSkill = _addSkill(catId, '', '', 1);
                page.querySelector('.skills-in-category-container').appendChild(createSkillFormBlock(newSkill));
                updateUI();
            }
        } else if (button.classList.contains('remove-skill-btn')) {
            const skillBlock = button.closest('.skill-form-block');
            const skillId = parseInt(skillBlock.dataset.skillId);
            const category = skillCategories.find(c => c.id === catId);
            if (category) {
                category.skills = category.skills.filter(s => s.id !== skillId);
                skillBlock.remove();
                updateUI();
            }
        }
    }
    
    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    function validateAndCalculateStats(values) {
        cardWrapper.querySelector('#card-health').textContent = `× ${values.constitution * 6}`;
        cardWrapper.querySelector('#card-inspiration').textContent = `× ${values.will * 2}`;
        cardWrapper.querySelector('#card-range').textContent = `× ${values.movement * 2}`;
        cardWrapper.querySelector('#card-capacity').textContent = `× ${values.constitution * 20}`;
    }

    function collectCharacterData() {
        const mainInfo = {
            name: document.getElementById('char-full-name').value,
            attributes: {}
        };
        document.querySelectorAll('.attribute-select').forEach(select => {
            const attrName = select.id.split('-')[1];
            mainInfo.attributes[attrName] = parseInt(select.value);
        });

        // Create a simplified structure for saving, excluding skill IDs and counters
        const simplifiedCategoriesData = skillCategories.map(cat => ({
            name: cat.name,
            skills: cat.skills.map(skill => ({
                name: skill.name,
                description: skill.description,
                level: skill.level
            }))
        }));

        return {
            mainInfo,
            skillCategories: simplifiedCategoriesData
        };
    }

    function saveDataToJson() {
        const characterData = collectCharacterData();
        const jsonData = JSON.stringify(characterData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        const charName = document.getElementById('char-full-name').value.toLowerCase().replace(/ /g, '-') || 'character';
        link.download = `${charName}-data.json`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url); // Clean up the URL object
    }

    function loadDataFromJson(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                applyLoadedData(loadedData);
            } catch (error) {
                console.error("Error parsing JSON:", error);
                alert("Ошибка при загрузке файла. Убедитесь, что это корректный JSON файл.");
            } finally {
                // Clear the file input value so the change event fires even if the same file is selected again
                loadFileInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    function applyLoadedData(data) {
        // Load main info
        if (data.mainInfo) {
            const fullNameInput = document.getElementById('char-full-name');
            if (data.mainInfo.name || data.mainInfo.nickname || data.mainInfo.surname) {
                // Backward compatibility: concatenate old fields
                fullNameInput.value = [
                    data.mainInfo.name || '',
                    data.mainInfo.nickname || '',
                    data.mainInfo.surname || ''
                ].join(' ').trim();
            } else if (data.mainInfo.name !== undefined) {
                // Load new single name field
                fullNameInput.value = data.mainInfo.name || '';
            }

            if (data.mainInfo.attributes) {
                document.querySelectorAll('.attribute-select').forEach(select => {
                    const attrName = select.id.split('-')[1];
                    if (data.mainInfo.attributes[attrName] !== undefined) {
                        select.value = data.mainInfo.attributes[attrName];
                    }
                });
            }
        }

        // Load skill categories
        if (Array.isArray(data.skillCategories)) {
            skillCategories = data.skillCategories;
            // Ensure unique IDs and update nextId counters
            // Assign new IDs to loaded categories and skills, and update counters
            let currentMaxCategoryId = -1;
            let currentMaxSkillId = -1;

            skillCategories = data.skillCategories.map(cat => {
                const newCat = { ...cat };
                if (newCat.id === undefined) {
                    newCat.id = nextCategoryId++;
                }
                if (newCat.id > currentMaxCategoryId) currentMaxCategoryId = newCat.id;

                if (Array.isArray(newCat.skills)) {
                    newCat.skills = newCat.skills.map(skill => {
                        const newSkill = { ...skill };
                        if (newSkill.id === undefined) {
                            newSkill.id = nextSkillId++;
                        }
                        if (newSkill.id > currentMaxSkillId) currentMaxSkillId = newSkill.id;
                        return newSkill;
                    });
                } else {
                    newCat.skills = [];
                }
                return newCat;
            });
            // Ensure nextId counters are at least one greater than the highest ID found/assigned
            nextCategoryId = Math.max(nextCategoryId, currentMaxCategoryId + 1);
            nextSkillId = Math.max(nextSkillId, currentMaxSkillId + 1);

            rebuildCategoryPages();
            showPage(0); // Go back to the first page after loading
            updateUI();
        } else {
             // If skillCategories is not an array, initialize with empty data
            skillCategories = [];
            nextCategoryId = 0;
            nextSkillId = 0;
            rebuildCategoryPages();
            showPage(0);
            updateUI();
        }
    }


    // --- PNG METADATA HANDLING (inspired by png-chunks-encode/extract) ---

    // Helper to convert Data URL to Uint8Array
    function dataURLtoUint8Array(dataURL) {
        const base64 = dataURL.split(',')[1];
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    // Helper to convert Uint8Array to Data URL
    function uint8ArrayToDataURL(uint8Array, mimeType) {
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return `data:${mimeType};base64,` + btoa(binary);
    }

    // Basic CRC32 implementation (simplified for demonstration, a full one is complex)
    // This is a placeholder. A proper CRC32 implementation is crucial for valid PNGs.
    // For a real-world scenario, a pre-built CRC32 library would be used.
    function crc32(buf) {
        let crc = -1;
        for (let i = 0; i < buf.length; i++) {
            crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xFF];
        }
        return crc ^ (-1);
    }

    const crc32Table = [];
    (function() {
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let k = 0; k < 8; k++) {
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crc32Table[i] = c;
        }
    })();

    // Function to extract chunks (simplified)
    function extractChunks(buffer) {
        const chunks = [];
        let offset = 8; // Skip PNG signature

        while (offset < buffer.length) {
            const length = (buffer[offset] << 24) |
                           (buffer[offset + 1] << 16) |
                           (buffer[offset + 2] << 8) |
                            buffer[offset + 3];
            
            const type = String.fromCharCode(buffer[offset + 4], buffer[offset + 5], buffer[offset + 6], buffer[offset + 7]);
            const data = buffer.slice(offset + 8, offset + 8 + length);
            const crc = (buffer[offset + 8 + length] << 24) |
                        (buffer[offset + 8 + length + 1] << 16) |
                        (buffer[offset + 8 + length + 2] << 8) |
                         buffer[offset + 8 + length + 3];

            chunks.push({ name: type, data: data, length: length, crc: crc });
            offset += 12 + length; // 4 (length) + 4 (type) + length (data) + 4 (crc)
            if (type === 'IEND') break; // End of image
        }
        return chunks;
    }

    // Function to encode chunks (simplified)
    function encodeChunks(chunks) {
        // PNG signature
        const signature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        let totalLength = signature.length;
        chunks.forEach(chunk => {
            totalLength += 12 + chunk.data.length; // length + type + data + crc
        });

        const outputBuffer = new Uint8Array(totalLength);
        let offset = 0;

        outputBuffer.set(signature, offset);
        offset += signature.length;

        chunks.forEach(chunk => {
            // Length
            outputBuffer[offset++] = (chunk.data.length >>> 24) & 0xFF;
            outputBuffer[offset++] = (chunk.data.length >>> 16) & 0xFF;
            outputBuffer[offset++] = (chunk.data.length >>> 8) & 0xFF;
            outputBuffer[offset++] = (chunk.data.length >>> 0) & 0xFF;

            // Type
            const typeBytes = new TextEncoder().encode(chunk.name);
            outputBuffer.set(typeBytes, offset);
            offset += 4;

            // Data
            outputBuffer.set(chunk.data, offset);
            offset += chunk.data.length;

            // CRC (calculate for type + data)
            const crcBuffer = new Uint8Array(4 + chunk.data.length);
            crcBuffer.set(typeBytes, 0);
            crcBuffer.set(chunk.data, 4);
            const calculatedCrc = crc32(crcBuffer);

            outputBuffer[offset++] = (calculatedCrc >>> 24) & 0xFF;
            outputBuffer[offset++] = (calculatedCrc >>> 16) & 0xFF;
            outputBuffer[offset++] = (calculatedCrc >>> 8) & 0xFF;
            outputBuffer[offset++] = (calculatedCrc >>> 0) & 0xFF;
        });

        return outputBuffer;
    }

    function downloadCard() {
        const cardElement = cardWrapper.querySelector('.character-card');
        html2canvas(cardElement, { scale: 2, backgroundColor: null, useCORS: true })
            .then(canvas => {
                const characterData = collectCharacterData();
                const jsonData = JSON.stringify(characterData);
                
                // Convert canvas to Uint8Array (PNG data)
                const dataUrl = canvas.toDataURL('image/png');
                const originalPngBytes = dataURLtoUint8Array(dataUrl);

                // Extract existing chunks
                const chunks = extractChunks(originalPngBytes);

                // Create a tEXt chunk for the JSON data
                const keyword = 'VitruviumData';
                const textData = keyword + '\0' + jsonData; // keyword + null separator + text
                const textBytes = new TextEncoder().encode(textData);

                const tEXtChunk = {
                    name: 'tEXt',
                    data: textBytes,
                    length: textBytes.length // This will be calculated by encodeChunks, but good to have
                };

                // Find IEND chunk and insert tEXt chunk before it
                const iendIndex = chunks.findIndex(chunk => chunk.name === 'IEND');
                if (iendIndex !== -1) {
                    chunks.splice(iendIndex, 0, tEXtChunk);
                } else {
                    chunks.push(tEXtChunk); // Should not happen for valid PNGs
                }

                // Encode the modified chunks back into a PNG Uint8Array
                const newPngBytes = encodeChunks(chunks);
                
                // Convert the new Uint8Array back to a Data URL for download
                const newPngDataUrl = uint8ArrayToDataURL(newPngBytes, 'image/png');

                const link = document.createElement('a');
                const charName = document.getElementById('char-full-name').value.toLowerCase().replace(/ /g, '-') || 'character';
                link.download = `${charName}-card.png`;
                link.href = newPngDataUrl;
                link.click();
            });
    }

    function uploadCardFromPng(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            try {
                const pngBytes = dataURLtoUint8Array(dataUrl);
                const chunks = extractChunks(pngBytes);

                let foundData = null;
                for (const chunk of chunks) {
                    if (chunk.name === 'tEXt') {
                        const textDecoder = new TextDecoder();
                        const text = textDecoder.decode(chunk.data);
                        const nullSeparatorIndex = text.indexOf('\0');
                        if (nullSeparatorIndex !== -1) {
                            const keyword = text.substring(0, nullSeparatorIndex);
                            if (keyword === 'VitruviumData') {
                                const jsonDataString = text.substring(nullSeparatorIndex + 1);
                                foundData = JSON.parse(jsonDataString);
                                break;
                            }
                        }
                    }
                }

                if (foundData) {
                    applyLoadedData(foundData);
                } else {
                    alert("В этом PNG файле не найдено данных персонажа.");
                }

            } catch (error) {
                console.error("Error processing PNG:", error);
                alert("Ошибка при обработке PNG файла. Убедитесь, что это корректный PNG файл.");
            } finally {
                uploadPngInput.value = '';
            }
        };
        reader.readAsDataURL(file);
    }

    // --- ЗАПУСК ---
    init();
});
