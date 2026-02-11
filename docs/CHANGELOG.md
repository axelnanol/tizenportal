# Changelog

All notable changes to TizenPortal are documented through git commit messages on tagged releases.

## Version Information

- **Current Version:** See `package.json` in the repository root
- **Version Format:** 4-digit numeric tags (e.g., `1018`, `1019`, `1020`)
- **Version Scheme:** `XXYY` where XX = major.minor, YY = patch (e.g., `1018` = v1.0.18)

## Finding Version History

Version history is maintained through git tags with detailed commit messages. To view:

```bash
# List all version tags
git tag --list | sort -V

# View commit message for a specific version
git show <version-tag>

# View all tagged releases
git log --tags --simplify-by-decoration --pretty="format:%d %s"
```

## Installation

To install a specific version:
```
alexnolan/tizenportal@<version-tag>
```

To install the latest version:
```
alexnolan/tizenportal@latest
```

## Version Notes

### Versioning Philosophy

TizenPortal uses numeric 4-digit tags instead of semantic versioning tags for ease of use on TV remotes. Typing `alexnolan/tizenportal@1018` on a TV remote is much faster than typing `@v1.0.18`.

### Breaking Changes

Major breaking changes are documented in git commit messages when they occur. Always review the commit message of a version tag before upgrading.

## Recent Development

For current development status and roadmap:
- See [Progress.md](Progress.md) for completed and in-progress work
- See [Engineering-Plan.md](Engineering-Plan.md) for the development roadmap
- See [Contributing.md](Contributing.md) for how to contribute

## Legacy Versions

Historical version information prior to this changelog being created can be found in git history:

```bash
# View commit history
git log --oneline

# View tagged releases with dates
git log --tags --simplify-by-decoration --pretty="format:%ai %d"
```

---

**Note:** This project follows a continuous deployment model where each meaningful change receives a version tag. Not all tags represent major feature releases - some may be bug fixes, documentation updates, or minor improvements.
