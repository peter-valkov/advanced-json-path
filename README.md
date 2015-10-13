# advanced-json-path
Inspired by Stefan Goessner's JSONPath http://goessner.net/articles/JsonPath/ with some enhancements

## Installation

First install node.js on your computer.

Then use the following command in command prompt:
	
	npm install advanced-json-path

## Quick Statrt Usage

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

## JSONPath Expressions Basics

Expression | Meaning
-----------|--------
**$** | Root Object
**@** | Current Object
**.** | Child
**..** | Recursive children descent
* | Any object/property
**[ ]** | index or quoted child name
**[start : end]** | slice operator
**( )** | script expression
**?( )** | filter expression
**{ }** | nested JSONPath expression


## Examples
Object in JSON notation used in examples:
```javascript
var object = {
	"EventURL": "/devices",
	"EventData": {
		"Device": "ESP8266",
		"Status": "OK",
		"Data": {
			"Devices": [
				{
					"Type": "UART",
					"URL": "/mod-rfid",
					"Found": 0
				},
				{
					"Type": "UART",
					"URL": "/mod-finger",
					"Found": 1
				},
				{
					"Type": "UART",
					"URL": "/mod-emtr",
					"Found": 0
				},
				{
					"Type": "NATIVE",
					"URL": "/button",
					"Found": 1
				},
				{
					"Type": "NATIVE",
					"URL": "/relay",
					"Found": 1
				},
				{
					"Type": "NATIVE",
					"URL": "/adc",
					"Found": 1
				},
				{
					"Type": "I2C",
					"URL": "/mod-rgb",
					"Found": 0,
					"ID": "0x64",
					"Addresses": []
				},
				{
					"Type": "I2C",
					"URL": "/mod-tc-mk2",
					"Found": 1,
					"ID": "0x27",
					"Addresses": [
						"0x23"
					]
				},
				{
					"Type": "I2C",
					"URL": "/mod-io2",
					"Found": 1,
					"ID": "0x23",
					"Addresses": [
						"0x21"
					]
				},
				{
					"Type": "I2C",
					"URL": "/mod-irda",
					"Found": 1,
					"ID": "0x54",
					"Addresses": [
						"0x24"
					]
				},
				{
					"Type": "SPI",
					"URL": "/mod-led-8x8-rgb",
					"Found": 1
				}
			]
		}
	}
}
```

```javascript
// Dotted or bracket notation
JSONPath(object, "$.EventData.Device");
JSONPath(object, "$['EventData']['Device']");

// Result
"ESP8266"
```

```javascript
// Recursive children descent
JSONPath(object, "$..Status");

// Result
"OK"
```

```javascript
JSONPath(object, "$..Devices[0]");
```
	{
	    "Type": "UART",
	    "URL": "/mod-rfid",
	    "Found": 0
	}

```javascript
JSONPath(object, "$..Devices[?(@.Found == 1)]");
```
	[
		{
			"Type": "UART",
			"URL": "/mod-finger",
			"Found": 1
		},
		{
			"Type": "NATIVE",
			"URL": "/button",
			"Found": 1
		},
		{
			"Type": "NATIVE",
			"URL": "/relay",
			"Found": 1
		},
		{
			"Type": "NATIVE",
			"URL": "/adc",
			"Found": 1
		},
		{
			"Type": "I2C",
			"URL": "/mod-tc-mk2",
			"Found": 1,
			"ID": "0x27",
			"Addresses": [
				"0x23"
			]
		},
		{
			"Type": "I2C",
			"URL": "/mod-io2",
			"Found": 1,
			"ID": "0x23",
			"Addresses": [
				"0x21"
			]
		},
		{
			"Type": "I2C",
			"URL": "/mod-irda",
			"Found": 1,
			"ID": "0x54",
			"Addresses": [
				"0x24"
			]
		},
		{
			"Type": "SPI",
			"URL": "/mod-led-8x8-rgb",
			"Found": 1
		}
	]

```javascript
JSONPath(object, "$..Devices[?({$.EventData.Status} == 'OK' && @.Type == 'SPI')]");
```
	{
		"Type": "SPI",
		"URL": "/mod-led-8x8-rgb",
		"Found": 1
	}

