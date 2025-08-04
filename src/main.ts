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
  color: "#FF6FE0",
  opacity: 100,
  strokeWidth: 1,
  position: "inside",
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
  
  if (colorSwatch) {
    colorSwatch.style.backgroundColor = settings.color;
  }
  
  if (colorLabel) {
    colorLabel.textContent = settings.color.replace("#", "").toUpperCase();
  }
  
  if (opacityValue) {
    opacityValue.textContent = Math.round(settings.opacity).toString();
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
  }
});

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
