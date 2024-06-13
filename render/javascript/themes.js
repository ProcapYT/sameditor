const fs = require("node:fs/promises");
const path = require("node:path");
const { ipcRenderer } = require("electron");

import { setEditorTheme } from "./editor.js";
import { createNewTab } from "./tabs.js";
import { getFileIconByFileName, getLanguageByFileName } from "./fileNames.js";

export let currentTheme;
export let currentThemePath;

async function getTheme(themePath) {
    const theme = JSON.parse(await fs.readFile(themePath));
    return theme;
}

export async function setTheme(themePath) {
    currentThemePath = themePath;
    currentTheme = await getTheme(themePath);

    const $styleSheet = document.createElement("style");
    $styleSheet.textContent = `
        * { color: ${currentTheme.fontColor}; }
        html, body {
            background-color: ${currentTheme.background};
            font-family: ${currentTheme.defaultFont};
        }

        .fileButton { background-color: ${currentTheme.fileButton}; }
        .fileButton:hover { background-color: ${currentTheme.fileButtonHover}; }
        .tab { background-color: ${currentTheme.tab}; }
        .tab.selected { background-color: ${currentTheme.tabSelected};}
        .tab:hover { background-color: ${currentTheme.tabHover}; }
        .tab.selected:hover { background-color: ${currentTheme.tabSelected}; }
        #fileContainer { backround-color: ${currentTheme.fileListBackground}; }
        #selectedFolder { background-color: ${currentTheme.header}; }
        #tabs { background-color: ${currentTheme.tabsContainer}; }
        #resizer { background-color: "transparent"; }
        #resizer:hover { background-color: ${currentTheme.resizerColor}; }
        #fileContainer { background-color: ${currentTheme.fileListBackground}; }

        .fileInput {
            background-color: ${currentTheme.fileInputBackground};
            border: 1px solid ${currentTheme.fileInputBorder};
        }

        #contextMenu { background-color: ${currentTheme.contextMenu.backgroundColor}; }
        .contextMenuOption { background-color: ${currentTheme["contextMenu"]["option.backgroundColor"]}; }
        .contextMenuOption:hover { background-color: ${currentTheme["contextMenu"]["option.hover"]}; }

        #background { color: ${currentTheme.backgroundFontColor}; }
    `;

    document.head.appendChild($styleSheet);

    setEditorTheme(currentTheme["editor.theme"], currentTheme.name);

    ipcRenderer.send("changedTheme", themePath);
}

/**
 * 
 * @param {string} themesFolder 
 */
async function createTheme(themesFolder) {
    const templatePath = path.join(__dirname, "javascript", "themeTemplate.json");
    const themeTemplate = JSON.parse(await fs.readFile(templatePath, "utf-8"));
    const stringedTemplate = JSON.stringify(themeTemplate, null, 4);

    const newPath = await createUniqueFile(themesFolder, "theme.json", stringedTemplate);

    const fileIconStyles = "width: 25px; aspect-ratio: 1 / 1;";
    const fileIconSrc = await getFileIconByFileName("theme.json");
    const lang = getLanguageByFileName("theme.json");
    const newName = newPath.substring(newPath.lastIndexOf(path.sep) + 1);
    await createNewTab(newName, fileIconStyles, fileIconSrc, newPath, stringedTemplate, lang, null);
}

/**
 * 
 * @param {string} folderPath 
 * @param {string} fileName 
 * @param {string} fileContent 
 */
async function createUniqueFile(folderPath, fileName, fileContent) {
    const folderFiles = await fs.readdir(folderPath);

    let counter = 0;
    const fileExt = fileName.substring(fileName.lastIndexOf(".") + 1);
    const baseName = fileName.substring(0, fileName.lastIndexOf("."));
    let newFileName = fileName;

    while (folderFiles.includes(newFileName)) {
        newFileName = `${baseName} (${counter}).${fileExt}`;
        counter++;
    }

    const filePath = path.join(folderPath, newFileName);
    fs.writeFile(filePath, fileContent, { encoding: "utf-8" });
    return filePath;
}

ipcRenderer.send("getTheme");
ipcRenderer.on("gotTheme", (_, themePath) => {
    setTheme(themePath);
});

ipcRenderer.on("createTheme", async (_, themePath) => {
    await createTheme(themePath);
});
