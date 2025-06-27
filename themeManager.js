// themeManager.js
// Handles theme switching and custom JSON style application

let theme = '/themes/dark.json';
let customStyles = {};

let _notify = null;

export function setNotifier(notifier) {
    _notify = notifier;
}

export function setTheme(newTheme) {
    theme = newTheme;
}

export function setCustomStyles(styles) {
    customStyles = styles;
}

export function getTheme() {
    return theme;
}

export function getCustomStyles() {
    return customStyles;
}

export async function handleThemeChange(
    event,
    characterCard,
    jsonStyleContainer,
    jsonInputArea,
    applyStylesFromJson,
) {
    if (!characterCard) return;
    const selectedTheme = event.target.value;
    if (selectedTheme === 'custom') {
        setTheme(selectedTheme);
        jsonStyleContainer.style.display = 'block';
        applyCustomStylesFromJson(jsonInputArea, characterCard, applyStylesFromJson);
    } else {
        jsonStyleContainer.style.display = 'none';
        if (selectedTheme && typeof selectedTheme === 'string' && selectedTheme.endsWith('.json')) {
            setTheme(selectedTheme);
            const response = await fetch(selectedTheme);
            const styles = await response.json();
            applyStylesFromJson(styles, characterCard);
        }
    }
}

export function applyCustomStylesFromJson(jsonInputArea, characterCard, applyStylesFromJson) {
    try {
        const jsonString = jsonInputArea.value;
        if (jsonString.trim() === '') return;
        const styles = JSON.parse(jsonString);
        applyStylesFromJson(styles, characterCard);
        setCustomStyles(styles);
    } catch (error) {
        if (_notify) _notify('error', 'Error parsing or applying custom styles JSON.');
        console.error('Error parsing or applying custom styles JSON:', error);
    }
}

export function applyStylesFromJson(styles, characterCard) {
    if (!characterCard) return;
    for (const key in styles) {
        if (styles.hasOwnProperty(key)) {
            const value = styles[key];
            const cssVarName = '--' + key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
            characterCard.style.setProperty(cssVarName, value);
        }
    }
}
