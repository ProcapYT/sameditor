const fs = require("node:fs/promises");
const path = require("node:path");
const { ipcRenderer } = require("electron");

const $fileContainer = document.getElementById("fileContainer");
const $selectedFolderName = document.getElementById("selectedFolderName");
const $createFileButton = document.getElementById("createFileButton");
const $createFolderButton = document.getElementById("createFolderButton");
const $reloadFolderButton = document.getElementById("reloadFolderButton");
const $closeFoldersButton = document.getElementById("closeFoldersButton");

import { createNewTab, changedFileName, deletedFile } from "./tabs.js";
import { ContextMenu } from "./contextMenu.js";
import { getFileIconByFileName, getLanguageByFileName, getSortedFiles } from "./fileNames.js";

let $lastClickedFolder = null;
let $lastClickedButton = null;

let currentWatcher = null;

const openedFolders = [];
let currentFolder = null;

async function openFolder(folderPath, indentation, $parent) {
    const folderFiles = await getSortedFiles(folderPath);
    for (const file of folderFiles) {
        const fullFilePath = path.join(folderPath, file);
        const isDir = (await fs.stat(fullFilePath)).isDirectory();

        const $fileButton = document.createElement("button");
        const $filePar = document.createElement("p");
        const $fileIcon = document.createElement("img");
        const $dirIcon = document.createElement("i");
        const $fileInput = document.createElement("input");

        $fileButton.classList.add("button", "fileButton");
        $filePar.classList.add("filePar");
        $fileIcon.classList.add("fileIcon");
        $dirIcon.classList.add("fa-solid", "fa-chevron-right");
        $fileInput.classList.add("hidden", "fileInput");

        $dirIcon.style.transition = "0.5s transform";

        $fileInput.type = "text";

        $fileIcon.style = "width: 15px; aspect-ratio: 1 / 1;";
        $filePar.style.marginLeft = 15 * indentation + "px";

        $fileIcon.src = await getFileIconByFileName(file, isDir);
        $fileIcon.style.marginLeft = isDir ? "5px" : "15px";

        $fileButton.dataset.folderOpened = "false";

        if (isDir)
            $filePar.appendChild($dirIcon);

        $filePar.appendChild($fileIcon);

        $fileButton.addEventListener("contextmenu", (e) => {
            e.stopPropagation();
            ContextMenu.removeAllOptions();

            if (isDir) {
                ContextMenu.addOption("Create File", async () => {
                    if ($fileButton.dataset.folderOpened == "false")
                        $fileButton.click();
                
                    await createFile(fullFilePath, indentation + 1, false, $fileButton);
                });

                ContextMenu.addOption("Create Folder", async () => {
                    if ($fileButton.dataset.folderOpened == "false")
                        $fileButton.click();
                    
                    await createFile(fullFilePath, indentation + 1, true, $fileButton);
                });
            }

            ContextMenu.addOption("Rename", renameFile);
            ContextMenu.addOption("Delete", deleteFile);



            ContextMenu.showContextMenu(e);
        });

        function deleteFile() {
            ipcRenderer.send("moveToTrash", fullFilePath);
        }

        function renameFile() {
            $fileInput.classList.remove("hidden");
            $fileInput.value = file;
            $fileInput.focus();
            $fileInput.select();
            
            removeParText($filePar);

            async function handleInputSubmition() {
                if ($fileInput.value != "" && $fileInput.value != file) {
                    try {
                        await fs.rename(fullFilePath, path.join(folderPath, $fileInput.value));
                        if (isDir && openedFolders.includes(fullFilePath)) {
                            const thisFolderIndex = openedFolders.indexOf(fullFilePath);
                            openedFolders[thisFolderIndex] = path.join(folderPath, $fileInput.value);

                            for (let i = 0; i < openedFolders.length; i++) {
                                const folder = openedFolders[i];
                                if (folder.startsWith(fullFilePath + path.sep)) {
                                    const substringedFolder = folder.substring(fullFilePath.length);
                                    openedFolders[i] = path.join(openedFolders[thisFolderIndex],substringedFolder);
                                }
                            }
                        }

                        const newIconPath = await getFileIconByFileName($fileInput.value, false);
                        const newLang = await getLanguageByFileName($fileInput.value);
                        changedFileName(path.join(folderPath, $fileInput.value), fullFilePath, newIconPath, newLang);
                    } catch {
                        cancelRename();
                        return;
                    }

                    $fileContainer.innerHTML = "";
                    await openFolder(currentFolder, 1, $fileContainer);
                } else {
                    cancelRename();
                }

                function cancelRename() {
                    if ($fileInput.classList.contains("hidden")) return;
                    $filePar.appendChild(document.createTextNode(file));
                    $fileInput.classList.add("hidden");
                }
            }

            $fileInput.addEventListener("keydown", async (e) => {
                if (e.key == "Enter") handleInputSubmition();
            });

            $fileInput.addEventListener("input", async () => {
                $fileIcon.src = await getFileIconByFileName($fileInput.value, isDir);
            });

            $fileInput.addEventListener("blur", handleInputSubmition);

            $fileInput.addEventListener("click", (e) => {
                e.stopPropagation();
            });

            function removeParText($par) {
                Array.from($par.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        node.remove();
                    }
                });
            }
        }

        $fileButton.delete = deleteFile;
        $fileButton.rename = renameFile;

        $fileButton.addEventListener("click", async (e) => {
            e.stopPropagation();
        
            if (!isDir) {
                const fileContent = await fs.readFile(fullFilePath, "utf-8");
                const lang = getLanguageByFileName(file);
                const fileIconSrc = $fileIcon.src;
                const fileIconStyles = "width: 25px; aspect-ratio: 1 / 1;";
                await createNewTab(file, fileIconStyles, fileIconSrc, fullFilePath, fileContent, lang, currentFolder);
            } else {
                if ($dirIcon.classList.contains("opened")) {
                    $fileButton.innerHTML = "";
                    $fileButton.appendChild($filePar);
                    $dirIcon.classList.remove("opened");
                    
                    openedFolders.splice(openedFolders.indexOf(fullFilePath), 1);
                    for (const folder of openedFolders) {
                        if (folder.startsWith(fullFilePath)) {
                            openedFolders.splice(openedFolders.indexOf(folder, 1));
                        }
                    }

                    $fileButton.dataset.folderOpened = "false";
                } else {
                    $dirIcon.classList.add("opened");
                    openFolder(fullFilePath, indentation + 1, $fileButton);

                    if (!openedFolders.includes(fullFilePath))
                        openedFolders.push(fullFilePath);

                    $fileButton.dataset.folderOpened = "true";
                }

                $lastClickedFolder = $fileButton;
            }

            $lastClickedButton = $fileButton;
        });

        $filePar.appendChild(document.createTextNode(file));
        $filePar.appendChild($fileInput);

        $fileButton.appendChild($filePar);
        $parent.appendChild($fileButton);

        $fileButton.dataset.filePath = fullFilePath;
        $fileButton.dataset.indentation = indentation;

        if (openedFolders.includes(fullFilePath)) {
            $fileButton.click();   
        }
    }
}

