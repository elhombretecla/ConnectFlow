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
   * Modo Curve: Conexión con curva suave tipo "S"
   * Detecta si la conexión es principalmente horizontal o vertical y ajusta la dirección de salida
   */
  private static generateCurvePath(start: AnchorPoint, end: AnchorPoint): string {
    const { x: x1, y: y1 } = start;
    const { x: x2, y: y2 } = end;

    // Calcular la distancia entre puntos
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Factor de curvatura basado en la distancia, con un mínimo para curvas muy pequeñas
    const minCurveFactor = 30;
    const curveFactor = Math.max(minCurveFactor, Math.min(distance / 3, 120));

    // Determinar si la conexión es principalmente horizontal o vertical
    const isHorizontalPrimary = Math.abs(deltaX) > Math.abs(deltaY);

    let c1x: number, c1y: number, c2x: number, c2y: number;

    if (isHorizontalPrimary) {
      // Conexión principalmente horizontal - puntos de control horizontales
      c1x = x1 + (deltaX >= 0 ? curveFactor : -curveFactor);
      c1y = y1;
      c2x = x2 - (deltaX >= 0 ? curveFactor : -curveFactor);
      c2y = y2;
    } else {
      // Conexión principalmente vertical - puntos de control verticales
      c1x = x1;
      c1y = y1 + (deltaY >= 0 ? curveFactor : -curveFactor);
      c2x = x2;
      c2y = y2 - (deltaY >= 0 ? curveFactor : -curveFactor);
    }

    return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
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