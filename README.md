# advanced-json-path
Inspired by Stefan Goessner's JSONPath http://goessner.net/articles/JsonPath/ with some enhancements

## Installation

First install node.js on your computer.

Then use the following command in command prompt:
	
	npm install advanced-json-path

## Usage

```javascript
var JSONPath = require('advanced-json-path');
var object = {
    EventURL: "/mod-tc-mk2",
    EventData: {
        Device: "MOD-TC-MK2",
        Status: "OK",
        Data: {
            Temperature: 23.5
        },
        I2C_Address: "0x23"
    }
};

var path = '$..Temperature';
var result = JSONPath(object, path);

console.log(result); // 23.75
```
