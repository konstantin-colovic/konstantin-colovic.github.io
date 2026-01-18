// CV Data
const cvData = {
    contact: {
        personal: 'konstantin.colovic@gmail.com',
        university: 'konstantin.colovic@tum.de',
        linkedin: 'linkedin.com/in/konstantincolovic',
        location: 'Belgrade, Serbia | Heilbronn, Germany'
    },
    experience: [
        {
            title: 'Student Research Assistant',
            org: 'TUM - Chair of Computer Architecture and Operating Systems (CAOS)',
            date: 'Oct 2025 - Present',
            location: 'Heilbronn, Germany',
            email: 'colk@cit.tum.de',
            desc: 'Benchmarking and optimizing computationally intensive operations on RISC-V development boards using vector extensions.'
        },
        {
            title: 'Tutor in Fundamentals of Programming',
            org: 'TUM - Chair of Software Engineering',
            date: 'Sep 2025 - Present',
            location: 'Heilbronn, Germany',
            desc: 'Creating and distributing programming exercises for 1st semester Information Engineering students.'
        }
    ],
    volunteering: [
        {
            title: 'Head of University Politics Department',
            org: 'TUM Student Council Heilbronn (Fachschaft)',
            date: 'Dec 2024 - Present',
            email: 'colovic@hn.fs.tum.de',
            desc: 'Advocating for student interests in committees and council assemblies.'
        },
        {
            title: 'Head of IT Team',
            org: 'TEDxHeilbronn',
            date: 'Jun 2025 - Present',
            desc: 'Leading the IT team for TEDxHeilbronn events.'
        }
    ],
    education: [
        {
            title: 'B.Sc. Information Engineering',
            org: 'Technical University of Munich',
            date: 'Aug 2024 - Present',
            email: 'konstantin.colovic@tum.de'
        },
        {
            title: 'High School Diploma',
            org: 'Third Belgrade Grammar School',
            date: 'Sep 2020 - Jun 2024'
        }
    ],
    languages: [
        { lang: 'English', level: 'Full Professional' },
        { lang: 'Serbo-Croatian', level: 'Native' },
        { lang: 'German', level: 'Limited Working' },
        { lang: 'French', level: 'Elementary' }
    ]
};

// Terminal state
let isTerminalMode = false;
let isFullscreen = false;
let currentMenu = 'main';
let isTyping = false;
let typeQueue = [];
let currentInput = '';
let commandHistory = [];
let historyIndex = -1;

// Available commands for autocomplete
const availableCommands = [
    'contact', 'experience', 'volunteer', 'volunteering', 'education',
    'languages', 'clear', 'exit', 'quit', 'help', 'menu', './menu.sh'
];

// DOM Elements
const modeToggle = document.getElementById('mode-toggle');
const themeToggle = document.getElementById('theme-toggle');
const terminalMode = document.getElementById('terminal-mode');
const terminalWindow = document.querySelector('.terminal-window');
const terminalOutput = document.getElementById('terminal-output');
const tooltip = document.getElementById('tooltip');
const redDot = document.querySelector('.terminal-dot.red');
const yellowDot = document.querySelector('.terminal-dot.yellow');
const greenDot = document.querySelector('.terminal-dot.green');

// Theme Management
function getPreferredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Initialize theme
setTheme(getPreferredTheme());

// Theme toggle via button click
themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// Terminal window controls
redDot.addEventListener('click', closeTerminal);
redDot.style.cursor = 'pointer';

yellowDot.addEventListener('click', minimizeTerminal);
yellowDot.style.cursor = 'pointer';

greenDot.addEventListener('click', toggleFullscreen);
greenDot.style.cursor = 'pointer';

function closeTerminal() {
    isTerminalMode = false;
    isTyping = false;
    typeQueue = [];
    terminalMode.classList.remove('visible');
    terminalWindow.classList.remove('fullscreen');
    isFullscreen = false;
    modeToggle.classList.remove('terminal-active');
    modeToggle.querySelector('.toggle-text').textContent = 'Terminal';
    // Clear after animation
    setTimeout(() => {
        terminalOutput.innerHTML = '';
        currentMenu = 'main';
    }, 300);
}

function minimizeTerminal() {
    // Animate minimize effect - terminal shrinks while background fades in
    terminalWindow.classList.add('minimizing');
    terminalMode.classList.add('fading');

    setTimeout(() => {
        terminalMode.classList.remove('fading');
        closeTerminal();
        terminalWindow.classList.remove('minimizing');
    }, 500);
}

