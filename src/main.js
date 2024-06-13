const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("node:path");
const { template } = require("./template.js");
const fs = require("node:fs/promises");

global.mainWindow = null;
function createMainWindow() {
    mainWindow = new BrowserWindow({
        icon: path.join(__dirname, "..", "assets", "icon.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.maximize();
    mainWindow.loadFile(path.join(__dirname, "..", "render", "index.html"));

    mainWindow.on("close", app.quit);

    if (!app.isPackaged) mainWindow.openDevTools();

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on("rendered", async () => {
    if (process.argv[app.isPackaged ? 1 : 2] == null) return;
    const filePath = path.join(process.cwd(), process.argv[app.isPackaged ? 1 : 2]);

    if (exsistsFile(filePath)) {
        const isDir = (await fs.stat(filePath)).isDirectory();
        
        if (isDir) {
            global.currentFolder = filePath;
            mainWindow.webContents.send("folderSelected", filePath);
        } else {
            mainWindow.webContents.send("fileSelected", filePath);
        }
    }
});

async function exsistsFile(filePath) {
    try {
        await fs.stat(filePath);
        return true;
    } catch {
        return false;
    }
}

app.on("ready", createMainWindow);

require("./dialogs.js");
require("./trash.js");
require("./template.js");
require("./settings.js");
