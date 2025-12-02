# CSV Column Mapper

[![npm version](https://img.shields.io/npm/v/csv-column-mapper.svg)](https://www.npmjs.com/package/csv-column-mapper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A powerful, flexible CSV parsing and column mapping library with a beautiful UI. Perfect for building data import features in your web applications.

## ✨ Features

- 📤 **Drag & Drop Upload** - Intuitive file upload with drag & drop support
- 🎯 **Smart Auto-Mapping** - Fuzzy matching automatically maps CSV columns to your fields
- ✏️ **Inline Editing** - Edit and fix data directly in the verification table
- ✅ **Real-time Validation** - Instant error detection with duplicate checking
- 🔄 **Custom Validation** - Define your own validation rules per field
- 📊 **Data Preview** - Visual preview of imported data with error highlighting
- 💾 **Export Options** - Built-in export to JSON and CSV formats
- 🎨 **Fully Customizable** - Use your own buttons, styling, and field definitions
- 🚀 **Zero Dependencies** - Pure vanilla JavaScript, no external dependencies
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 📦 Installation

```bash
npm install csv-column-mapper
```

## 🚀 Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <title>CSV Import Demo</title>
</head>
<body>
    <!-- Your custom button -->
    <button id="import-btn">Import CSV</button>

    <script src="node_modules/csv-column-mapper/dist/csv-mapper.js"></script>
    <script>
        // Define your fields
        const mapper = new CsvMapper('body', {
            columns: [
                { key: 'name', label: 'Full Name', required: true },
                { key: 'email', label: 'Email', required: true,
                  validate: (val) => val.includes('@') ? true : 'Invalid email' }
            ],
            onSubmit: (data) => {
                console.log('Imported data:', data);
                // Send to your API
            }
        });

        // Attach to your button
        document.getElementById('import-btn').onclick = () => mapper.init();
    </script>
</body>
</html>
```

## 📖 Documentation

### Constructor

```javascript
new CsvMapper(selector, options)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `string` | CSS selector for container (e.g., `'body'`, `'#app'`) |
| `options` | `object` | Configuration options |

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `columns` | `array` | ✅ Yes | Array of field definitions |
| `onSubmit` | `function` | ✅ Yes | Callback when data is submitted |
| `availableFields` | `array` | ❌ No | Pool of fields for dynamic selection |

### Field Definition

```javascript
{
    key: 'fieldName',        // Unique identifier (required)
    label: 'Display Name',   // User-facing label (required)
    required: true,          // Is field required? (optional)
    validate: (value) => {}  // Custom validation (optional)
}
```

### Validation Function

Return `true` if valid, or an error message string if invalid:

```javascript
validate: (value) => {
    if (!value) return true; // Allow empty if not required

    // Your validation logic
    if (someCondition) {
        return 'Error message here';
    }

    return true;
}
```

## 💡 Examples

### Basic Import

```javascript
const mapper = new CsvMapper('body', {
    columns: [
        { key: 'firstName', label: 'First Name', required: true },
        { key: 'lastName', label: 'Last Name', required: true },
        { key: 'email', label: 'Email', required: true }
    ],
    onSubmit: (data) => {
        console.log('Valid data:', data);
    }
});

mapper.init();
```

### With Custom Validation

```javascript
const mapper = new CsvMapper('body', {
    columns: [
        {
            key: 'email',
            label: 'Email Address',
            required: true,
            validate: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) ? true : 'Invalid email format';
            }
        },
        {
            key: 'age',
            label: 'Age',
            required: false,
            validate: (value) => {
                if (!value) return true;
                const age = parseInt(value);
                return (age >= 0 && age <= 120) ? true : 'Age must be 0-120';
            }
        },
        {
            key: 'phone',
            label: 'Phone Number',
            required: false,
            validate: (value) => {
                if (!value) return true;
                const phoneRegex = /^\+?[\d\s-()]+$/;
                return phoneRegex.test(value) ? true : 'Invalid phone format';
            }
        }
    ],
    onSubmit: async (data) => {
        // Send to your API
        const response = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Data imported successfully!');
        }
    }
});
```

### Custom Button Styling

```html
<style>
    .my-import-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 15px 30px;
        font-size: 18px;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        transition: transform 0.2s;
    }

    .my-import-btn:hover {
        transform: translateY(-2px);
    }
</style>

<button class="my-import-btn" id="import">📊 Import Data</button>

<script>
    const mapper = new CsvMapper('body', { /* ... */ });
    document.getElementById('import').onclick = () => mapper.init();
</script>
```

## 🎯 Built-in Features

### Automatic Duplicate Detection
The library automatically detects duplicate email addresses across all rows and highlights them with error messages.

### Real-time Validation
- Validation runs instantly as users edit cells
- Error count updates in real-time
- Cannot submit until all errors are fixed

### Inline Editing
Users can click any cell in the verification table to edit values directly. Changes are validated immediately.

### Smart Auto-Mapping
Uses fuzzy matching to automatically map CSV column headers to your defined fields, saving time for users.

## 🔧 API Methods

### `init()`
Opens the CSV mapper modal.

```javascript
mapper.init();
```

### `destroy()`
Closes and cleans up the mapper.

```javascript
mapper.destroy();
```

## 🌐 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## 📄 License

MIT © [Your Name]

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/yourusername/csv-column-mapper/issues).

## ⭐ Show your support

Give a ⭐️ if this project helped you!

## 📝 Changelog

### 1.0.0
- Initial release
- CSV parsing with drag & drop
- Smart column auto-mapping
- Real-time validation
- Inline editing
- Duplicate detection
- Export to JSON/CSV
