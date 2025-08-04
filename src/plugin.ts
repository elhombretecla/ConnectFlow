penpot.ui.open("ConnectFlow", `?theme=${penpot.theme}`, { width: 320, height: 600 });

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

interface Point {
  x: number;
  y: number;
}

interface AnchorPoint extends Point {
  side: 'top' | 'right' | 'bottom' | 'left';
}

// Calculate anchor points for a shape
function getAnchorPoints(shape: any): AnchorPoint[] {
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  return [
    { x: centerX, y: shape.y, side: 'top' },
    { x: shape.x + shape.width, y: centerY, side: 'right' },
    { x: centerX, y: shape.y + shape.height, side: 'bottom' },
    { x: shape.x, y: centerY, side: 'left' }
  ];
}

// Calculate distance between two points
function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Find the closest anchor points between two shapes
function findClosestAnchorPoints(shape1: any, shape2: any): { start: AnchorPoint, end: AnchorPoint } {
  const anchors1 = getAnchorPoints(shape1);
  const anchors2 = getAnchorPoints(shape2);

  let minDistance = Infinity;
  let closestPair = { start: anchors1[0], end: anchors2[0] };

  for (const anchor1 of anchors1) {
    for (const anchor2 of anchors2) {
      const dist = distance(anchor1, anchor2);
      if (dist < minDistance) {
        minDistance = dist;
        closestPair = { start: anchor1, end: anchor2 };
      }
    }
  }

  return closestPair;
}

