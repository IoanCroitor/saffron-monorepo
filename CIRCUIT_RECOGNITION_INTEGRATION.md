# Circuit Recognition API Integration

This document describes the integration of the Circuit Recognition API alongside Google Gemini AI in the `/scan` route of the Saffron application.

## Overview

The scan page now supports two different analysis engines:

1. **Google Gemini AI** - AI-powered circuit analysis using Google's Gemini model
2. **Circuit Recognition API** - Specialized circuit recognition service with structured output

## Features

### Dual API Support
- **Toggle between APIs**: Users can choose between Gemini AI and Circuit Recognition API
- **Automatic API detection**: The system checks if the Circuit Recognition API is available
- **Fallback handling**: If Circuit Recognition API is unavailable, users are guided to use Gemini

### Circuit Recognition API Features
- **Image to JSON**: Convert circuit images to structured JSON data
- **Image to ASC**: Generate LTspice ASC files from images
- **ASC to JSON**: Convert existing ASC files to JSON format
- **YOLO Debug Images**: Generate annotated images with bounding boxes and component labels
- **Processing time tracking**: Shows how long the recognition took
- **Component detection**: Identifies and counts different component types
- **Wire connection mapping**: Maps circuit connections

### Enhanced UI
- **API selection cards**: Clear visual distinction between available APIs
- **Status indicators**: Shows availability of each API
- **Circuit data visualization**: Displays structured data when using Circuit Recognition API
- **YOLO debug visualization**: Shows annotated images with component detection
- **Multiple file upload options**: Support for images and ASC files
- **Download options**: Export results as SPICE netlists, ASC files, JSON data, or annotated images

## API Configuration

### Circuit Recognition API
- **Base URL**: `http://localhost:8000/api/v1`
- **API Key**: `test-key-123` (default)
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /recognize-circuit` - Image to ASC/JSON
  - `POST /recognize-circuit/parse` - Image to JSON with processing time
  - `POST /recognize-circuit/annotated-image` - Image to annotated image with YOLO detection
  - `POST /asc-to-json/convert` - ASC to JSON conversion
  - `POST /asc-to-json/parse` - ASC file parsing

### Google Gemini AI
- **API Key**: Set via `PUBLIC_GEMINI_API_KEY` environment variable
- **Model**: `gemini-1.5-flash`
- **Fallback**: Demo mode when API key is not available

## Usage

### For Users

1. **Choose Analysis Engine**:
   - Select between "Google Gemini AI" or "Circuit Recognition API"
   - The system automatically checks API availability

2. **Upload Circuit**:
   - **Capture Photo**: Use device camera
   - **Upload Image**: Select image file (PNG, JPG)
   - **Upload ASC File**: Convert existing ASC files (Circuit Recognition API only)

3. **Process and View Results**:
   - Get SPICE netlist output
   - View structured circuit data (Circuit Recognition API)
   - Download results in various formats

### For Developers

#### Service Integration
```typescript
import { circuitRecognitionAPI } from '$lib/services/circuit-recognition-api';

// Check API health
const health = await circuitRecognitionAPI.healthCheck();

// Process image
const result = await circuitRecognitionAPI.recognizeCircuitWithParsing(imageFile);

// Generate annotated image with YOLO detection
const annotatedImageBlob = await circuitRecognitionAPI.getAnnotatedImage(imageFile);

// Convert ASC file
const jsonData = await circuitRecognitionAPI.convertAscToJson(ascFile);
```

#### State Management
```typescript
// API selection
let selectedAPI: 'gemini' | 'circuit-recognition' = 'gemini';

// API status
let apiStatus: 'unknown' | 'available' | 'unavailable' = 'unknown';

// Circuit recognition data
let circuitRecognitionData: CircuitRecognitionResponse | null = null;

// YOLO debug image
let annotatedImageUrl: string = '';
let showAnnotatedImage: boolean = false;
let isGeneratingAnnotatedImage: boolean = false;
```

## File Structure

```
src/
├── lib/
│   └── services/
│       └── circuit-recognition-api.ts    # API service
└── routes/
    └── scan/
        └── +page.svelte                  # Updated scan page
```

## Error Handling

- **API Unavailable**: Clear messaging when Circuit Recognition API is not running
- **File Validation**: Checks for valid file types and sizes
- **Network Errors**: Graceful fallback to available APIs
- **Processing Errors**: Detailed error messages for debugging

## Performance Considerations

- **File Size Limits**: 10MB maximum for uploads
- **Processing Time**: Circuit Recognition API typically 2-5 seconds
- **Caching**: Results are stored in component state
- **Concurrent Requests**: Both APIs support multiple simultaneous requests

## Security

- **API Key Management**: Environment variables for sensitive keys
- **File Validation**: Server-side validation of uploaded files
- **CORS Configuration**: Proper CORS setup for local development
- **HTTPS**: Use HTTPS in production for secure file uploads

## Testing

### Manual Testing
1. Start the Circuit Recognition API server
2. Navigate to `/scan` route
3. Test both API options with sample images
4. Verify YOLO debug image generation and display
5. Test file upload/download functionality
6. Check error handling with invalid files

### API Testing
```bash
# Health check
curl -H "X-API-Key: test-key-123" http://localhost:8000/api/v1/health

# Circuit recognition
curl -X POST -H "X-API-Key: test-key-123" \
  -F "file=@circuit.png" \
  -F "output_format=json" \
  http://localhost:8000/api/v1/recognize-circuit

# YOLO annotated image
curl -X POST -H "X-API-Key: test-key-123" \
  -F "file=@circuit.png" \
  http://localhost:8000/api/v1/recognize-circuit/annotated-image \
  -o circuit-annotated.png
```

## Future Enhancements

- **Batch Processing**: Support for multiple files
- **Advanced Filtering**: Component type filtering
- **Custom Models**: User-trained recognition models
- **Real-time Processing**: WebSocket support for live updates
- **Export Formats**: Support for additional circuit formats
- **Collaboration**: Real-time collaborative circuit editing

## Troubleshooting

### Common Issues

1. **Circuit Recognition API Not Available**
   - Check if server is running on `http://localhost:8000`
   - Verify API key configuration
   - Check network connectivity

2. **File Upload Failures**
   - Ensure file size is under 10MB
   - Check file format compatibility
   - Verify file permissions

3. **Processing Errors**
   - Check API server logs
   - Verify image quality and format
   - Ensure proper lighting in captured images

### Debug Mode
Enable debug logging by setting `console.log` statements in the service file for detailed error information. 