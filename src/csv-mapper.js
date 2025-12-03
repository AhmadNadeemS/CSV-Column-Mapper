import CsvParser from './csv-parser';
import Validator from './validator';
import UiManager from './ui-manager';
import './styles.css';

export default class CsvMapper {
    constructor(selector, options = {}) {
        // Determine active columns and available fields (matching React logic)
        let activeColumns, availableFields;

        if (options.availableFields) {
            // Legacy behavior: use provided availableFields
            activeColumns = options.columns || [];
            availableFields = options.availableFields;
        } else {
            // New behavior: Filter default columns
            const allFields = options.columns || [];
            const defaults = allFields.filter(c => c.default);
            // If no defaults specified, use all columns (legacy behavior)
            activeColumns = defaults.length > 0 ? defaults : allFields;
            availableFields = allFields;
        }

        this.options = {
            columns: activeColumns,
            availableFields: availableFields,
            ...options
        };

        this.state = {
            step: 1,
            rawRows: [],
            headerRowIndex: 0,
            headers: [],
            mapping: {}, // { templateKey: csvColumnIndex }
            data: [], // Parsed data rows (excluding header)
            validationResults: []
        };

        this.parser = new CsvParser();
        this.validator = new Validator(this.options.columns);
        this.ui = new UiManager(selector, this.options);

        this.bindEvents();
    }

    init() {
        this.ui.render();
        this.ui.showStep(1);
    }

