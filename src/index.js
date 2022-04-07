const {app, BrowserWindow} = require('electron');
const path = require('path');
const {ipcMain} = require('electron');
const {SerialPort, ReadlineParser, SerialPortMock} = require('serialport')

const port = new SerialPort({
        path: "/dev/tty.usbserial-FT5O13M8",
        baudRate: 6900,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: true,
    }
);

port.on('data', function(msgout) {
    console.log(msgout);
});
port.on('closed', function() {
    console.log("not-connected");
});


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true, // to allow require
            contextIsolation: false, // allow use with Electron 12+
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    //form data
    // ipcMain.on('submitForm', function(event, data) {
    //    // Access form data here
    // });

    port.on('ready', function() {
        console.log("connected");
        port.write(Buffer.from([0x11, 0x02, 0xAC, 0xFF, 0x42]), function(err) {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
            console.log('message written');
        });
    });

};




// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
