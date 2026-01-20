const configForm = document.getElementById('config');
const upperLimitInput = document.getElementById('upperLimit');
const equationCountInput = document.getElementById('equationCount');
const generateBtn = document.getElementById('generateBtn');
const equationsContainer = document.getElementById('equations');
const configSummary = document.getElementById('configSummary');

let equations = [];

function getRadioValue(name) {
    const selected = configForm.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function getConfig() {
    return {
        operation: getRadioValue('operation'),
        upperLimit: parseInt(upperLimitInput.value, 10),
        equationCount: parseInt(equationCountInput.value, 10),
        digitMode: getRadioValue('digitMode'),
        missingValue: getRadioValue('missingValue')
    };
}

function getOperandRange(digitMode, upperLimit) {
    switch (digitMode) {
        case 'single':
            return { min: 1, max: Math.min(9, upperLimit) };
        case 'double':
            return { min: 10, max: upperLimit };
        case 'mixed':
        default:
            return { min: 1, max: upperLimit };
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEquation(config, existingEquations) {
    const { operation, upperLimit, digitMode, missingValue } = config;
    const range = getOperandRange(digitMode, upperLimit);

    const maxAttempts = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;

        // Determine operation for this equation
        let op;
        if (operation === 'both') {
            op = Math.random() < 0.5 ? '+' : '-';
        } else if (operation === 'addition') {
            op = '+';
        } else {
            op = '-';
        }

        let a, b, c;

        if (op === '+') {
            // For addition: a + b = c, where c <= upperLimit
            // We need a and b from the range, and their sum <= upperLimit
            a = randomInt(range.min, Math.min(range.max, upperLimit - range.min));
            const maxB = Math.min(range.max, upperLimit - a);
            if (maxB < range.min) continue;
            b = randomInt(range.min, maxB);
            c = a + b;
        } else {
            // For subtraction: a - b = c, where c >= 0 and a <= upperLimit
            // a must be at least range.min + range.min to allow valid b
            a = randomInt(Math.max(range.min, range.min * 2), Math.min(range.max, upperLimit));
            const maxB = Math.min(range.max, a - 1); // c must be >= 0, so b < a for positive result
            if (maxB < range.min) continue;
            b = randomInt(range.min, maxB);
            c = a - b;
            if (c < 0) continue;
        }

        // Determine which value to hide
        let missing;
        if (missingValue === 'random') {
            const options = ['answer', 'first', 'second'];
            missing = options[Math.floor(Math.random() * options.length)];
        } else {
            missing = missingValue;
        }

        // Create equation key for duplicate checking
        const key = `${a}${op}${b}=${c}:${missing}`;

        if (!existingEquations.has(key)) {
            existingEquations.add(key);
            return { a, b, c, op, missing, key };
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
            <span class="equation-number">${index + 1}.</span>
            <span class="equation-text">${formatEquation(eq)}</span>
            <button type="button" data-index="${index}">New</button>
        `;
        equationsContainer.appendChild(div);
    });
}

function updateConfigSummary() {
    const config = getConfig();
    const opText = config.operation === 'both' ? 'Addition & Subtraction' :
                   config.operation === 'addition' ? 'Addition' : 'Subtraction';
    const digitText = config.digitMode === 'single' ? 'Single digit' :
                      config.digitMode === 'double' ? 'Double digit' : 'Mixed';
    const missingText = config.missingValue === 'answer' ? 'Answer hidden' :
                        config.missingValue === 'first' ? 'First operand hidden' :
                        config.missingValue === 'second' ? 'Second operand hidden' : 'Random hidden';

    configSummary.textContent = `${opText} | Up to ${config.upperLimit} | ${digitText} | ${missingText}`;
}

function generateAllEquations() {
    const config = getConfig();
    const existingKeys = new Set();
    equations = [];

    for (let i = 0; i < config.equationCount; i++) {
        const eq = generateEquation(config, existingKeys);
        if (eq) {
            equations.push(eq);
        }
    }

    updateConfigSummary();
    renderEquations();
}

function regenerateEquation(index) {
    const config = getConfig();
    const existingKeys = new Set(equations.map(eq => eq.key));
    existingKeys.delete(equations[index].key);

    const newEq = generateEquation(config, existingKeys);
    if (newEq) {
        equations[index] = newEq;
        renderEquations();
    }
}

generateBtn.addEventListener('click', generateAllEquations);

equationsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.dataset.index !== undefined) {
        regenerateEquation(parseInt(e.target.dataset.index, 10));
    }
});

// Generate initial equations on load
generateAllEquations();
