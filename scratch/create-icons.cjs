const fs = require('fs');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAF1JREFUeJztwTEBAAAAwqD1T20JT6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GwaSAABCQAAq/MAAAAASUVORK5CYII=', 'base64');
fs.writeFileSync('public/pwa-192x192.png', png);
fs.writeFileSync('public/pwa-512x512.png', png);
fs.writeFileSync('public/apple-touch-icon.png', png);
console.log('Icons created.');
