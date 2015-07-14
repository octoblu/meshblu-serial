'use strict';
var util = require('util');
var _ = require('lodash');
var debug = require('debug')('meshblu-serial');
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
      enum : [115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75,50],
      default: 57600
    },
    delimiter : {
      type : 'string',
      default: "\\n"
    }
  }
};

function Plugin(){
  _.bindAll(this);

  this.options = {};
  this.messageSchema = MESSAGE_SCHEMA;
  this.optionsSchema = OPTIONS_SCHEMA;

  return this;
}
util.inherits(Plugin, EventEmitter);

Plugin.prototype.onMessage = function(message){
  var self = this;

  if(!self.serialPort){
    var error = new Error('no connected serialPort');
    console.error(error);
    self.emit('error', error);
    return;
  }

  var payload = message.payload || {};

  if(payload.readPorts){
    self.serialPort.list(function (err, ports) {
      self.emit("message", {devices: ['*'], "payload": ports});
    });
  }

  if(payload.serial_out){
    self.serialPort.write(payload.serial_out);
  }
};

Plugin.prototype.onConfig = function(device){
  var self = this;
  self.cleanup(function(error){
    if(error){
      self.emit('error', error);
    }

    self.setOptions(device.options);
    debug('options', self.options);

    if(!self.options.port){
      var error = new Error('port field is required');
      console.error(error);
      self.emit('error', error);
      return;
    }

    self.serialPort = new SerialPort(self.options.port, {
      baudrate : self.options.baud,
      parser: serialport.parsers.readline(self.options.delimiter)
    });

    self.serialPort.on("open", function(){
      self.serialPort.on('data', self.onSerialData);
    });
  })
};

Plugin.prototype.setOptions = function(options){
  var self = this;
  self.options = _.defaults(options, {
    baud: 57600,
    delimiter: "\\n"
  });

  self.options.delimiter = self.options.delimiter.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\d/g, "\d").replace(/\\t/g, "\t");
};

Plugin.prototype.onSerialData = function(data) {
  var self = this;
  debug('onSerialData', data.toString());

  self.emit("message", {
    devices: ['*'],
    "payload": {
      "serial_in" : data.toString()
    }
  });
};

Plugin.prototype.cleanup = function(callback){
  var self = this;
  callback = callback || _.noop;

  if(!self.serialport){
    return callback();
  }

  self.serialPort.close(function(error){
    self.serialPort = null;
    callback(error);
  });
};

module.exports = {
  messageSchema: MESSAGE_SCHEMA,
  optionsSchema: OPTIONS_SCHEMA,
  Plugin: Plugin
};
