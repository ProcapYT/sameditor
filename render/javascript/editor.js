const { ipcRenderer } = require("electron");
const { emmetCSS, emmetHTML } = require("emmet-monaco-es");
const loader = require("load-monaco");
const fs = require("node:fs/promises");
const path = require("node:path");

const $editor = document.getElementById("editor");

export let currentEditor;

const editorSettings = {
    theme: "vs-dark",
    fontFamily: "CascadiaCode",
    fontSize: "14",
    fontLigatures: true,
    tabSize: 4,
    automaticLayout: true,
    cursorStyle: "line",
    cursorBlinking: "expand",
    wordWrap: "on",
};

export const monaco = await loader();

/**
 * 
 * @param {string} fileContent 
 * @param {string} language 
 * @param {string} openedFolder 
 * @param {string} filePath 
 * @returns {Promise<void>}
 */
export async function createEditor(fileContent, language, openedFolder, filePath) {
    if (currentEditor) {
        currentEditor.dispose();
        currentEditor = null;
        $editor.innerHTML = "";
    }

    currentEditor = monaco.editor.create($editor, {
        ...editorSettings,
        value: fileContent,
        language,
    });

    if (language == "html") {
        emmetHTML(monaco);
    }

    if (language == "css") {
        emmetCSS(monaco);
    }

    if (openedFolder != null) {
        const structure = await getDirectoryStructureWithOpenFile(openedFolder, filePath);
        initializeLanguageService(structure, language);
    }

    return currentEditor;
}

export function setEditorTheme(theme, themeName) {
    monaco.editor.defineTheme(themeName, theme);
    monaco.editor.setTheme(themeName);
    editorSettings.theme = themeName;
}

export function setLanguage(language, currentEditor) {
    if (currentEditor == null) {
        console.warn("language will not be changed beacose there is no editor");
        return;
    }

    const model = currentEditor.getModel();
    monaco.editor.setModelLanguage(model, language);
}

export function updateEditorOptions(options, editor = currentEditor) {
    for (const [ optionName, optionValue ] of Object.entries(options)) {
        editorSettings[optionName] = optionValue;
    }

    if (currentEditor == null) {
        return;
    }

    editor.updateOptions(options);
}

ipcRenderer.on("updateEditorOptions", (_, editorOptions) => {
    updateEditorOptions(editorOptions);
});

ipcRenderer.send("getSettings");
ipcRenderer.once("gotSettings", (_, settings) => {
    updateEditorOptions(settings);
});

/**
 * @param {string} dirPath 
 * @param {string} openFilePath
 * @returns {Promise<Object>} 
 */
async function getDirectoryStructureWithOpenFile(dirPath, openFilePath) {
    let structure = [];
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
            structure.push({
                type: 'directory',
                name: item.name,
                path: fullPath,
                children: await getDirectoryStructureWithOpenFile(fullPath, openFilePath)
            });
        } else {
            structure.push({
                type: 'file',
                name: item.name,
                path: fullPath,
                isOpen: fullPath === openFilePath
            });
        }
    }

    return structure;
}

/**
 * 
 * @param {Object} projectStructure 
 * @returns {void}
 */
function initializeLanguageService(projectStructure, language) {
    monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: () => {
            const suggestions = [];

            function traverse(structure) {
                for (const item of structure) {
                    if (item.type === 'file') {
                        suggestions.push({
                            label: item.name,
                            kind: monaco.languages.CompletionItemKind.File,
                            insertText: item.name,
                            detail: item.path,
                            documentation: item.isOpen ? "Archivo abierto actualmente" : ""
                        });
                    } else if (item.type === 'directory') {
                        traverse(item.children);
                    }
                }
            }

            traverse(projectStructure);

            return { suggestions: suggestions };
        }
    });
}
