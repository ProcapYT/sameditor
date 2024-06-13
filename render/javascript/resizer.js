const $editor = document.getElementById('editor');
const $resizer = document.getElementById('resizer');
const $fileContainer = document.getElementById("fileContainer");
const $selectedFolder = document.getElementById("selectedFolder");
const $tabsContainer = document.getElementById("tabs");
const $background = document.getElementById("background");

function setResizerPosition() {
    $resizer.style.left = $editor.offsetWidth + 'px';
}

function updateFileContainerWidth() {
    const remainingWidth = window.innerWidth - $editor.offsetWidth;
    $fileContainer.style.width = remainingWidth + 'px';
    $selectedFolder.style.width = remainingWidth + "px";
}

$resizer.addEventListener('mousedown', (_) => {
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
});

function resize(e) {
    const newWidth = e.clientX - $editor.offsetLeft;
    $editor.style.width = newWidth + 'px';
    $tabsContainer.style.width = newWidth + 'px';
    $background.style.width = newWidth + "px";
    setResizerPosition();
    updateFileContainerWidth();
}

function stopResize() {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}
