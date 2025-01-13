let configs = [];

// Function to decode Base64
function decodeBase64(str) {
    try {
        return decodeURIComponent(atob(str).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        return null;
    }
}

// Function to validate config links
function isValidConfigLink(link) {
    try {
        const url = new URL(link);
        return url.protocol === 'vless:' || url.protocol === 'vmess:';
    } catch (e) {
        return false;
    }
}

// Function to parse multiple vless:// or vmess:// links
function parseConfigs() {
    const configInput = document.getElementById('configInput').value.trim();
    const configLines = configInput.split('\n').filter(line => line.trim() !== '');
    configs = [];

    configLines.forEach((line, index) => {
        try {
            if (!isValidConfigLink(line)) {
                throw new Error('Invalid link format!');
            }

            if (line.startsWith('vmess://')) {
                // Handle vmess:// links (Base64 encoded)
                const decodedConfig = decodeBase64(line.replace('vmess://', ''));
                if (!decodedConfig) {
                    throw new Error('Failed to decode vmess link!');
                }

                // Parse JSON and validate required fields
                let config;
                try {
                    config = JSON.parse(decodedConfig);
                } catch (e) {
                    throw new Error('Invalid JSON in vmess link!');
                }

                if (!config.id || !config.add || !config.port) {
                    throw new Error('Invalid vmess config: Missing required fields (id, add, port)!');
                }

                configs.push({
                    id: index + 1,
                    protocol: 'vmess',
                    uuid: config.id,
                    address: config.add,
                    port: config.port,
                    params: {
                        type: config.net || '',
                        path: config.path || '',
                        security: config.tls === 'tls' ? 'tls' : 'none',
                        encryption: 'auto',
                        alpn: config.alpn || '',
                        host: config.host || '',
                        sni: config.sni || '',
                        fp: config.fp || ''
                    },
                    name: config.ps || 'Unnamed',
                    createdAt: new Date().toLocaleString(),
                    updatedAt: new Date().toLocaleString()
                });
            } else if (line.startsWith('vless://')) {
                // Handle vless:// links
                const url = new URL(line);
                configs.push({
                    id: index + 1,
                    protocol: 'vless',
                    uuid: url.username,
                    address: url.hostname,
                    port: url.port,
                    params: {
                        type: url.searchParams.get('type') || '',
                        path: url.searchParams.get('path') || '',
                        security: url.searchParams.get('security') || 'none',
                        encryption: url.searchParams.get('encryption') || 'none',
                        alpn: url.searchParams.get('alpn') || '',
                        host: url.searchParams.get('host') || '',
                        sni: url.searchParams.get('sni') || '',
                        fp: url.searchParams.get('fp') || ''
                    },
                    name: decodeURIComponent(url.hash.slice(1)) || 'Unnamed',
                    createdAt: new Date().toLocaleString(),
                    updatedAt: new Date().toLocaleString()
                });
            }
        } catch (e) {
            alert(`Error parsing link ${index + 1}: ${e.message}`);
            console.error(`Error parsing link ${index + 1}:`, e);
        }
    });

    // Display the list of configs
    displayConfigList(configs);
    // Auto-backup to localStorage
    localStorage.setItem('v2rayConfigsBackup', JSON.stringify(configs));
}

// Function to display the list of configs
function displayConfigList(configs) {
    const configList = document.getElementById('configList');
    configList.innerHTML = '';

    configs.forEach((config, index) => {
        const configItem = document.createElement('div');
        configItem.className = 'config-item';

        // Config header (clickable)
        const configHeader = document.createElement('div');
        configHeader.className = 'config-header';
        configHeader.innerHTML = `
            <h3>Config #${config.id}: ${config.name || 'Unnamed'}</h3>
            <button onclick="deleteConfig(${index}, event)">Delete</button>
        `;
        configHeader.addEventListener('click', (event) => toggleConfig(index, event));

        // Config content (collapsed by default)
        const configContent = document.createElement('div');
        configContent.className = 'config-content';
        configContent.innerHTML = `
            <div class="config-details">
                <p>
                    <label for="configName${index}">Config Name:</label>
                    <input type="text" id="configName${index}" value="${config.name || ''}">
                </p>
                <p>
                    <label for="configProtocol${index}">Protocol:</label>
                    <input type="text" id="configProtocol${index}" value="${config.protocol}">
                </p>
                <p>
                    <label for="configUuid${index}">UUID:</label>
                    <input type="text" id="configUuid${index}" value="${config.uuid}">
                </p>
                <p>
                    <label for="configAddress${index}">Server Address:</label>
                    <input type="text" id="configAddress${index}" value="${config.address}">
                </p>
                <p>
                    <label for="configPort${index}">Port:</label>
                    <input type="number" id="configPort${index}" value="${config.port}">
                </p>
                <p>
                    <label for="configType${index}">Connection Type:</label>
                    <input type="text" id="configType${index}" value="${config.params.type || ''}">
                </p>
                <p>
                    <label for="configPath${index}">Path:</label>
                    <input type="text" id="configPath${index}" value="${config.params.path || ''}">
                </p>
                <p>
                    <label for="configSecurity${index}">Security:</label>
                    <input type="text" id="configSecurity${index}" value="${config.params.security || ''}">
                </p>
                <p>
                    <label for="configEncryption${index}">Encryption:</label>
                    <input type="text" id="configEncryption${index}" value="${config.params.encryption || ''}">
                </p>
                <p>
                    <label for="configAlpn${index}">ALPN:</label>
                    <input type="text" id="configAlpn${index}" value="${config.params.alpn || ''}">
                </p>
                <p>
                    <label for="configHost${index}">Host:</label>
                    <input type="text" id="configHost${index}" value="${config.params.host || ''}">
                </p>
                <p>
                    <label for="configSni${index}">SNI:</label>
                    <input type="text" id="configSni${index}" value="${config.params.sni || ''}">
                </p>
                <p>
                    <label for="configFp${index}">Fingerprint:</label>
                    <input type="text" id="configFp${index}" value="${config.params.fp || ''}">
                </p>
                <p>Created At: ${config.createdAt}</p>
                <p>Last Updated: ${config.updatedAt}</p>
            </div>
            <button class="btn btn-primary" onclick="saveConfig(${index})">Save & Generate Link</button>
            <button class="btn btn-primary" onclick="showQRCode('${generateLink(config)}')">Show QR Code</button>
        `;

        // Add header and content to the config item
        configItem.appendChild(configHeader);
        configItem.appendChild(configContent);
        configList.appendChild(configItem);
    });
}

// Function to generate a new link
function generateLink(config) {
    const url = new URL(`${config.protocol}://${config.uuid}@${config.address}:${config.port}`);
    for (const [key, value] of Object.entries(config.params)) {
        if (value) {
            url.searchParams.set(key, value);
        }
    }
    url.hash = encodeURIComponent(config.name);
    return url.toString();
}

// Function to save config and copy link
function saveConfig(index) {
    const config = configs[index];
    config.name = document.getElementById(`configName${index}`).value;
    config.protocol = document.getElementById(`configProtocol${index}`).value;
    config.uuid = document.getElementById(`configUuid${index}`).value;
    config.address = document.getElementById(`configAddress${index}`).value;
    config.port = document.getElementById(`configPort${index}`).value;
    config.params.type = document.getElementById(`configType${index}`).value;
    config.params.path = document.getElementById(`configPath${index}`).value;
    config.params.security = document.getElementById(`configSecurity${index}`).value;
    config.params.encryption = document.getElementById(`configEncryption${index}`).value;
    config.params.alpn = document.getElementById(`configAlpn${index}`).value;
    config.params.host = document.getElementById(`configHost${index}`).value;
    config.params.sni = document.getElementById(`configSni${index}`).value;
    config.params.fp = document.getElementById(`configFp${index}`).value;
    config.updatedAt = new Date().toLocaleString();

    const newLink = generateLink(config);
    copyToClipboard(newLink);

    const alert = document.getElementById('alert');
    alert.textContent = 'Link copied to clipboard!';
    alert.classList.add('show');

    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);

    // Auto-backup to localStorage
    localStorage.setItem('v2rayConfigsBackup', JSON.stringify(configs));
}

