const { exec } = require("node:child_process");
const { ipcMain } = require("electron");

function openTerminal(directory) {
    let command = "";
    const platform = process.platform;

    if (!directory && platform == "win32") {
        directory = process.env.USERPROFILE;
    } else if (!directory) {
        directory = process.env.HOME;
    }

    switch (platform) {
        case "win32":
            command = `start powershell -NoExit -Command "Set-Location -Path '${directory}'"`;
            break;
        case "linux":
            command = `gnome-terminal --working-directory="${directory}" || xterm -e "cd '${directory}' && bash" || konsole --workdir "${directory}"`;
            break;
        case "darwin":
            command = `open -a Terminal "${directory}"`;
            break;
    }

    exec(command);
}

ipcMain.on("openTerminal", (_, directory) => {
    openTerminal(directory);
});

module.exports = { openTerminal };
