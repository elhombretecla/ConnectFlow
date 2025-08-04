export interface ColorPickerOptions {
  initialColor?: string;
  initialOpacity?: number;
  onColorChange?: (color: string, opacity: number) => void;
  onClose?: () => void;
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export class ColorPicker {
  private container!: HTMLElement;
  private overlay!: HTMLElement;
  private colorArea!: HTMLCanvasElement;
  private colorAreaCtx!: CanvasRenderingContext2D;
  private hueSlider!: HTMLElement;
  private opacitySlider!: HTMLElement;
  private hexInput!: HTMLInputElement;
  private opacityInput!: HTMLInputElement;
  private previewCircle!: HTMLElement;
  
  private currentHSV: HSV = { h: 0, s: 100, v: 100 };
  private currentOpacity: number = 100;
  private isDragging: boolean = false;
  private dragTarget: string | null = null;
  
  private options: ColorPickerOptions;

  constructor(options: ColorPickerOptions = {}) {
    this.options = options;
    this.currentOpacity = options.initialOpacity || 100;
    
    if (options.initialColor) {
      this.currentHSV = this.hexToHSV(options.initialColor);
    }
    
    this.createElements();
    this.setupEventListeners();
    this.updateDisplay();
  }

  private createElements(): void {
    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'color-picker-overlay';
    
    // Main container
    this.container = document.createElement('div');
    this.container.className = 'color-picker-container';
    
    // Color area (main gradient area)
    const colorAreaContainer = document.createElement('div');
    colorAreaContainer.className = 'color-area-container';
    
    this.colorArea = document.createElement('canvas');
    this.colorArea.className = 'color-area';
    this.colorArea.width = 280;
    this.colorArea.height = 200;
    this.colorAreaCtx = this.colorArea.getContext('2d')!;
    
    const colorAreaCursor = document.createElement('div');
    colorAreaCursor.className = 'color-area-cursor';
    
    colorAreaContainer.appendChild(this.colorArea);
    colorAreaContainer.appendChild(colorAreaCursor);
    
    // Controls section
    const controlsSection = document.createElement('div');
    controlsSection.className = 'color-controls';
    
    // Preview circle
    this.previewCircle = document.createElement('div');
    this.previewCircle.className = 'color-preview-circle';
    
    // Sliders container
    const slidersContainer = document.createElement('div');
    slidersContainer.className = 'sliders-container';
    
    // Hue slider
    const hueContainer = document.createElement('div');
    hueContainer.className = 'slider-container';
    this.hueSlider = document.createElement('div');
    this.hueSlider.className = 'hue-slider';
    const hueHandle = document.createElement('div');
    hueHandle.className = 'slider-handle';
    this.hueSlider.appendChild(hueHandle);
    hueContainer.appendChild(this.hueSlider);
    
    // Opacity slider
    const opacityContainer = document.createElement('div');
    opacityContainer.className = 'slider-container';
    this.opacitySlider = document.createElement('div');
    this.opacitySlider.className = 'opacity-slider';
    const opacityHandle = document.createElement('div');
    opacityHandle.className = 'slider-handle';
    this.opacitySlider.appendChild(opacityHandle);
    opacityContainer.appendChild(this.opacitySlider);
    
    slidersContainer.appendChild(hueContainer);
    slidersContainer.appendChild(opacityContainer);
    
    controlsSection.appendChild(this.previewCircle);
    controlsSection.appendChild(slidersContainer);
    
    // Input section
    const inputSection = document.createElement('div');
    inputSection.className = 'color-inputs';
    
    // Hex input
    const hexContainer = document.createElement('div');
    hexContainer.className = 'input-container';
    this.hexInput = document.createElement('input');
    this.hexInput.type = 'text';
    this.hexInput.className = 'hex-input';
    this.hexInput.placeholder = '#000000';
    const hexLabel = document.createElement('label');
    hexLabel.textContent = 'HEX';
    hexLabel.className = 'input-label';
    hexContainer.appendChild(this.hexInput);
    hexContainer.appendChild(hexLabel);
    
    // Opacity input
    const opacityInputContainer = document.createElement('div');
    opacityInputContainer.className = 'input-container';
    this.opacityInput = document.createElement('input');
    this.opacityInput.type = 'number';
    this.opacityInput.className = 'opacity-input';
    this.opacityInput.min = '0';
    this.opacityInput.max = '100';
    this.opacityInput.value = this.currentOpacity.toString();
    const opacityLabel = document.createElement('label');
    opacityLabel.textContent = '%';
    opacityLabel.className = 'input-label';
    opacityInputContainer.appendChild(this.opacityInput);
    opacityInputContainer.appendChild(opacityLabel);
    
    inputSection.appendChild(hexContainer);
    inputSection.appendChild(opacityInputContainer);
    
    // Assemble everything
    this.container.appendChild(colorAreaContainer);
    this.container.appendChild(controlsSection);
    this.container.appendChild(inputSection);
    
    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);
  }

  private setupEventListeners(): void {
    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    // Color area interactions
    this.colorArea.addEventListener('mousedown', (e) => this.handleColorAreaMouseDown(e));
    this.colorArea.addEventListener('mousemove', (e) => this.handleColorAreaMouseMove(e));
    
    // Hue slider
    this.hueSlider.addEventListener('mousedown', (e) => this.handleSliderMouseDown(e, 'hue'));
    
    // Opacity slider
    this.opacitySlider.addEventListener('mousedown', (e) => this.handleSliderMouseDown(e, 'opacity'));
    
    // Global mouse events
    document.addEventListener('mousemove', (e) => this.handleGlobalMouseMove(e));
    document.addEventListener('mouseup', () => this.handleGlobalMouseUp());
    
    // Input events
    this.hexInput.addEventListener('input', () => this.handleHexInput());
    this.opacityInput.addEventListener('input', () => this.handleOpacityInput());
  }

  private handleColorAreaMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.dragTarget = 'colorArea';
    this.updateColorFromArea(e);
  }

  private handleColorAreaMouseMove(e: MouseEvent): void {
    if (this.isDragging && this.dragTarget === 'colorArea') {
      this.updateColorFromArea(e);
    }
  }

  private handleSliderMouseDown(e: MouseEvent, type: string): void {
    e.preventDefault();
    this.isDragging = true;
    this.dragTarget = type;
    this.updateSlider(e, type);
  }

  private handleGlobalMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    
    if (this.dragTarget === 'hue') {
      this.updateSlider(e, 'hue');
    } else if (this.dragTarget === 'opacity') {
      this.updateSlider(e, 'opacity');
    }
  }

  private handleGlobalMouseUp(): void {
    this.isDragging = false;
    this.dragTarget = null;
  }

  private updateColorFromArea(e: MouseEvent): void {
    const rect = this.colorArea.getBoundingClientRect();
    const x = Math.max(0, Math.min(this.colorArea.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(this.colorArea.height, e.clientY - rect.top));
    
    this.currentHSV.s = (x / this.colorArea.width) * 100;
    this.currentHSV.v = 100 - (y / this.colorArea.height) * 100;
    
    this.updateDisplay();
    this.notifyColorChange();
  }

  private updateSlider(e: MouseEvent, type: string): void {
    const slider = type === 'hue' ? this.hueSlider : this.opacitySlider;
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(slider.offsetWidth, e.clientX - rect.left));
    const percentage = x / slider.offsetWidth;
    
    if (type === 'hue') {
      this.currentHSV.h = percentage * 360;
      this.drawColorArea();
    } else if (type === 'opacity') {
      this.currentOpacity = percentage * 100;
      this.opacityInput.value = Math.round(this.currentOpacity).toString();
    }
    
    this.updateDisplay();
    this.notifyColorChange();
  }

  private handleHexInput(): void {
    const hex = this.hexInput.value;
    if (this.isValidHex(hex)) {
      this.currentHSV = this.hexToHSV(hex);
      this.updateDisplay();
      this.notifyColorChange();
    }
  }

  private handleOpacityInput(): void {
    const opacity = parseInt(this.opacityInput.value);
    if (!isNaN(opacity) && opacity >= 0 && opacity <= 100) {
      this.currentOpacity = opacity;
      this.updateDisplay();
      this.notifyColorChange();
    }
  }



  private drawColorArea(): void {
    const ctx = this.colorAreaCtx;
    const width = this.colorArea.width;
    const height = this.colorArea.height;
    
    // Create base hue color
    const hueColor = this.hsvToRgb({ h: this.currentHSV.h, s: 100, v: 100 });
    
    // Create horizontal gradient (saturation)
    const saturationGradient = ctx.createLinearGradient(0, 0, width, 0);
    saturationGradient.addColorStop(0, '#ffffff');
    saturationGradient.addColorStop(1, `rgb(${hueColor.r}, ${hueColor.g}, ${hueColor.b})`);
    
    ctx.fillStyle = saturationGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Create vertical gradient (value/brightness)
    const valueGradient = ctx.createLinearGradient(0, 0, 0, height);
    valueGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    valueGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    
    ctx.fillStyle = valueGradient;
    ctx.fillRect(0, 0, width, height);
  }

  private updateDisplay(): void {
    this.drawColorArea();
    
    // Update color area cursor position
    const cursor = this.container.querySelector('.color-area-cursor') as HTMLElement;
    if (cursor) {
      const x = (this.currentHSV.s / 100) * this.colorArea.width;
      const y = ((100 - this.currentHSV.v) / 100) * this.colorArea.height;
      cursor.style.left = `${x - 6}px`;
      cursor.style.top = `${y - 6}px`;
    }
    
    // Update hue slider handle
    const hueHandle = this.hueSlider.querySelector('.slider-handle') as HTMLElement;
    if (hueHandle) {
      const huePosition = (this.currentHSV.h / 360) * this.hueSlider.offsetWidth;
      hueHandle.style.left = `${huePosition - 8}px`;
    }
    
    // Update opacity slider handle and background
    const opacityHandle = this.opacitySlider.querySelector('.slider-handle') as HTMLElement;
    if (opacityHandle) {
      const opacityPosition = (this.currentOpacity / 100) * this.opacitySlider.offsetWidth;
      opacityHandle.style.left = `${opacityPosition - 8}px`;
    }
    
    // Update opacity slider background
    const currentColor = this.hsvToHex(this.currentHSV);
    this.opacitySlider.style.background = `linear-gradient(to right, transparent, ${currentColor})`;
    
    // Update preview circle
    const rgb = this.hsvToRgb(this.currentHSV);
    this.previewCircle.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.currentOpacity / 100})`;
    
    // Update hex input
    this.hexInput.value = this.hsvToHex(this.currentHSV);
  }

  private notifyColorChange(): void {
    if (this.options.onColorChange) {
      const hex = this.hsvToHex(this.currentHSV);
      this.options.onColorChange(hex, this.currentOpacity);
    }
  }

  // Color conversion utilities
  private hsvToRgb(hsv: HSV): RGB {
    const h = hsv.h / 360;
    const s = hsv.s / 100;
    const v = hsv.v / 100;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    let r: number, g: number, b: number;
    
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
      default: r = g = b = 0;
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  private rgbToHsv(rgb: RGB): HSV {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    
    if (diff !== 0) {
      switch (max) {
        case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / diff + 2) / 6; break;
        case b: h = ((r - g) / diff + 4) / 6; break;
      }
    }
    
    return {
      h: h * 360,
      s: s * 100,
      v: v * 100
    };
  }

  private hsvToHex(hsv: HSV): string {
    const rgb = this.hsvToRgb(hsv);
    return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
  }

  private hexToHSV(hex: string): HSV {
    const rgb = this.hexToRgb(hex);
    return this.rgbToHsv(rgb);
  }

  private hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private isValidHex(hex: string): boolean {
    return /^#?([a-f\d]{6})$/i.test(hex);
  }

  public show(): void {
    this.overlay.style.display = 'flex';
    this.updateDisplay();
  }

  public close(): void {
    this.overlay.style.display = 'none';
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  public destroy(): void {
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }

  public getCurrentColor(): { hex: string; opacity: number } {
    return {
      hex: this.hsvToHex(this.currentHSV),
      opacity: this.currentOpacity
    };
  }
}