// Function to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Link copied to clipboard!');
    }).catch(() => {
        console.log('Failed to copy link.');
    });
}

// Function to delete a config
function deleteConfig(index, event) {
    event.stopPropagation(); // Prevent event bubbling
    configs.splice(index, 1); // Remove config from the array
    displayConfigList(configs); // Refresh the config list
    document.getElementById('qrcode').innerHTML = ''; // Clear QR Code
    // Auto-backup to localStorage
    localStorage.setItem('v2rayConfigsBackup', JSON.stringify(configs));
}

// Function to toggle config content
function toggleConfig(index, event) {
    if (event && event.target.closest('button')) return; // Prevent toggling if clicking on a button
    const configContent = document.querySelectorAll('.config-content')[index];
    configContent.classList.toggle('open');
}

// Function to filter configs
function filterConfigs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredConfigs = configs.filter(config =>
        config.name.toLowerCase().includes(searchTerm) ||
        config.address.toLowerCase().includes(searchTerm) ||
        config.protocol.toLowerCase().includes(searchTerm) ||
        config.uuid.toLowerCase().includes(searchTerm)
    );
    displayConfigList(filteredConfigs);
}

// Function to sort configs
function sortConfigs() {
    const sortBy = document.getElementById('sortSelect').value;
    if (sortBy === 'port') {
        configs.sort((a, b) => a[sortBy] - b[sortBy]);
    } else {
        configs.sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
    }
    displayConfigList(configs);
}

