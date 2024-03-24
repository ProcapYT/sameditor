import { getLang } from "./getLang.js";

const fs = require("node:fs/promises");
const { join } = require("node:path");

export async function getIcon(fileExt, isFolder) {
  // get the language by the file extension
  let language = fileExt;

  if (!isFolder) {
    language = getLang(fileExt);
  }

  // define the icon vars
  let iconPath = null;
  let iconStyle = "width: 20px; aspect-ratio: 1 / 1; margin-right: 5px;";

  // get the json object
  const iconsJson = JSON.parse(
    await fs.readFile(join(__dirname, "data", "icons.json"))
  );

  // get the icon path
  if (isFolder) {
    for (const icon in iconsJson.folders) {
      if (icon === language) {
        iconPath = join(iconsJson.iconsPath, iconsJson.folders[icon]);
        break;
      }
    }

    if (!iconPath) {
      iconPath = join(iconsJson.iconsPath, iconsJson.folders.default);
    }
  } else {
    for (const icon in iconsJson.files) {
      if (icon === language) {
        iconPath = join(iconsJson.iconsPath, iconsJson.files[icon]);
        break;
      }
    }

    if (!iconPath) {
      iconPath = join(iconsJson.iconsPath, iconsJson.files.default);
    }
  }

  // return the icon path and style
  return [iconPath, iconStyle];
}
