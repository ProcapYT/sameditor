// import nodejs modules
const { join } = require("node:path");
const { ipcRenderer } = require("electron");
const fs = require("node:fs/promises");

import { getIcon } from "./getIcon.js";
import { getLang } from "./getLang.js";

// get all of the necesary elements from the DOM (html file)
const $filesContainer = document.querySelector(".files");
const $createFile = document.querySelector(".createFile");
const $createFolder = document.querySelector(".createFolder");
const $ffNameInput = document.querySelector(".ffNameInput");
const $ffNameForm = document.querySelector(".ffNameForm");
const $editor = document.querySelector("#editor");
const $currentFolderPar = document.querySelector(".currentFolderPar");
const $tabsContainer = document.querySelector(".tabsContainer");
const $reloadButton = document.querySelector(".reload");
const $alertContainer = document.querySelector(".alert");
const $saveButton = document.querySelector(".saveCode");
const $cancelButton = document.querySelector(".cancelButton");
const $dontSaveButton = document.querySelector(".dontSave");

// load monaco to use it later on
const loader = require("monaco-loader");
const monaco = await loader();

// set the default config for the monaco-editor
const editorConfig = {
  theme: "vs-dark",
  fontFamily: "CascadiaCode",
  fontSize: 16,
  fontLigatures: true,
  tabSize: 2,
  automaticLayout: true,
};

// define some "global" variables
let currentFolderPath;
let currentEditingFile = null;
let currentEditor = null;

const currentTabs = [];

let currentTab = null;