async function createFile(folderPath, indentation, isDir, $parent) {
    const $fileButton = document.createElement("button");
    const $fileIcon = document.createElement("img");
    const $dirIcon = document.createElement("i");
    const $fileInput = document.createElement("input");
    const $filePar = document.createElement("p");

    $dirIcon.classList.add("fa-solid", "fa-chevron-right");
    $fileIcon.classList.add("fileIcon");
    $fileInput.classList.add("fileInput");
    $filePar.classList.add("filePar");
    $fileButton.classList.add("fileButton");

    $fileIcon.style = "width: 15px; aspect-ratio: 1 / 1;";
    $filePar.style.marginLeft = 15 * indentation + "px";

    $fileIcon.style.marginLeft = isDir ? "5px" : "15px";
    $fileIcon.src = await getFileIconByFileName($fileInput.value, isDir); 

    if (isDir) 
        $filePar.appendChild($dirIcon);

    $filePar.appendChild($fileIcon);
    $filePar.appendChild($fileInput);
    $fileButton.appendChild($filePar);
    $parent.appendChild($fileButton);

    $fileInput.focus();

    async function handleSubmition() {
        if ($fileInput.value != "") {
            try {
                if (isDir)
                    await fs.mkdir(path.join(folderPath, $fileInput.value));
                else {
                    await fs.writeFile(path.join(folderPath, $fileInput.value), "", {encoding: "utf-8"});
                    const fileIconStyles = "width: 25px; aspect-ratio: 1 / 1;";
                    const language = await getLanguageByFileName($fileInput.value);
                    await createNewTab($fileInput.value, fileIconStyles, $fileIcon.src, path.join(folderPath, $fileInput.value), "", language, currentFolder);
                }

                $fileContainer.innerHTML = "";
                await openFolder(currentFolder, 1, $fileContainer);
            } catch {
                cancelCreation();
            }
        } else {
            cancelCreation();
        }
    }

    function cancelCreation() {
        try {
            $fileButton.remove();
        } catch {};
    }

    $fileInput.addEventListener("keydown", (e) => {
        if (e.key == "Enter") handleSubmition();
    });

    $fileInput.addEventListener("blur", cancelCreation);

    $fileInput.addEventListener("input", async () => {
        $fileIcon.src = await getFileIconByFileName($fileInput.value, isDir);
    });
}

