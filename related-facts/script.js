const configForm = document.getElementById('config');
const summaryContent = document.getElementById('summaryContent');
const familyCountInput = document.getElementById('familyCount');
const upperLimitInput = document.getElementById('upperLimit');
const generateBtn = document.getElementById('generateBtn');
const factFamiliesContainer = document.getElementById('factFamilies');
const configSummary = document.getElementById('configSummary');

let factFamilies = [];

function getRadioValue(name) {
    const selected = configForm.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function getConfig() {
    return {
        upperLimit: parseInt(upperLimitInput.value, 10),
        digitMode: getRadioValue('digitMode'),
        missing: getRadioValue('missing'),
        familyCount: parseInt(familyCountInput.value) || 0
    };
}

function getOperandRange(digitMode, upperLimit) {
    switch (digitMode) {
        case 'single':
            return { min: 1, max: Math.min(9, upperLimit) };
        case 'double':
            return { min: 10, max: Math.min(99, upperLimit) };
        default:
            return { min: 1, max: upperLimit };
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFactFamily(config, existingFamilies) {
    const { upperLimit, digitMode } = config;

    let rangeA, rangeB;

    if (digitMode === 'single') {
        const singleOperandIsA = Math.random() < 0.5;
        const singleRange = { min: 1, max: Math.min(9, upperLimit) };
        const anyRange = { min: 1, max: upperLimit };

        rangeA = singleOperandIsA ? singleRange : anyRange;
        rangeB = singleOperandIsA ? anyRange : singleRange;
    } else {
        const range = getOperandRange(digitMode, upperLimit);
        rangeA = range;
        rangeB = range;
    }

    const maxAttempts = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;

        const a = randomInt(rangeA.min, Math.min(rangeA.max, upperLimit - rangeB.min));
        const maxB = Math.min(rangeB.max, upperLimit - a);
        if (maxB < rangeB.min) continue;

        const b = randomInt(rangeB.min, maxB);
        const c = a + b;

        if (c > upperLimit) continue;

        const key = `${a}+${b}=${c}`;

        if (!existingFamilies.has(key)) {
            existingFamilies.add(key);

            // Determine which values to hide
            const hiddenValues = determineHiddenValues(config.missing);

            return {
                a,
                b,
                c,
                key,
                equations: [
                    { a, b, c, op: '+', hidden: hiddenValues[0] },
                    { a: c, b: a, c: b, op: '-', hidden: hiddenValues[1] },
                    { a: c, b, c: a, op: '-', hidden: hiddenValues[2] }
                ]
            };
        }
    }

    return null;
}

function determineHiddenValues(missingMode) {
    // Returns an array of 3 sets of hidden values for the 3 equations
    // Each set is an object like { first: false, second: false, answer: false }

    if (missingMode === 'none') {
        return [
            { first: false, second: false, answer: false },
            { first: false, second: false, answer: false },
            { first: false, second: false, answer: false }
        ];
    }

    if (missingMode === 'some') {
        // Hide 1-2 values across the entire family
        const numHidden = randomInt(1, 2);
        const positions = [];

        // Generate all 9 positions (3 equations x 3 positions each)
        for (let eq = 0; eq < 3; eq++) {
            for (let pos of ['first', 'second', 'answer']) {
                positions.push({ eq, pos });
            }
        }

        // Shuffle and pick numHidden positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        const hidden = [
            { first: false, second: false, answer: false },
            { first: false, second: false, answer: false },
            { first: false, second: false, answer: false }
        ];

        for (let i = 0; i < numHidden; i++) {
            const { eq, pos } = positions[i];
            hidden[eq][pos] = true;
        }

        return hidden;
    }

    if (missingMode === 'many') {
        // Hide 3-5 values across the entire family
        const numHidden = randomInt(3, 5);
        const positions = [];

        for (let eq = 0; eq < 3; eq++) {
            for (let pos of ['first', 'second', 'answer']) {
                positions.push({ eq, pos });
            }
        }

        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        const hidden = [
            { first: false, second: false, answer: false },
            { first: false, second: false, answer: false },
            { first: false, second: false, answer: false }
        ];

        for (let i = 0; i < numHidden; i++) {
            const { eq, pos } = positions[i];
            hidden[eq][pos] = true;
        }

        return hidden;
    }

    return [
        { first: false, second: false, answer: false },
        { first: false, second: false, answer: false },
        { first: false, second: false, answer: false }
    ];
}

function formatNumber(num) {
    const numStr = String(num);
    const digitCount = numStr.length;
    const alignClass = digitCount === 1 ? 'center' : 'left';
    return `<span class="num align-${alignClass}">${num}</span>`;
}

function formatEquation(eq) {
    const blank = '<span class="blank"></span>';
    const aDisplay = eq.hidden.first ? blank : formatNumber(eq.a);
    const bDisplay = eq.hidden.second ? blank : formatNumber(eq.b);
    const cDisplay = eq.hidden.answer ? blank : formatNumber(eq.c);

    return `${aDisplay} ${eq.op} ${bDisplay} = ${cDisplay}`;
}

function renderFactFamilies() {
    factFamiliesContainer.innerHTML = '';

    factFamilies.forEach((family, index) => {
        const div = document.createElement('div');
        div.className = 'fact-family';

        const equationsHTML = family.equations
            .map(eq => `
                <div class="equation">
                    <span class="equation-text">${formatEquation(eq)}</span>
                </div>
            `)
            .join('');

        div.innerHTML = `
            <div class="fact-family-header">
                <span class="family-number">Family ${index + 1}</span>
                <button type="button" data-index="${index}">🔄</button>
            </div>
            <div class="equation-group">
                ${equationsHTML}
            </div>
        `;

        factFamiliesContainer.appendChild(div);
    });
}

function updateConfigSummary() {
    const config = getConfig();

    const digitLabel = config.digitMode === 'single' ? 'single' :
                       config.digitMode === 'double' ? 'double' : 'any';
    const missingLabel = config.missing === 'none' ? 'no values hidden' :
                        config.missing === 'some' ? 'some values hidden' :
                        'many values hidden';

    const summaryHTML = `
        <div>Fact Families: <strong>${config.familyCount}</strong></div>
        <div>Up to: <strong>${config.upperLimit}</strong></div>
        <div>Digits: <strong>${digitLabel}</strong></div>
        <div>Hidden: <strong>${missingLabel}</strong></div>
    `;

    summaryContent.innerHTML = summaryHTML;

    const printSummary = `${config.familyCount} fact families up to ${config.upperLimit} with ${digitLabel} digits, ${missingLabel}`;
    configSummary.innerHTML = printSummary;
}

function generateAllFactFamilies() {
    const config = getConfig();
    const existingKeys = new Set();
    factFamilies = [];

    for (let i = 0; i < config.familyCount; i++) {
        const family = generateFactFamily(config, existingKeys);
        if (family) {
            factFamilies.push(family);
        }
    }

    updateConfigSummary();
    renderFactFamilies();
}

function regenerateFactFamily(index) {
    const config = getConfig();
    const existingKeys = new Set(factFamilies.map(f => f.key));
    existingKeys.delete(factFamilies[index].key);

    const newFamily = generateFactFamily(config, existingKeys);
    if (newFamily) {
        factFamilies[index] = newFamily;
        renderFactFamilies();
    }
}

generateBtn.addEventListener('click', generateAllFactFamilies);

familyCountInput.addEventListener('input', updateConfigSummary);
upperLimitInput.addEventListener('input', updateConfigSummary);

configForm.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
        updateConfigSummary();
    }
});

factFamiliesContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.dataset.index !== undefined) {
        regenerateFactFamily(parseInt(e.target.dataset.index, 10));
    }
});

// Generate initial fact families on load
generateAllFactFamilies();
