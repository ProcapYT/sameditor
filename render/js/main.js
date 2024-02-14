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
const $tab = document.querySelector(".tab");
const $fileName = document.querySelector(".fileName");
const $closeTab = document.querySelector(".closeTab");
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
let currentEditor = null;
let currentFolderPath;
let currentEditingFile = null;
let codeSaved = true;

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
  openFolder(data.folder, $filesContainer, "solid");
});

function createEditor(language, fileContent, fullPath) {
  // if there is a current editor, dispose it
  if (currentEditor) {
    currentEditor.dispose();
    currentEditor = null;
  }

  // clean the editor
  $editor.innerHTML = "";
  $editor.classList.remove("image");

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

    // detect changes in the editor and set the codeSaved variable to false
    currentEditor.onDidChangeModelContent(() => {
      codeSaved = false;
      $closeTab.innerHTML = '<i class="fa-solid fa-circle fa-xs"></i>';
    });
  }
}

function openFolder(folderPath, $parentContainer, iconType) {
  // get the list of files in the folder
  ipcRenderer.send("listFiles", { folder: folderPath });

  // wait for the files to be listed
  ipcRenderer.once("filesListed", async (event, files) => {
    // cycle through the files array
    for (const file of files) {
      // get the file extension
      const indexFileExtension = file.lastIndexOf(".");
      const fileExtension = file.substring(indexFileExtension + 1);

      // get the icon properties and the class
      const iconProperties = getIcon(fileExtension) ?? "fa-solid fa-file";
      const iconClass = iconProperties[0];

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
      const $folderIcon = document.createElement("i");
      const $fileIcon = document.createElement("i");

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
      $folderIcon.classList.add(`fa-${iconType}`);
      $folderIcon.classList.add("fa-folder");
      $fileIcon.classList.add(...iconClass.split(" "));
      $fileIcon.style = iconProperties[1];
      $deleteButton.classList.add("deleteButton");
      $renameButton.classList.add("renameButton");
      $createFileButton.classList.add("createFileButton");
      $createFolderButton.classList.add("createFolderButton");

      // set the inner html of the elements
      $createFileButton.appendChild($createFileIcon);
      $createFolderButton.appendChild($createFolderIcon);

      if (isDirectory) {
        // create an arrow icon to indicate if the folder is opened or not
        const $arrowIcon = document.createElement("i");
        $arrowIcon.classList.add("fa-solid");
        $arrowIcon.classList.add("fa-chevron-right");

        $fileButton.appendChild($arrowIcon);
        $filePar.appendChild($folderIcon);

        // detect for a click in the file button element and open or close the folder
        $fileButton.addEventListener("click", (e) => {
          if (!$arrowIcon.classList.contains("opened")) {
            $arrowIcon.classList.add("opened");

            openFolder(fullPath, $fileButton, "regular");
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
      } else {
        $filePar.appendChild($fileIcon);
      }

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

          // check if the code is saved
          if (codeSaved) {
            // clean the file name element of the tab
            $fileName.innerHTML = "";

            // show the editor and the tab
            $editor.classList.remove("hidden");
            $tab.classList.remove("hidden");

            // create some elements
            const $fileNamePar = document.createElement("p");
            const $tabFileIcon = document.createElement("i");

            // add the icon classes and styles
            $tabFileIcon.classList.add(...iconClass.split(" "));
            $tabFileIcon.style = iconProperties[1];

            $fileNamePar.appendChild($tabFileIcon);
            $fileNamePar.appendChild(document.createTextNode(` ${file}`));

            $fileName.appendChild($fileNamePar);

            // read the file to get the content and get the language
            const fileContent = await fs.readFile(fullPath, "utf-8");
            const language = getLang(fileExtension.toLowerCase());

            // create the editor
            createEditor(language, fileContent, fullPath);
          } else {
            // if the file isn't saved, show the alert
            $alertContainer.classList.remove("hidden");

            // create functions to handle the alert buttons
            function handleSaveClick() {
              saveCode(currentEditingFile);
              $alertContainer.classList.add("hidden");
              $closeTab.innerHTML = '<i class="fa-solid fa-xmark"></i>';

              $fileButton.click();
            }

            function handleDontSaveClick() {
              $alertContainer.classList.add("hidden");
              codeSaved = true;
              $closeTab.innerHTML = '<i class="fa-solid fa-xmark"></i>';

              $fileButton.click();
            }

            function handleCancelClick() {
              $alertContainer.classList.add("hidden");
            }

            // add an event listener to each button
            $saveButton.addEventListener("click", handleSaveClick);
            $dontSaveButton.addEventListener("click", handleDontSaveClick);
            $cancelButton.addEventListener("click", handleCancelClick);
          }
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

  // show the editor and the tab
  $editor.classList.remove("hidden");
  $tab.classList.remove("hidden");

  // clear the file name element
  $fileName.innerHTML = "";

  // get the file extension
  const indexFileExtension = fileName.lastIndexOf(".");
  const fileExtension = fileName.substring(indexFileExtension + 1);

  // get the icon
  const fileIconProperties = getIcon(fileExtension);
  const fileIconClass = fileIconProperties[0];

  // create the file name
  const $fileNamePar = document.createElement("p");
  const $fileNameIcon = document.createElement("i");

  // add some classes to the file icon on the tab
  $fileNameIcon.classList.add(...fileIconClass.split(" "));
  $fileNameIcon.style = fileIconProperties[1];

  $fileNamePar.appendChild($fileNameIcon);
  $fileNamePar.appendChild(document.createTextNode(` ${fileName}`));

  $fileName.appendChild($fileNamePar);

  // get the language
  const language = getLang(fileExtension.toLowerCase());

  // create the editor
  createEditor(language, data.code, data.file);
});

function saveCode(filePath) {
  // send the save code event
  ipcRenderer.send("saveCode", {
    file: filePath,
    code: currentEditor.getValue(),
  });

  // set the code as saved
  $closeTab.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  codeSaved = true;
}

$closeTab.addEventListener("click", () => {
  // if the code is not saved, show the alert
  if (!codeSaved) {
    $alertContainer.classList.remove("hidden");

    // create functions to handle the alert buttons
    function handleSaveClick() {
      saveCode(currentEditingFile);

      $editor.classList.add("hidden");
      $tab.classList.add("hidden");
      $fileName.textContent = "";
      currentEditor.dispose();
      currentEditor = null;

      currentEditingFile = null;

      $alertContainer.classList.add("hidden");
      $closeTab.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    }

    function handleDontSaveClick() {
      $editor.classList.add("hidden");
      $tab.classList.add("hidden");
      $fileName.textContent = "";
      currentEditor.dispose();
      currentEditor = null;

      currentEditingFile = null;

      $alertContainer.classList.add("hidden");
      $closeTab.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    }

    function handleCancelClick() {
      $alertContainer.classList.add("hidden");
    }

    // add the event listeners
    $saveButton.addEventListener("click", handleSaveClick);
    $dontSaveButton.addEventListener("click", handleDontSaveClick);
    $cancelButton.addEventListener("click", handleCancelClick);
  } else {
    // if the code is saved, close the editor
    $editor.classList.add("hidden");
    $tab.classList.add("hidden");
    $fileName.textContent = "";
    currentEditor.dispose();
    currentEditor = null;
  }
});

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
      saveCode(currentEditingFile);
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
