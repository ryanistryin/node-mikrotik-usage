# node-mikrotik-usage

This is a simple application that uses the Mikrotik API to monitor data usage and send it to InfluxDB for storage

The logic is as follows

- Find the interface with the IP `192.168.88.1/24` and start a `torch` on it
- Monitor the `ip dhcp-server leases` for IP Address to MAC Address Bindings
- Monitor the `interface wireless registration-table` For WIFI info

Aggregate that information and send it off to InfluxDB

# Installation

- Clone the Repo
- Install and configure Influxdb
- Get token from Influx and add it to the app.js file
- Start the app (`node app.js`)

Send `HTTP POST` request to localhost:3000 with the following parameters `{host, user, password, user_id}`

The concept is that a `user_id` is passed through, this should be the identifier of this user on your system (billing system or whatever you are using - so that you can reference this information later back into your app)
