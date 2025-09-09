# AICOMPLYR CEP Extension for Adobe Creative Cloud

## Overview

The AICOMPLYR CEP Extension provides real-time compliance checking and metadata embedding directly within Adobe Creative Cloud applications. It monitors AI tool usage, validates compliance policies, and embeds compliance metadata using Adobe XMP standards.

## Supported Applications

- Adobe Photoshop 2022+ (v23.0+)
- Adobe Illustrator 2022+ (v26.0+)
- Adobe InDesign 2022+ (v17.0+)
- Adobe After Effects 2022+ (v19.0+)
- Adobe Premiere Pro 2022+ (v16.0+)

## Features

### Real-time Compliance Monitoring
- Automatic compliance status display
- Live AI tool usage detection
- Policy violation alerts
- Compliance score visualization

### Metadata Integration
- Embed compliance data in XMP format
- Preserve metadata across file saves
- Support for all Adobe file formats
- Automatic metadata updates

### AI Tool Tracking
- Adobe Firefly usage detection
- Generative Fill tracking
- Third-party AI plugin monitoring
- Usage history logging

### Workflow Integration
- Auto-check on file save
- One-click compliance reports
- Direct platform sync
- Batch operations support

## Installation

### For Development

1. **Enable Developer Mode**
   - Open Adobe Creative Cloud
   - Go to Preferences > Apps > Settings
   - Enable "Enable development/debug mode"

2. **Install Extension**
   ```bash
   # Clone repository
   git clone [repository-url]
   cd adobe-cep-extension
   
   # Copy to extensions folder
   # macOS
   cp -R . ~/Library/Application\ Support/Adobe/CEP/extensions/io.aicomplyr.compliance
   
   # Windows
   # Copy to: C:\Users\[Username]\AppData\Roaming\Adobe\CEP\extensions\io.aicomplyr.compliance
   ```

3. **Set Debug Mode**
   - Create/edit `~/.debug` (macOS) or `%APPDATA%\Adobe\CEP\debug` (Windows)
   - Add:
   ```xml
   <Extension Id="io.aicomplyr.compliance.panel">
     <HostList>
       <Host Name="PHSP" Port="8088"/>
       <Host Name="ILST" Port="8089"/>
       <Host Name="IDSN" Port="8090"/>
     </HostList>
   </Extension>
   ```

### For Production

1. **Sign Extension**
   ```bash
   npm run certificate  # First time only
   npm run build       # Creates aicomplyr-compliance.zxp
   ```

2. **Install via Adobe Exchange** (Coming Soon)
   - Search for "AICOMPLYR Compliance"
   - Click Install
   - Restart Adobe applications

3. **Manual Installation**
   - Download `aicomplyr-compliance.zxp`
   - Use Adobe Extension Manager CC
   - Or use ExManCmd tool

## Configuration

1. **Open Extension Panel**
   - Window > Extensions > AICOMPLYR Compliance

2. **Configure Settings**
   - Click settings icon
   - Enter API endpoint
   - Enter Organization ID
   - Enable desired features

3. **Test Connection**
   - Click "Check Compliance Now"
   - Verify connection status

## Usage

### Compliance Check
1. Open any document
2. Panel shows current compliance status
3. Click "Check Compliance Now" for manual check
4. View detailed violations and recommendations

### Embed Metadata
1. Complete compliance check
2. Click "Embed Compliance Metadata"
3. Save document to preserve metadata

### View Reports
1. Click "View Full Report"
2. Opens detailed report in browser
3. Share with stakeholders

## API Integration

The extension communicates with AICOMPLYR.IO APIs:

- **Health Check**: `/health`
- **Compliance Check**: `/compliance/check`
- **AI Tool Logging**: `/ai-tools/log`
- **Report Generation**: `/compliance/reports/{id}`

## XMP Metadata Schema

The extension uses custom XMP namespace:
```
Namespace: http://aicomplyr.io/xmp/1.0/
Prefix: aicomplyr
```

Fields:
- `aicomplyr:version`
- `aicomplyr:projectId`
- `aicomplyr:organizationId`
- `aicomplyr:complianceStatus`
- `aicomplyr:complianceScore`
- `aicomplyr:riskLevel`
- `aicomplyr:lastChecked`
- `aicomplyr:aiTools`
- `aicomplyr:violations`

## Development

### Project Structure
```
adobe-cep-extension/
├── CSXS/
│   └── manifest.xml      # Extension manifest
├── client/
│   ├── index.html        # Main UI
│   ├── js/              # JavaScript files
│   └── css/             # Styles
├── host/
│   └── index.jsx        # ExtendScript code
└── package.json         # Build configuration
```

### Building from Source
```bash
# Install dependencies
npm install

# Create self-signed certificate (first time)
npm run certificate

# Build extension
npm run build

# Debug mode
npm run debug
```

### Debugging

1. **Chrome DevTools**
   - Navigate to: http://localhost:8088 (port varies by app)
   - Debug JavaScript like web app

2. **ExtendScript Toolkit**
   - Debug host-side ExtendScript
   - Set breakpoints in .jsx files

3. **Console Logging**
   - Client: `console.log()` appears in Chrome DevTools
   - Host: `$.writeln()` appears in ExtendScript console

## Security

- All API communication over HTTPS
- Credentials stored securely in system keychain
- XMP metadata sanitized before embedding
- Extension signed with developer certificate

## Troubleshooting

### Extension Not Appearing
- Verify installation path
- Check debug mode is enabled
- Restart Adobe application
- Clear CEP cache

### Connection Issues
- Verify API endpoint
- Check organization ID
- Ensure network connectivity
- Review firewall settings

### Metadata Not Saving
- Check file permissions
- Verify XMP support for file format
- Ensure sufficient disk space
- Try "Save As" instead of "Save"

## Support

- Documentation: https://docs.aicomplyr.io/cep-extension
- Issues: https://github.com/aicomplyr/cep-extension/issues
- Email: support@aicomplyr.io

## License

MIT License - See LICENSE file for details