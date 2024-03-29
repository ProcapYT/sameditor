const { openDialog } = require("./dialogs.js");
const { openSettings, openSettingsJson } = require("./settings.js");

const mainTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Open Folder",
        accelerator: "CmdOrCtrl+Shift+O",
        async click() {
          const selectedFolder = await openDialog(["openDirectory"]);

          if (selectedFolder) {
            global.mainWindow.webContents.send("folderSelected", {
              folder: selectedFolder,
            });
          }
        },
      },
      {
        label: "Open File",
        accelerator: "CmdOrCtrl+Shift+F",
        async click() {
          const filePath = await openDialog(["openFile"]);

          if (filePath) {
            global.mainWindow.webContents.send("fileSelected", {
              file: filePath,
            });
          }
        },
      },
    ],
  },
  {
    label: "Settings",
    submenu: [
      {
        label: "Open Settings",
        accelerator: "CmdOrCtrl+Shift+S",
        click() {
          openSettings();
        },
      },
      {
        label: "Open Settings File",
        accelerator: "CmdOrCtrl+Shift+P",
        click() {
          openSettingsJson();
        },
      },
    ],
  },
];

module.exports = { mainTemplate };
