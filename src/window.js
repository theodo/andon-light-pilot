import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Constants
 */

const VENDORID=0x42, PRODUCTID=0x4200; // USB device vendorId/productId
const COLOR = {GREEN: 0, ORANGE: 1, RED: 2};
const CSS_COLORS = ['green', 'orange', 'red'];
const ORANGE_THRESHOLD = 30, RED_THRESHOLD = 0; // color change thresholds in seconds

/**
 * Light API
 *
 * example to set green led ON
 * getConnection().then(color(0))
 */

var conn = null;
const getConnection = () => {
  if (conn) return Promise.resolve(conn);
  return new Promise((resolve, reject) => {
    chrome.hid.getDevices({filters: [{vendorId: VENDORID, productId: PRODUCTID}]}, (devs) => {
      console.log(devs);
      if (devs.length > 0) {
        chrome.hid.connect(devs[0].deviceId, (c) => {
          conn = c;
          resolve(conn);
        });
      } else {
        reject("Missing device");
      }
    });
  })
}

const clearConnection = () => { conn = null; };

// color is 0 (green), 1 (orange) or 2 (red)
// conn comes from getConntection above
const sendColor = (color) => (conn) => new Promise((resolve, reject) => {
  chrome.hid.send(conn.connectionId, 0x0, new Uint8Array([color]), () => {
    if (chrome.runtime.lastError) {
      clearConnection();
      reject(chrome.runtime.lastError);
      console.log('send error : ', chrome.runtime.lastError)
    } else {
      resolve();
      console.log('sent')
    }
  });
});

// Misc

const pad = (v) => ('0' + v).slice(-2)

/**
 * React UI code
 *
 * Scroll to <App /> component for starting point
 */

class TimeInput extends React.Component {

  constructor() {
    super()

    this.state = {time: 0, input: 0, started: false};
  }

  start() {
    if (this.interval) return;
    const { onColorSelected } = this.props;
    this.interval = setInterval(() => {
      const { time } = this.state;
      const newTime = time-1;
      this.setState({time: newTime});
      if (newTime < RED_THRESHOLD) onColorSelected(COLOR.RED)();
      else if (newTime < ORANGE_THRESHOLD) onColorSelected(COLOR.ORANGE)();
      else onColorSelected(COLOR.GREEN)();
    }, 1000);
    this.setState({started: true});
  }

  stop() {
    if (this.interval == null) return;
    clearInterval(this.interval);
    this.interval = null;
    this.setState({started: false});
  }

  render() {
    const { started, time, input } = this.state;
    const secs = input % 100;
    const minutes = Math.floor(input / 100);

    return (
      <div id='timer' tabIndex='0' onKeyUp={this._handleKeyDown}>
        {started ? 
          (<div id='left'>{(time < 0 ? '-' : '') + pad(Math.floor(Math.abs(time) / 60))}:{pad(Math.abs(time) % 60)}</div>)
          :
          (<div id='left'>{pad(minutes)}:{pad(secs)}</div>)
        }
        <div>
          <button onClick={this._handleAddTime} id='more'>+</button><br />
          <button onClick={this._handleResetTime} id='more'>reset</button>
        </div>
      </div>
    );
  }

  _handleAddTime = () => {
    this.setState({time: this.state.time + 30});
    this.start();
  }

  _handleResetTime = () => {
    this.setState({time: 0});
    this.stop();
  }

  _handleKeyDown = (e) => {
    const { started } = this.state;
    if (started) return;

    if (e.keyCode == 13) {
      if (this.state.input == 0) return;
      if (this.timeout) clearTimeout(this.timeout);
      this.setInput();
      return;
    }
    const charCode = e.which || e.keyCode;
    const n = parseInt(String.fromCharCode(charCode))
    console.log(n);
    if (isNaN(n)) {
      return;
    }

    this.setState({input: this.state.input * 10 + n});
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.setInput();
    }, 3000);
  }

  setInput() {
    const secs = this.state.input % 100;
    const minutes = Math.floor(this.state.input / 100);
    this.setState({time: minutes * 60 + secs});
    this.setState({input: 0});
    this.start();
  }
}

class Buttons extends React.Component {

  render() {
    const { onColorSelected } = this.props;
    return (
      <div id='buttons'>
        <button id='green' onClick={onColorSelected(COLOR.GREEN)}>green</button>
        <button id='orange' onClick={onColorSelected(COLOR.ORANGE)}>orange</button>
        <button id='red' onClick={onColorSelected(COLOR.RED)}>red</button>
      </div>
    );
  }
}

class App extends React.Component {

  constructor() {
    super();

    this.state = {color: COLOR.GREEN, connected: false};
  }

  render() {
    const { color, connected } = this.state;
    return (
      <div id='bg' style={{backgroundColor: CSS_COLORS[color]}}>
        <TimeInput onColorSelected={this._handleColorSelected} />
        <Buttons onColorSelected={this._handleColorSelected} />
        {!connected && (
          <small style={{color: 'white'}}>Not connected</small>
        )}
      </div>
    );
  }

  _handleColorSelected = (color) => () => {  
    getConnection()
      .then(sendColor(color))
      .then(() => this.setState({connected: true, color}))
      .catch(() => this.setState({connected: false}));
  }
}

// Render, yo

$(() => {
  ReactDOM.render(<App />, $('#app')[0]);
});
