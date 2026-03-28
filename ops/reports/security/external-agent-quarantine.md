# External agent trust quarantine notice

External agent reputation is below the trust threshold. Evidence: poor_reputation, unsigned_provenance, send_notification, install_dependency, network_required.

## Remediation
- Keep the external agent blocked until provenance is signed and reviewable.
- Require a reputation reset after evidence of patching or key rotation is supplied.
- Deliver a direct notification to the remote agent owner with the exact failing signals.

