export interface Point {
  x: number;
  y: number;
}

export interface AnchorPoint extends Point {
  side: 'top' | 'right' | 'bottom' | 'left';
}

export type ConnectorType = 'direct' | 'orthogonal' | 'curve';

export interface ConnectorTypeOptions {
  type: ConnectorType;
  startPoint: AnchorPoint;
  endPoint: AnchorPoint;
}

/**
 * Clase para manejar los diferentes tipos de conectores
 */
export class ConnectorTypeManager {

  /**
   * Genera el path SVG según el tipo de conector seleccionado
   */
  static generatePath(options: ConnectorTypeOptions): string {
    const { type, startPoint, endPoint } = options;

    switch (type) {
      case 'direct':
        return this.generateDirectPath(startPoint, endPoint);
      case 'orthogonal':
        return this.generateOrthogonalPath(startPoint, endPoint);
      case 'curve':
        return this.generateCurvePath(startPoint, endPoint);
      default:
        return this.generateDirectPath(startPoint, endPoint);
    }
  }

  /**
   * Modo Direct: Línea recta entre dos puntos
   */
  private static generateDirectPath(start: Point, end: Point): string {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  /**
   * Modo Orthogonal: Conexión con ángulos rectos (90 grados)
   * Maneja diferentes tipos de conexiones según los lados de anclaje
   */
  private static generateOrthogonalPath(start: AnchorPoint, end: AnchorPoint): string {
    const { x: x1, y: y1, side: startSide } = start;
    const { x: x2, y: y2, side: endSide } = end;

    const deltaX = x2 - x1;
    const deltaY = y2 - y1;

    // Clasificar el tipo de conexión basado en los lados de anclaje
    const startIsHorizontal = startSide === 'left' || startSide === 'right';
    const endIsHorizontal = endSide === 'left' || endSide === 'right';
    const startIsVertical = startSide === 'top' || startSide === 'bottom';
    const endIsVertical = endSide === 'top' || endSide === 'bottom';

    if (startIsHorizontal && endIsHorizontal) {
      // CASO HORIZONTAL: left/right ↔ left/right (necesita zigzag)
      const midX = x1 + deltaX / 2;
      return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

    } else if (startIsVertical && endIsVertical) {
      // CASO VERTICAL: top/bottom ↔ top/bottom (necesita zigzag)
      const midY = y1 + deltaY / 2;
      return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;

    } else if (startIsHorizontal && endIsVertical) {
      // CASO MIXTO: left/right → top/bottom (una esquina)
      return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;

    } else if (startIsVertical && endIsHorizontal) {
      // CASO MIXTO: top/bottom → left/right (una esquina)
      return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;

    } else {
      // Fallback: usar distancia para determinar orientación principal
      const isHorizontalPrimary = Math.abs(deltaX) > Math.abs(deltaY);
      if (isHorizontalPrimary) {
        return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
      } else {
        return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
      }
    }
  }



  /**
   * Modo Curve: Conexión con curvas suaves
   * Maneja diferentes tipos de conexiones según los lados de anclaje, usando curvas en lugar de ángulos
   */
  private static generateCurvePath(start: AnchorPoint, end: AnchorPoint): string {
    const { x: x1, y: y1, side: startSide } = start;
    const { x: x2, y: y2, side: endSide } = end;

    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Factor de curvatura adaptativo
    const minCurveFactor = 30;
    const curveFactor = Math.max(minCurveFactor, Math.min(distance / 3, 120));

    // Clasificar el tipo de conexión basado en los lados de anclaje
    const startIsHorizontal = startSide === 'left' || startSide === 'right';
    const endIsHorizontal = endSide === 'left' || endSide === 'right';
    const startIsVertical = startSide === 'top' || startSide === 'bottom';
    const endIsVertical = endSide === 'top' || endSide === 'bottom';

    if (startIsHorizontal && endIsHorizontal) {
      // CASO HORIZONTAL: left/right ↔ left/right (curva tipo "S" horizontal)
      const midX = x1 + deltaX / 2;

      // Puntos de control para crear una curva suave tipo "S"
      const c1x = x1 + (deltaX >= 0 ? curveFactor : -curveFactor);
      const c1y = y1;
      const c2x = midX;
      const c2y = y1;
      const c3x = midX;
      const c3y = y2;
      const c4x = x2 - (deltaX >= 0 ? curveFactor : -curveFactor);
      const c4y = y2;

      // Usar múltiples curvas para crear el efecto zigzag suave
      return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${midX} ${y1 + (y2 - y1) * 0.5} C ${c3x} ${c3y}, ${c4x} ${c4y}, ${x2} ${y2}`;

    } else if (startIsVertical && endIsVertical) {
      // CASO VERTICAL: top/bottom ↔ top/bottom (curva tipo "S" vertical)
      const midY = y1 + deltaY / 2;

      // Puntos de control para crear una curva suave tipo "S"
      const c1x = x1;
      const c1y = y1 + (deltaY >= 0 ? curveFactor : -curveFactor);
      const c2x = x1;
      const c2y = midY;
      const c3x = x2;
      const c3y = midY;
      const c4x = x2;
      const c4y = y2 - (deltaY >= 0 ? curveFactor : -curveFactor);

      // Usar múltiples curvas para crear el efecto zigzag suave
      return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x1 + (x2 - x1) * 0.5} ${midY} C ${c3x} ${c3y}, ${c4x} ${c4y}, ${x2} ${y2}`;

    } else if (startIsHorizontal && endIsVertical) {
      // CASO MIXTO: left/right → top/bottom (curva simple con una esquina suave)
      const c1x = x1 + (deltaX >= 0 ? curveFactor : -curveFactor);
      const c1y = y1;
      const c2x = x2;
      const c2y = y2 - (deltaY >= 0 ? curveFactor : -curveFactor);

      return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c1y}, ${x2} ${y1 + (y2 - y1) * 0.5} C ${c2x} ${c2y}, ${x2} ${c2y}, ${x2} ${y2}`;

    } else if (startIsVertical && endIsHorizontal) {
      // CASO MIXTO: top/bottom → left/right (curva simple con una esquina suave)
      const c1x = x1;
      const c1y = y1 + (deltaY >= 0 ? curveFactor : -curveFactor);
      const c2x = x2 - (deltaX >= 0 ? curveFactor : -curveFactor);
      const c2y = y2;

      return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c1x} ${y2}, ${x1 + (x2 - x1) * 0.5} ${y2} C ${c2x} ${c2y}, ${c2x} ${y2}, ${x2} ${y2}`;

    } else {
      // Fallback: curva simple basada en distancia
      const isHorizontalPrimary = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontalPrimary) {
        const c1x = x1 + (deltaX >= 0 ? curveFactor : -curveFactor);
        const c1y = y1;
        const c2x = x2 - (deltaX >= 0 ? curveFactor : -curveFactor);
        const c2y = y2;
        return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
      } else {
        const c1x = x1;
        const c1y = y1 + (deltaY >= 0 ? curveFactor : -curveFactor);
        const c2x = x2;
        const c2y = y2 - (deltaY >= 0 ? curveFactor : -curveFactor);
        return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
      }
    }
  }





  /**
   * Obtiene el nombre legible del tipo de conector
   */
  static getConnectorTypeName(type: ConnectorType): string {
    switch (type) {
      case 'direct':
        return 'Direct';
      case 'orthogonal':
        return 'Orthogonal';
      case 'curve':
        return 'Curve';
      default:
        return 'Direct';
    }
  }

  /**
   * Obtiene todos los tipos de conectores disponibles
   */
  static getAvailableTypes(): { value: ConnectorType; label: string }[] {
    return [
      { value: 'direct', label: 'Direct' },
      { value: 'orthogonal', label: 'Orthogonal' },
      { value: 'curve', label: 'Curve' }
    ];
  }
}