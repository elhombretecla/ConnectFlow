# ConnectFlow - Penpot Plugin

ConnectFlow is a Penpot plugin that replicates the core functionality of Figma's "Autoflow" plugin. It enables users to generate, manage, and customize visual connectors between selected objects on the Penpot canvas.

## Features

- **Smart Connector Generation**: Automatically creates connectors between two selected objects
- **Anchor Point Detection**: Finds the optimal connection points between shapes
- **Customizable Styling**: 
  - Adjustable stroke color and opacity
  - Variable stroke width
  - Multiple stroke styles (solid, dashed, dotted)
  - Arrow markers (start/end)
- **Text Labels**: Add custom text labels to connectors
- **Interactive UI**: Dark theme interface matching Penpot's design system

## How to Use

1. **Install the Plugin**: Load the plugin in Penpot
2. **Select Objects**: Choose exactly two objects on your canvas
3. **Customize Settings**: 
   - Adjust color and opacity using the color picker
   - Set stroke width and style
   - Configure arrow markers
   - Add optional text labels
4. **Generate Connector**: Click the "GENERATE" button to create the connector

## UI Controls

- **Color Swatch**: Click to change connector color (currently set to #FF6FE0)
- **Opacity**: Adjust transparency (0-100%)
- **Stroke Width**: Control line thickness
- **Position**: Inside/Center/Outside stroke positioning
- **Style**: Solid/Dashed/Dotted line styles
- **Arrows**: Configure start and end arrow markers
- **Text Input**: Add custom labels to connectors
- **Draw on Selection**: Auto-generate when selecting objects (checkbox)

## Development

### Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Build for production: `npm run build`

### Project Structure

```
src/
├── plugin.ts    # Main plugin logic (runs in Penpot context)
├── main.ts      # UI logic (runs in plugin panel)
├── style.css    # Plugin interface styling
└── vite-env.d.ts
```

### Key Functions

- **Selection Validation**: Ensures exactly two objects are selected
- **Anchor Point Calculation**: Finds optimal connection points on shape edges
- **Path Generation**: Creates connector paths between anchor points
- **Smart Routing**: Basic pathfinding to avoid overlapping objects
- **Styling Application**: Applies user-defined visual properties

## Technical Implementation

The plugin uses the Penpot Plugin API to:
- Access selected objects via `penpot.selection`
- Create geometric shapes using `penpot.createRectangle()`
- Add text labels with `penpot.createText()`
- Apply styling through fill and stroke properties
- Manage object positioning and rotation

## Loading the Plugin in Penpot

### Development Mode

1. Start the development server: `npm run dev`
2. Open Penpot and use `Ctrl + Alt + P` to open the Plugin Manager
3. Enter the manifest URL: `http://localhost:4400/manifest.json`
4. Install and use the plugin

### Production Build

1. Build the plugin: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Use the deployed manifest.json URL in Penpot

## Future Enhancements

- Advanced pathfinding with obstacle avoidance
- More arrow marker styles
- Curved connector options
- Batch connector generation
- Connector templates and presets

## License

This project is licensed under the MIT License - see the LICENSE file for details.