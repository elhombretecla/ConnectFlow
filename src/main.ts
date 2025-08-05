import "./style.css";
import { ColorPicker } from "./colorPicker";
import { ConnectorType } from "./connectorTypes";

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
  drawOnSelection: boolean;
  startAnchor: string | null;
  endAnchor: string | null;
  connectorType: ConnectorType;
  offset: number;
}

const settings: ConnectorSettings = {
  color: "#000000",
  opacity: 100,
  strokeWidth: 2,
  position: "center",
  style: "solid",
  startArrow: "none",
  endArrow: "none",
  drawOnSelection: false,
  startAnchor: null,
  endAnchor: null,
  connectorType: "direct",
  offset: 0
};

let colorPicker: ColorPicker | null = null;

// Update UI elements with current settings
function updateUI() {
  const colorSwatch = document.querySelector(".color-swatch") as HTMLElement;
  const colorLabel = document.querySelector(".color-label") as HTMLElement;
  const opacityValue = document.querySelector(".opacity-value") as HTMLElement;
  const strokeInput = document.querySelector(".stroke-input") as HTMLInputElement;
  const offsetInput = document.querySelector(".offset-input") as HTMLInputElement;
  const styleDropdown = document.querySelector("[data-setting='style']") as HTMLSelectElement;
  const startArrowDropdown = document.querySelector("[data-setting='startArrow']") as HTMLSelectElement;
  const endArrowDropdown = document.querySelector("[data-setting='endArrow']") as HTMLSelectElement;
  const connectorTypeDropdown = document.querySelector("[data-setting='connectorType']") as HTMLSelectElement;
  
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
  
  if (offsetInput) {
    offsetInput.value = settings.offset.toString();
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
  
  if (connectorTypeDropdown) {
    connectorTypeDropdown.value = settings.connectorType;
    console.log('Initialized connectorType dropdown to:', settings.connectorType);
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

// Prevenir entrada de caracteres no numéricos en el input de stroke-width
document.querySelector(".stroke-input")?.addEventListener("keydown", (e) => {
  const key = (e as KeyboardEvent).key;
  // Permitir: backspace, delete, tab, escape, enter, home, end, left, right, up, down
  if ([
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
  ].includes(key)) {
    return;
  }
  // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
  if ((e as KeyboardEvent).ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) {
    return;
  }
  // Bloquear si no es un número
  if (!/^[0-9]$/.test(key)) {
    e.preventDefault();
  }
});

document.querySelector(".stroke-input")?.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement;
  
  // Remover cualquier carácter que no sea número
  target.value = target.value.replace(/[^0-9]/g, '');
  
  const value = parseInt(target.value);
  if (!isNaN(value) && value >= 1 && value <= 100) {
    settings.strokeWidth = value;
    parent.postMessage({ type: "settings-changed", settings }, "*");
  } else if (target.value === '') {
    // Si el campo está vacío, no actualizar settings pero permitir el estado vacío temporalmente
    return;
  } else {
    // Si el valor está fuera del rango, ajustarlo
    const clampedValue = Math.max(1, Math.min(100, value || 1));
    target.value = clampedValue.toString();
    settings.strokeWidth = clampedValue;
    parent.postMessage({ type: "settings-changed", settings }, "*");
  }
});

// Prevenir entrada de caracteres no numéricos en el input de offset
document.querySelector(".offset-input")?.addEventListener("keydown", (e) => {
  const key = (e as KeyboardEvent).key;
  // Permitir: backspace, delete, tab, escape, enter, home, end, left, right, up, down
  if ([
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
  ].includes(key)) {
    return;
  }
  // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
  if ((e as KeyboardEvent).ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) {
    return;
  }
  // Bloquear si no es un número
  if (!/^[0-9]$/.test(key)) {
    e.preventDefault();
  }
});

document.querySelector(".offset-input")?.addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement;
  
  // Remover cualquier carácter que no sea número
  target.value = target.value.replace(/[^0-9]/g, '');
  
  const value = parseInt(target.value);
  if (!isNaN(value) && value >= 0 && value <= 200) {
    settings.offset = value;
    parent.postMessage({ type: "settings-changed", settings }, "*");
  } else if (target.value === '') {
    // Si el campo está vacío, usar 0 como valor por defecto
    settings.offset = 0;
    parent.postMessage({ type: "settings-changed", settings }, "*");
  } else {
    // Si el valor está fuera del rango, ajustarlo
    const clampedValue = Math.max(0, Math.min(200, value || 0));
    target.value = clampedValue.toString();
    settings.offset = clampedValue;
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

// Handle anchor point clicks
function setupAnchorPointListeners() {
  document.querySelectorAll('.anchor-point').forEach(anchorPoint => {
    anchorPoint.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const side = target.classList.contains('top') ? 'top' :
                   target.classList.contains('right') ? 'right' :
                   target.classList.contains('bottom') ? 'bottom' : 'left';
      
      const previewElement = target.closest('.preview-element');
      const isLeftElement = previewElement?.classList.contains('left');
      
      if (isLeftElement) {
        // Handle start anchor selection
        handleAnchorSelection('start', side, target);
      } else {
        // Handle end anchor selection
        handleAnchorSelection('end', side, target);
      }
    });
  });
}

