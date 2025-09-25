const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// --- Version Reading Logic ---

/**
 * Reads the unique tag from the packaged ver.txt file.
 * @returns {string} The current app tag (e.g., "biscuit-dragon").
 */
function getCurrentAppTag() {
    try {
        // Reads ver.txt which should be placed in the app's resource path (next to main.js)
        const filePath = path.join(__dirname, 'ver.txt');
        return fs.readFileSync(filePath, 'utf8').trim();
    } catch (error) {
        console.warn("Could not read ver.txt. Assuming unknown version.", error);
        return "unknown-tag"; 
    }
}

// --- Main Electron Application Functions ---

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        title: 'YikeGame Website',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            sandbox: true,
        }
    });

    // CSS injection to hide the visual scrollbar while keeping scrolling functional
    mainWindow.webContents.on('did-finish-load', () => {
        const scrollbarHideCSS = `
            /* Hide scrollbar for Webkit/Blink (Chrome, Edge, Safari, Opera) */
            ::-webkit-scrollbar {
                width: 0px; /* For vertical scrollbar */
                height: 0px; /* For horizontal scrollbar */
                background: transparent;
            }
            /* Optional: Hide scrollbar for IE/Edge (older) */
            body {
                -ms-overflow-style: none;
            }
            /* Optional: Hide scrollbar for Firefox (not used by Electron, but complete) */
            body {
                scrollbar-width: none;
            }
        `;
        mainWindow.webContents.insertCSS(scrollbarHideCSS);
    });

    // Load your local website's index.html file from the "website" folder.
    mainWindow.loadFile(path.join(__dirname, 'website', 'index.html'));

    // mainWindow.webContents.openDevTools();
};

const createMenu = () => {
    const isMac = process.platform === 'darwin';
    const template = [
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
                { role: 'resetzoom' },
                { role: 'zoomin' },
                { role: 'zoomout' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

// When Electron is ready, create the window and the menu.
app.whenReady().then(() => {
    createWindow();
    createMenu();
    
    // Set up the IPC handler to give the current tag to the renderer process
    ipcMain.handle('get-current-tag', () => {
        return getCurrentAppTag();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