async function openNewTab(fullPath, fileExtension, iconProperties, fileName) {
  // get the icon class from the first index of the properties array
  const iconPath = iconProperties[0];

  // create the tab elements
  const $tab = document.createElement("button");
  const $fileName = document.createElement("p");
  const $closeTab = document.createElement("button");
  const $closeTabIcon = document.createElement("i");

  if (!currentTabs.includes(fullPath)) {
    // clean the file name element of the tab
    $fileName.innerHTML = "";

    // show the editor and the tab
    $editor.classList.remove("hidden");

    // get the language of the file
    const language = getLang(fileExtension.toLowerCase());

    // read the file to get the content
    const fileContent = await fs.readFile(fullPath, "utf-8");

    // create some elements
    const $fileNamePar = document.createElement("p");
    const $tabFileIcon = document.createElement("img");

    // add the classes to the tab elements
    $tab.classList.add("tab");
    $fileName.classList.add("fileName");
    $closeTab.classList.add("closeTab");
    $closeTabIcon.classList.add("fa-solid", "fa-xmark");
    $tabFileIcon.src = iconPath;
    $tabFileIcon.style = iconProperties[1];

    // add the tab to the container
    $closeTab.appendChild($closeTabIcon);
    $fileNamePar.appendChild($tabFileIcon);
    $fileNamePar.appendChild(document.createTextNode(` ${fileName}`));
    $fileName.appendChild($fileNamePar);
    $tab.appendChild($fileName);
    $tab.appendChild($closeTab);
    $tabsContainer.appendChild($tab);

    // push the full path to the tabs array
    currentTabs.push(fullPath);

    // set some necesary data in the attributes of the tab element
    $tab.dataset.path = fullPath;
    $tab.dataset.language = language;
    $tab.dataset.codeSaved = "true";
    $tab.dataset.content = fileContent;

    // if there is a current tab then remove the selected class
    if (currentTab) {
      currentTab.classList.remove("selected");
    }

    // make this tab the current one and add the selected class
    currentTab = $tab;
    $tab.classList.add("selected");

    // create the editor
    createEditor(language, fileContent, fullPath);

    function handleEditorKeyDown() {
      currentEditor.onKeyDown((event) => {
        // save the code when Ctrl+S is pressed
        if ((event.ctrlKey || event.metaKey) && event.code === "KeyS") {
          saveCode(currentEditingFile, currentEditor.getValue());

          // add the original icon to the element so the user knows that the code is saved
          $closeTabIcon.classList.remove(...$closeTabIcon.classList);
          $closeTabIcon.classList.add("fa-solid", "fa-xmark");

          // set the code-saved attribute from the tab to true
          $tab.dataset.codeSaved = "true";
        }
      });

      currentEditor.onDidChangeModelContent(() => {
        // set the current editor value in the tab so it can be accesed later
        $tab.dataset.content = currentEditor.getValue();

        // add an icon to the tab so the user knows that the code hans't been saved
        $closeTabIcon.classList.remove(...$closeTabIcon.classList);
        $closeTabIcon.classList.add("fa-solid", "fa-circle", "fa-xs");

        // set the code-saved attribute from the tab to false
        $tab.dataset.codeSaved = "false";
      });
    }

    // if there is an editor, handle the keydown
    if (currentEditor) {
      handleEditorKeyDown();
    }

    $tab.addEventListener("click", () => {
      // remove the class of selected from the current tab element
      if (currentTab) {
        currentTab.classList.remove("selected");
      }

      // set the current tab to be the selected tab and add the selected class
      currentTab = $tab;
      $tab.classList.add("selected");

      // dispose the editor if there is one
      if (currentEditor) {
        currentEditor.dispose();
        currentEditor = null;
      }

      // clear the editor
      $editor.innerHTML = "";

      // create an editor with the tab data
      createEditor(
        $tab.dataset.language,
        $tab.dataset.content,
        $tab.dataset.path
      );

      // handle the editor keydown so we can save the file later
      if (currentEditor) {
        handleEditorKeyDown();
      }
    });

    $closeTab.addEventListener("click", (e) => {
      // stop the button propagation
      e.stopPropagation();

      if ($tab.dataset.codeSaved === "true") {
        // remove the tab from the tabs container element
        if ($tabsContainer.contains($tab)) {
          $tabsContainer.removeChild($tab);
        }

        // remove the file path from the tabs array
        currentTabs.splice(currentTabs.indexOf(fullPath), 1);

        // if there is a current editor, dispose it
        if (currentEditor) {
          currentEditor.dispose();
          currentEditor = null;
        }

        // clear the editor
        $editor.innerHTML = "";

        // remove the image class from the editor so it has no background
        $editor.classList.remove("image");

        if (currentTabs.length >= 1) {
          // if the current tab is not the last one get the last one
          const $nextTab = $tabsContainer.querySelector(
            `[data-path="${currentTabs[currentTabs.length - 1]}"]`
          );

          // click the last tab
          $nextTab.click();
        }
      } else {
        $alertContainer.classList.remove("hidden");

        // function to handle the save button
        function handleSaveClick() {
          // save the code and click again the close tab button
          saveCode(currentEditingFile, $tab.dataset.content);
          $tab.dataset.codeSaved = "true";
          $closeTab.click();

          // hide the alert
          $alertContainer.classList.add("hidden");
        }

        // function to handle the dontsave button
        function handleDontSaveClick() {
          // click again the close tab button
          $tab.dataset.codeSaved = "true";
          $closeTab.click();

          // hide the alert
          $alertContainer.classList.add("hidden");
        }

        // function to handle the cancel button
        function handleCancelClick() {
          // hide the alert
          $alertContainer.classList.add("hidden");
        }

        // add the functions to the event listeners of the buttons
        $saveButton.addEventListener("click", handleSaveClick);
        $dontSaveButton.addEventListener("click", handleDontSaveClick);
        $cancelButton.addEventListener("click", handleCancelClick);
      }
    });
  } else {
    // get the tab that is already opened
    const $requestedTab = $tabsContainer.querySelector(
      `[data-path="${fullPath}"]`
    );

    // click the tab
    $requestedTab.click();
  }
}

// listen for the folderSelected event
ipcRenderer.on("folderSelected", (event, data) => {
  // clean the files container so the files and folders don't stack
  $filesContainer.innerHTML = "";

  // set the current folder path and the currentFolderPar element text content
  currentFolderPath = data.folder;
  $currentFolderPar.textContent = data.folder.substring(
    data.folder.lastIndexOf("/") + 1
  );

  // remove the necesary hidden classes from the elements
  $createFile.classList.remove("hidden");
  $createFolder.classList.remove("hidden");
  $reloadButton.classList.remove("hidden");

  // open the folder passing some arguments
  openFolder(data.folder, $filesContainer, 1);
});

