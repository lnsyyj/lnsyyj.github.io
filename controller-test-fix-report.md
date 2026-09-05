# Controller behavior test fix report

## Scope

- Replaced false-positive-prone controller source matching with executable behavior assertions in `tests/public-service-phones.test.js`.
- Added a dependency-free fake DOM, event, and localStorage harness and executed the real controller with `vm.runInNewContext` and the real `PublicServicePhonesData` module.
- Kept the existing static page-structure checks and data-integrity checks.
- No production source change was required.

## TDD evidence

### Initial RED before the harness existed

Command:

```text
node tests/public-service-phones.test.js
```

Result: exit code 1.

```text
ReferenceError: createControllerHarness is not defined
    at testStorageFailureDoesNotBlockCountryRendering (tests/public-service-phones.test.js:172:15)
```

This was the focused country-change/storage-failure behavior test added before the fake browser harness.

### Regression mutation RED

After the harness was present, the controller text loaded by the test was temporarily mutated in the test file so `persistState()` no longer caught `localStorage.setItem` failures. The mutation was not retained.

Command:

```text
node tests/public-service-phones.test.js
```

Result: exit code 1.

```text
Error: storage unavailable
    at Object.setItem (tests/public-service-phones.test.js:226:33)
    at persistState (evalmachine.<anonymous>:42:18)
    at FakeElement.<anonymous> (evalmachine.<anonymous>:151:5)
    at FakeElement.dispatchEvent (tests/public-service-phones.test.js:49:75)
    at testStorageFailuresDoNotBlockRendering (tests/public-service-phones.test.js:391:28)
```

This proves the executable test catches the production regression that the prior source-string assertions could miss.

### GREEN after restoring the real controller

Command:

```text
node tests/public-service-phones.test.js
```

Result: exit code 0.

```text
Public service phone catalogue tests passed.
```

The green suite executes and proves:

1. Country change, category click, and search input each update visible results even when `localStorage.setItem` throws.
2. `sitei18nchange` to English updates both requested `aria-label` values while retaining country, category, and query state.
3. Every rendered HTTPS source anchor uses `_blank` and `noopener noreferrer`, while injected markup-like record strings remain text nodes.

## Syntax verification

Each command exited 0 with no output:

```text
node --check assets/js/public-service-phones-data.js
node --check assets/js/public-service-phones.js
node --check tests/public-service-phones.test.js
```

## Final repository verification

The final `git diff --check` and `git status --short` evidence is recorded after the report is added and before commit. The intended pre-commit status contains only:

```text
 M tests/public-service-phones.test.js
?? controller-test-fix-report.md
```
