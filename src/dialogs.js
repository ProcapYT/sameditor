const { dialog, ipcMain } = require("electron");

async function openDialog(dir) {
    const result = await dialog.showOpenDialog({
        properties: [dir ? "openDirectory" : "openFile"],
    });

    return result.filePaths[0];
}

ipcMain.on("openDialogMessage", async (event, settings) => {
    const result = await dialog.showMessageBox(settings);

    event.reply("dialogMessageResult", settings.buttons[result.response]);
});

module.exports = { openDialog };