function createEditor(language, fileContent, fullPath) {
  // remove the image class if the editor has it
  if ($editor.classList.contains("image")) {
    $editor.classList.remove("image");
  }

  // dispose the current editor if there is one
  if (currentEditor) {
    currentEditor.dispose();
    currentEditor = null;
  }

  // clear the current editor
  $editor.innerHTML = "";

  // set the current editing file
  currentEditingFile = fullPath;

  // check if the file is a readable image
  if (
    language === "png" ||
    language === "jpg" ||
    language === "jpeg" ||
    language === "gif"
  ) {
    // set the image in the editor instead of the monaco-editor
    $editor.innerHTML = `<img src="${currentEditingFile}" alt="${currentEditingFile}" />`;

    // set the image class to the editor so it can be styled
    $editor.classList.add("image");
  } else {
    // rename the current editor variable and create an editor in the $editor element
    // use the current file content as the value and the default editor config
    currentEditor = monaco.editor.create($editor, {
      value: fileContent,
      language,
      ...editorConfig,
    });
  }
}

function openFolder(folderPath, $parentContainer, indentation) {
  // get the list of files in the folder
  ipcRenderer.send("listFiles", { folder: folderPath });

  // wait for the files to be listed
  ipcRenderer.once("filesListed", async (event, files) => {
    // cycle through the files array
    for (const file of files) {
      // get the file extension
      const indexFileExtension = file.lastIndexOf(".");

      let fileExtension = "";

      // "if statement" so if there isn't a file ext it doesn't get the file name as it was it
      // example: fileName: json | fileExt: json
      if (indexFileExtension != -1) {
        fileExtension = file.substring(indexFileExtension + 1);
      }

      const fileStats = await fs.stat(join(folderPath, file));

      if (fileStats.isDirectory()) {
        fileExtension = file;
      }

      // get the icon properties
      const iconProperties = await getIcon(
        fileExtension,
        fileStats.isDirectory()
      );

      // get the full path of the file and the stats
      const fullPath = join(folderPath, file);
      const stats = await fs.stat(fullPath);
      const isDirectory = stats.isDirectory();

      // create some html elements
      const $fileButton = document.createElement("button");
      const $filePar = document.createElement("p");
      const $deleteIcon = document.createElement("i");
      const $deleteButton = document.createElement("button");
      const $renameButton = document.createElement("button");
      const $renameIcon = document.createElement("i");
      const $createFileButton = document.createElement("button");
      const $createFileIcon = document.createElement("i");
      const $createFolderButton = document.createElement("button");
      const $createFolderIcon = document.createElement("i");
      const $fileIcon = document.createElement("img");

      // give the elements some classes
      $filePar.classList.add("filePar");
      $fileButton.classList.add("fileButton");
      $deleteIcon.classList.add("fa-solid");
      $deleteIcon.classList.add("fa-trash");
      $renameIcon.classList.add("fa-solid");
      $renameIcon.classList.add("fa-pen");
      $createFileIcon.classList.add("fa-solid");
      $createFileIcon.classList.add("fa-file-circle-plus");
      $createFolderIcon.classList.add("fa-solid");
      $createFolderIcon.classList.add("fa-folder-plus");
      $fileIcon.src = iconProperties[0];
      $fileIcon.style = iconProperties[1];
      $deleteButton.classList.add("deleteButton");
      $renameButton.classList.add("renameButton");
      $createFileButton.classList.add("createFileButton");
      $createFolderButton.classList.add("createFolderButton");

      // set the inner html of the elements
      $createFileButton.appendChild($createFileIcon);
      $createFolderButton.appendChild($createFolderIcon);

      $filePar.style = `margin-left: ${10 + indentation * 5}%`;

      if (isDirectory) {
        // create an arrow icon to indicate if the folder is opened or not
        const $arrowIcon = document.createElement("i");
        $arrowIcon.classList.add("fa-solid");
        $arrowIcon.classList.add("fa-chevron-right");

        $fileButton.appendChild($arrowIcon);
        // detect for a click in the file button element and open or close the folder
        $fileButton.addEventListener("click", (e) => {
          if (!$arrowIcon.classList.contains("opened")) {
            $arrowIcon.classList.add("opened");

            openFolder(fullPath, $fileButton, indentation + 1);
          } else {
            $arrowIcon.classList.remove("opened");
            $fileButton.innerHTML = "";
            $fileButton.appendChild($arrowIcon);
            $fileButton.appendChild($filePar);
            $fileButton.appendChild($deleteButton);
            $fileButton.appendChild($renameButton);
            $fileButton.appendChild($createFileButton);
            $fileButton.appendChild($createFolderButton);
          }

          // stop the propagation of the click event so the parent buttons don't get clicked
          e.stopPropagation();
        });
      }

      $filePar.appendChild($fileIcon);

      $deleteButton.appendChild($deleteIcon);
      $renameButton.appendChild($renameIcon);

      $filePar.appendChild(document.createTextNode(` ${file}`));
      $fileButton.appendChild($filePar);
      $fileButton.appendChild($deleteButton);
      $fileButton.appendChild($renameButton);

      if (isDirectory) {
        $fileButton.appendChild($createFileButton);
        $fileButton.appendChild($createFolderButton);
      }

      $parentContainer.appendChild($fileButton);

      $createFileButton.addEventListener("click", (e) => {
        // create a function to handle the submit event on the file or folder name form
        function handleSubmit(e) {
          // prevent the default page reload
          e.preventDefault();

          // check if the input is not empty and create a file
          if ($ffNameInput.value !== "") {
            ipcRenderer.send("createFile", {
              mainFolder: currentFolderPath,
              filePath: fullPath,
              fileName: $ffNameInput.value,
            });

            // unfocus (blur) the input and clear it
            $ffNameInput.blur();
            $ffNameInput.value = "";

            // remove the event listener of the form
            $ffNameForm.removeEventListener("submit", handleSubmit);
          }
        }

        // show the form and focus the input
        $ffNameForm.classList.remove("hidden");
        $ffNameInput.focus();

        // add the submit event listener to the form
        $ffNameForm.addEventListener("submit", handleSubmit);

        // stop the button propagation
        e.stopPropagation();
      });

      $fileButton.addEventListener("click", async (e) => {
        // if the "file" is not a directory
        if (!isDirectory) {
          // stop the button propagation
          e.stopPropagation();

          // open a new editor tab
          await openNewTab(fullPath, fileExtension, iconProperties, file);
        }
      });

      $createFolderButton.addEventListener("click", (e) => {
        // create a function to handle the submit event on the file or folder name form
        function handleSubmit(e) {
          // prevent the default page reload
          e.preventDefault();

          // check if the input is not empty and create a file
          if ($ffNameInput.value !== "") {
            // create the folder
            ipcRenderer.send("createFolder", {
              mainFolder: currentFolderPath,
              filePath: fullPath,
              fileName: $ffNameInput.value,
            });

            // unfocus (blur) the input and clear it
            $ffNameInput.blur();
            $ffNameInput.value = "";

            // remove the event listener of the form
            $ffNameForm.removeEventListener("submit", handleSubmit);
          }
        }

        // show the form and focus the input
        $ffNameForm.classList.remove("hidden");
        $ffNameInput.focus();

        // add the submit event listener to the form
        $ffNameForm.addEventListener("submit", handleSubmit);

        // stop the button propagation
        e.stopPropagation();
      });

      $deleteButton.addEventListener("click", (e) => {
        if (isDirectory) {
          // send the delete folder event
          ipcRenderer.send("deleteFolder", {
            folder: currentFolderPath,
            file: fullPath,
          });
        } else {
          // send the delete file event
          ipcRenderer.send("deleteFile", {
            folder: currentFolderPath,
            file: fullPath,
          });
        }

        // stop the button propagation
        e.stopPropagation();
      });

      $renameButton.addEventListener("click", (e) => {
        // create a function to handle the submit event on the file or folder name form
        function handleSubmit(e) {
          // prevent the default page reload
          e.preventDefault();

          // check if the input is not empty and create a file
          if ($ffNameInput.value !== "") {
            // rename the folder/file
            ipcRenderer.send("rename2", {
              mainFolder: currentFolderPath,
              folder: folderPath,
              oldName: fullPath,
              newName: join(folderPath, $ffNameInput.value),
            });

            // unfocus (blur) the input and clear it
            $ffNameInput.blur();
            $ffNameInput.value = "";

            // remove the event listener of the form
            $ffNameForm.removeEventListener("submit", handleSubmit);
          }
        }

        // show the form and focus the input
        $ffNameForm.classList.remove("hidden");
        $ffNameInput.focus();

        // add the submit event listener to the form
        $ffNameForm.addEventListener("submit", handleSubmit);

        // stop the button propagation
        e.stopPropagation();
      });
    }
  });
}

