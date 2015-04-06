'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var serialport = require("serialport");
var SerialPort = serialport.SerialPort

var port = "COM4";
var baud = 9600;


var MESSAGE_SCHEMA = {
  type: 'object',
  properties: {
    serial_out: {
      type: 'string',
      required: true
    }
  }
};

var OPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    port: {
      type: 'string',
      required: true
    },
    baud: {
      type: 'integer',
      required: true,
      enum : [115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75,50]
    }, 
    delimiter : {
      type : 'string'
    }
  }
};

function Plugin(){
  this.options = {};
  this.messageSchema = MESSAGE_SCHEMA;
  this.optionsSchema = OPTIONS_SCHEMA;
  return this;
}
util.inherits(Plugin, EventEmitter);



Plugin.prototype.onMessage = function(message){
  var self = this;
  var payload = message.payload;
 // this.emit('message', {devices: ['*'], topic: 'echo', payload: payload});

if(payload.readPorts == true){

self.serialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);

    self.emit("message", {devices: ['*'], "payload": ports
             });
  });
});

  
}

  
  self.serialPort.write(payload.serial_out, function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });



};

Plugin.prototype.onConfig = function(device){
  var self = this;
  self.setOptions(device.options||{});

  if(!this.options || !this.options.port){
    var error = new Error('port field is required'); 
    console.error(error); 

  }

  var serialOptions = {
    baudrate : self.options.baud || 57600
  }; 

  self.serialPort = new SerialPort(this.options.port,serialOptions);

  self.serialPort.on("open", function () {
    self.serialPort.on('data', function(data) {
      console.log('data received: ' + data);
      self.emit("message", {
        devices: ['*'], 
        "payload": {
          "serial_in" : data.toString()
        } 
      });
      
      self.serialPort.flush(); 
    });
  });
};

Plugin.prototype.setOptions = function(options){
  this.options = options;
};

module.exports = {
  messageSchema: MESSAGE_SCHEMA,
  optionsSchema: OPTIONS_SCHEMA,
  Plugin: Plugin
};
