# LiteLLM remediation brief

## Affected versions
- `1.82.7`
- `1.82.8`

## Cleanup steps
- Pin LiteLLM to `<=1.82.6` until the flagged installer path is cleared.
- Delete suspicious `.pth` startup hooks from the environment before rebuilding it.
- Rotate any credentials exposed during the attempted install path.
- Rebuild the virtual environment from a known-good lockfile and re-run receipt validation.

## Human approval
- Review the advisory before publication.
- Confirm downstream environments pin a safe version.

