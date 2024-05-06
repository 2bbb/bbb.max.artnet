# bbb.max.artnet

bbb.max.artnet is a library to use artnet based on node.script

inspired by [imp.dmx](https://www.theimpersonalstereo.com/impdmx) and [pixsper/lxmax](https://github.com/pixsper/lxmax)

this release is alpha version not stable.

## setup

at first, clone repo to `Max N/Library`

```bash
cd /path/to/USER/Max/Library
git clone 
```

after cloned, 

use `install` command of `bbb.artnet.controller` / `bbb.artnet.node`

## dependencies

* [dmxnet](https://github.com/margau/dmxnet)
* [@2bit/osc](https://github.com/2bbb/node-2bit-osc)

## bbb.artnet.controller

artnet controller

### messages

* setchannel CHANNEL VALUE
    * CHANNEL: 0-511
    * VALUE: 0-255
* channel CHANNEL VALUE
    * same as setchannel but send packet immediately
    * CHANNEL: 0-511
    * VALUE: 0-255
* set VALUES ...
    * set VALUES from index 0 to 
    * VALUES: 0-255[1-512]
* fill MIN MAX VALUE
    * set VALUE to range from MIN to MAX
* blackout [ENABLE]
    * ENABLE: optional value if given then enable with truthy value and disable with falsy value, if not given then enable.
* get_value CHANNEL
    * get value of specified CHANNEL as `value CHANNEL 0`
* get_values [LENGTH]
    * LENGTH: length of values want to get, if not given then all values will be output
    * get current values from 1st outlet as `values 0 ... 0`
* **bang**
    * send packet manually
* install
    * need network access to WAN
    * install node_modules

### osc command interface

prepend `/` to above commands

### attributes

* `@ip`
    * IP of listen of artnet node 
    * string
    * default: '127.0.0.1'
* `@port`
    * integer
    * default: 6454
* `@universe`
    * integer
    * default: 0
* `@subnet`
    * integer
    * default: 0
* `@net`
    * integer
    * default: 0
* `@fps`
    * interval of sending packet
    * number
    * default: 44
* `@osc_in`
    * enable osc command interface with given port. if not given then osc command interface will be disabled
    * integer
    * default: undefined
* `@osc_out`
    * enable osc feedback interface with given port. if not given then osc feedback interface will be disabled
    * integer
    * default: undefined
* `@address_origin`
    * integer
    * default: 0
* `@dict`
    * name for dict object describe parameters with attribute keys above without `@`
    * if this attribute is given then, other attributes above will be ignored


## bbb.artnet.node

artnet node

### messages

* get_value NET SUBNET UNIVERSE CHANNEL
    * get value of specified CHANNEL as `value NET SUBNET UNIVERSE CHANNEL 0`
* get_values NET SUBNET UNIVERSE [LENGTH]
    * LENGTH: length of values want to get, if not given then all values will be output
    * get current values from 1st outlet as `values NET SUBNET UNIVERSE 0 ... 0`
* install
    * need network access to WAN
    * install node_modules

### osc command interface

prepend `/` to above commands

### attributes

* `@ip`
    * IP of destination of artnet node 
    * string
    * default: '127.0.0.1'
* `@universe`
    * integer
    * default: 0
* `@subnet`
    * integer
    * default: 0
* `@net`
    * integer
    * default: 0
* `@notify`
    * enable/disable auto output `values` when receive packet
    * boolean or integer[0/1]
    * default : false
* `@osc_in`
    * enable osc command interface with given port. if not given then osc command interface will be disabled
    * integer
    * default: undefined
* `@osc_out`
    * enable osc feedback interface with given port. if not given then osc feedback interface will be disabled
    * integer
    * default: undefined
* `@address_origin`
    * integer
    * default: 0
* `@dict`
    * name for dict object describe parameters with attribute keys above without `@`
    * if this attribute is given then, other attributes above will be ignored
