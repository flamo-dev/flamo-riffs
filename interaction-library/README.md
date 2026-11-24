# Flamo base interactions

The [base entry point](src/base/index.ts) exports number binding, button feedback, scroll containers, text layout, caret blinking, stage camera and character performance. The [Shumei device script](../flamo-projects/shumei/src/components/coal/device.ts) uses `bindNumber` through the existing `@flamo/interaction-library/base` import. Other projects can keep that import.

Use the [Riffs interaction index](../interaction-examples.json) to find complete projects. Use this directory to inspect the reusable implementation behind their imports.

To publish a change, bump the package version and run `npm pack --ignore-scripts --pack-destination releases` from this directory. Commit the sources and the new archive together. Framework builds pin the Git commit and archive integrity. Preserve existing release archives.