function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    terminalWindow.classList.toggle('fullscreen', isFullscreen);
}

// Mode Toggle
modeToggle.addEventListener('click', () => {
    if (tooltip && !tooltip.classList.contains('hidden')) {
        tooltip.classList.add('hidden');
    }

    if (isTerminalMode) {
        closeTerminal();
    } else {
        openTerminal();
    }
});

function openTerminal() {
    isTerminalMode = true;
    isTyping = false;
    typeQueue = [];
    currentMenu = 'main';
    terminalOutput.innerHTML = '';
    terminalMode.classList.add('visible');
    modeToggle.classList.add('terminal-active');
    modeToggle.querySelector('.toggle-text').textContent = 'Close';

    // Blur the button so Enter key doesn't activate it
    modeToggle.blur();
    document.activeElement?.blur();

    // Small delay to ensure DOM is ready
    setTimeout(() => {
        showWelcome();
    }, 100);
}

// Typing system with queue to prevent race conditions
function printLine(text, className = '') {
    const lineEl = document.createElement('div');
    lineEl.className = `terminal-line ${className}`;
    lineEl.textContent = text;
    terminalOutput.appendChild(lineEl);
    scrollToBottom();
}

async function typeLine(text, className = '') {
    return new Promise((resolve) => {
        const lineEl = document.createElement('div');
        lineEl.className = `terminal-line ${className}`;
        terminalOutput.appendChild(lineEl);

        if (!text || text.length === 0) {
            resolve();
            return;
        }

        let i = 0;
        const speed = 3; // 3ms per char

        function typeChar() {
            if (!isTerminalMode) {
                resolve();
                return;
            }
            if (i < text.length) {
                lineEl.textContent += text.charAt(i);
                i++;
                scrollToBottom();
                setTimeout(typeChar, speed);
            } else {
                resolve();
            }
        }
        typeChar();
    });
}

async function typeLines(lines) {
    if (!isTerminalMode) return;

    isTyping = true;
    removeCursor();

    for (const line of lines) {
        if (!isTerminalMode) break;

        if (typeof line === 'string') {
            await typeLine(line);
        } else {
            await typeLine(line.text, line.class);
        }
    }

    isTyping = false;
}

async function showWelcome() {
    if (!isTerminalMode) return;

    const lines = [
        { text: 'konstantin@portfolio:~$ neofetch', class: 'prompt' },
        { text: '', class: '' },
        { text: '  _  __                _              _   _       ', class: 'ascii' },
        { text: ' | |/ /___  _ __  ___| |_ __ _ _ __ | |_(_)_ __  ', class: 'ascii' },
        { text: " | ' // _ \\| '_ \\/ __| __/ _` | '_ \\| __| | '_ \\ ", class: 'ascii' },
        { text: ' | . \\ (_) | | | \\__ \\ || (_| | | | | |_| | | | |', class: 'ascii' },
        { text: ' |_|\\_\\___/|_| |_|___/\\__\\__,_|_| |_|\\__|_|_| |_|', class: 'ascii' },
        { text: '', class: '' },
        { text: '  OS:       Student @ TUM', class: 'info-line' },
        { text: '  Degree:   B.Sc. Information Engineering', class: 'info-line' },
        { text: '  Location: Belgrade | Heilbronn', class: 'info-line' },
        { text: '  Uptime:   Since Dec 2005', class: 'info-line' },
        { text: '', class: '' },
    ];

    await typeLines(lines);
    if (isTerminalMode) {
        await showMainMenu();
    }
}

async function showMainMenu() {
    if (!isTerminalMode) return;

    currentMenu = 'main';

    const lines = [
        { text: 'konstantin@portfolio:~$ ./menu.sh', class: 'prompt' },
        { text: '', class: '' },
        { text: '  Available commands:', class: 'header' },
        { text: '', class: '' },
        { text: '    [1] contact    - View contact information', class: '' },
        { text: '    [2] experience - View work experience', class: '' },
        { text: '    [3] volunteer  - View volunteering', class: '' },
        { text: '    [4] education  - View education', class: '' },
        { text: '    [5] languages  - View language skills', class: '' },
        { text: '', class: '' },
        { text: '    [0] clear      - Clear terminal', class: 'dim' },
        { text: '    [ESC] exit     - Close terminal', class: 'dim' },
        { text: '', class: '' },
    ];

    await typeLines(lines);
    if (isTerminalMode) {
        addCursor();
    }
}

