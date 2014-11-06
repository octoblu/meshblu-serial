'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var SerialPort = require("serialport").SerialPort

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
      required: true
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


/* if(this.options != {}){
  self.serialPort = new SerialPort(this.options.port, {
  baudrate: this.options.baud
  });
}else { */
 console.log(port);
self.serialPort = new SerialPort(port, {
  baudrate: baud
});



//}
self.serialPort.on('data', function(data) {
    console.log('data received: ' + data);
      self.emit("message", {devices: ['*'], "payload": {"serial_in" : data.toString()}
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
