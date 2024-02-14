import { getLang } from "./getLang.js";

export function getIcon(fileExt) {
  // get the language by the file extension
  const languaje = getLang(fileExt);

  // define the icon variables so we can use them in the switch case
  let iconType = "fa-brands";
  let iconClass;
  let iconStyle = "color: #ffffff;";

  // check for some languages to set the icon
  switch (languaje) {
    case "css":
      iconClass = "fa-css3-alt";
      iconStyle = "color: #1a9cff;";
      break;
    case "html":
      iconClass = "fa-html5";
      iconStyle = "color: #ee3b1b;";
      break;
    case "json":
      iconType = "fa-brands";
      iconClass = "fa-node-js";
      iconStyle = "color: #00FF00;";
      break;
    case "javascript":
      iconClass = "fa-js";
      iconStyle = "color: #ffd43b;";
      break;
    case "markdown":
      iconClass = "fa-markdown";
      iconStyle = "color: #74c0fc;";
      break;
    case "python":
      iconClass = "fa-python";
      iconStyle = "color: #94bdff;";
      break;
    case "csharp":
      iconType = "fa-solid";
      iconClass = "fa-hashtag";
      iconStyle = "color: #b197fc;";
      break;
    case "rust":
      iconClass = "fa-rust";
      iconStyle = "color: #804400;";
      break;
    case "shell":
      iconType = "fa-solid";
      iconClass = "fa-terminal";
      iconStyle = "color: #ff8800;";
      break;
    case "powershell":
      iconType = "fa-solid";
      iconClass = "fa-terminal";
      iconStyle = "color: #1a9cff;";
      break;
    case "objective-c":
      iconType = "fa-solid";
      iconClass = "fa-c";
      iconStyle = "color: #ff8800;";
      break;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "webp":
    case "ico":
    case "icns":
      iconType = "fa-solid";
      iconClass = "fa-file-image";
      iconStyle = "color: #00BFA5;";
  }

  // if there isn't an icon class return the default file icon
  if (!iconClass) {
    return ["fa-solid fa-file", "color: #ffffff;"];
  }

  // return the icon class and style
  return [iconType + " " + iconClass, iconStyle];
}
