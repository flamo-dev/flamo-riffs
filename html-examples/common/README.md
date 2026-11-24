# Flamo shared resources

Deploy flamo-runtime/ and component-viewport.js directly under http://localhost:8080/common/. Keep the Runtime directory contents together; do not add another directory level or query parameters to filenames.

Runtime: http://localhost:8080/common/flamo-runtime/index.es.js?v=4ca579f2c786b020c32a17467a0597d377734d13cb25957c0107a91da921b9b4
Viewport: http://localhost:8080/common/component-viewport.js?v=8a9625e8b5d2fa2deb7a029f6c243937929a722f2a098a30bd3157466c5df6ae

Serve JavaScript with a JavaScript MIME type and allow cross-origin module requests (CORS). Use a new version directory when updating a versioned deployment.

This archive contains Runtime and component-viewport.js only. Project interactions remain in each component package. Runtime usage remains subject to FLAMO-RUNTIME-LICENSE and third-party licenses.
