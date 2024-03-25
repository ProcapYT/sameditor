const { BrowserWindow, app, ipcMain } = require("electron");
const { join } = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");

const { fileExists } = require("./filesManagement.js");
const { watchFile } = require("./watchFile.js");

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

    if (settingsWindow) {
      settingsWindow.webContents.send("currentConfig", JSON.parse(jsonConfig));
    }
  } else {
    const basicSettings = {
      theme: "vs-dark",
      cursorStyle: "line",
      cursorBlinking: "blink",
      fontFamily: "CascadiaCode",
      fontSize: 16,
    };

    await fs.writeFile(jsonConfigPath, JSON.stringify(basicSettings, null, 2));

    global.mainWindow.webContents.send("currentConfig", basicSettings);
  }
}

async function setSetting(setting, settingValue) {
  const jsonConfig = JSON.parse(
    await fs.readFile(jsonConfigPath, { encoding: "utf-8" })
  );

  jsonConfig[setting] = settingValue;

  await fs.writeFile(jsonConfigPath, JSON.stringify(jsonConfig, null, 2));
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

async function openSettingsJson() {
  await formatSettingsJson();

  global.mainWindow.webContents.send("openSettingsJson", jsonConfigPath);
}

async function formatSettingsJson() {
  const jsonObj = JSON.parse(await fs.readFile(jsonConfigPath, "utf8"));
  const formatedJson = JSON.stringify(jsonObj, null, 2);

  await fs.writeFile(jsonConfigPath, formatedJson);
}

ipcMain.on("updatedConfig", async (event, settings) => {
  global.mainWindow.webContents.send("currentConfig", settings);

  for (const [setting, settingValue] of Object.entries(settings)) {
    setSetting(setting, settingValue);
  }
});

ipcMain.on("settingsRendered", loadSettings);

const watchFilePromise = new Promise((resolve) => {
  const watchFileInterval = setInterval(async () => {
    if (await fileExists(jsonConfigPath)) {
      resolve();
      clearInterval(watchFileInterval);
    }
  }, 100);
});

watchFilePromise.then(() => {
  watchFile(jsonConfigPath, loadSettings);
});

module.exports = { openSettings, loadSettings, openSettingsJson };
