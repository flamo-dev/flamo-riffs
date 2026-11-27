# Flamo shared resources

Deploy flamo-runtime/ and component-viewport.js directly under http://localhost:8080/common/. Keep the Runtime directory contents together; do not add another directory level or query parameters to filenames.

For this release, copy `runtime/flamo-runtime/` and `runtime/component-viewport.js` from the official [Flamo 26.1127.02 feature package](https://flamo.dev/desktop-features/releases/a760b03a2724a10764469ea9f7a1c9731302c00e63a2df459256dbd9b01ce10e/features.zip). Its SHA-256 is `3c987ce201ca8db9f3b370a3984f0482d7d0e3ef2f2f95bd9f288282895cff56`.

Runtime: http://localhost:8080/common/flamo-runtime/index.es.js?v=8dfb5cf5a7b9086ddd588d557e545c8c9e2f0799e3a5bf50ea075898d24ad615
Viewport: http://localhost:8080/common/component-viewport.js?v=2422d4da6065ff4fedf2c98c0c721f0fb9cb6e546389c6a6448a00c0f7d6dd51

Serve JavaScript with a JavaScript MIME type and allow cross-origin module requests (CORS). Use a new version directory when updating a versioned deployment.

This archive contains Runtime and component-viewport.js only. Project interactions remain in each component package. Runtime usage remains subject to FLAMO-RUNTIME-LICENSE and third-party licenses.
