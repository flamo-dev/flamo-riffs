# Flamo shared resources

Deploy flamo-runtime/ and component-viewport.js directly under http://localhost:8080/common/. Keep the Runtime directory contents together; do not add another directory level or query parameters to filenames.

For this release, copy `runtime/flamo-runtime/` and `runtime/component-viewport.js` from the official [Flamo 26.1126.05 feature package](https://flamo.dev/desktop-features/releases/92752732634d735fad543ec2cbc9b7f4ed85d9ca77cba5e3334388d6d7ddce4a/features.zip). Its SHA-256 is `b310754386df3411ec9a1397226361dc247ba6b83c9106d31290a45b2d71313b`.

Runtime: http://localhost:8080/common/flamo-runtime/index.es.js?v=5778be0cd289c3718fd780d30ee8718a3fd87c697e5cbb46a9710e1d942b08d1
Viewport: http://localhost:8080/common/component-viewport.js?v=2422d4da6065ff4fedf2c98c0c721f0fb9cb6e546389c6a6448a00c0f7d6dd51

Serve JavaScript with a JavaScript MIME type and allow cross-origin module requests (CORS). Use a new version directory when updating a versioned deployment.

This archive contains Runtime and component-viewport.js only. Project interactions remain in each component package. Runtime usage remains subject to FLAMO-RUNTIME-LICENSE and third-party licenses.
