const { ipcMain } = require("electron");
const { join } = require("node:path");
const { rimraf } = require("rimraf");
const fs = require("node:fs/promises");
const readdirSort = require("./readdirSort.js");

ipcMain.on("deleteFile", async (event, data) => {
  await fs.unlink(data.file);

  event.reply("folderSelected", {
    folder: data.folder,
  });
});

ipcMain.on("deleteFolder", async (event, data) => {
  await rimraf(data.file);

  event.reply("folderSelected", {
    folder: data.folder,
  });
});

ipcMain.on("saveCode", async (event, data) => {
  await fs.writeFile(data.file, data.code, "utf-8");
});

ipcMain.on("rename", async (event, data) => {
  const folderFiles = await fs.readdir(data.folder);

  if (!folderFiles.includes(data.newName)) {
    await fs.rename(data.oldName, data.newName);

    event.reply("folderSelected", {
      folder: data.folder,
    });
  }
});

ipcMain.on("rename2", async (event, data) => {
  const folderFiles = await fs.readdir(data.folder);

  if (!folderFiles.includes(data.newName)) {
    await fs.rename(data.oldName, data.newName);

    event.reply("folderSelected", {
      folder: data.mainFolder,
    });
  }
});

ipcMain.on("listFiles", async (event, data) => {
  const folderFiles = await readdirSort(data.folder);

  event.reply("filesListed", folderFiles);
});

ipcMain.on("createFile", async (event, data) => {
  const folderFiles = await fs.readdir(data.filePath);

  if (!folderFiles.includes(data.fileName)) {
    await fs.writeFile(join(data.filePath, data.fileName), "", "utf-8");

    event.reply("folderSelected", {
      folder: data.mainFolder,
    });
  }
});

ipcMain.on("createFolder", async (event, data) => {
  const folderFiles = await fs.readdir(data.filePath);

  if (!folderFiles.includes(data.fileName)) {
    await fs.mkdir(join(data.filePath, data.fileName));

    event.reply("folderSelected", {
      folder: data.mainFolder,
    });
  }
});

ipcMain.on("reload", async (event, folder) => {
  event.reply("folderSelected", {
    folder,
  });
});

async function fileExists(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = { fileExists };
