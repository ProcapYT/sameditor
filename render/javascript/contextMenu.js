const $contextMenu = document.getElementById("contextMenu");

export class ContextMenu {
    static addOption(optionName, optionAction) {
        const $button = document.createElement("div");
        const $namePar = document.createElement("p");
    
        $button.classList.add("contextMenuOption");
        $namePar.classList.add("contextMenuOptionName");
        $namePar.textContent = optionName;
        $button.dataset.name = optionName;

        $button.addEventListener("mouseup", optionAction);
    
        $button.appendChild($namePar);
        $contextMenu.appendChild($button);
    }
    
    static removeOption(optionName) {
        const $button = $contextMenu.querySelector(`[data-name=${optionName}]`);
        if (!$button) return;
        $button.remove();
    }
    
    static removeAllOptions() {
        $contextMenu.innerHTML = "";
    }
    
    static showContextMenu(e) {
        e.preventDefault();
        if (e.pageX > innerWidth / 2) $contextMenu.style.left = `${e.pageX - $contextMenu.offsetWidth}px`;
        else $contextMenu.style.left = `${e.pageX}px`;
    
        if (e.pageY > innerHeight / 2) $contextMenu.style.top = `${e.pageY - $contextMenu.offsetHeight}px`;
        else $contextMenu.style.top = `${e.pageY}px`;
    
        if ($contextMenu.innerHTML != "") $contextMenu.style.display = 'block';
        else $contextMenu.style.display = 'none';
    }
}



document.addEventListener("mouseup", () => {
    $contextMenu.style.display = "none";
});
