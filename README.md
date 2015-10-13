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
as described at http://goessner.net/articles/JsonPath/

JSONPath expressions always refer to a JSON structure in the same way as XPath expression are used in combination with an XML document. Since a JSON structure is usually anonymous and doesn't necessarily have a "root member object" JSONPath assumes the abstract name $ assigned to the outer level object.

JSONPath expressions can use the dot–notation
```javascript 
$.EventData.Data.Devices[0].Type
```

or the bracket–notation
```javascript
$['EventData']['Data']['Devices'][0]['Type']
```

for input path.

JSONPath allows the wildcard symbol * for member names and array indices. It borrows the descendant operator '..' from E4X and the array slice syntax proposal [start:end].

Expressions of the underlying scripting language (< expression >) can be used as an alternative to explicit names or indices as in
```javascript
$..Devices[(@.length-1)]
```

using the symbol '@' for the current object. Filter expressions are supported via the syntax ?(< boolean expression >) as in
```javascript
$..Devices[?(@.Found==1)]
```

Nested JSONPath expressions can be used with {< expression >}
```javascript
$..Devices[{$.EventData..Selected}]
```

Here is a complete overview of the JSONPath syntax elements.

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
			"Selected": 3,
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

// Recursive children descent
JSONPath(object, "$..Status");

// Result
"OK"

// Index
JSONPath(object, "$..Devices[0]");

// Result
{
	"Type": "UART",
	"URL": "/mod-rfid",
	"Found": 0
}

// Last device
JSONPath(object, "$..Devices[(@.length-1)]");

// Result
{
	"Type": "SPI",
	"URL": "/mod-led-8x8-rgb",
	"Found": 1
}

// Nested JSONPath expression as index
JSONPath(object, "$..Devices[{$.EventData..Selected}]");

// Result
{
	"Type": "NATIVE",
	"URL": "/button",
	"Found": 1
}

// Slice
JSONPath(object, "$..Devices[1:3]");

// Result
[
	{
		"Type": "UART",
		"URL": "/mod-finger",
		"Found": 1
	},
	{
		"Type": "UART",
		"URL": "/mod-emtr",
		"Found": 0
	}
]

// Filter expression
JSONPath(object, "$..Devices[?(@.Found == 1)]");

// Result
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

// Filter using current object and nested JSONPath expression
JSONPath(object, "$..Devices[?({$.EventData.Status} == 'OK' && @.Type == 'SPI')]");

// Result
{
	"Type": "SPI",
	"URL": "/mod-led-8x8-rgb",
	"Found": 1
}
```
