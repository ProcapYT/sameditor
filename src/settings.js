const { BrowserWindow, app, ipcMain } = require("electron");
const { join } = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");

const { fileExists } = require("./filesManagement.js");

let jsonConfigPath = join(__dirname, "settings.json");
let folderConfigPath = __dirname;

if (app.isPackaged) {
  folderConfigPath = join(os.homedir(), ".sameditor");
  jsonConfigPath = join(folderConfigPath, "settings.json");
}

let settingsWindow;

async function mkdirExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {}
}

async function loadSettings() {
  if (app.isPackaged) {
    await mkdirExists(folderConfigPath);
  }

  if (await fileExists(jsonConfigPath)) {
    const jsonConfig = await fs.readFile(jsonConfigPath, { encoding: "utf-8" });

    global.mainWindow.webContents.send("currentConfig", JSON.parse(jsonConfig));
    settingsWindow.webContents.send("currentConfig", JSON.parse(jsonConfig));
  } else {
    const basicSettings = {
      theme: "vs-dark",
      cursorStyle: "line",
      cursorBlinking: "blink",
    };

    await fs.writeFile(jsonConfigPath, JSON.stringify(basicSettings));

    global.mainWindow.webContents.send("currentConfig", basicSettings);
  }
}

async function setSetting(setting, settingValue) {
  const jsonConfig = JSON.parse(
    await fs.readFile(jsonConfigPath, { encoding: "utf-8" })
  );

  jsonConfig[setting] = settingValue;

  await fs.writeFile(jsonConfigPath, JSON.stringify(jsonConfig));
}

ipcMain.on("changedSetting", (event, settings) => {
  setSetting(settings.setting, settings.settingValue);
});

function openSettings() {
  settingsWindow = new BrowserWindow({
    width: 200,
    height: 500,
    icon: join(__dirname, "..", "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  settingsWindow.loadFile(
    join(__dirname, "..", "render", "settings", "index.html")
  );

  if (!app.isPackaged) {
    settingsWindow.openDevTools();
  }

  settingsWindow.menuBarVisible = false;
}

ipcMain.on("updatedConfig", async (event, settings) => {
  global.mainWindow.webContents.send("currentConfig", settings);

  for (const [setting, settingValue] of Object.entries(settings)) {
    setSetting(setting, settingValue);
  }
});

ipcMain.on("settingsRendered", loadSettings);

module.exports = { openSettings, loadSettings };
