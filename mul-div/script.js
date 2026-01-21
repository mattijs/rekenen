const configForm = document.getElementById('config');
const summaryContent = document.getElementById('summaryContent');
const multiplicationEnabledInput = document.getElementById('multiplicationEnabled');
const divisionEnabledInput = document.getElementById('divisionEnabled');
const multiplicationCountInput = document.getElementById('multiplicationCount');
const divisionCountInput = document.getElementById('divisionCount');
const generateBtn = document.getElementById('generateBtn');
const equationsContainer = document.getElementById('equations');
const configSummary = document.getElementById('configSummary');

let equations = [];

function getRadioValue(name) {
    const selected = configForm.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function getSelectedTables(prefix) {
    const checkboxes = configForm.querySelectorAll(`input[name="${prefix}Table"]:checked`);
    return Array.from(checkboxes).map(cb => parseInt(cb.value, 10));
}

function selectAllTables(prefix) {
    const checkboxes = configForm.querySelectorAll(`input[name="${prefix}Table"]`);
    checkboxes.forEach(cb => cb.checked = true);
    updateConfigSummary();
}

function selectNoneTables(prefix) {
    const checkboxes = configForm.querySelectorAll(`input[name="${prefix}Table"]`);
    checkboxes.forEach(cb => cb.checked = false);
    updateConfigSummary();
}

function getConfig() {
    const multiplicationMode = getRadioValue('multiplicationMode');
    const divisionMode = getRadioValue('divisionMode');

    const multiplicationTables = getSelectedTables('multiplication');
    const divisionTables = getSelectedTables('division');

    let multiplicationCount = 0;
    let divisionCount = 0;

    if (multiplicationEnabledInput.checked) {
        if (multiplicationMode === 'all' || multiplicationMode === 'random') {
            multiplicationCount = multiplicationTables.length * 12;
        } else {
            // custom mode
            multiplicationCount = parseInt(multiplicationCountInput.value) || 0;
        }
    }

    if (divisionEnabledInput.checked) {
        if (divisionMode === 'all' || divisionMode === 'random') {
            divisionCount = divisionTables.length * 12;
        } else {
            // custom mode
            divisionCount = parseInt(divisionCountInput.value) || 0;
        }
    }

    return {
        multiplication: {
            tables: multiplicationTables,
            form: getRadioValue('multiplicationForm'),
            mode: multiplicationMode,
            count: multiplicationCount,
            missing: getRadioValue('multiplicationMissing')
        },
        division: {
            tables: divisionTables,
            form: getRadioValue('divisionForm'),
            mode: divisionMode,
            count: divisionCount,
            missing: getRadioValue('divisionMissing')
        },
        equationCount: multiplicationCount + divisionCount
    };
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTableList(tables) {
    if (tables.length === 0) return '';

    // Sort tables
    const sorted = [...tables].sort((a, b) => a - b);

    const ranges = [];
    let rangeStart = sorted[0];
    let rangeEnd = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === rangeEnd + 1) {
            // Continue the range
            rangeEnd = sorted[i];
        } else {
            // End current range and start new one
            if (rangeEnd - rangeStart >= 2) {
                // 3 or more consecutive: use range notation
                ranges.push(`${rangeStart}-${rangeEnd}`);
            } else if (rangeEnd === rangeStart) {
                // Single number
                ranges.push(String(rangeStart));
            } else {
                // Two numbers (rangeEnd - rangeStart === 1)
                ranges.push(String(rangeStart));
                ranges.push(String(rangeEnd));
            }
            rangeStart = sorted[i];
            rangeEnd = sorted[i];
        }
    }

    // Add final range
    if (rangeEnd - rangeStart >= 2) {
        ranges.push(`${rangeStart}-${rangeEnd}`);
    } else if (rangeEnd === rangeStart) {
        ranges.push(String(rangeStart));
    } else {
        ranges.push(String(rangeStart));
        ranges.push(String(rangeEnd));
    }

    return ranges.join(', ');
}

function generateAllForTables(tables, op, missing, form) {
    const equations = [];

    for (const table of tables) {
        for (let i = 1; i <= 12; i++) {
            let a, b, c;

            if (op === '×') {
                if (form === 'secondary') {
                    // Secondary form: varying number first, table second
                    // e.g., for table 2: 1×2=2, 2×2=4, 3×2=6, ...
                    a = i;
                    b = table;
                    c = table * i;
                } else {
                    // Standard form: table first, varying number second
                    // e.g., for table 2: 2×1=2, 2×2=4, 2×3=6, ...
                    a = table;
                    b = i;
                    c = table * i;
                }
            } else { // op === '÷'
                if (form === 'secondary') {
                    // Secondary form: quotient is the table (secondary answer)
                    // e.g., for table 3: 3÷1=3, 6÷2=3, 9÷3=3, ...
                    a = table * i;  // dividend
                    b = i;          // divisor (varying)
                    c = table;      // quotient (table number - always the same)
                } else {
                    // Standard form: divisor is the table (standard divisor)
                    // e.g., for table 3: 3÷3=1, 6÷3=2, 9÷3=3, ...
                    a = table * i;  // dividend
                    b = table;      // divisor (table number - always the same)
                    c = i;          // quotient (varying)
                }
            }

            // Determine which value to hide
            let missingValue;
            if (missing === 'random') {
                const options = ['answer', 'first', 'second'];
                missingValue = options[Math.floor(Math.random() * options.length)];
            } else {
                missingValue = missing;
            }

            equations.push({ a, b, c, op, missing: missingValue });
        }
    }

    return equations;
}

