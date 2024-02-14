export function getLang(fileExt) {
  // define the language variable and set a default value (the file extension)
  let language = fileExt;

  // create a switch case to set the language
  switch (fileExt) {
    case "js":
      language = "javascript";
      break;
    case "ts":
      language = "typescript";
      break;
    case "md":
      language = "markdown";
      break;
    case "py":
      language = "python";
      break;
    case "cs":
      language = "csharp";
      break;
    case "rb":
      language = "ruby";
      break;
    case "rs":
      language = "rust";
      break;
    case "kt":
      language = "kotlin";
      break;
    case "ps1":
      language = "powershell";
      break;
    case "sh":
      language = "shell";
      break;
    case "yml":
      language = "yaml";
      break;
    case "m":
      language = "objective-c";
      break;
  }

  return language;
}