// Function to export configs as JSON
function exportConfigs() {
    const data = JSON.stringify(configs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'v2ray-configs.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Function to import configs from JSON
function importConfigs() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            configs = JSON.parse(event.target.result);
            displayConfigList(configs);
            // Auto-backup to localStorage
            localStorage.setItem('v2rayConfigsBackup', JSON.stringify(configs));
        };
        reader.readAsText(file);
    };
    fileInput.click();
}

// Function to show QR Code
function showQRCode(url) {
    if (typeof QRCode === 'undefined') {
        alert('QRCode library is not loaded!');
        return;
    }
    document.getElementById('qrcode').innerHTML = '';
    new QRCode(document.getElementById('qrcode'), {
        text: url,
        width: 128,
        height: 128
    });
}

// Function to toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Drag & Drop functionality
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('configInput').value = event.target.result;
    };
    reader.readAsText(file);
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#e9f5ff';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.backgroundColor = '#fff';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#fff';
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('configInput').value = event.target.result;
    };
    reader.readAsText(file);
});

// Load settings from localStorage on page load
function loadSettings() {
    const configs = localStorage.getItem('v2rayConfigsBackup');
    if (configs) {
        document.getElementById('configInput').value = configs;
        alert('Settings loaded!');
    } else {
        alert('No settings found.');
    }
}

// Event listeners
document.getElementById('parseConfigsBtn').addEventListener('click', parseConfigs);
document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
document.getElementById('loadSettingsBtn').addEventListener('click', loadSettings);
document.getElementById('exportConfigsBtn').addEventListener('click', exportConfigs);
document.getElementById('importConfigsBtn').addEventListener('click', importConfigs);
document.getElementById('toggleDarkModeBtn').addEventListener('click', toggleDarkMode);
document.getElementById('searchInput').addEventListener('input', filterConfigs);
document.getElementById('sortSelect').addEventListener('change', sortConfigs);
