const fs = require("node:fs/promises");
const { openDialog } = require("./dialogs.js");

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
            const fileContent = await fs.readFile(filePath, "utf-8");

            global.mainWindow.webContents.send("fileSelected", {
              file: filePath,
              code: fileContent,
            });
          }
        },
      },
    ],
  },
];

module.exports = { mainTemplate };
