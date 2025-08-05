import { ConnectorTypeManager, ConnectorType, AnchorPoint } from "./connectorTypes";

penpot.ui.open("ConnectFlow", `?theme=${penpot.theme}`, { width: 320, height: 600 });

// Send initial selection state
setTimeout(() => {
  const selection = penpot.selection.map(shape => ({
    name: shape.name,
    type: shape.type,
    id: shape.id
  }));

  penpot.ui.sendMessage({
    type: 'selection-update',
    selection: selection
  });
}, 100);

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
}

interface Point {
  x: number;
  y: number;
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

// Get specific anchor point by side
function getAnchorPointBySide(shape: any, side: 'top' | 'right' | 'bottom' | 'left'): AnchorPoint {
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  switch (side) {
    case 'top':
      return { x: centerX, y: shape.y, side: 'top' };
    case 'right':
      return { x: shape.x + shape.width, y: centerY, side: 'right' };
    case 'bottom':
      return { x: centerX, y: shape.y + shape.height, side: 'bottom' };
    case 'left':
      return { x: shape.x, y: centerY, side: 'left' };
  }
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

  // Use manual anchor selection if available, otherwise find optimal anchor points
  let start: AnchorPoint;
  let end: AnchorPoint;

  if (settings.startAnchor && settings.endAnchor) {
    // Both anchors manually selected
    start = getAnchorPointBySide(shape1, settings.startAnchor as 'top' | 'right' | 'bottom' | 'left');
    end = getAnchorPointBySide(shape2, settings.endAnchor as 'top' | 'right' | 'bottom' | 'left');
    console.log('Using manually selected anchor points:', settings.startAnchor, settings.endAnchor);
  } else if (settings.startAnchor) {
    // Only start anchor manually selected
    start = getAnchorPointBySide(shape1, settings.startAnchor as 'top' | 'right' | 'bottom' | 'left');
    // Find closest anchor on shape2 to the selected start anchor
    const anchors2 = getAnchorPoints(shape2);
    let minDistance = Infinity;
    end = anchors2[0];
    for (const anchor2 of anchors2) {
      const dist = distance(start, anchor2);
      if (dist < minDistance) {
        minDistance = dist;
        end = anchor2;
      }
    }
    console.log('Using manually selected start anchor:', settings.startAnchor, 'and closest end anchor:', end.side);
  } else if (settings.endAnchor) {
    // Only end anchor manually selected
    end = getAnchorPointBySide(shape2, settings.endAnchor as 'top' | 'right' | 'bottom' | 'left');
    // Find closest anchor on shape1 to the selected end anchor
    const anchors1 = getAnchorPoints(shape1);
    let minDistance = Infinity;
    start = anchors1[0];
    for (const anchor1 of anchors1) {
      const dist = distance(anchor1, end);
      if (dist < minDistance) {
        minDistance = dist;
        start = anchor1;
      }
    }
    console.log('Using manually selected end anchor:', settings.endAnchor, 'and closest start anchor:', start.side);
  } else {
    // No manual selection, use automatic detection
    const closestPair = findClosestAnchorPoints(shape1, shape2);
    start = closestPair.start;
    end = closestPair.end;
    console.log('Using automatically detected anchor points:', start.side, end.side);
  }

  // Try creating a path using SVG string (alternative approach)
  try {
    console.log('Creating path using SVG approach');
    console.log('Start point:', start.x, start.y);
    console.log('End point:', end.x, end.y);
    console.log('Connector type:', settings.connectorType);

    // Generate path data using the connector type manager
    const pathData = ConnectorTypeManager.generatePath({
      type: settings.connectorType,
      startPoint: start,
      endPoint: end
    });

    console.log('Generated path data:', pathData);

    // Create a minimal SVG with proper viewBox to avoid huge dimensions
    const minX = Math.min(start.x, end.x) - 50;
    const minY = Math.min(start.y, end.y) - 50;
    const width = Math.abs(end.x - start.x) + 100;
    const height = Math.abs(end.y - start.y) + 100;

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
      // Update current settings to keep them in sync
      currentSettings = { ...message.settings };
      console.log('Settings updated, drawOnSelection:', currentSettings.drawOnSelection);
      break;
  }
});

// Store current settings to access drawOnSelection
let currentSettings: ConnectorSettings = {
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
  connectorType: "direct"
};

// Auto-generate on selection change if enabled
penpot.on('selectionchange', () => {
  // Send selection info to UI for preview updates
  const selection = penpot.selection.map(shape => ({
    name: shape.name,
    type: shape.type,
    id: shape.id
  }));

  penpot.ui.sendMessage({
    type: 'selection-update',
    selection: selection
  });

  // Auto-generate connector if drawOnSelection is enabled and we have exactly 2 elements
  if (currentSettings.drawOnSelection && selection.length === 2) {
    console.log('Auto-generating connector due to drawOnSelection being enabled');
    generateConnector(currentSettings);
  }
});

// Update the theme in the iframe
penpot.on("themechange", (theme) => {
  penpot.ui.sendMessage({
    source: "penpot",
    type: "themechange",
    theme,
  });
});