function randomSample(array, count) {
    // If count >= array length, return all
    if (count >= array.length) {
        return [...array];
    }

    // Fisher-Yates shuffle and take first count elements
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
}

function formatNumber(num) {
    const numStr = String(num);
    const digitCount = numStr.length;
    const alignClass = digitCount === 1 ? 'center' : 'left';
    return `<span class="num align-${alignClass}">${num}</span>`;
}

function formatEquation(eq) {
    const blank = '<span class="blank"></span>';
    const aDisplay = eq.missing === 'first' ? blank : formatNumber(eq.a);
    const bDisplay = eq.missing === 'second' ? blank : formatNumber(eq.b);
    const cDisplay = eq.missing === 'answer' ? blank : formatNumber(eq.c);

    return `${aDisplay} ${eq.op} ${bDisplay} = ${cDisplay}`;
}

function renderEquations() {
    const config = getConfig();
    const multiplicationMode = config.multiplication.mode;
    const divisionMode = config.division.mode;

    equationsContainer.innerHTML = '';

    equations.forEach((eq, index) => {
        const div = document.createElement('div');
        div.className = 'equation';

        // Show regenerate button only in custom mode
        const showRegenerate = (eq.op === '×' && multiplicationMode === 'custom') ||
                               (eq.op === '÷' && divisionMode === 'custom');

        const regenerateBtn = showRegenerate ?
            `<button type="button" data-index="${index}">🔄</button>` : '';

        div.innerHTML = `
            <span class="equation-number">${index + 1})</span>
            <span class="equation-text">${formatEquation(eq)}</span>
            ${regenerateBtn}
        `;
        equationsContainer.appendChild(div);
    });
}

function updateConfigSummary() {
    const config = getConfig();

    const getMissingLabel = (missing) => {
        switch (missing) {
            case 'answer': return 'answer';
            case 'first': return 'left operand';
            case 'second': return 'right operand';
            case 'random': return 'random';
            default: return missing;
        }
    };

    const enabledRules = [];

    // Multiplication summary
    if (multiplicationEnabledInput.checked) {
        const tables = config.multiplication.tables;
        if (tables.length > 0) {
            const tableList = formatTableList(tables);
            const form = config.multiplication.form === 'secondary' ? 'secondary' : 'standard';
            let mode;
            if (config.multiplication.mode === 'all') {
                mode = 'all';
            } else if (config.multiplication.mode === 'random') {
                mode = 'all random';
            } else {
                // custom
                mode = `${config.multiplication.count} custom`;
            }
            const missing = getMissingLabel(config.multiplication.missing);
            enabledRules.push(`Multiplication tables ${tableList} (${form}): ${mode} with ${missing} hidden`);
        }
    }

    // Division summary
    if (divisionEnabledInput.checked) {
        const tables = config.division.tables;
        if (tables.length > 0) {
            const tableList = formatTableList(tables);
            const form = config.division.form === 'secondary' ? 'secondary' : 'standard';
            let mode;
            if (config.division.mode === 'all') {
                mode = 'all';
            } else if (config.division.mode === 'random') {
                mode = 'all random';
            } else {
                // custom
                mode = `${config.division.count} custom`;
            }
            const missing = getMissingLabel(config.division.missing);
            enabledRules.push(`Division tables ${tableList} (${form}): ${mode} with ${missing} hidden`);
        }
    }

    // Update Summary box (visible in normal mode)
    let summaryHTML = `<div>Equations: <strong>${config.equationCount}</strong></div>`;
    summaryHTML += '<div>Configuration:</div>';
    if (enabledRules.length > 0) {
        summaryHTML += '<ul>' + enabledRules.map(rule => `<li>${rule}</li>`).join('') + '</ul>';
    } else {
        summaryHTML += '<div>No rules enabled</div>';
    }
    summaryContent.innerHTML = summaryHTML;

    // Update print mode summary
    configSummary.innerHTML = enabledRules.length > 0 ? enabledRules.join('<br>') : 'No rules enabled';
}