function handleAnchorSelection(elementType: 'start' | 'end', side: string, clickedElement: HTMLElement) {
  const previewElement = clickedElement.closest('.preview-element');
  if (!previewElement) return;
  
  // Remove selected class from all anchor points in this element
  previewElement.querySelectorAll('.anchor-point').forEach(point => {
    point.classList.remove('selected');
  });
  
  // If clicking the same anchor point that's already selected, deselect it
  const currentSelection = elementType === 'start' ? settings.startAnchor : settings.endAnchor;
  if (currentSelection === side) {
    // Deselect
    if (elementType === 'start') {
      settings.startAnchor = null;
    } else {
      settings.endAnchor = null;
    }
  } else {
    // Select new anchor point
    clickedElement.classList.add('selected');
    if (elementType === 'start') {
      settings.startAnchor = side;
    } else {
      settings.endAnchor = side;
    }
  }
  
  // Notify plugin about settings change
  parent.postMessage({ type: "settings-changed", settings }, "*");
}

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
    // No selection - show placeholders and reset anchor selections
    leftPreviewText.textContent = defaultLeftText;
    leftPreviewText.classList.remove('selected');
    rightPreviewText.textContent = defaultRightText;
    rightPreviewText.classList.remove('selected');
    
    // Reset anchor point selections
    settings.startAnchor = null;
    settings.endAnchor = null;
    updateAnchorPointsVisualState();
  } else if (selection.length === 1) {
    // One element selected
    leftPreviewText.textContent = selection[0].name || "Element 1";
    leftPreviewText.classList.add('selected');
    rightPreviewText.textContent = defaultRightText;
    rightPreviewText.classList.remove('selected');
    
    // Reset end anchor when only one element is selected
    settings.endAnchor = null;
    updateAnchorPointsVisualState();
  } else if (selection.length >= 2) {
    // Two or more elements selected
    leftPreviewText.textContent = selection[0].name || "Element 1";
    leftPreviewText.classList.add('selected');
    rightPreviewText.textContent = selection[1].name || "Element 2";
    rightPreviewText.classList.add('selected');
    
    // Keep current anchor selections
    updateAnchorPointsVisualState();
  }
}

// Update visual state of anchor points based on current settings
function updateAnchorPointsVisualState() {
  // Clear all selected states
  document.querySelectorAll('.anchor-point').forEach(point => {
    point.classList.remove('selected');
  });
  
  // Apply selected state to current selections
  if (settings.startAnchor) {
    const startAnchor = document.querySelector(`.preview-element.left .anchor-point.${settings.startAnchor}`);
    startAnchor?.classList.add('selected');
  }
  
  if (settings.endAnchor) {
    const endAnchor = document.querySelector(`.preview-element.right .anchor-point.${settings.endAnchor}`);
    endAnchor?.classList.add('selected');
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
  setupAnchorPointListeners();
});
