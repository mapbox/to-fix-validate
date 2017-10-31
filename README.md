# to-fix-validate

Exposes a function to validate FeatureCollections sent to the to-fix backend, enforcing the `properties` schema.

Currently exposes a single function called `validateFeatureCollection` that returns `false` if no errors, else an Array of strings with error messages.