async function showContact() {
    if (!isTerminalMode) return;
    removeCursor();

    const lines = [
        { text: 'konstantin@portfolio:~$ cat ~/.contact', class: 'prompt' },
        { text: '', class: '' },
        { text: '# Contact Information', class: 'header' },
        { text: '', class: '' },
        { text: `  Email (Personal):   ${cvData.contact.personal}`, class: '' },
        { text: `  Email (University): ${cvData.contact.university}`, class: '' },
        { text: `  LinkedIn:           ${cvData.contact.linkedin}`, class: '' },
        { text: `  Location:           ${cvData.contact.location}`, class: '' },
        { text: '', class: '' },
    ];

    await typeLines(lines);
    if (isTerminalMode) {
        await showBackPrompt();
    }
}

async function showExperience() {
    if (!isTerminalMode) return;
    removeCursor();

    const lines = [
        { text: 'konstantin@portfolio:~$ cat ~/experience.log', class: 'prompt' },
        { text: '', class: '' },
        { text: '# Work Experience', class: 'header' },
        { text: '', class: '' },
    ];

    for (const exp of cvData.experience) {
        lines.push({ text: `  ## ${exp.title}`, class: 'subheader' });
        lines.push({ text: `     ${exp.org}`, class: '' });
        lines.push({ text: `     ${exp.date} | ${exp.location}`, class: 'dim' });
        if (exp.email) {
            lines.push({ text: `     Contact: ${exp.email}`, class: 'dim' });
        }
        lines.push({ text: '', class: '' });
        lines.push({ text: `     ${exp.desc}`, class: 'dim' });
        lines.push({ text: '', class: '' });
    }

    await typeLines(lines);
    if (isTerminalMode) {
        await showBackPrompt();
    }
}

async function showVolunteering() {
    if (!isTerminalMode) return;
    removeCursor();

    const lines = [
        { text: 'konstantin@portfolio:~$ cat ~/volunteer.log', class: 'prompt' },
        { text: '', class: '' },
        { text: '# Volunteering', class: 'header' },
        { text: '', class: '' },
    ];

    for (const vol of cvData.volunteering) {
        lines.push({ text: `  ## ${vol.title}`, class: 'subheader' });
        lines.push({ text: `     ${vol.org}`, class: '' });
        lines.push({ text: `     ${vol.date}`, class: 'dim' });
        if (vol.email) {
            lines.push({ text: `     Contact: ${vol.email}`, class: 'dim' });
        }
        lines.push({ text: '', class: '' });
        lines.push({ text: `     ${vol.desc}`, class: 'dim' });
        lines.push({ text: '', class: '' });
    }

    await typeLines(lines);
    if (isTerminalMode) {
        await showBackPrompt();
    }
}

async function showEducation() {
    if (!isTerminalMode) return;
    removeCursor();

    const lines = [
        { text: 'konstantin@portfolio:~$ cat ~/education.md', class: 'prompt' },
        { text: '', class: '' },
        { text: '# Education', class: 'header' },
        { text: '', class: '' },
    ];

    for (const edu of cvData.education) {
        lines.push({ text: `  ## ${edu.title}`, class: 'subheader' });
        lines.push({ text: `     ${edu.org}`, class: '' });
        lines.push({ text: `     ${edu.date}`, class: 'dim' });
        if (edu.email) {
            lines.push({ text: `     Contact: ${edu.email}`, class: 'dim' });
        }
        lines.push({ text: '', class: '' });
    }

    await typeLines(lines);
    if (isTerminalMode) {
        await showBackPrompt();
    }
}

async function showLanguages() {
    if (!isTerminalMode) return;
    removeCursor();

    const lines = [
        { text: 'konstantin@portfolio:~$ locale -a', class: 'prompt' },
        { text: '', class: '' },
        { text: '# Languages', class: 'header' },
        { text: '', class: '' },
    ];

    for (const lang of cvData.languages) {
        const bar = getProgressBar(lang.level);
        lines.push({ text: `  ${lang.lang.padEnd(15)} ${bar}  ${lang.level}`, class: '' });
    }

    lines.push({ text: '', class: '' });

    await typeLines(lines);
    if (isTerminalMode) {
        await showBackPrompt();
    }
}

function getProgressBar(level) {
    const levels = {
        'Native': 5,
        'Full Professional': 4,
        'Limited Working': 2,
        'Elementary': 1
    };
    const filled = levels[level] || 1;
    return '[' + '='.repeat(filled) + ' '.repeat(5 - filled) + ']';
}