function generateAllEquations() {
    const config = getConfig();
    equations = [];

    // Track if we need to shuffle at the end
    let shouldShuffleAll = false;

    // Generate multiplication equations
    if (multiplicationEnabledInput.checked) {
        const tables = config.multiplication.tables;
        if (tables.length > 0) {
            const allEqs = generateAllForTables(tables, '×', config.multiplication.missing, config.multiplication.form);

            if (config.multiplication.mode === 'all') {
                // Keep in order, don't shuffle
                equations.push(...allEqs);
            } else if (config.multiplication.mode === 'random') {
                // Generate all but shuffle them
                const shuffled = [...allEqs];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                equations.push(...shuffled);
                shouldShuffleAll = true;
            } else {
                // Custom mode
                const randomEqs = randomSample(allEqs, config.multiplication.count);
                equations.push(...randomEqs);
                shouldShuffleAll = true;
            }
        }
    }

    // Generate division equations
    if (divisionEnabledInput.checked) {
        const tables = config.division.tables;
        if (tables.length > 0) {
            const allEqs = generateAllForTables(tables, '÷', config.division.missing, config.division.form);

            if (config.division.mode === 'all') {
                // Keep in order, don't shuffle
                equations.push(...allEqs);
            } else if (config.division.mode === 'random') {
                // Generate all but shuffle them
                const shuffled = [...allEqs];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                equations.push(...shuffled);
                shouldShuffleAll = true;
            } else {
                // Custom mode
                const randomEqs = randomSample(allEqs, config.division.count);
                equations.push(...randomEqs);
                shouldShuffleAll = true;
            }
        }
    }

    // Shuffle all equations together if any operation is random or custom
    if (shouldShuffleAll) {
        for (let i = equations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [equations[i], equations[j]] = [equations[j], equations[i]];
        }
    }

    updateConfigSummary();
    renderEquations();
}

function regenerateEquation(index) {
    const config = getConfig();
    const currentOp = equations[index].op;
    const opConfig = currentOp === '×' ? config.multiplication : config.division;

    // Generate all possible equations for this operation
    const allEqs = generateAllForTables(opConfig.tables, currentOp, opConfig.missing, opConfig.form);

    // Pick a random one (could be the same, but that's okay)
    const newEq = allEqs[Math.floor(Math.random() * allEqs.length)];

    equations[index] = newEq;
    renderEquations();
}

// Event listeners for generate button
generateBtn.addEventListener('click', generateAllEquations);

// Event listener for print button
const printBtn = document.getElementById('printBtn');
printBtn.addEventListener('click', () => {
    window.print();
});

// Event listeners for table selection buttons
document.querySelectorAll('.select-all-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const prefix = btn.dataset.prefix;
        selectAllTables(prefix);
    });
});

document.querySelectorAll('.select-none-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const prefix = btn.dataset.prefix;
        selectNoneTables(prefix);
    });
});

// Event listeners for table checkboxes (update summary)
document.querySelectorAll('input[name="multiplicationTable"], input[name="divisionTable"]').forEach(cb => {
    cb.addEventListener('change', updateConfigSummary);
});

// Event listeners for mode radio buttons (enable/disable count input)
document.querySelectorAll('input[name="multiplicationMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        // Only enable count input for custom mode
        multiplicationCountInput.disabled = (e.target.value !== 'custom');
        updateConfigSummary();
    });
});

document.querySelectorAll('input[name="divisionMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        // Only enable count input for custom mode
        divisionCountInput.disabled = (e.target.value !== 'custom');
        updateConfigSummary();
    });
});

// Event listeners for count inputs (random mode)
multiplicationCountInput.addEventListener('input', updateConfigSummary);
divisionCountInput.addEventListener('input', updateConfigSummary);

// Event listener for form radio buttons
document.querySelectorAll('input[name="multiplicationForm"], input[name="divisionForm"]').forEach(radio => {
    radio.addEventListener('change', updateConfigSummary);
});

// Event listener for missing radio buttons
document.querySelectorAll('input[name="multiplicationMissing"], input[name="divisionMissing"]').forEach(radio => {
    radio.addEventListener('change', updateConfigSummary);
});

// Event listener for regenerate buttons
equationsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.dataset.index !== undefined) {
        regenerateEquation(parseInt(e.target.dataset.index, 10));
    }
});

// Collapse toggle functionality
document.querySelectorAll('.collapse-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const fieldset = button.closest('fieldset');
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        button.setAttribute('aria-expanded', !isExpanded);
        button.textContent = isExpanded ? '+' : '−';
        fieldset.classList.toggle('collapsed', isExpanded);
    });
});

// Rule toggle functionality
document.querySelectorAll('.rule-toggle').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const fieldset = checkbox.closest('fieldset');
        const collapseBtn = fieldset.querySelector('.collapse-toggle');
        const isDisabled = !checkbox.checked;

        fieldset.classList.toggle('rule-disabled', isDisabled);
        fieldset.querySelectorAll('.fieldset-content input, .fieldset-content select').forEach(input => {
            input.disabled = isDisabled;
        });

        // Collapse when disabling, expand when enabling
        fieldset.classList.toggle('collapsed', isDisabled);
        collapseBtn.setAttribute('aria-expanded', !isDisabled);
        collapseBtn.textContent = isDisabled ? '+' : '−';

        updateConfigSummary();
    });
});

// Generate initial equations on load
updateConfigSummary();
generateAllEquations();
