# Flamo shared resources

Deploy flamo-runtime/ and component-viewport.js directly under http://localhost:8080/common/. Keep the Runtime directory contents together; do not add another directory level or query parameters to filenames.

Runtime: http://localhost:8080/common/flamo-runtime/index.es.js?v=6d2ff1a7ac46cbf71db7bc0e5e550b1103dfff6826484a351327f677c7d408f6
Viewport: http://localhost:8080/common/component-viewport.js?v=7f533668b721e562ddf4b4d8b1b520b1b229234216c8393b7cf1cf5192a1ccd0

Serve JavaScript with a JavaScript MIME type and allow cross-origin module requests (CORS). Use a new version directory when updating a versioned deployment.

This archive contains Runtime and component-viewport.js only. Project interactions remain in each component package. Runtime usage remains subject to FLAMO-RUNTIME-LICENSE and third-party licenses.
