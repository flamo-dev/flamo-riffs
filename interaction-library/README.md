# Flamo interaction library

Use the [Riffs interaction index](../interaction-examples.json) to find a playable example by gesture or API. Its source references lead to the project script that implements the interaction.

The [asset catalog](catalog/interactions.index.json) links reusable behavior contracts, recipes and sources. Browse [Base](src/base), [Web](src/web) and [HMI](src/hmi) or see [Shumei](../flamo-projects/shumei/src/components/coal/device.ts) for a number binding in a project.

The framework installs this package from a pinned Git commit and verifies archive integrity. To publish a revision, update the package and catalog version, run the registry validation, then run `npm pack --ignore-scripts --pack-destination releases`. Commit the new archive with its sources. Published archives and the hashes of versioned managed modules are immutable.
