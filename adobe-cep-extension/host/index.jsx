/**
 * AICOMPLYR CEP Extension - ExtendScript Host Functions
 * This runs in the Adobe application context
 */

// Get document information
function getDocumentInfo() {
    try {
        if (app.documents.length === 0) {
            return JSON.stringify(null);
        }
        
        var doc = app.activeDocument;
        var info = {
            name: doc.name,
            path: doc.fullName ? doc.fullName.fsName : '',
            type: getDocumentType(),
            width: doc.width ? doc.width.toString() : '',
            height: doc.height ? doc.height.toString() : '',
            colorMode: getColorMode(doc),
            created: doc.created ? doc.created.toString() : '',
            modified: doc.modified ? doc.modified.toString() : ''
        };
        
        return JSON.stringify(info);
    } catch (e) {
        return JSON.stringify(null);
    }
}

// Get document type based on application
function getDocumentType() {
    switch (app.name) {
        case 'Adobe Photoshop':
            return 'photoshop';
        case 'Adobe Illustrator':
            return 'illustrator';
        case 'Adobe InDesign':
            return 'indesign';
        case 'Adobe After Effects':
            return 'aftereffects';
        case 'Adobe Premiere Pro':
            return 'premiere';
        default:
            return 'unknown';
    }
}

// Get color mode (Photoshop specific)
function getColorMode(doc) {
    if (app.name !== 'Adobe Photoshop') return '';
    
    switch (doc.mode) {
        case DocumentMode.RGB:
            return 'RGB';
        case DocumentMode.CMYK:
            return 'CMYK';
        case DocumentMode.GRAYSCALE:
            return 'Grayscale';
        default:
            return 'Other';
    }
}

// Get document metadata (XMP)
function getDocumentMetadata() {
    try {
        if (app.documents.length === 0) {
            return JSON.stringify({});
        }
        
        var doc = app.activeDocument;
        var metadata = {};
        
        // Load XMP library
        if (ExternalObject.AdobeXMPScript === undefined) {
            ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
        }
        
        // Get XMP metadata
        var xmp = new XMPMeta(doc.xmpMetadata.rawData);
        
        // Try to get AICOMPLYR metadata
        try {
            metadata.projectId = xmp.getProperty('http://aicomplyr.io/xmp/1.0/', 'projectId');
            metadata.organizationId = xmp.getProperty('http://aicomplyr.io/xmp/1.0/', 'organizationId');
            metadata.complianceStatus = xmp.getProperty('http://aicomplyr.io/xmp/1.0/', 'complianceStatus');
            metadata.complianceScore = xmp.getProperty('http://aicomplyr.io/xmp/1.0/', 'complianceScore');
            metadata.lastChecked = xmp.getProperty('http://aicomplyr.io/xmp/1.0/', 'lastChecked');
        } catch (e) {
            // No AICOMPLYR metadata yet
        }
        
        // Get standard metadata
        metadata.title = getXMPProperty(xmp, XMPConst.NS_DC, 'title');
        metadata.creator = getXMPProperty(xmp, XMPConst.NS_DC, 'creator');
        metadata.description = getXMPProperty(xmp, XMPConst.NS_DC, 'description');
        metadata.keywords = getXMPProperty(xmp, XMPConst.NS_DC, 'subject');
        
        return JSON.stringify(metadata);
    } catch (e) {
        return JSON.stringify({});
    }
}

// Helper to get XMP property safely
function getXMPProperty(xmp, namespace, property) {
    try {
        return xmp.getProperty(namespace, property).toString();
    } catch (e) {
        return '';
    }
}

// Get AI tool usage from document
function getAIToolUsage() {
    try {
        var tools = [];
        
        // Check for Adobe Firefly usage (Photoshop)
        if (app.name === 'Adobe Photoshop') {
            // Check layers for generative fill
            var doc = app.activeDocument;
            for (var i = 0; i < doc.layers.length; i++) {
                var layer = doc.layers[i];
                if (layer.name.indexOf('Generative') !== -1 || 
                    layer.name.indexOf('Firefly') !== -1) {
                    tools.push({
                        tool_name: 'Adobe Firefly',
                        tool_version: app.version,
                        usage_type: 'generative-fill',
                        usage_timestamp: new Date().toISOString()
                    });
                    break;
                }
            }
        }
        
        // Check for other AI features based on app
        // This would be expanded based on specific AI features in each app
        
        return JSON.stringify(tools);
    } catch (e) {
        return JSON.stringify([]);
    }
}

// Detect real-time AI tool usage
function detectAIToolUsage() {
    // This would hook into application events to detect AI tool usage
    // For now, return empty array
    return JSON.stringify([]);
}

// Embed XMP metadata in document
function embedXMPMetadata(xmpDataStr) {
    try {
        if (app.documents.length === 0) {
            return 'false';
        }
        
        var doc = app.activeDocument;
        var xmpData = JSON.parse(xmpDataStr);
        
        // Load XMP library
        if (ExternalObject.AdobeXMPScript === undefined) {
            ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
        }
        
        // Get existing XMP or create new
        var xmp;
        if (doc.xmpMetadata && doc.xmpMetadata.rawData) {
            xmp = new XMPMeta(doc.xmpMetadata.rawData);
        } else {
            xmp = new XMPMeta();
        }
        
        // Register AICOMPLYR namespace
        XMPMeta.registerNamespace('http://aicomplyr.io/xmp/1.0/', 'aicomplyr');
        
        // Set AICOMPLYR properties
        for (var key in xmpData) {
            if (xmpData.hasOwnProperty(key) && key.indexOf('aicomplyr:') === 0) {
                var prop = key.substring(10); // Remove 'aicomplyr:' prefix
                xmp.setProperty('http://aicomplyr.io/xmp/1.0/', prop, xmpData[key]);
            }
        }
        
        // Apply XMP to document
        doc.xmpMetadata.rawData = xmp.serialize();
        
        return 'true';
    } catch (e) {
        $.writeln('Error embedding XMP: ' + e.toString());
        return 'false';
    }
}

// Export functions for testing
var exports = {
    getDocumentInfo: getDocumentInfo,
    getDocumentMetadata: getDocumentMetadata,
    getAIToolUsage: getAIToolUsage,
    detectAIToolUsage: detectAIToolUsage,
    embedXMPMetadata: embedXMPMetadata
};