import { app, BrowserWindow } from 'electron';

function createWindow() {
    const win = new BrowserWindow({});

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});
