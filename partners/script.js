const configForm = document.getElementById('config');
const summaryContent = document.getElementById('summaryContent');
const partnersToggle = document.getElementById('partnersToggle');
const sequencesToggle = document.getElementById('sequencesToggle');
const generateBtn = document.getElementById('generateBtn');
const printBtn = document.getElementById('printBtn');
const equationsContainer = document.getElementById('equations');
const sequencesContainer = document.getElementById('sequences');
const configSummary = document.getElementById('configSummary');

let equations = [];
let sequences = [];

function getRadioValue(name) {
    const selected = configForm.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function getConfig() {
    return {
        partners: {
            enabled: partnersToggle.checked,
            total: parseInt(document.getElementById('partnersTotal').value, 10),
            digitMode: getRadioValue('partnersDigits'),
            missing: getRadioValue('partnersHidden'),
            count: parseInt(document.getElementById('partnersCount').value, 10)
        },
        sequences: {
            enabled: sequencesToggle.checked,
            total: parseInt(document.getElementById('sequencesTotal').value, 10),
            count: parseInt(document.getElementById('sequencesCount').value, 10)
        }
    };
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Exercise 1: Partner Pairs

function getAllPartners(total) {
    // Generate all valid partners (excluding 0)
    // Returns array of [a, b] pairs where a + b = total
    const partners = [];
    for (let a = 1; a < total; a++) {
        const b = total - a;
        partners.push([a, b]);
    }
    return partners;
}

function filterByDigitMode(partners, digitMode, count) {
    if (digitMode === 'any') {
        return partners;
    } else if (digitMode === 'single') {
        // Try strict first: both operands must be single-digit (< 10)
        const strictSingle = partners.filter(([a, b]) => a < 10 && b < 10);

        // If we have enough strict matches, use them
        if (strictSingle.length >= count) {
            return strictSingle;
        }

        // Fallback: at least one operand is single-digit
        return partners.filter(([a, b]) => a < 10 || b < 10);
    } else if (digitMode === 'double') {
        // Try strict first: both operands must be double-digit (>= 10)
        const strictDouble = partners.filter(([a, b]) => a >= 10 && b >= 10);

        // If we have enough strict matches, use them
        if (strictDouble.length >= count) {
            return strictDouble;
        }

        // Fallback: at least one operand is double-digit
        return partners.filter(([a, b]) => a >= 10 || b >= 10);
    }
    return partners;
}

function generatePartnerPairs(config) {
    const { total, digitMode, missing, count } = config;

    // Get all valid partners
    let partners = getAllPartners(total);

    // Filter by digit mode
    partners = filterByDigitMode(partners, digitMode, count);

    if (partners.length === 0) {
        return [];
    }

    // Randomly select up to 'count' partners using Fisher-Yates shuffle
    const shuffled = [...partners];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Create equation objects
    return selected.map(([a, b]) => {
        // Determine which value to hide
        let missingValue;
        if (missing === 'random') {
            const options = ['answer', 'first', 'second'];
            missingValue = options[Math.floor(Math.random() * options.length)];
        } else {
            missingValue = missing;
        }

        return {
            a,
            b,
            c: total,
            op: '+',
            missing: missingValue,
            key: `${a}+${b}=${total}:${missingValue}`
        };
    });
}

// Exercise 2: Partner Sequences

function generatePartnerSequences(config) {
    const { total, count } = config;

    // Generate complete sequence including 0
    const allPartners = [];
    for (let i = 0; i <= total; i++) {
        allPartners.push({
            a: i,
            b: total - i,
            c: total
        });
    }

    const result = [];

    for (let s = 0; s < count; s++) {
        // Randomly pick one partner to omit (the blank)
        const blankIndex = randomInt(0, total);

        // Determine 6 visible items around the blank
        const visibleItems = selectVisibleItems(allPartners, blankIndex);

        result.push({
            allPartners: allPartners,
            blankIndex: blankIndex,
            visibleItems: visibleItems
        });
    }

    return result;
}

function selectVisibleItems(allPartners, blankIndex) {
    const total = allPartners.length - 1; // Total number of partners (0 to total inclusive)
    const totalItems = allPartners.length; // Total items including 0

    // We want to show exactly 6 items around the blank
    // Prefer 3 before and 3 after, but adjust if near start/end

    let beforeCount = 3;
    let afterCount = 3;

    // Adjust if near the start
    if (blankIndex < 3) {
        beforeCount = blankIndex;
        afterCount = 6 - beforeCount;
    }

    // Adjust if near the end
    if (blankIndex > total - 3) {
        afterCount = total - blankIndex;
        beforeCount = 6 - afterCount;
    }

    const startIndex = blankIndex - beforeCount;
    const endIndex = blankIndex + afterCount;

    const before = [];
    const after = [];

    for (let i = startIndex; i < blankIndex; i++) {
        if (i >= 0 && i < totalItems) {
            before.push({ ...allPartners[i], index: i });
        }
    }

    for (let i = blankIndex + 1; i <= endIndex; i++) {
        if (i >= 0 && i < totalItems) {
            after.push({ ...allPartners[i], index: i });
        }
    }

    return {
        before,
        blank: { ...allPartners[blankIndex], index: blankIndex },
        after
    };
}

// Rendering Functions

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
    equationsContainer.innerHTML = '';

    equations.forEach((eq, index) => {
        const div = document.createElement('div');
        div.className = 'equation';
        div.innerHTML = `
            <span class="equation-number">${index + 1})</span>
            <span class="equation-text">${formatEquation(eq)}</span>
        `;
        equationsContainer.appendChild(div);
    });
}

function formatSequenceItem(item, isBlank = false) {
    const blank = '<span class="blank"></span>';
    if (isBlank) {
        return `${blank} + ${blank} = ${blank}`;
    }
    return `${formatNumber(item.a)} + ${formatNumber(item.b)} = ${formatNumber(item.c)}`;
}

function renderSequences() {
    sequencesContainer.innerHTML = '';

    sequences.forEach((seq, index) => {
        const div = document.createElement('div');
        div.className = 'sequence-box';

        let html = `<button type="button" class="sequence-regenerate" data-index="${index}">🔄</button>`;

        // Render before items
        seq.visibleItems.before.forEach(item => {
            html += `<div class="sequence-item">${formatSequenceItem(item)}</div>`;
        });

        // Render blank
        html += `<div class="sequence-item">${formatSequenceItem(null, true)}</div>`;

        // Render after items
        seq.visibleItems.after.forEach(item => {
            html += `<div class="sequence-item">${formatSequenceItem(item)}</div>`;
        });

        div.innerHTML = html;
        sequencesContainer.appendChild(div);
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
    let totalCount = 0;

    // Exercise 1: Partner Pairs
    if (config.partners.enabled) {
        const digitLabel = config.partners.digitMode === 'single' ? 'single' :
                          config.partners.digitMode === 'double' ? 'double' : 'any';
        const missingLabel = getMissingLabel(config.partners.missing);
        enabledRules.push(
            `${config.partners.count}x partner pairs for ${config.partners.total} with ${digitLabel} digits and ${missingLabel} hidden`
        );
        totalCount += config.partners.count;
    }

    // Exercise 2: Partner Sequences
    if (config.sequences.enabled) {
        enabledRules.push(
            `${config.sequences.count}x partner sequences for ${config.sequences.total}`
        );
        totalCount += config.sequences.count;
    }

    // Update Summary box (visible in normal mode)
    let summaryHTML = `<div>Total items: <strong>${totalCount}</strong></div>`;
    summaryHTML += '<div>Configuration:</div>';
    if (enabledRules.length > 0) {
        summaryHTML += '<ul>' + enabledRules.map(rule => `<li>${rule}</li>`).join('') + '</ul>';
    } else {
        summaryHTML += '<div>No exercises enabled</div>';
    }
    summaryContent.innerHTML = summaryHTML;

    // Update print mode summary
    configSummary.innerHTML = enabledRules.length > 0 ? enabledRules.join('<br>') : 'No exercises enabled';
}

function generateAll() {
    const config = getConfig();

    equations = [];
    sequences = [];

    // Generate Exercise 1: Partner Pairs
    if (config.partners.enabled) {
        equations = generatePartnerPairs(config.partners);
    }

    // Generate Exercise 2: Partner Sequences
    if (config.sequences.enabled) {
        sequences = generatePartnerSequences(config.sequences);
    }

    updateConfigSummary();
    renderEquations();
    renderSequences();
}

// Event Listeners

generateBtn.addEventListener('click', generateAll);
printBtn.addEventListener('click', () => window.print());

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

// Update summary when any input changes
document.querySelectorAll('#config input').forEach(input => {
    input.addEventListener('input', updateConfigSummary);
    input.addEventListener('change', updateConfigSummary);
});

// Regenerate individual sequence
sequencesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('sequence-regenerate')) {
        const index = parseInt(e.target.dataset.index, 10);
        regenerateSequence(index);
    }
});

function regenerateSequence(index) {
    const config = getConfig();
    if (!config.sequences.enabled) return;

    // Generate a new sequence
    const total = config.sequences.total;
    const allPartners = [];
    for (let i = 0; i <= total; i++) {
        allPartners.push({
            a: i,
            b: total - i,
            c: total
        });
    }

    const blankIndex = randomInt(0, total);
    const visibleItems = selectVisibleItems(allPartners, blankIndex);

    sequences[index] = {
        allPartners: allPartners,
        blankIndex: blankIndex,
        visibleItems: visibleItems
    };

    renderSequences();
}

// Generate initial content on load
generateAll();