// Create a simple straight line path
function createStraightPath(start: Point, end: Point): string {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

// Create an elbow (right-angled) path
function createElbowPath(start: AnchorPoint, end: AnchorPoint): string {
  const midX = start.x + (end.x - start.x) / 2;
  const midY = start.y + (end.y - start.y) / 2;

  // Simple elbow logic - can be enhanced with more sophisticated routing
  if (start.side === 'right' || start.side === 'left') {
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  } else {
    return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
  }
}

// Create arrow marker
function createArrowMarker(settings: ConnectorSettings): string {
  if (settings.endArrow === 'none') return '';

  // Simple arrow path - this would need to be adapted to Penpot's marker system
  return 'M 0 0 L 10 5 L 0 10 Z';
}

// Generate connector between two selected objects
function generateConnector(settings: ConnectorSettings) {
  console.log('Generating connector with settings:', settings);
  const selected = penpot.selection;

  // Validate selection
  if (selected.length !== 2) {
    penpot.ui.sendMessage({
      type: 'notification',
      message: 'Please select exactly two objects to create a flow.'
    });
    return;
  }

  const [shape1, shape2] = selected;

  // Find optimal anchor points
  const { start, end } = findClosestAnchorPoints(shape1, shape2);

  // Try creating a path using SVG string (alternative approach)
  try {
    console.log('Creating path using SVG approach');
    console.log('Start point:', start.x, start.y);
    console.log('End point:', end.x, end.y);

    // Create a minimal SVG with proper viewBox to avoid huge dimensions
    const pathData = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    const minX = Math.min(start.x, end.x) - 10;
    const minY = Math.min(start.y, end.y) - 10;
    const width = Math.abs(end.x - start.x) + 20;
    const height = Math.abs(end.y - start.y) + 20;

    const svgString = `<svg viewBox="${minX} ${minY} ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <path d="${pathData}" fill="none" stroke="${settings.color}" stroke-width="${settings.strokeWidth}"/>
    </svg>`;

    console.log('SVG string:', svgString);

    const connector = penpot.createShapeFromSvg(svgString);
    let finalConnector: any = connector;

    if (connector) {
      console.log('SVG shape created successfully');

      // Find the path inside the group recursively
      const findPath = (shape: any): any => {
        if (penpot.utils.types.isPath(shape)) {
          return shape;
        }
        if (shape.children) {
          for (const child of shape.children) {
            const found = findPath(child);
            if (found) return found;
          }
        }
        return null;
      };

      const pathShape = findPath(connector);

      if (pathShape) {
        console.log('Found path shape:', pathShape.type);

        // Apply styling to the path
        pathShape.fills = [];
        const strokeAlignment = settings.position as 'center' | 'inner' | 'outer';
        const strokeStyle = settings.style as 'solid' | 'dashed' | 'dotted' | 'mixed';

        console.log('Setting strokeAlignment to:', strokeAlignment);
        console.log('Setting strokeStyle to:', strokeStyle);
        console.log('Settings startArrow:', settings.startArrow);
        console.log('Settings endArrow:', settings.endArrow);

        // Build stroke object with caps
        const stroke: any = {
          strokeColor: settings.color,
          strokeOpacity: settings.opacity / 100,
          strokeWidth: settings.strokeWidth,
          strokeStyle: strokeStyle,
          strokeAlignment: strokeAlignment
        };

        // Add stroke caps if they are not 'none'
        if (settings.startArrow !== 'none') {
          stroke.strokeCapStart = settings.startArrow as 'round' | 'square' | 'line-arrow' | 'triangle-arrow' | 'square-marker' | 'circle-marker' | 'diamond-marker';
          console.log('Adding strokeCapStart:', stroke.strokeCapStart);
        }

        if (settings.endArrow !== 'none') {
          stroke.strokeCapEnd = settings.endArrow as 'round' | 'square' | 'line-arrow' | 'triangle-arrow' | 'square-marker' | 'circle-marker' | 'diamond-marker';
          console.log('Adding strokeCapEnd:', stroke.strokeCapEnd);
        }

        console.log('Final stroke object:', JSON.stringify(stroke, null, 2));
        pathShape.strokes = [stroke];

        // Extract the path from the group using ungroup
        console.log('Ungrouping SVG to extract path');

        // Position the group correctly first
        connector.x = minX;
        connector.y = minY;

        // Before ungrouping, collect all non-path elements to delete them
        const elementsToDelete: any[] = [];
        if (connector.children) {
          for (const child of connector.children) {
            if (!penpot.utils.types.isPath(child)) {
              elementsToDelete.push(child);
              console.log('Marking for deletion:', child.type);
            }
          }
        }

        // Ungroup the SVG to get individual elements
        if (penpot.utils.types.isGroup(connector)) {
          penpot.ungroup(connector);
          console.log('SVG group ungrouped');

          // Delete the unwanted elements (like base-background)
          for (const element of elementsToDelete) {
            try {
              element.remove();
              console.log('Deleted element:', element.type);
            } catch (error) {
              console.log('Could not delete element:', error);
            }
          }

          // Use the path as our final connector
          finalConnector = pathShape;
        } else {
          console.log('Connector is not a group, using as-is');
          finalConnector = connector;
        }
      } else {
        console.error('Could not find path shape in SVG group');
        finalConnector = connector;
      }

      const createdElements: any[] = [finalConnector];

      // Add text label if specified
      if (settings.labelText.trim()) {
        const midX = start.x + (end.x - start.x) / 2;
        const midY = start.y + (end.y - start.y) / 2;

        const textLabel = penpot.createText(settings.labelText);
        if (textLabel) {
          textLabel.x = midX - 25; // Approximate centering
          textLabel.y = midY - 10;
          textLabel.fills = [{
            fillColor: settings.color,
            fillOpacity: settings.opacity / 100
          }];

          createdElements.push(textLabel);
        }
      }

      // Select the created elements
      penpot.selection = createdElements;

      penpot.ui.sendMessage({
        type: 'notification',
        message: 'Connector created successfully!'
      });
    }
  } catch (error) {
    console.error('Error creating connector:', error);
    penpot.ui.sendMessage({
      type: 'notification',
      message: 'Error creating connector. Please try again.'
    });
  }
}

// Handle messages from UI
penpot.ui.onMessage<any>((message) => {
  switch (message.type) {
    case 'generate-connector':
      generateConnector(message.settings);
      break;
    case 'settings-changed':
      // Settings updated - could trigger live preview if needed
      break;
  }
});

// Auto-generate on selection change if enabled
penpot.on('selectionchange', () => {
  // This would be implemented if drawOnSelection is enabled
  // For now, we'll keep it manual via the Generate button
});

// Update the theme in the iframe
penpot.on("themechange", (theme) => {
  penpot.ui.sendMessage({
    source: "penpot",
    type: "themechange",
    theme,
  });
});
