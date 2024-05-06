import { dmxnet } from 'dmxnet';
import * as Max from 'max-api';
import * as osc from '@2bit/osc';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// console.log(dmxlib);

const argv = process.argv.slice(2);
console.log(__dirname);

let blackout_values = null;

const default_settings = {
    ip: '0.0.0.0',
    port: 6454,
    universe: 0,
    subnet: 0,
    net: 0,
    notify: false,
    address_origin: 0,
    oem: 0x2908,
    esta: 0x0000,
    log: {
        level: 'error'
    },
    short_name: 'bbb.artnet.node',
    long_name: 'bbb.artnet.node - node.script based ArtNet Tranceiver',
};

const settings = await (async () => {
    const loaded_settings = await (async () => {
        return await Max.getDict(argv[0]);
    })();

    const settings = { ... default_settings };
    
    for(const key in loaded_settings) {
        settings[key] = loaded_settings[key];
    }

    if(Array.isArray(settings.ip)) {
        settings.hosts = settings.ip;
    } else {
        settings.hosts = [ settings.ip ];
    }
    if(settings.universes == null) {
        const { universe, subnet, net, notify } = settings;
        settings.universes = [ { universe, subnet, net, notify }];
    }
    return settings;
})();

const { address_origin } = settings;

console.log(settings);

const osc_client = (() => {
    if(settings.osc_out != null) {
        Max.post(`osc client create with 127.0.0.1:${settings.osc_out}`)
        const client = new osc.Client('127.0.0.1', settings.osc_out);

        return client;
    }
    return null;
})();

const outlet = (() => {
    if(osc_client) {
        return (key, ... args) => {
            Max.outlet(key, ... args);
            osc_client.send(`/${key}`, ... args);
        }
    } else {
        return (key, ... args) => {
            Max.outlet(key, ... args);
        }
    }
})();

const dmxlib = new dmxnet({
    hosts: settings.hosts,
    port: settings.port,
    log: settings.log,
    oem: settings.oem,
    esta: settings.esta,
    sName: settings.short_name,
    lName: settings.long_name,
});

const receivers = {};

const create_id = (net, subnet, universe) => (net << 8) | (subnet << 4) | universe;

const create = (net, subnet, universe, notify) => {
    const univ_id = create_id(net, subnet, universe);
    const receiver = dmxlib.newReceiver({
        universe: universe,
        subnet: subnet,
        net: net,
    });
    receivers[univ_id] = receiver;
    if(notify) {
        receiver.on('data', (data) => {
            outlet('values', net, subnet, universe, ... data);
        });
    }
}

for(const univ of settings.universes) {
    create(
        univ.net || 0,
        univ.subnet || 0,
        univ.universe,
        univ.notify == null ? settings.notify : univ.notify);
}

function get_value(net, subnet, univ, channel) {
    const values = receivers[create_id(net, subnet, univ)].values;
    if(0 <= channel - address_origin && channel - address_origin < 512) {
        outlet('value', net, subnet, univ, channel, values[channel - address_origin]);
    } else {
        Max.post(`invalid channel ${channel}`);
    }
}

function get_values(net, subnet, univ, length) {
    const values = receivers[create_id(net, subnet, univ)].values;
    if(length && length < 512) {
        outlet('values', net, subnet, univ, ... values.slice(0, 0 ^ length));
    } else {
        outlet('values', ... values);
    }
}

Max.addHandler(Max.MESSAGE_TYPES.BANG, () => sender.transmit());

Max.addHandler("get_value", get_value);
Max.addHandler("get_values", get_values);

const osc_server = (() => {
    if(settings.osc_in != null) {
        const server = new osc.Server(settings.osc_in);

        server.on('/get_value', (net, subnet, univ, channel) => {
            get_value(net, subnet, univ, channel);
        });
        server.on('/get_values', (net, subnet, univ, length) => {
            get_values(net, subnet, univ, length);
        });

        Max.post(`osc server create with 0.0.0.0:${settings.osc_in}`);
        
        return server;
    }
    return null;
})();
