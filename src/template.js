const { openDialog } = require("./dialogs.js");
const { createSettingsWindow } = require("./settings.js");
const { openTerminal } = require("./terminal.js");
const { app } = require("electron");
const path = require("node:path");

global.currentFolder = null;

const template = [
    {
        label: "File",
        submenu: [
            {
                label: "Open Folder",
                accelerator: "Ctrl+Shift+O",
                async click() {
                    const folderPath = await openDialog(true);
                    global.mainWindow.webContents.send("folderSelected", folderPath);
                    if (folderPath == null) return;
                    currentFolder = folderPath;
                },
            },
            {
                label: "Open File",
                accelerator: "Ctrl+Shift+F",
                async click() {
                    const filePath = await openDialog(false);
                    global.mainWindow.webContents.send("fileSelected", filePath);
                }
            },
            {
                label: "Exit",
                click() {
                    app.quit();
                }
            }
        ]
    },
    {
        label: "Settings",
        submenu: [
            {
                label: "Open Settings",
                accelerator: "Ctrl+,",
                click() {
                    createSettingsWindow();
                }
            },
            {
                label: "Open Settings File",
                click() {
                    global.mainWindow.webContents.send("fileSelected", global.settingsFilePath);
                }
            }
        ]
    },
    {
        label: "Themes",
        submenu: [
            {
                label: "Create New Theme",
                click() {
                    const themesFolder = app.isPackaged ? path.join(app.getPath("userData"), "themes") : path.join(__dirname, ".sameditor", "themes");
                    global.mainWindow.webContents.send("createTheme", themesFolder);
                }
            },
            {
                label: "Open Themes Folder",
                click() {
                    const themesFolder = app.isPackaged ? path.join(app.getPath("userData"), "themes") : path.join(__dirname, ".sameditor", "themes");
                    global.mainWindow.webContents.send("folderSelected", themesFolder);
                }
            }
        ]
    },
    {
        label: "Terminal",
        submenu: [
            {
                label: "Open new terminal",
                accelerator: "Ctrl+Shift+N",
                click() {
                    openTerminal(currentFolder);
                }
            }
        ]
    }
];

module.exports = { template };
