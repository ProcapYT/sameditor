const { ipcMain, dialog } = require("electron");
const path = require("node:path");
const os = require("node:os");
const sudo = require("sudo-prompt");

ipcMain.on("moveToTrash", async (event, filePath) => {
    const { default: trash } = await import("trash");

    const fileName = filePath.substring(filePath.lastIndexOf(path.sep) + 1);

    const result = await dialog.showMessageBox({
        type: "question",
        buttons: ["Move to recycle bin", "Cancel"],
        title: 'Delete file',
        message: `Do you want to move the file "${fileName}" to the recycle bin?`,
        cancelId: 1,
        defaultId: 1,
        noLink: true,
    });

    if (result.response == 0) {
        try {
            await trash([filePath]);
        } catch {
            const options = {
                name: "Sameditor",
            };

            let command = "";
            const platform = os.platform();

            if (platform == "linux") {
                const trashPath = path.join(os.homedir(), ".local", "share", "Trash", "files");
                command = `mv "${filePath}" "${trashPath}"`;
            } else if (platform == "win32") {
                command = `node -e "require('recycle-bin').deleteSync(['${filePath}'])"`;
            }

            sudo.exec(command, options, (error) => {
                dialog.showErrorBox("Error", `Error moving ${fileName} to the recicle bin: ${error}`);
                return;
            });
        }

        event.reply("reloadFolder");
        event.reply("fileDeleted", filePath);
    }
});
