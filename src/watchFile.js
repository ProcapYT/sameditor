const fs = require("node:fs");

function watchFile(filePath, cb) {
  fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      cb();
    }
  });
}

module.exports = { watchFile };
