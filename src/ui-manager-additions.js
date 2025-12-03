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