async function reopenFolder() {
    $fileContainer.innerHTML = "";
    await openFolder(currentFolder, 1, $fileContainer);
}

$fileContainer.addEventListener("click", () => {
    $lastClickedFolder = null;
});

$createFileButton.addEventListener("click", async () => {
    let folderPath = currentFolder;
    let indentation = 1;
    let $parent = $fileContainer;

    if ($lastClickedFolder != null) {
        folderPath = $lastClickedFolder.dataset.filePath;
        indentation = parseInt($lastClickedFolder.dataset.indentation) + 1;
        $parent = $lastClickedFolder;

        if ($lastClickedFolder.dataset.folderOpened == "false") $lastClickedFolder.click();
    }

    await createFile(folderPath, indentation, false, $parent);
});

$createFolderButton.addEventListener("click", async () => {
    let folderPath = currentFolder;
    let indentation = 1;
    let $parent = $fileContainer;

    if ($lastClickedFolder != null) {
        folderPath = $lastClickedFolder.dataset.filePath;
        indentation = parseInt($lastClickedFolder.dataset.indentation) + 1;
        $parent = $lastClickedFolder;

        if ($lastClickedFolder.dataset.folderOpened == "false") $lastClickedFolder.click();
    }

    await createFile(folderPath, indentation, true, $parent);
});

$reloadFolderButton.addEventListener("click", reopenFolder);

$closeFoldersButton.addEventListener("click", async () => {
    openedFolders.splice(0, openedFolders.length);
    reopenFolder();
});

ipcRenderer.on("folderSelected", async (_, folderPath) => {
    if (folderPath == null) return;

    $fileContainer.innerHTML = "";

    const lastSlash = folderPath.lastIndexOf(path.sep);
    const folderName = folderPath.substring(lastSlash + 1);

    document.title = `Sameditor - ${folderName}`;

    $selectedFolderName.textContent = folderName;

    openFolder(folderPath, 1, $fileContainer);

    currentFolder = folderPath;

    $createFileButton.classList.remove("hidden");
    $createFolderButton.classList.remove("hidden");
    $reloadFolderButton.classList.remove("hidden");
    $closeFoldersButton.classList.remove("hidden");

    if (currentWatcher != null) {
        currentWatcher.close();
        currentWatcher = null;
    }

    currentWatcher = await watchFolder(folderPath, async () => {
        await reopenFolder();
        await deletedFile();
    });
});

ipcRenderer.on("reloadFolder", reopenFolder);

ipcRenderer.on("fileSelected", async (_, filePath) => {
    if (filePath == null) return;

    const fileName = filePath.substring(filePath.lastIndexOf(path.sep) + 1);
    const fileIconStyles = "width: 25px; aspect-ratio: 1 / 1;";
    const fileIconSrc = await getFileIconByFileName(fileName);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const language = getLanguageByFileName(fileName);
    await createNewTab(fileName, fileIconStyles, fileIconSrc, filePath, fileContent, language, currentFolder);
});

ipcRenderer.on("fileDeleted", () => {
    deletedFile();
});

document.addEventListener("keydown", (e) => {
    if ($lastClickedButton != null && $lastClickedButton == document.activeElement) {
        if (e.key == "Delete") {
           $lastClickedButton.delete();
           return;
        }

        if (e.key == "F2") {
            $lastClickedButton.rename();
            return;
        }
    }

    if (e.key == "Escape") {
        document.activeElement.blur();
    }
});

async function watchFolder(folder, onChange) {
    let currentFiles = [];
    let prevFiles = [];

    async function addFilesRecursive(folderPath) {
        try {
            const folderFiles = await fs.readdir(folderPath);
            for (const file of folderFiles) {
                const filePath = path.join(folderPath, file);
                currentFiles.push(filePath);
                const stats = await fs.stat(filePath);
                if (stats.isDirectory()) {
                    await addFilesRecursive(filePath);
                }
            }
        } catch (error) {
            console.error('Error al leer el directorio:', error);
        }
    }

    await addFilesRecursive(folder);

    const watchInterval = setInterval(async () => {
        currentFiles = [];
        await addFilesRecursive(folder);

        const prevFilesString = JSON.stringify(prevFiles.sort());
        const currentFilesString = JSON.stringify(currentFiles.sort());

        if (prevFilesString !== currentFilesString) {
            onChange();
            prevFiles = currentFiles;
        }
    }, 1000);

    const watcher = {
        close() {
            clearInterval(watchInterval);
        }
    };

    return watcher;
}

ipcRenderer.send("rendered");
