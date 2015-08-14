// Array.prototype.map polyfill
export default function map(obj, callback, thisArg) {
  return obj.map ? obj.map(callback, thisArg) : mapPolyfill.call(obj, callback, thisArg);
}

// https://github.com/emberjs/ember.js/blob/v1.11.0/packages/ember-metal/lib/array.js
function mapPolyfill(fun /*, thisp */) {
  if (this === void 0 || this === null || typeof fun !== "function") {
    throw new TypeError();
  }

  var t = Object(this);
  var len = t.length >>> 0;
  var res = new Array(len);
  var thisp = arguments[1];

  for (var i = 0; i < len; i++) {
    if (i in t) {
      res[i] = fun.call(thisp, t[i], i, t);
    }
  }

  return res;
}