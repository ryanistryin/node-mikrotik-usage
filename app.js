const RouterOSClient = require('routeros-client').RouterOSClient;
const express = require('express');
const bodyParser = require('body-parser');

const { InfluxDB, Point } = require("@influxdata/influxdb-client");
// You can generate a Token from the "Tokens Tab" in the UI
const token =
    "INFLUX_TOKEN";
const org = "ORGANISATION_ID";
const bucket = "BUCKET_NAME";
const influx_client = new InfluxDB({
    url: "http://localhost:8086",
    token: token
});




// const def_host = '192.168.88.1'
const def_user = 'admin'
const def_password = 'password'
// const def_user_id = 123


var connections = []

getIdentity = async function (conn) {
    // console.log('starting to monitor this', conn)
    // console.log('currently monitred hosts', connections)
    var hosts = {}

    const sendData = function (user_id, input, torch) {

        //dont send "0" data. 
        if (torch.rx == 0 || torch.tx == 0) {
            return false
        }

        //if we don't have our required data, dont send. The below are required
        if (!input['address'] || !input['activeMacAddress'] || !input['hostName']) {
            console.log('missing data')
            return false
        }

        const writeApi = influx_client.getWriteApi(org, bucket);

        let data = "data,user_id=" + user_id

        //mostly static info
        if (input['address']) {
            data += ",address=" + input['address']
        }
        if (input['hostName']) {
            data += ',hostName="' + input['hostName'] + '"'
        }
        if (input['activeMacAddress']) {
            data += ",activeMacAddress=" + input['activeMacAddress']
        }
        if (input['wifi']) {
            data += ",wifi=" + input['wifi']
        }
        if (input['interface']) {
            data += ",interface=" + input['interface']
        }
        if (input['encryption']) {
            data += ",encryption=" + input['encryption']
        }
        if (input['authenticationType']) {
            data += ",authenticationType=" + input['authenticationType']
        }

        data += " rx=" + torch.rx + ",tx=" + torch.tx
        console.log(data)
        writeApi.writeRecord(data);
        writeApi.close()
            // .then(() => {
            // //   console.log("FINISHED");
            // })
            .catch(e => {
                console.error(e);
                console.log("\nFinished ERROR");
            });
        //   console.log("data written for : " + device.user_id);

    }



    const api = new RouterOSClient({
        host: conn.host,
        user: conn.user,
        password: conn.password
    });
    try {
        const client = await api.connect()
        connections[conn.user_id] = true
        // console.log('getting interface to watch')
        const addressMenu = client.menu("/ip address");
        var addresses = await addressMenu.where("address", "192.168.88.1/24").get()
        // console.log(addresses)
        const interface = addresses[0].interface

        // //start torch
        // console.log('starting torch')
        client.menu("/tool torch").where({
            interface: interface,
            srcAddress: "0.0.0.0/0"
        })
            .stream((err, data, stream) => {
                if (err) {
                    // console.log('got an error from stream', err)
                    console.log("error getting torchinformation!", err)
                    return err; // got an error while trying to stream
                }

                // console.log('data from the stream itself!', data); // the data from the stream itself
                if (data.length > 0) {
                    data.forEach(async d => {
                        if (hosts[d.srcAddress]) {
                            // console.log('sending', hosts[d.srcAddress])
                            sendData(conn.user_id, hosts[d.srcAddress], d)
                        }
                        // console.log(d)
                    });
                }
                // console.log('debugging shutting down!')
                // console.log('connections', connections)
                // console.log('user_id', conn.user_id)
                if (connections[conn.user_id] != undefined && connections[conn.user_id] == false) {
                    console.log('closing connection for this user_id: ' + conn.user_id)
                    api.disconnect()
                    delete connections[conn.user_id]
                }

            });

        //stream the dhcp-server leases
        const ip_address = client.menu("/ip dhcp-server lease");
        ip_address
            .query({ interval: 2 })
            .stream("print", (err, data) => {
                if (err) {
                    // Error trying to stream
                    console.log("error getting IP information", err);
                    return;
                } else {
                    for (let index = 0; index < data.length; index++) {
                        const element = data[index];
                        if (!hosts[element.address]) {
                            hosts[element.address] = {}
                        }
                        hosts[element.address].hostName = element.hostName
                        hosts[element.address].activeMacAddress = element.activeMacAddress
                        hosts[element.address].address = element.address
                    }
                }
                if (connections[conn.user_id] && connections[conn.user_id] == false) {
                    console.log('closing connection for this user_id: ' + conn.user_id)
                    api.disconnect()
                    delete connections[conn.user_id]
                }
            });

        // //check wifi clients
        // console.log('starting wifi clients')

        const wifiMenu = client.menu("/interface wireless registration-table");
        wifiMenu.query({ interval: 2 })
            .stream("print", (err, data) => {
                if (err) {
                    console.log("error getting WIFI information", err)
                } else {
                    for (let index = 0; index < data.length; index++) {
                        const element = data[index];
                        // console.log(element)
                        //check if we have data yet from the dhcp binding
                        if (element.lastIp && hosts[element.lastIp]) {
                            hosts[element.lastIp].wifi = true
                            hosts[element.lastIp].uptime = element.uptime
                            hosts[element.lastIp].interface = element.interface
                            hosts[element.lastIp].encryption = element.encryption
                            hosts[element.lastIp].authenticationType = element.authenticationType
                            hosts[element.lastIp].lastActivity = element.lastActivity
                            hosts[element.lastIp].rxRate = element.rxRate
                            hosts[element.lastIp].txRate = element.txRate

                        }

                    }
                }
                if (connections[conn.user_id] && connections[conn.user_id] == false) {
                    console.log('closing connection for this user_id: ' + conn.user_id)
                    api.disconnect()
                    delete connections[conn.user_id]
                }
            })

            api.on('error', (err) => {
                console.log('got some error', err)
            })
    } catch (error) {
        console.log('error connecting to ' + conn.host, error)
    }




}

// getIdentity()

const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.listen(3001);
app.post('/add', function (req, res) {
    const host = req.body.host 
    const user = req.body.user || def_user
    const password = req.body.password || def_password
    const user_id = req.body.user_id 

    if (!host || !user_id) {
        res.sendStatus(401)
    } else {
        res.sendStatus(200);
        getIdentity({ host: host, user: user, password: password, user_id: user_id })
    } 


});

app.post('/remove', function (req, res) {
    
    const user_id = req.body.user_id
    res.sendStatus(200);
    connections[user_id] = false

});

