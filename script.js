const configForm = document.getElementById('config');
const equationCountInput = document.getElementById('equationCount');
const additionCountInput = document.getElementById('additionCount');
const subtractionCountInput = document.getElementById('subtractionCount');
const additionEnabledInput = document.getElementById('additionEnabled');
const subtractionEnabledInput = document.getElementById('subtractionEnabled');
const generateBtn = document.getElementById('generateBtn');
const equationsContainer = document.getElementById('equations');
const configSummary = document.getElementById('configSummary');

let equations = [];

function updateTotalCount() {
    const additionCount = additionEnabledInput.checked ? (parseInt(additionCountInput.value) || 0) : 0;
    const subtractionCount = subtractionEnabledInput.checked ? (parseInt(subtractionCountInput.value) || 0) : 0;
    equationCountInput.textContent = additionCount + subtractionCount;
}

function getRadioValue(name) {
    const selected = configForm.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function getConfig() {
    return {
        addition: {
            upperLimit: parseInt(document.getElementById('additionUpperLimit').value, 10),
            digitMode: getRadioValue('additionDigitMode'),
            missing: getRadioValue('additionMissing'),
            count: parseInt(additionCountInput.value) || 0
        },
        subtraction: {
            upperLimit: parseInt(document.getElementById('subtractionUpperLimit').value, 10),
            digitMode: getRadioValue('subtractionDigitMode'),
            missing: getRadioValue('subtractionMissing'),
            count: parseInt(subtractionCountInput.value) || 0
        },
        equationCount: parseInt(equationCountInput.textContent, 10)
    };
}

function getOperandRange(digitMode, upperLimit) {
    switch (digitMode) {
        case 'single':
            return { min: 1, max: Math.min(9, upperLimit) };
        case 'double':
            return { min: 1, max: Math.min(99, upperLimit) };
        default:
            return { min: 1, max: upperLimit };
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEquation(opConfig, op, existingEquations) {
    const { upperLimit, digitMode, missing } = opConfig;
    const range = getOperandRange(digitMode, upperLimit);

    const maxAttempts = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;

        let a, b, c;

        if (op === '+') {
            a = randomInt(range.min, Math.min(range.max, upperLimit - range.min));
            const maxB = Math.min(range.max, upperLimit - a);
            if (maxB < range.min) continue;
            b = randomInt(range.min, maxB);
            c = a + b;
        } else {
            a = randomInt(Math.max(range.min, range.min * 2), Math.min(range.max, upperLimit));
            const maxB = Math.min(range.max, a - 1);
            if (maxB < range.min) continue;
            b = randomInt(range.min, maxB);
            c = a - b;
            if (c < 0) continue;
        }

        // Determine which value to hide
        let missingValue;
        if (missing === 'random') {
            const options = ['answer', 'first', 'second'];
            missingValue = options[Math.floor(Math.random() * options.length)];
        } else if (missing === 'first' || missing === 'second' || missing === 'answer') {
            missingValue = missing;
        } else {
            missingValue = 'answer';
        }

        const key = `${a}${op}${b}=${c}:${missingValue}`;

        if (!existingEquations.has(key)) {
            existingEquations.add(key);
            return { a, b, c, op, missing: missingValue, key };
        }
    }

    return null;
}

function formatEquation(eq) {
    const blank = '<span class="blank"></span>';
    const aDisplay = eq.missing === 'first' ? blank : eq.a;
    const bDisplay = eq.missing === 'second' ? blank : eq.b;
    const cDisplay = eq.missing === 'answer' ? blank : eq.c;

    return `${aDisplay} ${eq.op} ${bDisplay} = ${cDisplay}`;
}

function renderEquations() {
    equationsContainer.innerHTML = '';

    equations.forEach((eq, index) => {
        const div = document.createElement('div');
        div.className = 'equation';
        div.innerHTML = `
            <span class="equation-number">${index + 1})</span>
            <span class="equation-text">${formatEquation(eq)}</span>
            <button type="button" data-index="${index}">🔄</button>
        `;
        equationsContainer.appendChild(div);
    });
}

function updateConfigSummary() {
    const config = getConfig();
    const addDigit = config.addition.digitMode === 'single' ? 'single' : config.addition.digitMode === 'double' ? 'double' : 'any';
    const subDigit = config.subtraction.digitMode === 'single' ? 'single' : config.subtraction.digitMode === 'double' ? 'double' : 'any';
    const getMissingLabel = (missing) => {
        switch (missing) {
            case 'answer': return 'answer';
            case 'first': return 'left operand';
            case 'second': return 'right operand';
            case 'random': return 'random';
            default: return missing;
        }
    };
    const addMissing = getMissingLabel(config.addition.missing);
    const subMissing = getMissingLabel(config.subtraction.missing);

    configSummary.textContent = `Addition: ${config.addition.count}x up to ${config.addition.upperLimit} (${addDigit}, ${addMissing}) | Subtraction: ${config.subtraction.count}x up to ${config.subtraction.upperLimit} (${subDigit}, ${subMissing})`;
}

function generateAllEquations() {
    const config = getConfig();
    const existingKeys = new Set();
    equations = [];

    // Generate addition equations
    if (additionEnabledInput.checked) {
        for (let i = 0; i < config.addition.count; i++) {
            const eq = generateEquation(config.addition, '+', existingKeys);
            if (eq) {
                equations.push(eq);
            }
        }
    }

    // Generate subtraction equations
    if (subtractionEnabledInput.checked) {
        for (let i = 0; i < config.subtraction.count; i++) {
            const eq = generateEquation(config.subtraction, '-', existingKeys);
            if (eq) {
                equations.push(eq);
            }
        }
    }

    // Shuffle equations
    for (let i = equations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [equations[i], equations[j]] = [equations[j], equations[i]];
    }

    updateConfigSummary();
    renderEquations();
}

function regenerateEquation(index) {
    const config = getConfig();
    const existingKeys = new Set(equations.map(eq => eq.key));
    existingKeys.delete(equations[index].key);

    const currentOp = equations[index].op;
    const opConfig = currentOp === '+' ? config.addition : config.subtraction;

    const newEq = generateEquation(opConfig, currentOp, existingKeys);
    if (newEq) {
        equations[index] = newEq;
        renderEquations();
    }
}

generateBtn.addEventListener('click', generateAllEquations);

additionCountInput.addEventListener('input', updateTotalCount);
subtractionCountInput.addEventListener('input', updateTotalCount);

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

        updateTotalCount();
    });
});

// Generate initial equations on load
generateAllEquations();
