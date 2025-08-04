import "./style.css";
import { ColorPicker } from "./colorPicker";

// get the current theme from the URL
const searchParams = new URLSearchParams(window.location.search);
document.body.dataset.theme = searchParams.get("theme") ?? "light";

// Plugin state
interface ConnectorSettings {
  color: string;
  opacity: number;
  strokeWidth: number;
  position: string;
  style: string;
  startArrow: string;
  endArrow: string;
  labelText: string;
  drawOnSelection: boolean;
}

const settings: ConnectorSettings = {
  color: "#000000",
  opacity: 100,
  strokeWidth: 2,
  position: "center",
  style: "solid",
  startArrow: "none",
  endArrow: "none",
  labelText: "",
  drawOnSelection: true
};

let colorPicker: ColorPicker | null = null;

// Update UI elements with current settings
function updateUI() {
  const colorSwatch = document.querySelector(".color-swatch") as HTMLElement;
  const colorLabel = document.querySelector(".color-label") as HTMLElement;
  const opacityValue = document.querySelector(".opacity-value") as HTMLElement;
  const strokeInput = document.querySelector(".stroke-input") as HTMLInputElement;
  const positionDropdown = document.querySelector("[data-setting='position']") as HTMLSelectElement;
  const styleDropdown = document.querySelector("[data-setting='style']") as HTMLSelectElement;
  const startArrowDropdown = document.querySelector("[data-setting='startArrow']") as HTMLSelectElement;
  const endArrowDropdown = document.querySelector("[data-setting='endArrow']") as HTMLSelectElement;
  
  if (colorSwatch) {
    colorSwatch.style.backgroundColor = settings.color;
  }
  
  if (colorLabel) {
    colorLabel.textContent = settings.color.replace("#", "").toUpperCase();
  }
  
  if (opacityValue) {
    opacityValue.textContent = Math.round(settings.opacity).toString();
  }
  
  if (strokeInput) {
    strokeInput.value = settings.strokeWidth.toString();
  }
  
  if (positionDropdown) {
    positionDropdown.value = settings.position;
    console.log('Initialized position dropdown to:', settings.position);
  }
  
  if (styleDropdown) {
    styleDropdown.value = settings.style;
    console.log('Initialized style dropdown to:', settings.style);
  }
  
  if (startArrowDropdown) {
    startArrowDropdown.value = settings.startArrow;
    console.log('Initialized startArrow dropdown to:', settings.startArrow);
  }
  
  if (endArrowDropdown) {
    endArrowDropdown.value = settings.endArrow;
    console.log('Initialized endArrow dropdown to:', settings.endArrow);
  }
}

// Event listeners for UI controls
document.querySelector(".color-swatch")?.addEventListener("click", () => {
  if (colorPicker) {
    colorPicker.destroy();
  }
  
  colorPicker = new ColorPicker({
    initialColor: settings.color,
    initialOpacity: settings.opacity,
    onColorChange: (color: string, opacity: number) => {
      settings.color = color;
      settings.opacity = opacity;
      updateUI();
      parent.postMessage({ type: "settings-changed", settings }, "*");
    },
    onClose: () => {
      colorPicker = null;
    }
  });
  
  colorPicker.show();
});

document.querySelectorAll(".dropdown").forEach(dropdown => {
  dropdown.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    const setting = target.dataset.setting as keyof ConnectorSettings;
    if (setting) {
      console.log(`Setting ${setting} to:`, target.value);
      (settings as any)[setting] = target.value;
      parent.postMessage({ type: "settings-changed", settings }, "*");
    }
  });
});

document.querySelector(".text-input")?.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement;
  settings.labelText = target.value;
  parent.postMessage({ type: "settings-changed", settings }, "*");
});

document.querySelector(".stroke-input")?.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement;
  const value = parseInt(target.value);
  if (!isNaN(value) && value >= 1 && value <= 100) {
    settings.strokeWidth = value;
    parent.postMessage({ type: "settings-changed", settings }, "*");
  }
});

document.querySelector("[data-setting='drawOnSelection']")?.addEventListener("change", (e) => {
  const target = e.target as HTMLInputElement;
  settings.drawOnSelection = target.checked;
  parent.postMessage({ type: "settings-changed", settings }, "*");
});

document.querySelector("[data-handler='generate-connector']")?.addEventListener("click", () => {
  parent.postMessage({ type: "generate-connector", settings }, "*");
});

// Listen plugin.ts messages
window.addEventListener("message", (event) => {
  if (event.data.source === "penpot") {
    document.body.dataset.theme = event.data.theme;
  } else if (event.data.type === "notification") {
    // Show notification to user
    showNotification(event.data.message);
  } else if (event.data.type === "selection-update") {
    // Update preview elements with selected element names
    updatePreviewElements(event.data.selection);
  }
});

// Update preview elements with selected element names
function updatePreviewElements(selection: any[]) {
  const leftPreviewText = document.querySelector(".preview-element.left .preview-text") as HTMLElement;
  const rightPreviewText = document.querySelector(".preview-element.right .preview-text") as HTMLElement;
  
  if (!leftPreviewText || !rightPreviewText) return;
  
  // Default placeholder texts
  const defaultLeftText = "Select an element";
  const defaultRightText = "then another element holding [Shift]";
  
  if (selection.length === 0) {
    // No selection - show placeholders
    leftPreviewText.textContent = defaultLeftText;
    leftPreviewText.classList.remove('selected');
    rightPreviewText.textContent = defaultRightText;
    rightPreviewText.classList.remove('selected');
  } else if (selection.length === 1) {
    // One element selected
    leftPreviewText.textContent = selection[0].name || "Element 1";
    leftPreviewText.classList.add('selected');
    rightPreviewText.textContent = defaultRightText;
    rightPreviewText.classList.remove('selected');
  } else if (selection.length >= 2) {
    // Two or more elements selected
    leftPreviewText.textContent = selection[0].name || "Element 1";
    leftPreviewText.classList.add('selected');
    rightPreviewText.textContent = selection[1].name || "Element 2";
    rightPreviewText.classList.add('selected');
  }
}

// Simple notification system
function showNotification(message: string) {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    background-color: #333;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
});
