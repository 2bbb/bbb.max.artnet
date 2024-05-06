import { dmxnet } from 'dmxnet';
const dmxlib = new dmxnet();
import * as Max from 'max-api';
import * as osc from '@2bit/osc';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// console.log(dmxlib);

const argv = process.argv.slice(2);
// console.log(__dirname);

const packageinfo = JSON.parse(fs.readFileSync(path.join(__dirname, './package.json'), 'utf8'));
Max.post(`${packageinfo.name} v${packageinfo.version}`);

let blackout_values = null;

const default_settings = {
    ip: '127.0.0.1',
    universe: 0,
    subnet: 0,
    net: 0,
    fps: 44,
    address_origin: 0,
};

const settings = await (async () => {
    const loaded_settings = await (async () => {
        return await Max.getDict(argv[0]);
    })();

    const settings = { ... default_settings };
    for(const key in loaded_settings) {
        settings[key] = loaded_settings[key];
    }
    return settings;
})();

const { address_origin } = settings;

console.log(settings);

const sender = dmxlib.newSender({
    log: { level: 'error' },
    base_refresh_interval: 1000.0 / settings.fps,
    ip: settings.ip == 'localhost' ? '127.0.0.1' : settings.ip,
    universe: settings.universe,
    subnet: settings.subnet,
    net: settings.net,
});

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

function validate(v) {
    return 0 ^ Math.max(0.0, Math.min(255.0, v));
}

function setchannel(ch, value) {
    const values = blackout_values ? blackout_values : sender.values;
    values[ch - address_origin] = validate(value);
}

function channel(ch, value) {
    const values = blackout_values ? blackout_values : sender.values;
    values[ch - address_origin] = validate(value);
    sender.transmit();
}

function set(... vs) {
    const validated_values = vs.map(validate).slice(0, 512);
    const values = blackout_values ? blackout_values : sender.values;
    for(let i = 0; i < values.length; ++i) {
        values[i] = validated_values[i];
    }
}

function fill(min, max, value) {
    const validated_value = validate(value);
    const values = blackout_values ? blackout_values : sender.values;
    for(let i = min - address_origin; i <= max - address_origin; ++i) {
        values[i] = validated_value;
    }
}

function blackout(enable) {
    if(enable === undefined || enable) {
        blackout_values = [ ... sender.values ];
        sender.reset();
    } else {
        sender.values = [ ... blackout_values ];
        blackout_values = null;
    }
    sender.transmit();
}

function get_value(channel) {
    const values = blackout_values ? blackout_values : sender.values;
    if(0 <= channel - address_origin && channel - address_origin < 512) {
        outlet('value', channel, values[channel - address_origin]);
    } else {
        Max.post(`invalid channel ${channel}`);
    }
}

function get_values(length) {
    const values = blackout_values ? blackout_values : sender.values;
    if(length && length < 512) {
        outlet('values', ... sender.values.slice(0, 0 ^ length));
    } else {
        outlet('values', ... sender.values);
    }
}

Max.addHandler(Max.MESSAGE_TYPES.BANG, () => sender.transmit());

Max.addHandler("setchannel", setchannel);
Max.addHandler("channel", channel);
Max.addHandler("set", set);
Max.addHandler("fill", fill);
Max.addHandler("blackout", blackout);
Max.addHandler("get_value", get_value);
Max.addHandler("get_values", get_values);

const osc_server = (() => {
    if(settings.osc_in != null) {
        const server = new osc.Server(settings.osc_in);

        server.on('/setchannel', (channel, value) => {
            setchannel(channel, value);
        });
        server.on('/channel', (channel, value) => {
            channel(channel, value);
        });
        server.on('/set', (packet) => {
            set(... packet);
        });
        server.on('/fill', (min, max, value) => {
            fill(min, max, value);
        });
        server.on('/blackout', enable => {
            blackout(enable);
        });
        server.on('/get_value', (channel) => {
            get_value(channel);
        });
        server.on('/get_values', (length) => {
            get_values(length);
        });

        Max.post(`osc server create with 0.0.0.0:${settings.osc_in}`);
        
        return server;
    }
    return null;
})();