ipcRenderer.on("fileSelected", async (event, data) => {
  // get the file name from the full path
  const fileName = data.file.substring(data.file.lastIndexOf("/") + 1);

  // show the editor
  $editor.classList.remove("hidden");

  // get the file extension
  const indexFileExtension = fileName.lastIndexOf(".");
  const fileExtension = fileName.substring(indexFileExtension + 1);

  // get the icon properties
  const fileIconProperties = getIcon(fileExtension, false);

  // open a new editor tab
  openNewTab(data.file, fileExtension, fileIconProperties, fileName);
});

function saveCode(filePath, code) {
  // send the save code event
  ipcRenderer.send("saveCode", {
    file: filePath,
    code,
  });
}

$createFile.addEventListener("click", () => {
  // create a function to handle the submit event on the file or folder name form
  function handleSubmit(e) {
    // prevent the default action
    e.preventDefault();

    // check if the input is not empty
    if ($ffNameInput.value !== "") {
      ipcRenderer.send("createFile", {
        mainFolder: currentFolderPath,
        filePath: currentFolderPath,
        fileName: $ffNameInput.value,
      });

      // unfocus (blur) the input and clear it
      $ffNameInput.blur();
      $ffNameInput.value = "";

      // remove the event listener of the form
      $ffNameForm.removeEventListener("submit", handleSubmit);
    }
  }

  // show the form and focus the input
  $ffNameForm.classList.remove("hidden");
  $ffNameInput.focus();

  // add the submit event listener
  $ffNameForm.addEventListener("submit", handleSubmit);
});

