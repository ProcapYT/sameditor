const { app, BrowserWindow, Menu } = require("electron");
const { join } = require("node:path");
const { exec } = require("node:child_process");

const { mainTemplate } = require("./template.js");

global.mainWindow;

app.disableHardwareAcceleration();

function createWindow() {
  global.mainWindow = new BrowserWindow({
    icon: join(__dirname, "..", "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  global.mainWindow.maximize();
  global.mainWindow.setFullScreenable(false);

  global.mainWindow.removeMenu();

  if (!app.isPackaged) {
    global.mainWindow.openDevTools();
  }

  global.mainWindow.loadFile(join(__dirname, "..", "render", "index.html"));

  const mainMenu = Menu.buildFromTemplate(mainTemplate);
  Menu.setApplicationMenu(mainMenu);
}

app.whenReady().then(() => {
  const originalProcessArg = process.argv[1];

  if (app.isPackaged) {
    if (!process.argv.includes("--second")) {
      const sameditorProcess = exec(
        `sameditor ${originalProcessArg} --second`,
        { shell: true },
        (err) => {
          if (err) {
            console.error(err);
            process.exit(1);
          }
        }
      );

      sameditorProcess.unref();
      app.quit();
    } else {
      createWindow();
    }
  } else {
    createWindow();
  }
});

global.app = app;

require("./onRender.js");
require("./dialogs.js");
require("./filesManagement.js");
