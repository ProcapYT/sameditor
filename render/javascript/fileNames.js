const fs = require("node:fs/promises");
const path = require("node:path");

export async function getFileIconByFileName(fileName, isDir = false) {
    if (isDir) {
        const dirIconsString = await fs.readFile(path.join(__dirname, "icons", "jsons", "dirs.json"));
        const dirIcons = JSON.parse(dirIconsString);

        for (const [folderName, path] of Object.entries(dirIcons)) {
            if (folderName === fileName) return path;
        }

        return dirIcons["default"];
    } else {
        const fileIconsString = await fs.readFile(path.join(__dirname, "icons", "jsons", "files.json"));
        const fileIcons = JSON.parse(fileIconsString);

        for (const [name, path] of Object.entries(fileIcons["fullNames"]))
            if (name === fileName) return path;

        const fileExtensiion = fileName.substring(fileName.lastIndexOf(".") + 1);
        if (fileExtensiion === -1) return fileIcons["default"];

        for (const [name, path] of Object.entries(fileIcons)) {
            if (name === fileExtensiion) return path;
        }

        return fileIcons["default"];
    }
}

export async function getSortedFiles(folderPath) {
    const dirs = [];
    const files = [];

    const folderFiles = await fs.readdir(folderPath);

    const filesPromises = folderFiles.map(async (file) => {
        const isDir = (await fs.stat(path.join(folderPath, file))).isDirectory();
        if (isDir) dirs.push(file);
        else files.push(file);
    });

    await Promise.all(filesPromises);

    files.sort();
    dirs.sort();

    const result = [...dirs, ...files];

    return result;
}

export function getLanguageByFileName(fileName) {
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex === -1) return "txt";
    const fileExtensiion = fileName.substring(dotIndex + 1);

    switch (fileExtensiion) {
        case "js":
        case "mjs":
        case "cjs":
        case "jsx":
            return "javascript";
        case "ts":
        case "tsx":
            return "typescript";
        case "cs":
            return "csharp";
        case "py":
            return "python";
        case "m":
            return "objective-c";
        case "md":
            return "markdown";
        case "rb":
            return "ruby";
        case "rs":
            return "rust";
        case "kt":
            return "kotlin";
        case "ps1":
            return "powershell";
        case "sh":
            return "shell";
        case "yml":
            return "yaml";
        default:
            return fileExtensiion;
    }
}