// add an event listener on the DOM so the user can save the file with ctrl+s
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();

    // if an editor is opened save it
    if (currentEditor) {
      saveCode(currentEditingFile, currentEditor.getValue());
    }
  }
});

$createFolder.addEventListener("click", () => {
  // create a function to handle the submit event on the file or folder name form
  function handleSubmit(e) {
    // prevent the default action
    e.preventDefault();

    // check if the input is not empty
    if ($ffNameInput.value !== "") {
      ipcRenderer.send("createFolder", {
        mainFolder: currentFolderPath,
        filePath: currentFolderPath,
        fileName: $ffNameInput.value,
      });

      // unfocus (blur) the input and clear it
      $ffNameInput.blur();
      $ffNameInput.value = "";

      // remove the event listener of the form
      $ffNameForm.removeEventListener("submit", handleSubmit);
    }
  }

  // show the form and focus the input
  $ffNameForm.classList.remove("hidden");
  $ffNameInput.focus();

  // add the submit event listener
  $ffNameForm.addEventListener("submit", handleSubmit);
});

$ffNameInput.addEventListener("blur", () => {
  // if the input gets unfocused (blured) hide the form
  $ffNameForm.classList.add("hidden");
});

$reloadButton.addEventListener("click", () => {
  // reload the current folder
  ipcRenderer.send("reload", currentFolderPath);
});

// send the rendered event so the app knows that is has been rendered
ipcRenderer.send("rendered");
