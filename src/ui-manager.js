export default class UiManager {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.options = options;
        this.events = {};
        this.elements = {};
        this.state = {
            viewMode: 'upload', // 'upload' or 'paste'
            isLoading: false,
            currentPage: 1,
            rowsPerPage: 10,
            showErrorsOnly: false
        };
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
        const overlay = document.createElement('div');
        overlay.className = 'csv-mapper-overlay';

        overlay.innerHTML = `
            <div class="csv-mapper-modal">
                <div class="csv-mapper-header">
                    <h2 id="csv-step-title">CSV Upload</h2>
                    <span class="csv-mapper-close">&times;</span>
                </div>
                <div class="csv-mapper-body" id="csv-mapper-body"></div>
                <div class="csv-mapper-footer" id="csv-mapper-footer">
                    <div class="csv-footer-left">
                        <span id="csv-status-text"></span>
                    </div>
                    <div class="csv-footer-right" id="csv-footer-buttons"></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.elements.overlay = overlay;
        this.elements.body = overlay.querySelector('#csv-mapper-body');
        this.elements.title = overlay.querySelector('#csv-step-title');
        this.elements.footerButtons = overlay.querySelector('#csv-footer-buttons');
        this.elements.closeIcon = overlay.querySelector('.csv-mapper-close');

        this.elements.closeIcon.addEventListener('click', () => this.destroy());
    }

    destroy() {
        if (this.elements.overlay) {
            this.elements.overlay.remove();
            this.elements = {};
        }
        this.emit('close');
    }

    showError(message) {
        this.clearError();
        const errorBanner = document.createElement('div');
        errorBanner.className = 'csv-error-banner';
        errorBanner.id = 'csv-error-banner';
        errorBanner.textContent = message;
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
        this.clearError();
        this.state.currentPage = 1;

        switch(step) {
            case 1:
                this.elements.title.textContent = 'Upload CSV';
                this.renderUploadStep();
                this.renderFooterButtons(step);
                break;
            case 2:
                this.elements.title.textContent = 'Select Header Row';
                this.renderHeaderSelectionStep(data);
                this.renderFooterButtons(step);
                break;
            case 3:
                this.elements.title.textContent = 'Map Columns';
                this.renderMappingStep(data);
                this.renderFooterButtons(step);
                break;
            case 4:
                this.elements.title.textContent = 'Verify Data';
                this.renderValidationStep(data);
                this.renderFooterButtons(step);
                break;
        }
    }

    renderFooterButtons(step) {
        const buttons = [];

        if (step > 1 && !this.state.isLoading) {
            buttons.push(`<button class="csv-btn csv-btn-secondary" id="csv-prev-btn">Prev</button>`);
        }

        if (step < 4 && step > 1 && !this.state.isLoading) {
            buttons.push(`<button class="csv-btn csv-btn-primary" id="csv-next-btn">Next</button>`);
        }

        if (step === 4 && !this.state.isLoading) {
            buttons.push(`<button class="csv-btn csv-btn-primary" id="csv-next-btn">Submit</button>`);
        }

        if (this.state.isLoading) {
            buttons.push(`<button class="csv-btn csv-btn-danger" id="csv-cancel-btn">Cancel</button>`);
        }

        buttons.push(`<button class="csv-btn csv-btn-secondary" id="csv-close-btn">Close</button>`);

        this.elements.footerButtons.innerHTML = buttons.join('');

        // Bind events
        const prevBtn = this.elements.footerButtons.querySelector('#csv-prev-btn');
        const nextBtn = this.elements.footerButtons.querySelector('#csv-next-btn');
        const closeBtn = this.elements.footerButtons.querySelector('#csv-close-btn');
        const cancelBtn = this.elements.footerButtons.querySelector('#csv-cancel-btn');

        if (prevBtn) prevBtn.addEventListener('click', () => this.emit('prev'));
        if (nextBtn) nextBtn.addEventListener('click', () => this.emit('next'));
        if (closeBtn) closeBtn.addEventListener('click', () => this.destroy());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.emit('cancel-loading'));
    }

    renderUploadStep() {
        if (this.state.viewMode === 'paste') {
            this.renderPasteView();
            return;
        }

        const container = document.createElement('div');
        container.style.cssText = 'max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px;';

        container.innerHTML = `
            <div class="csv-upload-area" id="csv-drop-zone" style="width: 100%; position: relative; opacity: ${this.state.isLoading ? '0.6' : '1'}; pointer-events: ${this.state.isLoading ? 'none' : 'auto'};">
                <div class="csv-upload-text">Drop files here or click to upload</div>
                <div class="csv-upload-subtext">XLS, XLSX, CSV files are accepted</div>
                <input type="file" id="csv-file-input" accept=".csv,.xls,.xlsx" style="display:none">
                ${this.state.isLoading ? `
                    <div class="csv-loading-overlay">
                        <div class="csv-loading-spinner"></div>
                        <div class="csv-loading-text">Processing your file...</div>
                        <div id="csv-progress-display"></div>
                        <div class="csv-loading-subtext">This may take a moment for large files</div>
                    </div>
                ` : ''}
            </div>
            <div style="margin-top: 16px; text-align: center;">
                <a href="#" class="csv-paste-data-link" id="csv-paste-trigger" style="text-decoration: none;">
                    Or click here to copy paste table data
                </a>
            </div>
        `;

        this.elements.body.appendChild(container);

        const dropZone = container.querySelector('#csv-drop-zone');
        const fileInput = container.querySelector('#csv-file-input');
        const pasteLink = container.querySelector('#csv-paste-trigger');

        if (!this.state.isLoading) {
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
                    this.handleFileSelected(e.dataTransfer.files[0]);
                }
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    this.handleFileSelected(e.target.files[0]);
                }
            });
            pasteLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.state.viewMode = 'paste';
                this.showStep(1);
            });
        }
    }

    renderPasteView() {
        const container = document.createElement('div');
        container.style.cssText = 'max-width: 700px; margin: 0 auto;';

        container.innerHTML = `
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #666; line-height: 1.5;">
                Copy existing table data from a spreadsheet (like an Excel workbook or Google Sheet) and paste it in the field below.
            </p>
            <textarea class="csv-paste-textarea" id="csv-paste-data" placeholder="" autofocus></textarea>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-size: 14px; color: #666;">Select Delimiter</label>
                    <select class="csv-delimiter-select" id="csv-delimiter">
                        <option value=",">Comma</option>
                        <option value="\\t">Tab</option>
                        <option value=";">Semicolon</option>
                        <option value="|">Pipe</option>
                        <option value=" ">Space</option>
                    </select>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="csv-btn csv-btn-secondary" id="csv-paste-cancel">Cancel</button>
                    <button class="csv-btn csv-btn-primary" id="csv-paste-submit">Import Data</button>
                </div>
            </div>
        `;

        this.elements.body.appendChild(container);

        const textarea = container.querySelector('#csv-paste-data');
        const delimiter = container.querySelector('#csv-delimiter');
        const cancelBtn = container.querySelector('#csv-paste-cancel');
        const submitBtn = container.querySelector('#csv-paste-submit');

        cancelBtn.addEventListener('click', () => {
            this.state.viewMode = 'upload';
            this.showStep(1);
        });

        submitBtn.addEventListener('click', () => {
            const data = textarea.value.trim();
            if (data) {
                this.emit('data-pasted', { data, delimiter: delimiter.value });
                this.state.viewMode = 'upload';
            }
        });
    }

    handleFileSelected(file) {
        this.state.isLoading = true;
        this.showStep(1);
        this.renderFooterButtons(1);

        this.emit('file-selected', {
            file,
            onProgress: (progress) => {
                const progressDisplay = document.querySelector('#csv-progress-display');
                if (progressDisplay && progress.percent > 0) {
                    progressDisplay.innerHTML = `
                        <div class="csv-progress-bar" style="margin-top: 16px; width: 80%; max-width: 300px;">
                            <div class="csv-progress-fill csv-progress-fill-bar" style="width: ${progress.percent}%; height: 8px;"></div>
                        </div>
                        <div class="csv-loading-subtext" style="margin-top: 8px;">
                            ${progress.percent}% • ${progress.rowsParsed.toLocaleString()} rows
                        </div>
                    `;
                }
            }
        });
    }

    setLoading(isLoading) {
        this.state.isLoading = isLoading;
    }

    renderHeaderSelectionStep(data) {
        const { rows, selectedRowIndex } = data;
        const rowsPerPage = 10;
        const totalPages = Math.ceil(rows.length / rowsPerPage);
        const startIndex = (this.state.currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const currentRows = rows.slice(startIndex, endIndex);

        const container = document.createElement('div');
        container.innerHTML = `
            <div class="csv-preview-table-container">
                <table class="csv-table">
                    <tbody>
                        ${currentRows.map((row, i) => {
                            const absoluteIndex = startIndex + i;
                            return `
                                <tr class="${absoluteIndex === selectedRowIndex ? 'csv-header-row' : ''}">
                                    <td class="csv-row-select">
                                        <input type="radio" name="header-row" value="${absoluteIndex}" ${absoluteIndex === selectedRowIndex ? 'checked' : ''}>
                                    </td>
                                    <td class="csv-row-index">${absoluteIndex + 1}</td>
                                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ${totalPages > 1 ? `
                <div class="csv-pagination" style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px;">
                    <button class="csv-btn csv-btn-secondary" id="csv-page-prev" ${this.state.currentPage === 1 ? 'disabled' : ''} style="padding: 4px 12px; font-size: 14px;">Previous</button>
                    <span style="font-size: 14px; color: #666;">Page ${this.state.currentPage} of ${totalPages}</span>
                    <button class="csv-btn csv-btn-secondary" id="csv-page-next" ${this.state.currentPage === totalPages ? 'disabled' : ''} style="padding: 4px 12px; font-size: 14px;">Next</button>
                </div>
            ` : ''}
        `;

        this.elements.body.appendChild(container);

        // Bind radio changes
        const radios = container.querySelectorAll('input[name="header-row"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.emit('header-row-selected', parseInt(e.target.value));
            });
        });

        // Bind pagination
        if (totalPages > 1) {
            const prevBtn = container.querySelector('#csv-page-prev');
            const nextBtn = container.querySelector('#csv-page-next');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.state.currentPage > 1) {
                        this.state.currentPage--;
                        this.showStep(2, data);
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.state.currentPage < totalPages) {
                        this.state.currentPage++;
                        this.showStep(2, data);
                    }
                });
            }
        }
    }

    renderMappingStep(data) {
        const { templateFields, availableFields, headers, mapping } = data;
        const activeKeys = new Set(templateFields.map(f => f.key));

        const container = document.createElement('div');
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div class="csv-field-selector-dropdown">
                    <button class="csv-btn csv-btn-secondary" id="csv-field-selector-btn">+ Add/Remove Fields</button>
                    <div class="csv-field-selector-menu hidden" id="csv-field-selector-menu">
                        <div style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Select Fields</div>
                        ${availableFields.map(field => `
                            <label class="csv-field-checkbox-item">
                                <input type="checkbox" value="${field.key}" ${activeKeys.has(field.key) ? 'checked' : ''}>
                                <span>${field.label}</span>
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
                    <div class="csv-mapping-row" data-field-index="${idx}" data-field-key="${field.key}">
                        <div class="csv-mapping-label">
                            ${field.label}
                            <span class="csv-required-star">*</span>
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

        const selectorBtn = container.querySelector('#csv-field-selector-btn');
        const selectorMenu = container.querySelector('#csv-field-selector-menu');

        console.log('Dropdown elements:', { selectorBtn, selectorMenu }); // Debug

        if (selectorBtn && selectorMenu) {
            selectorBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Dropdown button clicked'); // Debug
                selectorMenu.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            const closeDropdown = (e) => {
                // Don't close if clicking inside the menu or on the button
                if (selectorMenu.contains(e.target) || selectorBtn.contains(e.target)) {
                    return;
                }
                selectorMenu.classList.add('hidden');
            };

            // Use setTimeout to avoid immediately closing after opening
            setTimeout(() => {
                document.addEventListener('click', closeDropdown);
            }, 100);

            // Clean up event listener when step changes
            this.dropdownCleanup = () => {
                document.removeEventListener('click', closeDropdown);
            };
        }

        const checkboxes = container.querySelectorAll('.csv-field-checkbox-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.emit('toggle-template-field', {
                    key: e.target.value,
                    enabled: e.target.checked
                });
            });
        });

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

    renderValidationStep(data) {
        const { validationResults, templateFields } = data;

        const invalidCount = validationResults.filter(r => !r.isValid).length;

        // Auto-switch back to showing all rows if there are no errors
        if (invalidCount === 0 && this.state.showErrorsOnly) {
            this.state.showErrorsOnly = false;
        }

        const rowsWithIndex = validationResults.map((r, i) => ({ ...r, originalIndex: i }));
        const filteredResults = this.state.showErrorsOnly
            ? rowsWithIndex.filter(r => !r.isValid)
            : rowsWithIndex;

        const totalRows = filteredResults.length;
        const totalPages = Math.ceil(totalRows / this.state.rowsPerPage);
        const startIndex = (this.state.currentPage - 1) * this.state.rowsPerPage;
        const endIndex = Math.min(startIndex + this.state.rowsPerPage, totalRows);
        const currentRows = filteredResults.slice(startIndex, endIndex);

        const container = document.createElement('div');
        container.innerHTML = `
            <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <button class="csv-btn csv-btn-secondary" id="csv-export-json">Export JSON</button>
                    <button class="csv-btn csv-btn-secondary" id="csv-export-csv" style="margin-left: 8px;">Export CSV</button>
                </div>
                <div style="font-size: 14px; color: #666;">
                    ${invalidCount > 0 ? `
                        <span style="color: #dc2626; font-weight: 500;">
                            Found ${invalidCount} invalid row${invalidCount !== 1 ? 's' : ''}.
                            <button id="csv-toggle-errors" style="background: none; border: none; color: #2563eb; text-decoration: underline; cursor: pointer; margin-left: 8px; padding: 0; font: inherit; font-weight: 600;">
                                ${this.state.showErrorsOnly ? 'Show all rows' : 'Show only errors'}
                            </button>
                        </span>
                    ` : '<span>All rows are valid</span>'}
                </div>
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
                        ${currentRows.map((row, i) => {
                            const displayIndex = startIndex + i;
                            return `
                                <tr>
                                    <td>${displayIndex + 1}</td>
                                    ${templateFields.map(f => {
                                        const value = row.transformed[f.key] || '';
                                        const error = row.errors[f.key];
                                        return `
                                            <td class="${error ? 'error' : ''}" data-row-index="${row.originalIndex}" data-field-key="${f.key}">
                                                <div class="csv-cell-content" contenteditable="true">${value}</div>
                                                ${error ? `<div class="csv-error-tooltip">${error}</div>` : ''}
                                            </td>
                                        `;
                                    }).join('')}
                                    <td class="csv-remove-row" data-index="${row.originalIndex}">X</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ${totalPages > 1 ? `
                <div class="csv-pagination" style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-top: 16px; padding: 0 8px; gap: 16px;">
                    <div class="csv-rows-per-page" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #666;">
                        <span>Rows per page:</span>
                        <select id="csv-rows-per-page" style="padding: 4px; border-radius: 4px; border: 1px solid #ddd;">
                            <option value="10" ${this.state.rowsPerPage === 10 ? 'selected' : ''}>10</option>
                            <option value="25" ${this.state.rowsPerPage === 25 ? 'selected' : ''}>25</option>
                            <option value="50" ${this.state.rowsPerPage === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${this.state.rowsPerPage === 100 ? 'selected' : ''}>100</option>
                        </select>
                    </div>
                    <div class="csv-pagination-controls" style="display: flex; justify-content: center; align-items: center; gap: 8px;">
                        <button class="csv-btn csv-btn-secondary" id="csv-page-first" ${this.state.currentPage === 1 ? 'disabled' : ''} style="padding: 4px 8px; font-size: 14px; min-width: 32px;" title="First Page">&laquo;</button>
                        <button class="csv-btn csv-btn-secondary" id="csv-page-prev" ${this.state.currentPage === 1 ? 'disabled' : ''} style="padding: 4px 8px; font-size: 14px; min-width: 32px;" title="Previous Page">&lsaquo;</button>
                        <div style="display: flex; align-items: center; gap: 4px; font-size: 14px; color: #666;">
                            <span>Page</span>
                            <input type="number" id="csv-page-input" min="1" max="${totalPages}" value="${this.state.currentPage}" style="width: 60px; padding: 4px; text-align: center; border-radius: 4px; border: 1px solid #ddd;">
                            <span>of ${totalPages.toLocaleString()}</span>
                        </div>
                        <button class="csv-btn csv-btn-secondary" id="csv-page-next" ${this.state.currentPage === totalPages ? 'disabled' : ''} style="padding: 4px 8px; font-size: 14px; min-width: 32px;" title="Next Page">&rsaquo;</button>
                        <button class="csv-btn csv-btn-secondary" id="csv-page-last" ${this.state.currentPage === totalPages ? 'disabled' : ''} style="padding: 4px 8px; font-size: 14px; min-width: 32px;" title="Last Page">&raquo;</button>
                    </div>
                    <div class="csv-pagination-info" style="font-size: 14px; color: #666; text-align: right; white-space: nowrap;">
                        ${startIndex + 1}-${endIndex} of ${totalRows} rows
                    </div>
                </div>
            ` : ''}
        `;

        this.elements.body.appendChild(container);

        // Bind export buttons
        container.querySelector('#csv-export-json')?.addEventListener('click', () => this.emit('export-json'));
        container.querySelector('#csv-export-csv')?.addEventListener('click', () => this.emit('export-csv'));

        // Bind toggle errors
        container.querySelector('#csv-toggle-errors')?.addEventListener('click', () => {
            this.state.showErrorsOnly = !this.state.showErrorsOnly;
            this.state.currentPage = 1;
            this.showStep(4, data);
        });

        // Bind cell editing
        container.querySelectorAll('.csv-cell-content').forEach(cell => {
            cell.addEventListener('blur', (e) => {
                const td = e.target.closest('td');
                const rowIndex = parseInt(td.dataset.rowIndex);
                const fieldKey = td.dataset.fieldKey;
                const newValue = e.target.textContent.trim();
                this.emit('cell-edited', { rowIndex, fieldKey, newValue });
            });

            cell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });

        // Bind remove row
        container.querySelectorAll('.csv-remove-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.emit('remove-row', index);
            });
        });

        // Bind pagination
        if (totalPages > 1) {
            const rowsPerPageSelect = container.querySelector('#csv-rows-per-page');
            const pageInput = container.querySelector('#csv-page-input');
            const firstBtn = container.querySelector('#csv-page-first');
            const prevBtn = container.querySelector('#csv-page-prev');
            const nextBtn = container.querySelector('#csv-page-next');
            const lastBtn = container.querySelector('#csv-page-last');

            rowsPerPageSelect?.addEventListener('change', (e) => {
                this.state.rowsPerPage = parseInt(e.target.value);
                this.state.currentPage = 1;
                this.showStep(4, data);
            });

            pageInput?.addEventListener('blur', (e) => {
                let page = parseInt(e.target.value);
                if (isNaN(page) || page < 1) page = 1;
                if (page > totalPages) page = totalPages;
                this.state.currentPage = page;
                this.showStep(4, data);
            });

            pageInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.target.blur();
                }
            });

            firstBtn?.addEventListener('click', () => {
                this.state.currentPage = 1;
                this.showStep(4, data);
            });

            prevBtn?.addEventListener('click', () => {
                if (this.state.currentPage > 1) {
                    this.state.currentPage--;
                    this.showStep(4, data);
                }
            });

            nextBtn?.addEventListener('click', () => {
                if (this.state.currentPage < totalPages) {
                    this.state.currentPage++;
                    this.showStep(4, data);
                }
            });

            lastBtn?.addEventListener('click', () => {
                this.state.currentPage = totalPages;
                this.showStep(4, data);
            });
        }
    }

    addMappingRow(field, headers, mapping) {
        const mappingRowsContainer = document.querySelector('#csv-mapping-rows');
        if (!mappingRowsContainer) return;

        const rowHTML = `
            <div class="csv-mapping-row" data-field-key="${field.key}">
                <div class="csv-mapping-label">
                    ${field.label}
                    <span class="csv-required-star">*</span>
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
        `;

        mappingRowsContainer.insertAdjacentHTML('beforeend', rowHTML);

        // Bind event listener to the new select
        const newSelect = mappingRowsContainer.querySelector(`select[data-key="${field.key}"]`);
        if (newSelect) {
            newSelect.addEventListener('change', (e) => {
                this.emit('mapping-changed', {
                    key: e.target.dataset.key,
                    columnIndex: e.target.value ? parseInt(e.target.value) : -1
                });
            });
        }
    }

    removeMappingRow(fieldKey) {
        const row = document.querySelector(`.csv-mapping-row[data-field-key="${fieldKey}"]`);
        if (row) {
            row.remove();
        }
    }
}
