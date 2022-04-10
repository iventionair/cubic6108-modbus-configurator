// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {SerialPort, InterByteTimeoutParser} = require('serialport')

// list of serial ports
let portsArray = [];

let serialPortForm = document.getElementById("SerialPort");

// array compare function
function compareArrays(array1, array2) {
    if (array1.length === array2.length)
        return array1.every((a, index) => a === array2[index])
    else
        return false
}
// serial port list function
async function listSerialPorts() {
    await SerialPort.list().then((ports, err) => {

        let tempPortsArray = [];

        if (err) {
            document.getElementById('error').textContent = err.message
            return
        } else {
            document.getElementById('error').textContent = ''
        }

        if (ports.length === 0) {
            document.getElementById('error').textContent = 'No ports discovered'
        }

        ports.forEach(async (port) => {
            tempPortsArray.push(port.path)
        });

        if (!compareArrays(tempPortsArray, portsArray)) {

            portsArray = tempPortsArray;

            serialPortForm.innerHTML = '';

            tempPortsArray.forEach(async (port) => {

                let newOption = document.createElement('option');

                newOption.innerText = String(port);
                newOption.setAttribute('value', String(port));

                serialPortForm.appendChild(newOption);

            });

        }

    })
}

function listPorts() {
    listSerialPorts();
    setTimeout(listPorts, 2000);
}

function checkCurrentId() {
    let currentid = document.getElementById('currentId').innerHTML;
    if (currentid === '') {
        document.getElementById('deviceSettings').setAttribute('hidden', 'true');
    } else {
        document.getElementById('deviceSettings').removeAttribute('hidden');
    }
}
// Set a timeout that will check for new serialPorts every 5 seconds.
// This timeout reschedules itself.
setTimeout(listPorts, 2000);

listSerialPorts()

function decToHex(num){
    if (num.toString(16).length === 1) {
        return "0" + num.toString(16);
    }else {
        return num.toString(16);
    }
    return
}

function createSerialPort(){
    let port = new SerialPort({
            path: serialPortForm.value,
            baudRate: 9600,
            dataBits: 8,
            parity: 'none',
            stopBits: 1,
            autoOpen: true,
        }
    );
    return port;
}
function createParser(port){
    return port.pipe(new InterByteTimeoutParser({interval: 50}));
}
function errorSerialPort(err){
    if (err) {
        document.getElementById('error').textContent = err.message
        return
    } else {
        document.getElementById('error').textContent = ''
    }
}
// get data
function getId() {
    let port = createSerialPort();
    let parser = createParser(port);
    parser.on('data', (data) => {
        console.log(data)
        port.flush();
        port.close()
        document.getElementById('currentId').innerHTML = data[3];
        getWifiSSID()
    });
    port.write(Buffer.from([0x11, 0x02, 0xAC, 0xFF, 0x42]), function (err) {
        errorSerialPort(err)
        console.log('message written')
    });
}
function getWifiSSID() {
    let port = createSerialPort();
    let parser = createParser(port);
    parser.on('data', (data) => {
        console.log(data.toString())
        port.flush();
        port.close()
        document.getElementById('ValueWifiSSID').innerHTML = data.toString().replace('+ok=','');
        getWifiPassword();
    });
    port.write("XFAT+WSSSID\r\n", function (err) {
        errorSerialPort(err)
        console.log('message written')
    });
}

function getWifiPassword() {
    let port = createSerialPort();
    let parser = createParser(port);
    parser.on('data', (data) => {
        console.log(data.toString())
        port.flush();
        port.close()
        document.getElementById('ValueWifiPASSWD').innerHTML = data.toString().replace('+ok=','');
        getServer()
    });
    port.write("XFAT+WSKEY\r\n", function (err) {
        errorSerialPort(err)
        console.log('message written')
    });
}

function getServer() {
    let port = createSerialPort();
    let parser = createParser(port);
    parser.on('data', (data) => {
        console.log(data.toString())
        port.flush();
        port.close();
        document.getElementById('ValueServer').innerHTML = data.toString().replace('+ok=','');
        getSensorData();
    });
    port.write("XFAT+NETP\r\n", function (err) {
        errorSerialPort(err)
        console.log('message written')
    });
}

function getSensorData() {
    let port = createSerialPort();
    let parser = createParser(port);
    let currentId = parseInt(document.getElementById('currentId').innerHTML);
    parser.on('data', (data) => {
        console.log(data)
        port.flush();
        port.close();
        document.getElementById('ValuePM10').innerHTML = ((data[3] << 8 | data[4]));
        document.getElementById('ValuePM25').innerHTML = ((data[5] << 8 | data[6]));
        document.getElementById('ValuePM1').innerHTML = ((data[7] << 8 | data[8]));
        document.getElementById('ValueCO2').innerHTML = ((data[9] << 8 | data[10]));
        document.getElementById('ValueHUM').innerHTML = ((data[15] << 8 | data[16])) / 10;
        document.getElementById('ValueTEMP').innerHTML = ((data[13] << 8 | data[14])) / 10;
        document.getElementById('ValueTVOC').innerHTML = data[12];
        checkCurrentId()
    });
    port.write(Buffer.from(crc16(decToHex(currentId) + "04000A0007"), 'hex'), function (err) {
        errorSerialPort(err)
        console.log('message written')
    });
}

