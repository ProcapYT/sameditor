const fs = require("node:fs/promises");
const path = require("node:path");
const { ipcRenderer } = require("electron");

const $tabsContainer = document.getElementById("tabs");

import { createEditor, setLanguage, monaco } from "./editor.js";

export let $currentTab = null;
let currentEditor;
const $openedTabs = [];

export async function createNewTab(fileName, fileIconStyles, fileIconSrc, filePath, fileContent, language, openedFolder) {
    for (const $openedTab of $openedTabs) {
        if ($openedTab.dataset.filePath === filePath) {
            $openedTab.click();
            return;
        }
    }

    const $tab = document.createElement("button");
    const $filePar = document.createElement("p");
    const $fileIcon = document.createElement("img");
    const $closeButton = document.createElement("button");
    const $closeButtonIcon = document.createElement("i");

    $closeButton.classList.add("tabCloseButton");
    $closeButtonIcon.classList.add("fa-solid", "fa-x");
    $tab.classList.add("tab");
    $filePar.classList.add("tabFilePar");

    $tab.dataset.filePath = filePath;
    $tab.dataset.language = language;
    $tab.dataset.fileContent = fileContent;
    $tab.dataset.codeSaved = "true";

    $filePar.appendChild($fileIcon);
    $filePar.appendChild(document.createTextNode(" " + fileName));

    $closeButton.appendChild($closeButtonIcon);
    $closeButton.style.color = document.body.style.color;

    $fileIcon.style = fileIconStyles;
    $fileIcon.src = fileIconSrc;

    $fileIcon.classList.add("fileIcon");

    currentEditor = await createEditor(fileContent, language, openedFolder, filePath);
    updateTabFileContent($tab);

    if ($currentTab != null) $currentTab.classList.remove("selected");
    $currentTab = $tab;
    $tab.classList.add("selected");

    $tab.appendChild($filePar);
    $tab.appendChild($closeButton);
    $tabsContainer.appendChild($tab);

    $openedTabs.push($tab);

    $tab.addEventListener("click", async () => {
        if ($currentTab != null) {
            $currentTab.classList.remove("selected");
            $currentTab.dataset.viewState = currentEditor.saveViewState();
        }

        $tab.classList.add("selected");
        $currentTab = $tab;

        currentEditor = await createEditor($tab.dataset.fileContent, $tab.dataset.language);
        updateTabFileContent($tab);

        if ($tab.dataset.viewState != null) {
            currentEditor.restoreViewState($tab.dataset.viewState);
        }
    });

    $closeButton.addEventListener("click", async (e) => {
        e.stopPropagation();

        const tabIndex = $openedTabs.indexOf($tab);
        $openedTabs.splice(tabIndex, 1);

        if ($tab.dataset.codeSaved == "false") {
            ipcRenderer.send("openDialogMessage", {
                type: "question",
                buttons: ["Save", "Dont Save", "Cancel"],
                title: "Close tab",
                message: `Do you want to save the code before closing?`,
                defaultId: 2,
                cancelId: 2,
                noLink: true,
            });

            const optionSelected = await new Promise((resolve) => {
                ipcRenderer.on("dialogMessageResult", (_, optionSelected) => {
                    resolve(optionSelected);
                });
            });

            if (optionSelected == "Save") {
                try {
                    await saveCode($tab);
                    $tab.dataset.codeSaved = "true";
                    $closeButton.click();
                    return;
                } catch {return;}
            }

            if (optionSelected == "Dont Save") {
                $tab.dataset.codeSaved = "true";
                $closeButton.click();
                return;
            }

            if (optionSelected == "Cancel") {
                return;
            }
        }

        if ($openedTabs.length == 0) {
            if (currentEditor != null) {
                currentEditor.dispose();
                currentEditor = null;
            }
        } else if ($tab == $currentTab) {
            const $lastTab = $openedTabs[$openedTabs.length - 1];
            $lastTab.click();
        }

        $tab.remove();
    });
}

function updateTabFileContent($tab) {
    if (currentEditor == null) {
        console.warn("tab content won't be changed, no editor");
        return;
    }

    currentEditor.onDidChangeModelContent(() => {
        $tab.dataset.fileContent = currentEditor.getValue();
        $tab.dataset.codeSaved = "false";
        const $closeButtonIcon = $tab.querySelector(".tabCloseButton").querySelector("i");
        $closeButtonIcon.classList.remove("fa-x");
        $closeButtonIcon.classList.add("fa-circle-xmark");
    });

    currentEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
        await saveCode($tab);
    });
}

async function saveCode($tab) {
    const fileContent = $tab.dataset.fileContent;
    const filePath = $tab.dataset.filePath;

    try {
        await fs.writeFile(filePath, fileContent, {encoding: "utf-8"});

        $tab.dataset.codeSaved = "true";
        const $closeButtonIcon = $tab.querySelector(".tabCloseButton").querySelector("i");
        $closeButtonIcon.classList.remove("fa-circle-xmark");
        $closeButtonIcon.classList.add("fa-x");
    } catch(e) {
        console.error("file couldn't be saved", e);
        return;
    }
}

export async function changedFileName(filePath, prevPath, newIconPath, lang) {
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep) + 1);
    for (const $tab of $openedTabs) {
        if ($tab.dataset.filePath == prevPath) {
            const $filePar = $tab.querySelector(".tabFilePar");
            const $fileIcon = $filePar.querySelector("img");
            removeParText($filePar);
            $filePar.appendChild(document.createTextNode(" " + fileName));
            changeFilePath($tab);

            $fileIcon.src = newIconPath;
            $tab.dataset.language = lang;

            if ($tab.classList.contains("selected")) {
                setLanguage(lang, currentEditor);
            }
        }

        if ($tab.dataset.filePath.startsWith(prevPath + path.sep)) {
            changeFilePath($tab);
        }
    }

    function changeFilePath($tab) {
        const substringedFile = $tab.dataset.filePath.substring(prevPath.length);
        $tab.dataset.filePath = path.join(filePath, substringedFile);
    }

    function removeParText($par) {
        Array.from($par.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                node.remove();
            }
        });
    }
}

export async function deletedFile() {
    for (let i = $openedTabs.length - 1; i >= 0; i--) {
        const $tab = $openedTabs[i];

        try {
            await fs.readFile($tab.dataset.filePath, "utf-8");
        } catch {
            $tab.dataset.codeSaved = "true";
            const $closeButton = $tab.querySelector(".tabCloseButton");
            $closeButton.click();

            $openedTabs.splice(i, 1);
        }
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key == "w" && e.ctrlKey) {
        if ($currentTab != null) {
            const $closeButton = $currentTab.querySelector(".tabCloseButton");
            $closeButton.click();
        }
    }
});
