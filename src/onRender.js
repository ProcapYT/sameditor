const fs = require("node:fs/promises");
const { ipcMain } = require("electron");
const { join } = require("node:path");

async function openFolder(path) {
  const stats = await fs.stat(path);

  if (stats.isDirectory()) {
    global.mainWindow.webContents.send("folderSelected", {
      folder: path,
    });
  } else {
    global.mainWindow.webContents.send("fileSelected", {
      file: path,
    });
  }
}

ipcMain.on("rendered", async () => {
  let processArgs;

  if (global.app.isPackaged) {
    processArgs = process.argv[1];
  } else {
    processArgs = process.argv[2];
  }

  if (processArgs !== undefined) {
    if (processArgs.startsWith("/")) {
      await openFolder(processArgs);
    } else {
      await openFolder(join(process.cwd(), processArgs));
    }
  }
});
