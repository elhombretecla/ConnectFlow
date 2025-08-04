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
  
  // Create the connector as a simple rectangle (line)
  try {
    // Calculate line dimensions and position
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    const connector = penpot.createRectangle();
    
    if (connector) {
      // Resize and position the rectangle to create a line
      connector.resize(length, settings.strokeWidth);
      connector.x = start.x;
      connector.y = start.y - settings.strokeWidth / 2;
      
      // Rotate the rectangle to match the line angle
      connector.rotation = angle;
      
      // Apply styling
      connector.fills = [{
        fillColor: settings.color,
        fillOpacity: settings.opacity / 100
      }];
      connector.strokes = [];
      
      const createdElements: any[] = [connector];
      
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
