const fs = require("node:fs/promises");
const { ipcRenderer } = require("electron");

let settingsFilePath = "";
let currentTheme = null;

export async function setTheme(themePath) {
    currentTheme = JSON.parse(await fs.readFile(themePath, "utf-8"));

    const $style = document.createElement("style");
    $style.textContent = `
        * { color: ${currentTheme.fontColor} }
        html, body {
            background-color: ${currentTheme.background};
            font-family: ${currentTheme.defaultFont};
        }

        .input {
            border: 1px solid ${currentTheme.settings.inputBorder};
            background-color: ${currentTheme.settings.inputBackground};
        }
    `;

    document.head.appendChild($style);

    $themeSelect.querySelectorAll("option").forEach((theme) => {
        if (theme.value == currentTheme.name)
            theme.selected = true;
    });
}

ipcRenderer.on("changedTheme", async (_, themePath) => {
    await setTheme(themePath);
});

ipcRenderer.on("settingsFile", async (_, settingsFile) => {
    settingsFilePath = settingsFile;

    const fileContent = JSON.parse(await fs.readFile(settingsFile, "utf-8"));

    for (const setting of settings) {
        setting.$element.value = fileContent[setting.jsonKey] ?? setting.defaultValue;
    }
});

const $themeSelect = document.getElementById("themeSelect");
const settings = [
    {
        $element: document.getElementById("fontSizeInput"),
        defaultValue: 14,
        jsonKey: "fontSize",
    },
    {
        $element: document.getElementById("fontFamilyInput"),
        defaultValue: "CascadiaCode",
        jsonKey: "fontFamily",
    },
    {
        $element: document.getElementById("fontLigaturesSelect"),
        defaultValue: "true",
        jsonKey: "fontLigatures",
    },
    {
        $element: document.getElementById("wordWrapSelect"),
        defaultValue: "on",
        jsonKey: "wordWrap",
    },
    {
        $element: document.getElementById("tabSizeInput"),
        defaultValue: 4,
        jsonKey: "tabSize",
    },
    {
        $element: document.getElementById("cursorStyleSelect"),
        defaultValue: "line",
        jsonKey: "cursorStyle",
    },
    {
        $element: document.getElementById("cursorBlinkingSelect"),
        defaultValue: "blink",
        jsonKey: "cursorBlinking",
    },
];

for (const setting of settings) {
    setting.$element.addEventListener("change", updateSettings);
}

$themeSelect.addEventListener("change", updateSettings);

async function updateSettings() {
    const fileContent = JSON.parse(await fs.readFile(settingsFilePath, "utf-8"));
    for (const setting of settings) {
        fileContent[setting.jsonKey] = setting.$element.value;
    }

    fileContent["theme"] = $themeSelect.value;

    const stringedContent = JSON.stringify(fileContent, null, 4);

    await fs.writeFile(settingsFilePath, stringedContent, { encoding: "utf-8" });
}

ipcRenderer.send("getThemeList");
ipcRenderer.on("gotThemeList", (_, themeList) => { 
    $themeSelect.innerHTML = "";

    for (const themeName of themeList) {
        const formatedName = themeName
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

        const $option = document.createElement("option");
        $option.value = themeName;
        $option.textContent = formatedName;

        $themeSelect.appendChild($option);
    }
});