    bindEvents() {
        // UI Events
        this.ui.on('close', () => {
            console.log('Mapper closed');
        });

        this.ui.on('file-selected', async ({ file, onProgress }) => {
            try {
                // Add throttling to progress updates
                let lastUpdate = 0;
                const throttledProgress = (progress) => {
                    const now = Date.now();
                    if (now - lastUpdate > 100 || progress.percent === 100) {
                        onProgress(progress);
                        lastUpdate = now;
                    }
                };

                const rows = await this.parser.parse(file, {}, null, throttledProgress);
                this.ui.setLoading(false);
                this.state.rawRows = rows;
                this.state.step = 2;
                this.state.headerRowIndex = 0;
                this.updateStep();
            } catch (err) {
                this.ui.setLoading(false);
                console.error('Parse error', err);
                if (err.name !== 'AbortError') {
                    this.ui.showError('Error parsing file. Please check the file format and try again.');
                }
            }
        });

        this.ui.on('data-pasted', async ({ data, delimiter }) => {
            this.ui.setLoading(true);
            this.updateStep();
            try {
                const rows = await this.parser.parse(data, { delimiter }, null, null);
                this.ui.setLoading(false);
                this.state.rawRows = rows;
                this.state.step = 2;
                this.state.headerRowIndex = 0;
                this.updateStep();
            } catch (err) {
                this.ui.setLoading(false);
                console.error('Parse error', err);
                if (err.name !== 'AbortError') {
                    this.ui.showError('Error parsing pasted data. Please check the format and try again.');
                }
            }
        });

        this.ui.on('cancel-loading', () => {
            if (this.parser.worker) {
                this.parser.cleanup();
            }
            this.ui.setLoading(false);
            this.updateStep();
        });

        this.ui.on('header-row-selected', (index) => {
            this.state.headerRowIndex = index;
        });

        this.ui.on('mapping-changed', ({ key, columnIndex }) => {
            this.state.mapping[key] = columnIndex;
        });

        this.ui.on('field-label-changed', ({ key, newLabel }) => {
            const field = this.options.columns.find(f => f.key === key);
            if (field && newLabel.trim() !== '') {
                field.label = newLabel.trim();
            }
        });

        this.ui.on('toggle-template-field', ({ key, enabled }) => {
            if (enabled) {
                // Add field from available pool
                const availableField = this.options.availableFields.find(f => f.key === key);
                if (availableField && !this.options.columns.find(f => f.key === key)) {
                    // Force all fields to be required
                    this.options.columns.push({ ...availableField, required: true });
                    this.state.mapping[key] = -1;
                    // Update validator with new columns
                    this.validator = new Validator(this.options.columns);
                    // Tell UI to add the row dynamically instead of re-rendering
                    this.ui.addMappingRow(availableField, this.state.headers, this.state.mapping);
                }
            } else {
                // Remove field
                const index = this.options.columns.findIndex(f => f.key === key);
                if (index !== -1) {
                    this.options.columns.splice(index, 1);
                    delete this.state.mapping[key];
                    // Update validator with new columns
                    this.validator = new Validator(this.options.columns);
                    // Tell UI to remove the row dynamically instead of re-rendering
                    this.ui.removeMappingRow(key);
                }
            }
        });

        this.ui.on('prev', () => {
            if (this.state.step > 1) {
                this.state.step--;
                this.updateStep();
            }
        });

        this.ui.on('next', () => {
            if (this.state.step === 2) {
                // Process headers
                this.state.headers = this.state.rawRows[this.state.headerRowIndex];
                // Auto-map
                this.state.mapping = this.validator.autoMap(this.state.headers);
                this.state.step = 3;
            } else if (this.state.step === 3) {
                // Validate all fields are mapped
                const unmappedFields = this.options.columns.filter(f =>
                    this.state.mapping[f.key] === undefined || this.state.mapping[f.key] === -1 || this.state.mapping[f.key] === ''
                );

                if (unmappedFields.length > 0) {
                    const fieldNames = unmappedFields.map(f => f.label).join(', ');
                    this.ui.showError(`Please map all fields before continuing. Unmapped fields: ${fieldNames}`);
                    return;
                }

                // Clear any previous errors
                this.ui.clearError();

                // Process data
                // Extract data rows (all rows after header)
                const dataRows = this.state.rawRows.slice(this.state.headerRowIndex + 1);
                this.state.validationResults = this.validator.validateAll(dataRows, this.state.mapping);
                this.state.step = 4;
            } else if (this.state.step === 4) {
                // Check if there are any errors
                const invalidRows = this.state.validationResults.filter(r => !r.isValid);
                if (invalidRows.length > 0) {
                    this.ui.showError(`File has ${invalidRows.length} invalid row${invalidRows.length > 1 ? 's' : ''}. Please resolve the errors before uploading.`);
                    return;
                }

                // Clear any previous errors
                this.ui.clearError();

                // Submit
                this.submit();
                return;
            }
            this.updateStep();
        });

        this.ui.on('cell-edited', ({ rowIndex, fieldKey, newValue }) => {
            if (this.state.validationResults[rowIndex]) {
                // Update the transformed value
                this.state.validationResults[rowIndex].transformed[fieldKey] = newValue;

                // Re-validate using the transformed data (preserves all existing values)
                this.state.validationResults = this.validator.revalidateTransformed(this.state.validationResults);

                // Re-render to show updated validation
                this.updateStep();
            }
        });

        this.ui.on('export-json', () => {
            const data = this.state.validationResults.map(r => r.transformed);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            this.downloadBlob(blob, 'export.json');
        });

        this.ui.on('export-csv', () => {
            // Simple CSV export
            const headers = this.options.columns.map(c => c.label);
            const rows = this.state.validationResults.map(r =>
                this.options.columns.map(c => {
                    const val = r.transformed[c.key] || '';
                    return `"${String(val).replace(/"/g, '""')}"`;
                }).join(',')
            );
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            this.downloadBlob(blob, 'export.csv');
        });

        this.ui.on('remove-row', (index) => {
            this.state.validationResults.splice(index, 1);

            // Re-validate remaining rows using transformed data (preserves all values)
            if (this.state.validationResults.length > 0) {
                this.state.validationResults = this.validator.revalidateTransformed(this.state.validationResults);
            }

            // Update the display
            this.updateStep();
        });
    }

    updateStep() {
        switch(this.state.step) {
            case 2:
                this.ui.showStep(2, {
                    rows: this.state.rawRows,
                    selectedRowIndex: this.state.headerRowIndex
                });
                break;
            case 3:
                this.ui.showStep(3, {
                    templateFields: this.options.columns,
                    availableFields: this.options.availableFields,
                    headers: this.state.headers,
                    mapping: this.state.mapping
                });
                break;
            case 4:
                this.ui.showStep(4, {
                    validationResults: this.state.validationResults,
                    templateFields: this.options.columns
                });
                break;
        }
    }

    submit() {
        const validData = this.state.validationResults
            .filter(r => r.isValid)
            .map(r => r.transformed);

        console.log('Submitting data', validData);
        if (this.options.onSubmit) {
            this.options.onSubmit(validData);
        }
        this.ui.destroy();
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
