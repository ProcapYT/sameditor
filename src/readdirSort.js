const fs = require('node:fs/promises')
const { join } = require('node:path')

async function readdirSort(dirPath) {
  try {
    const dirFiles = await fs.readdir(dirPath)

    const dirs = []
    const files = []

    const filePromises = dirFiles.map(async (file) => {
      const stats = await fs.stat(join(dirPath, file))

      if (stats.isDirectory()) {
        dirs.push(file)
      } else {
        files.push(file)
      }
    })

    dirs.sort()
    files.sort()

    await Promise.all(filePromises)

    const result = [...dirs, ...files]

    return result
  } catch {
    console.error(`Error reading file or directory ${dirPath}`)
  }
}

module.exports = readdirSort
