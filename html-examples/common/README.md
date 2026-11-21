# Flamo shared resources

Deploy flamo-runtime/ and component-viewport.js directly under http://localhost:8080/common/. Keep the Runtime directory contents together; do not add another directory level or query parameters to filenames.

Runtime: http://localhost:8080/common/flamo-runtime/index.es.js?v=8f5d47e13e7bdefb2390913112ff092935863a76d5cfbd39f3b75f4cc804ce19
Viewport: http://localhost:8080/common/component-viewport.js?v=8a9625e8b5d2fa2deb7a029f6c243937929a722f2a098a30bd3157466c5df6ae

Serve JavaScript with a JavaScript MIME type and allow cross-origin module requests (CORS). Use a new version directory when updating a versioned deployment.

This archive contains Runtime and component-viewport.js only. Project interactions remain in each component package. Runtime usage remains subject to FLAMO-RUNTIME-LICENSE and third-party licenses.
