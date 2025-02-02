// NAME: Convenient Repeat
// AUTHOR: bc9123
// VERSION: 0.1
// DESCRIPTION: An extension for Spicetify that adds a convenient repeat options menu

let debounceTimeout: ReturnType<typeof setTimeout>;
const DEBOUNCE_DELAY: number = 200;
let themeCheckInterval: NodeJS.Timeout | null = null;
let lastKnownColors = {
    background: "",
    text: "",
    button: "",
    buttonHover: "",
};

async function convenientRepeat() {
  async function getThemeColor(variableName: string): Promise<string> {
      const body = document.body;
      return body ? getComputedStyle(body).getPropertyValue(variableName).trim() : "";
  }

  async function updateThemeColors() {
      const newColors = {
          background: await getThemeColor("--background-base"),
          text: await getThemeColor("--text-base"),
          button: await getThemeColor("--background-press"),
          buttonHover: await getThemeColor("--text-bright-accent"),
      };

      if (newColors.background !== lastKnownColors.background ||
          newColors.text !== lastKnownColors.text ||
          newColors.button !== lastKnownColors.button ||
          newColors.buttonHover !== lastKnownColors.buttonHover) {
          console.log("Theme colors changed, updating...");
          lastKnownColors = newColors;
          document.getElementById("repeat-menu")?.remove();
      }
  }

  function toggleThemeCheck(enable: boolean) {
      if (enable && !themeCheckInterval) {
          themeCheckInterval = setInterval(updateThemeColors, 1000);
      } else if (!enable && themeCheckInterval) {
          clearInterval(themeCheckInterval);
          themeCheckInterval = null;
      }
  }

  async function createRepeatMenu() {
      const existingMenu = document.getElementById("repeat-menu");
      if (existingMenu) {
          existingMenu.remove();
          toggleThemeCheck(false);
          return;
      }

      toggleThemeCheck(true);

      const menu = document.createElement("div");
      menu.id = "repeat-menu";

      const [menuBackgroundColor, menuTextColor, btnBackground, btnHoverBackground] = await Promise.all([
          getThemeColor("--background-base"),
          getThemeColor("--text-base"),
          getThemeColor("--background-press"),
          getThemeColor("--text-bright-accent")
      ]);

      menu.style.position = "absolute";
      menu.style.background = menuBackgroundColor || "#282828";
      menu.style.color = menuTextColor || "#fff";
      menu.style.padding = "10px";
      menu.style.borderRadius = "5px";
      menu.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.3)";
      menu.style.display = "flex";
      menu.style.gap = "5px";
      menu.style.fontSize = "14px";
      menu.style.cursor = "pointer";
      menu.style.zIndex = "9999";

      const options = [
          { label: "Repeat Off", value: 0 },
          { label: "Repeat All", value: 1 },
          { label: "Repeat One", value: 2 },
      ];

      options.forEach(option => {
          const btn = document.createElement("div");
          btn.innerText = option.label;
          btn.style.padding = "5px 10px";
          btn.style.borderRadius = "3px";
          btn.style.background = btnBackground || "#333";
          btn.style.textAlign = "center";
          btn.style.transition = "background 0.2s ease-in-out";

          btn.addEventListener("mouseover", () => (btn.style.background = btnHoverBackground || "#444"));
          btn.addEventListener("mouseout", () => (btn.style.background = btnBackground || "#333"));

          btn.onclick = () => {
              Spicetify.Player.setRepeat(option.value);
              menu.remove();
              toggleThemeCheck(false);
          };

          menu.appendChild(btn);
      });

      return menu;
  }

  function createConvenientRepeatButton() {
      const parentContainer = document.querySelector(".main-nowPlayingBar-extraControls");

      if (!parentContainer) {
          console.warn("Repeat button container not found!");
          return;
      }

      if (parentContainer.querySelector(`#custom-repeat-button`)) return;

      const customButton = new Spicetify.Playbar.Button(
          "Convenient Repeat",
          "repeat",
          async () => {
              const existingMenu = document.getElementById("repeat-menu");
              if (existingMenu) {
                  existingMenu.remove();
                  toggleThemeCheck(false);
              } else {
                  const menu = await createRepeatMenu();
                  if (menu) {
                      document.body.appendChild(menu);
                      const rect = customButton.element.getBoundingClientRect();
                      const buttonCenterX = rect.left + rect.width / 2;
                      const buttonTopY = rect.top;
                      menu.style.left = `${buttonCenterX - menu.offsetWidth / 2 + window.scrollX}px`;
                      menu.style.top = `${buttonTopY + window.scrollY - menu.offsetHeight - 10}px`;
                  }
              }
          },
          false,
          false
      );

      customButton.element.id = "custom-repeat-button";
      customButton.element.style.cursor = "pointer";
      customButton.register();
      parentContainer.insertBefore(customButton.element, parentContainer.firstChild);
  }

  createConvenientRepeatButton();

  const observer = new MutationObserver(() => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
          if (!document.getElementById("custom-repeat-button")) {
              createConvenientRepeatButton();
          }
      }, DEBOUNCE_DELAY);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('unload', () => {
    observer.disconnect();
    if (themeCheckInterval) {
        clearInterval(themeCheckInterval);
    }
  });
}

export default convenientRepeat;
