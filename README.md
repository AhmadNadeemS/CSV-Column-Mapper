# CSV Column Mapper

[![npm version](https://img.shields.io/npm/v/csv-column-mapper.svg)](https://www.npmjs.com/package/csv-column-mapper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A powerful, production-ready vanilla JavaScript CSV import library with intelligent column mapping, real-time validation, and a beautiful, themeable UI. Perfect for building data import features without any framework dependencies.

## 🎬 Demo

Try the live demo: [CSV Column Mapper Demo](https://ahmadnadeems.github.io/csv-column-mapper/)

### Complete Workflow
![CSV Mapper Demo](https://github.com/AhmadNadeemS/csv-column-mapper/raw/main/demo.gif)

*Full import workflow: Upload → Select Header → Map Columns → Validate & Edit → Submit*

## ✨ Features

### 🚀 Performance & Scalability
- **Web Worker Processing** - Handle large files (100k+ rows) without blocking the UI
- **Streaming Parser** - Memory-efficient chunk-based parsing
- **Real-time Progress** - Live progress updates with row count and percentage
- **Cancellable Operations** - Abort long-running imports at any time

### 🎨 Theming & Customization
- **Indigo Theme** - Beautiful, modern indigo color scheme
- **CSS Variables** - Easy customization via CSS custom properties
- **Custom Trigger** - Use your own button or element to trigger the mapper
- **Fully Styled** - Complete UI out of the box, no additional CSS needed

### 📊 Data Handling
- **Smart Auto-mapping** - Automatically matches CSV columns to your fields
- **Flexible Field Selection** - Define default fields and let users add more
- **Paste Support** - Copy/paste data directly from spreadsheets
- **Inline Editing** - Edit cell values directly in the validation step
- **Row Management** - Add or remove rows before import
- **Duplicate Detection** - Automatically identifies duplicate emails
- **Export Options** - Export validated data as JSON or CSV

### ✅ Validation & Quality
- **Real-time Validation** - Instant feedback as users map and edit data
- **Custom Validators** - Define your own validation rules per field
- **Required Fields** - Mark fields as required with visual indicators
- **Error Filtering** - Toggle between all rows and error rows only
- **Pagination** - Handle large datasets with built-in pagination
- **Validation Summary** - Clear overview of errors and warnings

### 🎯 Developer Experience
- **Zero Dependencies** - Pure vanilla JavaScript, no external dependencies
- **Framework Agnostic** - Works with React, Vue, Angular, or no framework
- **TypeScript Ready** - Use with TypeScript or plain JavaScript
- **Zero Configuration** - Works out of the box with sensible defaults
- **Small Bundle** - Minimal footprint, optimized for production

## 📦 Installation

```bash
npm install csv-column-mapper
```

## 🚀 Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>CSV Import</title>
</head>
<body>
    <!-- Your custom button -->
    <button id="import-btn">Import CSV</button>

    <script src="node_modules/csv-column-mapper/dist/csv-mapper.js"></script>
    <script>
        // Define your fields
        const mapper = new CsvMapper('body', {
            columns: [
                { key: 'name', label: 'Full Name', required: true, default: true },
                { key: 'email', label: 'Email', required: true, default: true },
                { key: 'phone', label: 'Phone Number' }
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

### With Module Bundler (Webpack, Vite, etc.)

```javascript
import CsvMapper from 'csv-column-mapper';

const mapper = new CsvMapper('body', {
    columns: [
        { key: 'firstName', label: 'First Name', required: true, default: true },
        { key: 'lastName', label: 'Last Name', required: true, default: true },
        { key: 'email', label: 'Email', required: true, default: true },
        { key: 'phone', label: 'Phone Number' }
    ],
    onSubmit: (data) => {
        console.log('Imported data:', data);
    }
});

// Trigger from your button
document.querySelector('#import-btn').addEventListener('click', () => {
    mapper.init();
});
```

## 🎨 Theming

The library uses an indigo theme by default. You can customize it by overriding CSS variables:

```html
<style>
    :root {
        --csv-primary: #7c3aed;        /* Purple 600 */
        --csv-primary-hover: #6d28d9;  /* Purple 700 */
        --csv-primary-light: #f5f3ff;  /* Purple 50 */
        --csv-primary-dark: #5b21b6;   /* Purple 800 */
    }
</style>
```

### Available CSS Variables

```css
:root {
    --csv-primary: #6366f1;        /* Main theme color */
    --csv-primary-hover: #4f46e5;  /* Hover state */
    --csv-primary-light: #eef2ff;  /* Light backgrounds */
    --csv-primary-dark: #4338ca;   /* Dark text on light bg */
    --csv-bg-main: #f9fafb;        /* Main background */
    --csv-bg-card: #ffffff;        /* Card backgrounds */
    --csv-text-primary: #111827;   /* Primary text */
    --csv-text-secondary: #6b7280; /* Secondary text */
    --csv-border: #e5e7eb;         /* Borders */
    --csv-border-dark: #d1d5db;    /* Darker borders */
}
```

## 📖 API Reference

### Constructor

```javascript
new CsvMapper(selector, options)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `selector` | `string` | ✅ Yes | CSS selector for container (e.g., `'body'`, `'#app'`) |
| `options` | `object` | ✅ Yes | Configuration options |

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `columns` | `array` | ✅ Yes | Array of field definitions |
| `onSubmit` | `function` | ✅ Yes | Callback when data is submitted |

### Column Definition

```javascript
{
    key: 'fieldName',        // Unique identifier (required)
    label: 'Display Name',   // User-facing label (required)
    required: true,          // Is field required? (optional)
    default: true,           // Show by default? (optional)
    validate: (value) => {}  // Custom validation (optional)
}
```

### Validation Function

Return `true` if valid, or an error message string if invalid:

```javascript
validate: (value) => {
    if (!value) return true; // Allow empty if not required

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return 'Invalid email format';
    }

    return true;
}
```

### Methods

#### `init()`
Opens the CSV mapper modal.

```javascript
mapper.init();
```

#### `destroy()`
Closes and cleans up the mapper.

```javascript
mapper.destroy();
```

## 💡 Advanced Examples

### Custom Validation

```javascript
const mapper = new CsvMapper('body', {
    columns: [
        {
            key: 'email',
            label: 'Email Address',
            required: true,
            default: true,
            validate: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) ? true : 'Invalid email format';
            }
        },
        {
            key: 'age',
            label: 'Age',
            validate: (value) => {
                if (!value) return true;
                const age = parseInt(value);
                return (age >= 0 && age <= 120) ? true : 'Age must be 0-120';
            }
        },
        {
            key: 'phone',
            label: 'Phone Number',
            validate: (value) => {
                if (!value) return true;
                const phoneRegex = /^\+?[\d\s-()]+$/;
                return phoneRegex.test(value) ? true : 'Invalid phone format';
            }
        }
    ],
    onSubmit: async (data) => {
        await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }
});
```

### Dynamic Field Selection

```javascript
// Define all possible fields
const allFields = [
    { key: 'firstName', label: 'First Name', default: true },
    { key: 'lastName', label: 'Last Name', default: true },
    { key: 'email', label: 'Email', required: true, default: true },
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' },
    { key: 'title', label: 'Job Title' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' }
];

// Users can select which fields to import via the UI
const mapper = new CsvMapper('body', {
    columns: allFields,
    onSubmit: (data) => console.log(data)
});
```

### Custom Button Styling

```html
<style>
    .my-import-btn {
        background: #6366f1;
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .my-import-btn:hover {
        background: #4f46e5;
    }
</style>

<button class="my-import-btn" id="import">📊 Import Data</button>

<script>
    const mapper = new CsvMapper('body', { /* ... */ });
    document.getElementById('import').onclick = () => mapper.init();
</script>
```

## 🔧 How It Works

1. **Upload** - Drag & drop, file upload, or paste CSV data
2. **Select Header** - Choose which row contains column headers (with pagination for large files)
3. **Map Columns** - Auto-mapped or manually map CSV columns to your fields
   - Add/remove optional fields dynamically
   - See all available fields in dropdown
4. **Validate & Edit** - Review data, fix errors, add/remove rows (paginated view)
   - Inline editing with real-time validation
   - Filter to show only errors
   - Automatic duplicate detection
5. **Submit** - Clean, validated data ready for your API

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

### Pagination
Large datasets are automatically paginated in both header selection and validation steps for better performance.

### Progress Tracking
Visual progress bar with percentage and row count during file parsing.

## 🌐 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

Requires Web Worker support for large file processing.

## 🆚 React Version

Looking for a React component? Check out [`react-csv-mapper`](https://www.npmjs.com/package/react-csv-mapper) - a React wrapper with the same features plus:
- React component & hook APIs
- 18 built-in theme colors
- TypeScript support out of the box

## 📄 License

MIT © Ahmad Nadeem

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check the [issues page](https://github.com/AhmadNadeemS/csv-column-mapper/issues).

## ⭐ Show your support

Give a ⭐️ if this project helped you!
