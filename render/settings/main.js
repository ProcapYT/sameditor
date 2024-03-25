const { ipcRenderer } = require("electron");

const $settingsSelects = {
  $themeSelect: [document.querySelector("#themeSelect"), "theme"],
  $cursorStyleSelect: [
    document.querySelector("#cursorStyleSelect"),
    "cursorStyle",
  ],
  $cursorBlinkSelect: [
    document.querySelector("#cursorBlinkSelect"),
    "cursorBlinking",
  ],
};

for (const key in $settingsSelects) {
  const $settingSelect = $settingsSelects[key];

  $settingSelect[0].addEventListener("change", () => {
    const setting = $settingSelect[1];
    const updatedConfig = {};
    updatedConfig[setting] = $settingSelect[0].value;

    ipcRenderer.send("updatedConfig", updatedConfig);
  });
}

function getSettingElement(name) {
  for (const [_, $settingSelect] of Object.entries($settingsSelects)) {
    if ($settingSelect[1] === name) {
      return $settingSelect;
    }
  }

  return null;
}

ipcRenderer.on("currentConfig", (event, settings) => {
  for (const [setting, settingValue] of Object.entries(settings)) {
    const $settingElement = getSettingElement(setting)[0];

    $settingElement.value = settingValue;
  }
});

ipcRenderer.send("settingsRendered");
