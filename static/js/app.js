document.addEventListener('DOMContentLoaded', () => {
    // Load Monaco Editor
    require.config({
        paths: {
            'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs'
        }
    });

    require(['vs/editor/editor.main'], function() {
        window.editor = monaco.editor.create(document.getElementById('editor'), {
            value: '',
            language: 'plaintext',
            theme: 'vs-dark'
        });

        window.editor.onDidChangeModelContent(() => {
            isContentSaved = false;
        });
    });

    loadFiles();

    const openFileButton = document.getElementById('openFileButton');
    const createDirectoryButton = document.getElementById('createDirectoryButton');
    const createFileButton = document.getElementById('createFileButton');
    const deleteFileButton = document.getElementById('deleteFileButton');
    const languageDropdown = document.getElementById('languageDropdown');
    const runCodeButton = document.getElementById('runCodeButton');

    if (openFileButton) {
        openFileButton.addEventListener('click', toggleFilePane);
    }
    if (createDirectoryButton) {
        createDirectoryButton.addEventListener('click', createDirectory);
    }
    if (createFileButton) {
        createFileButton.addEventListener('click', createNewFile);
    }
    if (deleteFileButton) {
        deleteFileButton.addEventListener('click', deleteFile);
    }
    if (languageDropdown) {
        languageDropdown.addEventListener('change', changeLanguage);
    }
    if (runCodeButton) {
        runCodeButton.addEventListener('click', runCode);
    }

    // Start the Flask server if this component is loaded in the main webapp
    startFlaskServer();
});

function startFlaskServer() {
    fetch('/start-flask', {
        method: 'POST'
    })
    .then(response => {
        if (response.ok) {
            console.log('Flask server started successfully.');
        } else {
            console.error('Failed to start Flask server.');
        }
    })
    .catch(error => console.error('Error starting Flask server:', error));
}

let currentFilename = '';
let isContentSaved = true;
let currentDirectory = '';
let language = 'plaintext'

function loadFiles(directory = '') {
    fetch(`/api/files?directory=${encodeURIComponent(directory)}`)
        .then(response => response.json())
        .then(files => {
            const filesList = document.getElementById('files');
            if (filesList) {
                filesList.innerHTML = '';
                if (directory) {
                    const li = document.createElement('li');
                    li.textContent = '..';
                    li.onclick = () => {
                        const parentDirectory = directory.split('/').slice(0, -1).join('/');
                        loadFiles(parentDirectory);
                        currentDirectory = parentDirectory;
                    };
                    li.classList.add('directory');
                    filesList.appendChild(li);
                }
                files.forEach(item => {
                    const li = document.createElement('li');
                    if (item.type === 'directory') {
                        li.textContent = `[+] ${item.name}`;
                        li.onclick = () => {
                            li.classList.toggle('expanded');
                            if (li.classList.contains('expanded')) {
                                loadFiles(item.path);
                            } else {
                                loadFiles(directory);
                            }
                        };
                        li.classList.add('directory');
                    } else {
                        li.textContent = item.name;
                        li.onclick = () => switchFile(item.path);
                        li.classList.add('file');
                    }
                    filesList.appendChild(li);
                });
            }
        })
        .catch(error => console.error('Error loading files:', error));
}

function switchFile(filename) {
    if (!isContentSaved) {
        const userChoice = confirm('You have unsaved changes. Do you want to save them before switching files?');
        if (userChoice) {
            saveFile(currentFilename, () => {
                openFile(filename);
            });
        } else {
            openFile(filename);
        }
    } else {
        openFile(filename);
    }
}

function openFile(filename) {
    if (!filename) {
        console.error('Filename is undefined');
        return;
    }
    fetch(`/api/files/${encodeURIComponent(filename)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to open file: ${response.statusText}`);
            }
            return response.text();
        })
        .then(content => {
            currentFilename = filename;
            document.getElementById('filename').value = filename;
            window.editor.setValue(content);
            isContentSaved = true;
            toggleFilePane(); // Close the file pane after selecting a file

            // Determine language based on file extension
            let language = 'plaintext';
            const extension = filename.split('.').pop().toLowerCase();
            switch (extension) {
                case 'gcode':
                case 'nc':
                    language = 'plaintext'; // G-code isn't directly supported, use plaintext
                    break;
                case 'py':
                    language = 'python';
                    break;
                case 'sbp':
                    language = 'plaintext'; // OpenSBP isn't directly supported, use plaintext
                    break;
                default:
                    language = 'plaintext';
            }
            monaco.editor.setModelLanguage(window.editor.getModel(), language);
        })
        .catch(error => console.error('Error opening file:', error));
}

