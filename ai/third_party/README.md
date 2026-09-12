# Third-party reference code

The reference implementation is intentionally not duplicated in this ZIP. `scripts/setup_colab.py` clones the upstream repository into:

`third_party/ref_repo/`

This keeps the package small and ensures the reference code comes from the upstream repository at setup time.
