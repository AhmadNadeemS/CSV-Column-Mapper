export default class UiManager {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.options = options;
        this.events = {};
        this.elements = {};
    }

    on(event, callback) {
        this.events[event] = callback;
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event](data);
        }
    }

    render() {
        // Create modal structure
        const overlay = document.createElement('div');
        overlay.className = 'csv-mapper-overlay';

        overlay.innerHTML = `
            <div class="csv-mapper-modal">
                <div class="csv-mapper-header">
                    <h2 id="csv-step-title">CSV Upload</h2>
                    <span class="csv-mapper-close">&times;</span>
                </div>
                <div class="csv-mapper-body" id="csv-mapper-body">
                    <!-- Dynamic Content -->
                </div>
                <div class="csv-mapper-footer" id="csv-mapper-footer">
                    <div class="csv-footer-left">
                        <span id="csv-status-text"></span>
                    </div>
                    <div class="csv-footer-right">
                        <button class="csv-btn csv-btn-secondary hidden" id="csv-prev-btn">Prev</button>
                        <button class="csv-btn csv-btn-primary hidden" id="csv-next-btn">Next</button>
                        <button class="csv-btn csv-btn-secondary" id="csv-close-btn">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.elements.overlay = overlay;
        this.elements.body = overlay.querySelector('#csv-mapper-body');
        this.elements.title = overlay.querySelector('#csv-step-title');
        this.elements.prevBtn = overlay.querySelector('#csv-prev-btn');
        this.elements.nextBtn = overlay.querySelector('#csv-next-btn');
        this.elements.closeBtn = overlay.querySelector('#csv-close-btn');
        this.elements.closeIcon = overlay.querySelector('.csv-mapper-close');

        // Bind global events
        this.elements.closeBtn.addEventListener('click', () => this.destroy());
        this.elements.closeIcon.addEventListener('click', () => this.destroy());
        this.elements.prevBtn.addEventListener('click', () => this.emit('prev'));
        this.elements.nextBtn.addEventListener('click', () => this.emit('next'));
    }

    destroy() {
        if (this.elements.overlay) {
            this.elements.overlay.remove();
            this.elements = {};
        }
        this.emit('close');
    }

    showError(message) {
        // Remove any existing error
        this.clearError();

        // Create error banner
        const errorBanner = document.createElement('div');
        errorBanner.className = 'csv-error-banner';
        errorBanner.id = 'csv-error-banner';
        errorBanner.textContent = message;

        // Insert before footer
        const footer = this.elements.overlay.querySelector('.csv-mapper-footer');
        footer.parentNode.insertBefore(errorBanner, footer);
    }

    clearError() {
        const existingError = this.elements.overlay?.querySelector('#csv-error-banner');
        if (existingError) {
            existingError.remove();
        }
    }

    showStep(step, data) {
        this.elements.body.innerHTML = '';
        this.elements.prevBtn.classList.add('hidden');
        this.elements.nextBtn.classList.add('hidden');

        switch(step) {
            case 1:
                this.renderUploadStep();
                break;
            case 2:
                this.renderHeaderSelectionStep(data);
                break;
            case 3:
                this.renderMappingStep(data);
                break;
            case 4:
                this.renderValidationStep(data);
                break;
        }
    }

    // Step 1: Upload
    renderUploadStep() {
        this.elements.title.textContent = 'CSV Upload';

        const container = document.createElement('div');
        container.innerHTML = `
            <p>You can use the attached sample CSV file to get started: <a href="#" id="csv-download-sample">example.csv</a></p>
            <div class="csv-upload-area" id="csv-drop-zone">
                <div class="csv-upload-text">Drop files here or click to upload</div>
                <div class="csv-upload-subtext">XLS, XLSX, CSV files are accepted</div>
                <input type="file" id="csv-file-input" accept=".csv,.xls,.xlsx" style="display:none">
            </div>
            <a href="#" class="csv-paste-link" id="csv-paste-trigger">Or click here to copy paste table data</a>
        `;

        this.elements.body.appendChild(container);

        const dropZone = container.querySelector('#csv-drop-zone');
        const fileInput = container.querySelector('#csv-file-input');

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                this.emit('file-selected', e.dataTransfer.files[0]);
            }
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.emit('file-selected', e.target.files[0]);
            }
        });
    }

    // Step 2: Header Selection
    renderHeaderSelectionStep(data) {
        this.elements.title.textContent = 'Select Header Row';
        this.elements.prevBtn.classList.remove('hidden');
        this.elements.nextBtn.classList.remove('hidden');

        const { rows, selectedRowIndex } = data;

        const container = document.createElement('div');
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <select class="csv-select" style="width: auto; display: inline-block;">
                    <option>UTF-8</option>
                </select>
                <button class="csv-btn csv-btn-secondary">Switch Rows/Columns</button>
            </div>
            <div class="csv-preview-table-container">
                <table class="csv-table">
                    <tbody>
                        ${rows.slice(0, 10).map((row, i) => `
                            <tr class="${i === selectedRowIndex ? 'csv-header-row' : ''}">
                                <td class="csv-row-select">
                                    <input type="radio" name="header-row" value="${i}" ${i === selectedRowIndex ? 'checked' : ''}>
                                </td>
                                <td class="csv-row-index">${i + 1}</td>
                                ${row.map(cell => `<td>${cell}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.elements.body.appendChild(container);

        // Bind radio change
        const radios = container.querySelectorAll('input[name="header-row"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.emit('header-row-selected', parseInt(e.target.value));
                // Update visual style
                container.querySelectorAll('tr').forEach(tr => tr.classList.remove('csv-header-row'));
                e.target.closest('tr').classList.add('csv-header-row');
            });
        });
    }

    // Step 3: Mapping
    renderMappingStep(data) {
        this.elements.title.textContent = 'Map Columns';
        this.elements.prevBtn.classList.remove('hidden');
        this.elements.nextBtn.classList.remove('hidden');

        const { templateFields, availableFields, headers, mapping } = data;

        const container = document.createElement('div');
        container.className = 'csv-mapping-container';

        // Get list of inactive fields (available but not selected)
        const activeKeys = new Set(templateFields.map(f => f.key));
        const inactiveFields = availableFields.filter(f => !activeKeys.has(f.key));

        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div class="csv-field-selector-dropdown">
                    <button class="csv-btn csv-btn-secondary" id="csv-field-selector-btn">
                        + Add/Remove Fields
                    </button>
                    <div class="csv-field-selector-menu hidden" id="csv-field-selector-menu">
                        <div style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Select Fields</div>
                        ${availableFields.map(field => `
                            <label class="csv-field-checkbox-item">
                                <input type="checkbox" value="${field.key}" ${activeKeys.has(field.key) ? 'checked' : ''}>
                                <span>${field.label}${field.required ? ' *' : ''}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="csv-mapping-row" style="background: #f5f5f5; font-weight: 600; padding: 12px;">
                <div class="csv-mapping-label">Template Fields</div>
                <div class="csv-mapping-select">Columns in your File</div>
            </div>
            <div id="csv-mapping-rows">
                ${templateFields.map((field, idx) => `
                    <div class="csv-mapping-row" data-field-index="${idx}">
                        <div class="csv-mapping-label">
                            ${field.label}
                            ${field.required ? '<span class="csv-required-star">*</span>' : ''}
                        </div>
                        <div class="csv-mapping-select">
                            <select class="csv-select" data-key="${field.key}">
                                <option value="">Select a column</option>
                                ${headers.map((header, index) => `
                                    <option value="${index}" ${mapping[field.key] === index ? 'selected' : ''}>
                                        ${header}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.elements.body.appendChild(container);

        // Bind field selector dropdown toggle
        const selectorBtn = container.querySelector('#csv-field-selector-btn');
        const selectorMenu = container.querySelector('#csv-field-selector-menu');

        selectorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectorMenu.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!selectorMenu.contains(e.target) && e.target !== selectorBtn) {
                selectorMenu.classList.add('hidden');
            }
        });

        // Bind checkbox changes
        const checkboxes = container.querySelectorAll('.csv-field-checkbox-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.emit('toggle-template-field', {
                    key: e.target.value,
                    enabled: e.target.checked
                });
            });
        });

        // Bind select changes
        const selects = container.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.emit('mapping-changed', {
                    key: e.target.dataset.key,
                    columnIndex: e.target.value ? parseInt(e.target.value) : -1
                });
            });
        });
    }

    // Step 4: Validation
    renderValidationStep(data) {
        this.elements.title.textContent = 'Verify Data';
        this.elements.prevBtn.classList.remove('hidden');
        this.elements.nextBtn.classList.remove('hidden');
        this.elements.nextBtn.textContent = 'Submit';

        const { validationResults, templateFields } = data;

        const container = document.createElement('div');
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <button class="csv-btn csv-btn-secondary">Show all rows</button>
                <button class="csv-btn csv-btn-secondary" id="csv-export-json">Export JSON</button>
                <button class="csv-btn csv-btn-secondary" id="csv-export-csv">Export CSV</button>
            </div>
            <div class="csv-preview-table-container">
                <table class="csv-table csv-validation-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            ${templateFields.map(f => `<th>${f.label}</th>`).join('')}
                            <th>Remove</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${validationResults.map((row, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                ${templateFields.map(f => {
                                    const value = row.transformed[f.key] || '';
                                    const error = row.errors[f.key];
                                    return `
                                        <td class="${error ? 'error' : ''}"
                                            data-row-index="${i}"
                                            data-field-key="${f.key}">
                                            <div class="csv-cell-content" contenteditable="true">${value}</div>
                                            ${error ? `<div class="csv-error-tooltip">${error}</div>` : ''}
                                        </td>
                                    `;
                                }).join('')}
                                <td class="csv-remove-row" data-index="${i}">X</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.elements.body.appendChild(container);

        // Bind export buttons
        container.querySelector('#csv-export-json').addEventListener('click', () => this.emit('export-json'));
        container.querySelector('#csv-export-csv').addEventListener('click', () => this.emit('export-csv'));

        // Bind remove row
        container.querySelectorAll('.csv-remove-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.emit('remove-row', index);
            });
        });

        // Bind cell editing
        container.querySelectorAll('.csv-cell-content').forEach(cell => {
            cell.addEventListener('blur', (e) => {
                const td = e.target.closest('td');
                const rowIndex = parseInt(td.dataset.rowIndex);
                const fieldKey = td.dataset.fieldKey;
                const newValue = e.target.textContent.trim();

                this.emit('cell-edited', {
                    rowIndex,
                    fieldKey,
                    newValue
                });
            });

            // Handle Enter key to move to next cell
            cell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });
    }
}