function saveFile() {
    if (!currentFilename) {
        alert('No file selected to save.');
        return;
    }
    const content = window.editor.getValue();
    fetch(`/api/files/${encodeURIComponent(currentFilename)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: content
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        isContentSaved = true;
        loadFiles(currentDirectory);
    })
    .catch(error => console.error('Error saving file:', error));
}

function changeLanguage() {
    const languageDropdown = document.getElementById('languageDropdown');
    const selectedLanguage = languageDropdown.value;

    let monacoLanguage;
    switch (selectedLanguage) {
        case 'python':
            monacoLanguage = 'python';
            break;
        case 'gcode':
        case 'opensbp':
            monacoLanguage = 'plaintext'; // G-code and OpenSBP are not supported, use plaintext as fallback
            break;
        default:
            monacoLanguage = 'plaintext';
    }

    if (window.editor) {
        monaco.editor.setModelLanguage(window.editor.getModel(), monacoLanguage);
    }
}

function createNewFile() {
    const filename = prompt('Enter the new filename:');
    if (filename) {
        window.editor.setValue('');
        document.getElementById('filename').value = filename;
        currentFilename = filename;
        isContentSaved = false;
    }
}

function deleteFile() {
    if (!currentFilename) {
        alert('No file selected to delete.');
        return;
    }
    if (confirm(`Are you sure you want to delete ${currentFilename}?`)) {
        fetch(`/api/files/${encodeURIComponent(currentFilename)}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            window.editor.setValue('');
            document.getElementById('filename').value = '';
            currentFilename = '';
            isContentSaved = true;
            loadFiles(currentDirectory);
        })
        .catch(error => console.error('Error deleting file:', error));
    }
}

function createDirectory() {
    const directoryName = prompt('Enter the new directory name:');
    if (directoryName) {
        fetch(`/api/directories/${encodeURIComponent(directoryName)}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                loadFiles(currentDirectory);
            } else {
                console.error('Failed to create directory:', data.message);
            }
        })
        .catch(error => console.error('Error creating directory:', error));
    }
}

function toggleFilePane() {
    const filePane = document.getElementById('filePane');
    if (filePane) {
        filePane.style.display = filePane.style.display === 'block' ? 'none' : 'block';
    }
}

// JavaScript to make the file selector a pop-out system
const openFileSelectorButton = document.getElementById('openFileSelectorButton');
const closeFileSelectorButton = document.getElementById('closeFileSelectorButton');

if (openFileSelectorButton) {
    openFileSelectorButton.addEventListener('click', function() {
        const fileSelectorPopup = document.getElementById('fileSelectorPopup');
        if (fileSelectorPopup) {
            fileSelectorPopup.style.display = 'block';
        }
    });
}

if (closeFileSelectorButton) {
    closeFileSelectorButton.addEventListener('click', function() {
        const fileSelectorPopup = document.getElementById('fileSelectorPopup');
        if (fileSelectorPopup) {
            fileSelectorPopup.style.display = 'none';
        }
    });
}

// Function to run the code in the editor
function runCode() {
    const language = window.editor.getModel();
    const code = window.editor.getValue();

    switch (languageDropdown.value) {
        case 'python':
            runPythonCode(code);
            break;
        case 'plaintext':
            alert('Cannot run plaintext files. Please select a supported language.');
            break;
        default:
            alert('Running code is not supported for the selected language.');
    }
}

function runPythonCode(code) {
    fetch('/api/run-python', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Output: ${data.output}`);
        } else {
            console.error('Failed to run Python code:', data.error);
        }
    })
    .catch(error => console.error('Error running Python code:', error));
}