async function showBackPrompt() {
    if (!isTerminalMode) return;
    currentMenu = 'sub';
    const lines = [
        { text: '  Type "./menu.sh" to return | "clear" | "exit"', class: 'dim' },
        { text: '', class: '' },
    ];
    await typeLines(lines);
    if (isTerminalMode) {
        addCursor();
    }
}

function addCursor() {
    removeCursor();
    currentInput = '';
    const cursorLine = document.createElement('div');
    cursorLine.className = 'terminal-line prompt';
    cursorLine.innerHTML = 'konstantin@portfolio:~$ <span id="input-text"></span><span class="cursor"></span>';
    cursorLine.id = 'cursor-line';
    terminalOutput.appendChild(cursorLine);
    scrollToBottom();
}

function removeCursor() {
    const cursorLine = document.getElementById('cursor-line');
    if (cursorLine) cursorLine.remove();
}

function scrollToBottom() {
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

async function clearTerminal() {
    terminalOutput.innerHTML = '';
    await showMainMenu();
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    if (!isTerminalMode || isTyping) return;

    const key = e.key;

    // Escape always closes
    if (key === 'Escape') {
        closeTerminal();
        return;
    }

    const inputSpan = document.getElementById('input-text');
    if (!inputSpan) return;

    // Prevent default for all keys in terminal to avoid button activation
    e.preventDefault();
    e.stopPropagation();

    if (key === 'Enter') {
        // Save to history if not empty
        if (currentInput.trim()) {
            commandHistory.push(currentInput.trim());
            historyIndex = commandHistory.length;
        }
        executeCommand(currentInput.trim().toLowerCase());
    } else if (key === 'Backspace') {
        currentInput = currentInput.slice(0, -1);
        inputSpan.textContent = currentInput;
    } else if (key === 'ArrowUp') {
        // Navigate history backwards
        if (historyIndex > 0) {
            historyIndex--;
            currentInput = commandHistory[historyIndex];
            inputSpan.textContent = currentInput;
        }
    } else if (key === 'ArrowDown') {
        // Navigate history forwards
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            currentInput = commandHistory[historyIndex];
            inputSpan.textContent = currentInput;
        } else {
            historyIndex = commandHistory.length;
            currentInput = '';
            inputSpan.textContent = '';
        }
    } else if (key === 'Tab') {
        // Autocomplete
        const partial = currentInput.toLowerCase();
        if (partial) {
            const matches = availableCommands.filter(cmd => cmd.startsWith(partial));
            if (matches.length === 1) {
                // Single match - complete it
                currentInput = matches[0];
                inputSpan.textContent = currentInput;
            } else if (matches.length > 1) {
                // Multiple matches - show them
                removeCursor();
                printLine(`konstantin@portfolio:~$ ${currentInput}`, 'prompt');
                printLine(matches.join('  '), 'dim');
                addCursor();
                inputSpan.textContent = currentInput;
            }
        }
    } else if (key.length === 1) {
        currentInput += key;
        inputSpan.textContent = currentInput;
        scrollToBottom();
    }
});

async function executeCommand(cmd) {
    // Show the command that was typed
    removeCursor();

    // Handle empty command - just show new prompt
    if (!cmd || cmd === '') {
        printLine('konstantin@portfolio:~$', 'prompt');
        addCursor();
        return;
    }

    printLine(`konstantin@portfolio:~$ ${cmd}`, 'prompt');

    // All commands work from anywhere
    switch (cmd) {
        case '1':
        case 'contact':
            await showContact();
            break;
        case '2':
        case 'experience':
            await showExperience();
            break;
        case '3':
        case 'volunteer':
        case 'volunteering':
            await showVolunteering();
            break;
        case '4':
        case 'education':
            await showEducation();
            break;
        case '5':
        case 'languages':
            await showLanguages();
            break;
        case '0':
        case 'clear':
            await clearTerminal();
            break;
        case 'exit':
        case 'quit':
            closeTerminal();
            break;
        case 'help':
        case 'menu':
        case './menu.sh':
            await showMainMenu();
            break;
        default:
            printLine(`bash: ${cmd}: command not found`, 'dim');
            printLine('Type "help" for available commands.', 'dim');
            printLine('', '');
            addCursor();
    }
}

function printLine(text, className = '') {
    const lineEl = document.createElement('div');
    lineEl.className = `terminal-line ${className}`;
    lineEl.textContent = text;
    terminalOutput.appendChild(lineEl);
    scrollToBottom();
}
