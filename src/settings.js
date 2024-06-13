const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

let currentThemePath = null;

global.global.settingsFilePath = app.isPackaged ? path.join(app.getPath("userData"), "settings.json") : path.join(__dirname, ".sameditor", "settings.json");

global.settingsWindow = null;
function createSettingsWindow() {
    settingsWindow = new BrowserWindow({
        width: 400,
        height: 800,
        icon: path.join(__dirname, "..", "assets", "icon.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    settingsWindow.loadFile(path.join(__dirname, "..", "render", "settings", "index.html"));

    settingsWindow.setMenu(null);

    if (!app.isPackaged) settingsWindow.openDevTools();

    global.settingsWindow.webContents.on("did-finish-load", () => {
        global.settingsWindow.webContents.send("changedTheme", currentThemePath);
        global.settingsWindow.webContents.send("settingsFile", global.settingsFilePath);
    });
}

ipcMain.on("changedTheme", (_, themePath) => {
    currentThemePath = themePath;

    if (!global.settingsWindow) return;
    global.settingsWindow.webContents.send("changedTheme", themePath);
});

ipcMain.on("updateEditorOptions", (_, editorOptions) => {
    global.mainWindow.webContents.send("updateEditorOptions", editorOptions);
});

async function fileExsists(filePath) {
    try {
        await fs.stat(filePath);
        return true;
    } catch {
        return false;
    }
}

const defaultSettings = {
    theme: "dark",
    fontLigatures: "true",
    fontFamily: "CascadiaCode",
    fontSize: 14,
    tabSize: 4,
    cursorStyle: "line",
    cursorBlinking: "blink",
    wordWrap: "on",
};

async function createSettingsFile() {
    if (!await fileExsists(global.settingsFilePath)) {
        const stringifiedSettings = JSON.stringify(defaultSettings, null, 4);
        await fs.writeFile(global.settingsFilePath, stringifiedSettings, { encoding: "utf-8" });
    }

    const themesFolder = path.join(app.getPath("userData"), "themes");
    const localThemesFolder = path.join(__dirname, ".sameditor", "themes");
    if (!await fileExsists(themesFolder) && app.isPackaged) {
        await fs.mkdir(themesFolder);
        const themes = await fs.readdir(localThemesFolder);

        const themesPromise = themes.map(async (theme) => {
            await fs.copyFile(path.join(localThemesFolder, theme), path.join(themesFolder, theme));
        });

        await Promise.all(themesPromise);
    }

    watchFile(global.global.settingsFilePath, async () => {
        global.mainWindow.webContents.send("gotTheme", await getTheme());
        await sendSettings();
    });
}

ipcMain.on("getTheme", async (event) => {
    const themePath = await getTheme();

    event.reply("gotTheme", themePath);
});

async function getTheme() {
    if (!global.settingsFilePath) return themePath;
    const settingsFile = JSON.parse(await fs.readFile(global.settingsFilePath, "utf-8"));
    const themeFolder = app.isPackaged ? path.join(app.getPath("userData"), "themes") : path.join(__dirname, ".sameditor", "themes");

    let themePath = path.join(themeFolder, "dark.json");
    const themes = await fs.readdir(themeFolder);
    const themesPromise = themes.map(async (theme) => {
        const themeContent = await fs.readFile(path.join(themeFolder, theme), "utf-8")
        if (JSON.parse(themeContent).name == settingsFile.theme) {
            themePath = path.join(themeFolder, theme);
        }
    });

    await Promise.all(themesPromise);

    return themePath;
}

async function getThemeList() {
    const themeFolder = app.isPackaged ? path.join(app.getPath("userData"), "themes") : path.join(__dirname, ".sameditor", "themes");

    const themes = await fs.readdir(themeFolder);
    const themeNames = [];
    const themesPromise = themes.map(async (theme) => {
        const themeContent = await fs.readFile(path.join(themeFolder, theme), "utf-8")
        themeNames.push(JSON.parse(themeContent).name);
    });

    await Promise.all(themesPromise);

    return themeNames;
}

ipcMain.on("getThemeList", async (event) => {
    event.reply("gotThemeList", await getThemeList());
});

ipcMain.on("getSettings", async (event) => {
    const settingsFile = JSON.parse(await fs.readFile(global.settingsFilePath, "utf-8"));
    event.reply("gotSettings", settingsFile);
});

async function sendSettings() {
    const settingsFile = JSON.parse(await fs.readFile(global.settingsFilePath, "utf-8"));
    global.mainWindow.webContents.send("updateEditorOptions", settingsFile);
}

function watchFile(filePath, onChange) {
    let currentValue = "";
    let prevValue = "";

    const fileInterval = setInterval(async () => {
        currentValue = await fs.readFile(filePath, "utf-8");

        if (currentValue != prevValue) {
            onChange();
            prevValue = currentValue;
        }
    });

    const watcher = {
        close() {
            clearInterval(fileInterval);
        },
        filePath,
    };

    return watcher;
}

createSettingsFile();

module.exports = { createSettingsWindow };
