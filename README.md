# node-mikrotik-usage

This is a simple application that uses the Mikrotik API to monitor data usage and send it to InfluxDB for storage

The logic is as follows

- Find the interface with the IP `192.168.88.1/24` and start a `torch` on it
- Monitor the `ip dhcp-server leases` for IP Address to MAC Address Bindings
- Monitor the `interface wireless registration-table` For WIFI info

Aggregate that information and send it off to InfluxDB

# Installation

- Clone the Repo `git clone https://github.com/ryanistryin/node-mikrotik-usage.git MTUsage`
- Install Influxdb `docker run -p 8086:8086 -v influxdb2:/var/lib/influxdb influxdb:2.0`
- Configure InfluxDB and get your token
  * Login to influx and go to Data>Buckets
  * Create a new bucket (make sure to give it a retention time!), take note of the bucket name
  * Click Tokens, Generate Read/Write Token, Select your bucket on both sides
  * Take node of your organisation id (look at the url)
    
- Edit app.js, add your `token` inside `token` constant and `bucket` in `bucket` constant  and `organisation id` in the constant `org`
- install dependencies `npm install`
- Start the app (`node app.js`)


The concept is that a `user_id` is passed through, this should be the identifier of this user on your system (billing system or whatever you are using - so that you can reference this information later back into your app). You should hook this up to your authentication server, after your user has successfully authenticated, you can send the user information to this program and monitoring will start. If the user disconnects, send the stop request so that that monitoring stops


Start Monitoring

Send `HTTP POST` request to `localhost:3000/start` with the following parameters `{host:, user, password, user_id}`


Stop Monitoring

Send `HTTP POST` request to `localhost:3000/remove` with the following parameters `{user_id}`
