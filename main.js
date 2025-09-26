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
    // ... (BrowserWindow setup)

    const mainWindow = new BrowserWindow({
        // ... (your existing options)
    });

    // Load your local website
    mainWindow.loadFile(path.join(__dirname, 'website', 'index.html'));

    // 🏆 AGGRESSIVE FOCUS RECOVERY FIX
    // Use the 'focus' event to force focus back to webContents via a deferred call.
    mainWindow.on('focus', () => {
        // This is the CRITICAL line. setImmediate runs after the current
        // queue finishes, ensuring the OS has finished re-focusing the window
        // before we tell the web contents to focus.
        if (mainWindow.webContents) {
            setImmediate(() => {
                mainWindow.webContents.focus();
            });
        }
    });

    // ... (did-finish-load handler for initial CSS/Focus)
    mainWindow.webContents.on('did-finish-load', () => {
        // ... (CSS injection)

        // Ensure the window is fully focused after the content loads
        if (!mainWindow.isFocused()) {
            mainWindow.focus();
        }
        
        // Final safety focus on the web contents
        if (mainWindow.webContents) {
             mainWindow.webContents.focus();
        }
    });

    // ... (rest of the createWindow function)
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

