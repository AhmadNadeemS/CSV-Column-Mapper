# Publishing to NPM - Step by Step Guide

## Prerequisites

1. **NPM Account**: Create one at https://www.npmjs.com/signup
2. **Node.js & NPM**: Already installed ✅

## Steps to Publish

### 1. Update Package Information

Before publishing, update these fields in `package.json`:

```json
{
  "name": "csv-column-mapper",  // ⚠️ Check if name is available on NPM
  "version": "1.0.0",
  "author": "Ahmad Nadeem <ahmadnadeem509@gmail.com>",  // ⚠️ Update this
  "repository": {
    "type": "git",
    "url": "https://github.com/AhmadNadeemS/csv-column-mapper.git"  // ⚠️ Update if you have a repo
  }
}
```

### 2. Check Package Name Availability

```bash
npm search csv-column-mapper
```

If the name is taken, you'll need to:
- Choose a different name (e.g., `@ahmadnadeemsiddiqui/csv-column-mapper`)
- Or use a scoped package: `@ahmadnadeemsiddiqui/csv-column-mapper`

### 3. Login to NPM

```bash
npm login
```

Enter your:
- Username
- Password
- Email
- 2FA code (if enabled)

### 4. Build the Package

```bash
npm run build
```

This creates the `dist/` folder with the bundled files.

### 5. Test the Package Locally (Optional)

```bash
# In the package directory
npm pack

# This creates a .tgz file
# Install it in another project to test:
npm install /path/to/csv-column-mapper-1.0.0.tgz
```

### 6. Publish to NPM

```bash
npm publish
```

**For scoped packages (if using @username/package-name):**
```bash
npm publish --access public
```

### 7. Verify Publication

Visit: `https://www.npmjs.com/package/csv-column-mapper`

## Post-Publication

### Install Your Package

```bash
npm install csv-column-mapper
```

### Update Version for Future Releases

```bash
# Patch release (1.0.0 -> 1.0.1)
npm version patch

# Minor release (1.0.0 -> 1.1.0)
npm version minor

# Major release (1.0.0 -> 2.0.0)
npm version major

# Then publish again
npm publish
```

## Troubleshooting

### "Package name already exists"
- Use a scoped package: `@ahmadnadeemsiddiqui/csv-column-mapper`
- Choose a different name

### "You must be logged in"
```bash
npm login
```

### "You do not have permission to publish"
- Make sure you're logged in with the correct account
- Check if you have 2FA enabled

### "prepublishOnly script failed"
- Make sure `npm run build` works correctly
- Check for any build errors

## Files Included in Package

The following files will be published (defined in `package.json` "files" field):
- `dist/` - Bundled JavaScript and CSS
- `README.md` - Documentation
- `LICENSE` - MIT License

Files excluded (via `.npmignore`):
- `src/` - Source files
- `example/` - Example files
- `node_modules/` - Dependencies
- Development config files

## Quick Reference

```bash
# 1. Login
npm login

# 2. Build
npm run build

# 3. Publish
npm publish

# 4. Update version and publish again
npm version patch
npm publish
```

## Success! 🎉

Your package is now live on NPM and anyone can install it with:

```bash
npm install csv-column-mapper
```