// set data
function setId() {
    console.log("setId");
    let currentId = parseInt(document.getElementById('currentId').innerHTML);
    let id = parseInt(document.getElementById('newId').value);
    if (id >= 0 && id <= 255) {
        let port = createSerialPort();
        let parser = createParser(port);
        parser.on('data', (data) => {
            console.log(data.toString())
            port.flush();
            port.close();
            getId();
        });
        let hexcommand = decToHex(currentId) + "06001100" + decToHex(id);
        let cr16hexcommand = crc16(hexcommand);
        let buffercr16hexcommand = Buffer.from(cr16hexcommand, 'hex');
        console.log(hexcommand);
        console.log("");
        console.log(cr16hexcommand);
        console.log("");
        console.log(buffercr16hexcommand);
        port.write(buffercr16hexcommand, function (err) {
            errorSerialPort(err)
            console.log('message written')
        });
    } else {
        document.getElementById('error').textContent = 'Please enter a new ID'
        return
    }
}

function setServer() {
    let port = createSerialPort();
    let parser = createParser(port);
    let serverPort = document.getElementById('serverPort').value;
    let serverIP = document.getElementById('serverIp').value
    parser.on('data', (data) => {
        console.log(data.toString())
        port.flush();
        port.close()
        getId()
    });
    port.write("XFAT+NETP=TCP,CLIENT," + serverPort + "," + serverIP + "\r\n", function (err) {
        errorSerialPort(err)
        console.log('message written')
    });
}

function setWifiSSID() {
    let port = createSerialPort();
    let parser = createParser(port);
    let wifiSSID = document.getElementById('wifiSSID').value;
    parser.on('data', (data) => {
        console.log(data.toString())
        port.flush();
        port.close()
        setWifiPassword();
    });
    port.write("XFAT+WSSSID=" + wifiSSID + "\r\n", function (err) {
        errorSerialPort(err)
        console.log('message written')
    });
}
function setWifiPassword() {
    let port = createSerialPort();
    let parser = createParser(port);
    let wifiPassword = document.getElementById('wifiPassword').value
    parser.on('data', (data) => {
        console.log(data.toString())
        port.flush();
        port.close()
        getId();
    });
    port.write("XFAT+WSKEY=WPA2PSK,AES," + wifiPassword + "\r\n", function (err) {
        errorSerialPort(err)
        console.log('message written')
    });
}

function crc16(data) {
    var CRCMaster = {
        StringToCheck: "",
        CleanedString: "",
        CRCTableDNP: [],
        init: function() {
            this.CRCDNPInit();
        },
        CleanString: function(inputType) {
            if (inputType == "ASCII") {
                this.CleanedString = this.StringToCheck;
            } else {
                if (this.StringToCheck.match(/^[0-9A-F \t]+$/gi) !== null) {
                    this.CleanedString = this._hexStringToString(this.StringToCheck.toUpperCase().replace(/[\t ]/g, ''));
                } else {
                    window.alert("String doesn't seem to be a valid Hex input.");
                    return false;
                }
            }
            return true;
        },
        CRCDNPInit: function() {
            var i, j, crc, c;
            for (i = 0; i < 256; i++) {
                crc = 0;
                c = i;
                for (j = 0; j < 8; j++) {
                    if ((crc ^ c) & 0x0001) crc = (crc >> 1) ^ 0xA6BC;
                    else crc = crc >> 1;
                    c = c >> 1;
                }
                this.CRCTableDNP[i] = crc;
            }
        },
        CRC16Modbus: function() {
            var crc = 0xFFFF;
            var str = this.CleanedString;
            for (var pos = 0; pos < str.length; pos++) {
                crc ^= str.charCodeAt(pos);
                for (var i = 8; i !== 0; i--) {
                    if ((crc & 0x0001) !== 0) {
                        crc >>= 1;
                        crc ^= 0xA001;
                    } else
                        crc >>= 1;
                }
            }
            return crc;
        },
        _stringToBytes: function(str) {
            var ch, st, re = [];
            for (var i = 0; i < str.length; i++) {
                ch = str.charCodeAt(i); // get char
                st = []; // set up "stack"
                do {
                    st.push(ch & 0xFF); // push byte to stack
                    ch = ch >> 8; // shift value down by 1 byte
                }
                while (ch);
                // add stack contents to result
                // done because chars have "wrong" endianness
                re = re.concat(st.reverse());
            }
            // return an array of bytes
            return re;
        },
        _hexStringToString: function(inputstr) {
            var hex = inputstr.toString(); //force conversion
            var str = '';
            for (var i = 0; i < hex.length; i += 2)
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            return str;
        },
        Calculate: function(str, inputType) {
            this.StringToCheck = str;
            if (this.CleanString(inputType)) {
                crcinputcrc16modbus=this.CRC16Modbus().toString(16).toUpperCase().padStart(4,"0");
                crcinputcrc16modbus=crcinputcrc16modbus.substr(2) + crcinputcrc16modbus.substr(0, 2); //swap bytes
            }
        }
    };
    CRCMaster.init();
    var inputType = "HEX";
    var crcinputcrc16modbus;
    var crcinput = data;
    CRCMaster.Calculate(crcinput, inputType);
    var check = crcinput + crcinputcrc16modbus;
    return check;
}
