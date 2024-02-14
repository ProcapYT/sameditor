const { dialog } = require("electron");

async function openDialog(dialogProperties) {
  const result = await dialog.showOpenDialog({
    properties: dialogProperties,
  });

  if (!result.canceled) {
    return result.filePaths[0];
  } else {
    return null;
  }
}

module.exports = { openDialog };
