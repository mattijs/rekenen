const configForm = document.getElementById('config');
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
        addition: {
            upperLimit: parseInt(document.getElementById('additionUpperLimit').value, 10),
            digitMode: getRadioValue('additionDigitMode'),
            missing: getRadioValue('additionMissing')
        },
        subtraction: {
            upperLimit: parseInt(document.getElementById('subtractionUpperLimit').value, 10),
            digitMode: getRadioValue('subtractionDigitMode'),
            missing: getRadioValue('subtractionMissing')
        },
        equationCount: parseInt(equationCountInput.value, 10)
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
        if (missing === 'operand') {
            missingValue = Math.random() < 0.5 ? 'first' : 'second';
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
            <span class="equation-number">${index + 1}.</span>
            <span class="equation-text">${formatEquation(eq)}</span>
            <button type="button" data-index="${index}">New</button>
        `;
        equationsContainer.appendChild(div);
    });
}

function updateConfigSummary() {
    const config = getConfig();
    const addDigit = config.addition.digitMode === 'single' ? 'single' : 'double';
    const subDigit = config.subtraction.digitMode === 'single' ? 'single' : 'double';
    const addMissing = config.addition.missing === 'answer' ? 'answer' : 'operand';
    const subMissing = config.subtraction.missing === 'answer' ? 'answer' : 'operand';

    configSummary.textContent = `Addition up to ${config.addition.upperLimit} (${addDigit}, ${addMissing}) | Subtraction up to ${config.subtraction.upperLimit} (${subDigit}, ${subMissing})`;
}

function generateAllEquations() {
    const config = getConfig();
    const existingKeys = new Set();
    equations = [];

    const halfCount = Math.floor(config.equationCount / 2);
    const additionCount = halfCount;
    const subtractionCount = config.equationCount - halfCount;

    // Generate addition equations
    for (let i = 0; i < additionCount; i++) {
        const eq = generateEquation(config.addition, '+', existingKeys);
        if (eq) {
            equations.push(eq);
        }
    }

    // Generate subtraction equations
    for (let i = 0; i < subtractionCount; i++) {
        const eq = generateEquation(config.subtraction, '-', existingKeys);
        if (eq) {
            equations.push(eq);
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

equationsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.dataset.index !== undefined) {
        regenerateEquation(parseInt(e.target.dataset.index, 10));
    }
});

// Generate initial equations on load
generateAllEquations();
