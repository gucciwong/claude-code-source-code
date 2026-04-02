function _mergeNamespaces(n2, m2) {
  for (var i = 0; i < m2.length; i++) {
    const e = m2[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k2 in e) {
        if (k2 !== "default" && !(k2 in n2)) {
          const d = Object.getOwnPropertyDescriptor(e, k2);
          if (d) {
            Object.defineProperty(n2, k2, d.get ? d : {
              enumerable: true,
              get: () => e[k2]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n2, Symbol.toStringTag, { value: "Module" }));
}
function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
var react = { exports: {} };
var react_production_min = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l$1 = Symbol.for("react.element"), n$1 = Symbol.for("react.portal"), p$2 = Symbol.for("react.fragment"), q$1 = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v$1 = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z$1 = Symbol.iterator;
function A$1(a) {
  if (null === a || "object" !== typeof a) return null;
  a = z$1 && a[z$1] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var B$1 = { isMounted: function() {
  return false;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, C$1 = Object.assign, D$1 = {};
function E$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
E$1.prototype.isReactComponent = {};
E$1.prototype.setState = function(a, b) {
  if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, a, b, "setState");
};
E$1.prototype.forceUpdate = function(a) {
  this.updater.enqueueForceUpdate(this, a, "forceUpdate");
};
function F() {
}
F.prototype = E$1.prototype;
function G$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
var H$1 = G$1.prototype = new F();
H$1.constructor = G$1;
C$1(H$1, E$1.prototype);
H$1.isPureReactComponent = true;
var I$1 = Array.isArray, J = Object.prototype.hasOwnProperty, K$1 = { current: null }, L$1 = { key: true, ref: true, __self: true, __source: true };
function M$1(a, b, e) {
  var d, c = {}, k2 = null, h = null;
  if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k2 = "" + b.key), b) J.call(b, d) && !L$1.hasOwnProperty(d) && (c[d] = b[d]);
  var g = arguments.length - 2;
  if (1 === g) c.children = e;
  else if (1 < g) {
    for (var f2 = Array(g), m2 = 0; m2 < g; m2++) f2[m2] = arguments[m2 + 2];
    c.children = f2;
  }
  if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
  return { $$typeof: l$1, type: a, key: k2, ref: h, props: c, _owner: K$1.current };
}
function N$1(a, b) {
  return { $$typeof: l$1, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
}
function O$1(a) {
  return "object" === typeof a && null !== a && a.$$typeof === l$1;
}
function escape(a) {
  var b = { "=": "=0", ":": "=2" };
  return "$" + a.replace(/[=:]/g, function(a2) {
    return b[a2];
  });
}
var P$1 = /\/+/g;
function Q$1(a, b) {
  return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
}
function R$1(a, b, e, d, c) {
  var k2 = typeof a;
  if ("undefined" === k2 || "boolean" === k2) a = null;
  var h = false;
  if (null === a) h = true;
  else switch (k2) {
    case "string":
    case "number":
      h = true;
      break;
    case "object":
      switch (a.$$typeof) {
        case l$1:
        case n$1:
          h = true;
      }
  }
  if (h) return h = a, c = c(h), a = "" === d ? "." + Q$1(h, 0) : d, I$1(c) ? (e = "", null != a && (e = a.replace(P$1, "$&/") + "/"), R$1(c, b, e, "", function(a2) {
    return a2;
  })) : null != c && (O$1(c) && (c = N$1(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P$1, "$&/") + "/") + a)), b.push(c)), 1;
  h = 0;
  d = "" === d ? "." : d + ":";
  if (I$1(a)) for (var g = 0; g < a.length; g++) {
    k2 = a[g];
    var f2 = d + Q$1(k2, g);
    h += R$1(k2, b, e, f2, c);
  }
  else if (f2 = A$1(a), "function" === typeof f2) for (a = f2.call(a), g = 0; !(k2 = a.next()).done; ) k2 = k2.value, f2 = d + Q$1(k2, g++), h += R$1(k2, b, e, f2, c);
  else if ("object" === k2) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
  return h;
}
function S$1(a, b, e) {
  if (null == a) return a;
  var d = [], c = 0;
  R$1(a, d, "", "", function(a2) {
    return b.call(e, a2, c++);
  });
  return d;
}
function T$1(a) {
  if (-1 === a._status) {
    var b = a._result;
    b = b();
    b.then(function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
    }, function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
    });
    -1 === a._status && (a._status = 0, a._result = b);
  }
  if (1 === a._status) return a._result.default;
  throw a._result;
}
var U$1 = { current: null }, V$1 = { transition: null }, W$1 = { ReactCurrentDispatcher: U$1, ReactCurrentBatchConfig: V$1, ReactCurrentOwner: K$1 };
function X$2() {
  throw Error("act(...) is not supported in production builds of React.");
}
react_production_min.Children = { map: S$1, forEach: function(a, b, e) {
  S$1(a, function() {
    b.apply(this, arguments);
  }, e);
}, count: function(a) {
  var b = 0;
  S$1(a, function() {
    b++;
  });
  return b;
}, toArray: function(a) {
  return S$1(a, function(a2) {
    return a2;
  }) || [];
}, only: function(a) {
  if (!O$1(a)) throw Error("React.Children.only expected to receive a single React element child.");
  return a;
} };
react_production_min.Component = E$1;
react_production_min.Fragment = p$2;
react_production_min.Profiler = r;
react_production_min.PureComponent = G$1;
react_production_min.StrictMode = q$1;
react_production_min.Suspense = w;
react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W$1;
react_production_min.act = X$2;
react_production_min.cloneElement = function(a, b, e) {
  if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
  var d = C$1({}, a.props), c = a.key, k2 = a.ref, h = a._owner;
  if (null != b) {
    void 0 !== b.ref && (k2 = b.ref, h = K$1.current);
    void 0 !== b.key && (c = "" + b.key);
    if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
    for (f2 in b) J.call(b, f2) && !L$1.hasOwnProperty(f2) && (d[f2] = void 0 === b[f2] && void 0 !== g ? g[f2] : b[f2]);
  }
  var f2 = arguments.length - 2;
  if (1 === f2) d.children = e;
  else if (1 < f2) {
    g = Array(f2);
    for (var m2 = 0; m2 < f2; m2++) g[m2] = arguments[m2 + 2];
    d.children = g;
  }
  return { $$typeof: l$1, type: a.type, key: c, ref: k2, props: d, _owner: h };
};
react_production_min.createContext = function(a) {
  a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
  a.Provider = { $$typeof: t, _context: a };
  return a.Consumer = a;
};
react_production_min.createElement = M$1;
react_production_min.createFactory = function(a) {
  var b = M$1.bind(null, a);
  b.type = a;
  return b;
};
react_production_min.createRef = function() {
  return { current: null };
};
react_production_min.forwardRef = function(a) {
  return { $$typeof: v$1, render: a };
};
react_production_min.isValidElement = O$1;
react_production_min.lazy = function(a) {
  return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T$1 };
};
react_production_min.memo = function(a, b) {
  return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
};
react_production_min.startTransition = function(a) {
  var b = V$1.transition;
  V$1.transition = {};
  try {
    a();
  } finally {
    V$1.transition = b;
  }
};
react_production_min.unstable_act = X$2;
react_production_min.useCallback = function(a, b) {
  return U$1.current.useCallback(a, b);
};
react_production_min.useContext = function(a) {
  return U$1.current.useContext(a);
};
react_production_min.useDebugValue = function() {
};
react_production_min.useDeferredValue = function(a) {
  return U$1.current.useDeferredValue(a);
};
react_production_min.useEffect = function(a, b) {
  return U$1.current.useEffect(a, b);
};
react_production_min.useId = function() {
  return U$1.current.useId();
};
react_production_min.useImperativeHandle = function(a, b, e) {
  return U$1.current.useImperativeHandle(a, b, e);
};
react_production_min.useInsertionEffect = function(a, b) {
  return U$1.current.useInsertionEffect(a, b);
};
react_production_min.useLayoutEffect = function(a, b) {
  return U$1.current.useLayoutEffect(a, b);
};
react_production_min.useMemo = function(a, b) {
  return U$1.current.useMemo(a, b);
};
react_production_min.useReducer = function(a, b, e) {
  return U$1.current.useReducer(a, b, e);
};
react_production_min.useRef = function(a) {
  return U$1.current.useRef(a);
};
react_production_min.useState = function(a) {
  return U$1.current.useState(a);
};
react_production_min.useSyncExternalStore = function(a, b, e) {
  return U$1.current.useSyncExternalStore(a, b, e);
};
react_production_min.useTransition = function() {
  return U$1.current.useTransition();
};
react_production_min.version = "18.3.1";
{
  react.exports = react_production_min;
}
var reactExports = react.exports;
const React$2 = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
const React$3 = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: React$2
}, [reactExports]);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f = reactExports, k = Symbol.for("react.element"), l = Symbol.for("react.fragment"), m$1 = Object.prototype.hasOwnProperty, n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p$1 = { key: true, ref: true, __self: true, __source: true };
function q(c, a, g) {
  var b, d = {}, e = null, h = null;
  void 0 !== g && (e = "" + g);
  void 0 !== a.key && (e = "" + a.key);
  void 0 !== a.ref && (h = a.ref);
  for (b in a) m$1.call(a, b) && !p$1.hasOwnProperty(b) && (d[b] = a[b]);
  if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
  return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
}
reactJsxRuntime_production_min.Fragment = l;
reactJsxRuntime_production_min.jsx = q;
reactJsxRuntime_production_min.jsxs = q;
{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}
var jsxRuntimeExports = jsxRuntime.exports;
var client = {};
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(exports$1) {
  function f2(a, b) {
    var c = a.length;
    a.push(b);
    a: for (; 0 < c; ) {
      var d = c - 1 >>> 1, e = a[d];
      if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
      else break a;
    }
  }
  function h(a) {
    return 0 === a.length ? null : a[0];
  }
  function k2(a) {
    if (0 === a.length) return null;
    var b = a[0], c = a.pop();
    if (c !== b) {
      a[0] = c;
      a: for (var d = 0, e = a.length, w2 = e >>> 1; d < w2; ) {
        var m2 = 2 * (d + 1) - 1, C2 = a[m2], n2 = m2 + 1, x2 = a[n2];
        if (0 > g(C2, c)) n2 < e && 0 > g(x2, C2) ? (a[d] = x2, a[n2] = c, d = n2) : (a[d] = C2, a[m2] = c, d = m2);
        else if (n2 < e && 0 > g(x2, c)) a[d] = x2, a[n2] = c, d = n2;
        else break a;
      }
    }
    return b;
  }
  function g(a, b) {
    var c = a.sortIndex - b.sortIndex;
    return 0 !== c ? c : a.id - b.id;
  }
  if ("object" === typeof performance && "function" === typeof performance.now) {
    var l2 = performance;
    exports$1.unstable_now = function() {
      return l2.now();
    };
  } else {
    var p2 = Date, q2 = p2.now();
    exports$1.unstable_now = function() {
      return p2.now() - q2;
    };
  }
  var r2 = [], t2 = [], u2 = 1, v2 = null, y2 = 3, z2 = false, A2 = false, B2 = false, D2 = "function" === typeof setTimeout ? setTimeout : null, E2 = "function" === typeof clearTimeout ? clearTimeout : null, F2 = "undefined" !== typeof setImmediate ? setImmediate : null;
  "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function G2(a) {
    for (var b = h(t2); null !== b; ) {
      if (null === b.callback) k2(t2);
      else if (b.startTime <= a) k2(t2), b.sortIndex = b.expirationTime, f2(r2, b);
      else break;
      b = h(t2);
    }
  }
  function H2(a) {
    B2 = false;
    G2(a);
    if (!A2) if (null !== h(r2)) A2 = true, I2(J2);
    else {
      var b = h(t2);
      null !== b && K2(H2, b.startTime - a);
    }
  }
  function J2(a, b) {
    A2 = false;
    B2 && (B2 = false, E2(L2), L2 = -1);
    z2 = true;
    var c = y2;
    try {
      G2(b);
      for (v2 = h(r2); null !== v2 && (!(v2.expirationTime > b) || a && !M2()); ) {
        var d = v2.callback;
        if ("function" === typeof d) {
          v2.callback = null;
          y2 = v2.priorityLevel;
          var e = d(v2.expirationTime <= b);
          b = exports$1.unstable_now();
          "function" === typeof e ? v2.callback = e : v2 === h(r2) && k2(r2);
          G2(b);
        } else k2(r2);
        v2 = h(r2);
      }
      if (null !== v2) var w2 = true;
      else {
        var m2 = h(t2);
        null !== m2 && K2(H2, m2.startTime - b);
        w2 = false;
      }
      return w2;
    } finally {
      v2 = null, y2 = c, z2 = false;
    }
  }
  var N2 = false, O2 = null, L2 = -1, P2 = 5, Q2 = -1;
  function M2() {
    return exports$1.unstable_now() - Q2 < P2 ? false : true;
  }
  function R2() {
    if (null !== O2) {
      var a = exports$1.unstable_now();
      Q2 = a;
      var b = true;
      try {
        b = O2(true, a);
      } finally {
        b ? S2() : (N2 = false, O2 = null);
      }
    } else N2 = false;
  }
  var S2;
  if ("function" === typeof F2) S2 = function() {
    F2(R2);
  };
  else if ("undefined" !== typeof MessageChannel) {
    var T2 = new MessageChannel(), U2 = T2.port2;
    T2.port1.onmessage = R2;
    S2 = function() {
      U2.postMessage(null);
    };
  } else S2 = function() {
    D2(R2, 0);
  };
  function I2(a) {
    O2 = a;
    N2 || (N2 = true, S2());
  }
  function K2(a, b) {
    L2 = D2(function() {
      a(exports$1.unstable_now());
    }, b);
  }
  exports$1.unstable_IdlePriority = 5;
  exports$1.unstable_ImmediatePriority = 1;
  exports$1.unstable_LowPriority = 4;
  exports$1.unstable_NormalPriority = 3;
  exports$1.unstable_Profiling = null;
  exports$1.unstable_UserBlockingPriority = 2;
  exports$1.unstable_cancelCallback = function(a) {
    a.callback = null;
  };
  exports$1.unstable_continueExecution = function() {
    A2 || z2 || (A2 = true, I2(J2));
  };
  exports$1.unstable_forceFrameRate = function(a) {
    0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P2 = 0 < a ? Math.floor(1e3 / a) : 5;
  };
  exports$1.unstable_getCurrentPriorityLevel = function() {
    return y2;
  };
  exports$1.unstable_getFirstCallbackNode = function() {
    return h(r2);
  };
  exports$1.unstable_next = function(a) {
    switch (y2) {
      case 1:
      case 2:
      case 3:
        var b = 3;
        break;
      default:
        b = y2;
    }
    var c = y2;
    y2 = b;
    try {
      return a();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_pauseExecution = function() {
  };
  exports$1.unstable_requestPaint = function() {
  };
  exports$1.unstable_runWithPriority = function(a, b) {
    switch (a) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        a = 3;
    }
    var c = y2;
    y2 = a;
    try {
      return b();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_scheduleCallback = function(a, b, c) {
    var d = exports$1.unstable_now();
    "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
    switch (a) {
      case 1:
        var e = -1;
        break;
      case 2:
        e = 250;
        break;
      case 5:
        e = 1073741823;
        break;
      case 4:
        e = 1e4;
        break;
      default:
        e = 5e3;
    }
    e = c + e;
    a = { id: u2++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
    c > d ? (a.sortIndex = c, f2(t2, a), null === h(r2) && a === h(t2) && (B2 ? (E2(L2), L2 = -1) : B2 = true, K2(H2, c - d))) : (a.sortIndex = e, f2(r2, a), A2 || z2 || (A2 = true, I2(J2)));
    return a;
  };
  exports$1.unstable_shouldYield = M2;
  exports$1.unstable_wrapCallback = function(a) {
    var b = y2;
    return function() {
      var c = y2;
      y2 = b;
      try {
        return a.apply(this, arguments);
      } finally {
        y2 = c;
      }
    };
  };
})(scheduler_production_min);
{
  scheduler.exports = scheduler_production_min;
}
var schedulerExports = scheduler.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aa = reactExports, ca = schedulerExports;
function p(a) {
  for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
  return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var da = /* @__PURE__ */ new Set(), ea = {};
function fa(a, b) {
  ha(a, b);
  ha(a + "Capture", b);
}
function ha(a, b) {
  ea[a] = b;
  for (a = 0; a < b.length; a++) da.add(b[a]);
}
var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma = {};
function oa(a) {
  if (ja.call(ma, a)) return true;
  if (ja.call(la, a)) return false;
  if (ka.test(a)) return ma[a] = true;
  la[a] = true;
  return false;
}
function pa(a, b, c, d) {
  if (null !== c && 0 === c.type) return false;
  switch (typeof b) {
    case "function":
    case "symbol":
      return true;
    case "boolean":
      if (d) return false;
      if (null !== c) return !c.acceptsBooleans;
      a = a.toLowerCase().slice(0, 5);
      return "data-" !== a && "aria-" !== a;
    default:
      return false;
  }
}
function qa(a, b, c, d) {
  if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
  if (d) return false;
  if (null !== c) switch (c.type) {
    case 3:
      return !b;
    case 4:
      return false === b;
    case 5:
      return isNaN(b);
    case 6:
      return isNaN(b) || 1 > b;
  }
  return false;
}
function v(a, b, c, d, e, f2, g) {
  this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
  this.attributeName = d;
  this.attributeNamespace = e;
  this.mustUseProperty = c;
  this.propertyName = a;
  this.type = b;
  this.sanitizeURL = f2;
  this.removeEmptyString = g;
}
var z = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
  z[a] = new v(a, 0, false, a, null, false, false);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
  var b = a[0];
  z[b] = new v(b, 1, false, a[1], null, false, false);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
  z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
  z[a] = new v(a, 2, false, a, null, false, false);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
  z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
});
["checked", "multiple", "muted", "selected"].forEach(function(a) {
  z[a] = new v(a, 3, true, a, null, false, false);
});
["capture", "download"].forEach(function(a) {
  z[a] = new v(a, 4, false, a, null, false, false);
});
["cols", "rows", "size", "span"].forEach(function(a) {
  z[a] = new v(a, 6, false, a, null, false, false);
});
["rowSpan", "start"].forEach(function(a) {
  z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
});
var ra = /[\-:]([a-z])/g;
function sa(a) {
  return a[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
  var b = a.replace(
    ra,
    sa
  );
  z[b] = new v(b, 1, false, a, null, false, false);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
});
["tabIndex", "crossOrigin"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
});
z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
["src", "href", "action", "formAction"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
});
function ta(a, b, c, d) {
  var e = z.hasOwnProperty(b) ? z[b] : null;
  if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
}
var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = Symbol.for("react.element"), wa = Symbol.for("react.portal"), ya = Symbol.for("react.fragment"), za = Symbol.for("react.strict_mode"), Aa = Symbol.for("react.profiler"), Ba = Symbol.for("react.provider"), Ca = Symbol.for("react.context"), Da = Symbol.for("react.forward_ref"), Ea = Symbol.for("react.suspense"), Fa = Symbol.for("react.suspense_list"), Ga = Symbol.for("react.memo"), Ha = Symbol.for("react.lazy");
var Ia = Symbol.for("react.offscreen");
var Ja = Symbol.iterator;
function Ka(a) {
  if (null === a || "object" !== typeof a) return null;
  a = Ja && a[Ja] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var A = Object.assign, La;
function Ma(a) {
  if (void 0 === La) try {
    throw Error();
  } catch (c) {
    var b = c.stack.trim().match(/\n( *(at )?)/);
    La = b && b[1] || "";
  }
  return "\n" + La + a;
}
var Na = false;
function Oa(a, b) {
  if (!a || Na) return "";
  Na = true;
  var c = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (b) if (b = function() {
      throw Error();
    }, Object.defineProperty(b.prototype, "props", { set: function() {
      throw Error();
    } }), "object" === typeof Reflect && Reflect.construct) {
      try {
        Reflect.construct(b, []);
      } catch (l2) {
        var d = l2;
      }
      Reflect.construct(a, [], b);
    } else {
      try {
        b.call();
      } catch (l2) {
        d = l2;
      }
      a.call(b.prototype);
    }
    else {
      try {
        throw Error();
      } catch (l2) {
        d = l2;
      }
      a();
    }
  } catch (l2) {
    if (l2 && d && "string" === typeof l2.stack) {
      for (var e = l2.stack.split("\n"), f2 = d.stack.split("\n"), g = e.length - 1, h = f2.length - 1; 1 <= g && 0 <= h && e[g] !== f2[h]; ) h--;
      for (; 1 <= g && 0 <= h; g--, h--) if (e[g] !== f2[h]) {
        if (1 !== g || 1 !== h) {
          do
            if (g--, h--, 0 > h || e[g] !== f2[h]) {
              var k2 = "\n" + e[g].replace(" at new ", " at ");
              a.displayName && k2.includes("<anonymous>") && (k2 = k2.replace("<anonymous>", a.displayName));
              return k2;
            }
          while (1 <= g && 0 <= h);
        }
        break;
      }
    }
  } finally {
    Na = false, Error.prepareStackTrace = c;
  }
  return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
}
function Pa(a) {
  switch (a.tag) {
    case 5:
      return Ma(a.type);
    case 16:
      return Ma("Lazy");
    case 13:
      return Ma("Suspense");
    case 19:
      return Ma("SuspenseList");
    case 0:
    case 2:
    case 15:
      return a = Oa(a.type, false), a;
    case 11:
      return a = Oa(a.type.render, false), a;
    case 1:
      return a = Oa(a.type, true), a;
    default:
      return "";
  }
}
function Qa(a) {
  if (null == a) return null;
  if ("function" === typeof a) return a.displayName || a.name || null;
  if ("string" === typeof a) return a;
  switch (a) {
    case ya:
      return "Fragment";
    case wa:
      return "Portal";
    case Aa:
      return "Profiler";
    case za:
      return "StrictMode";
    case Ea:
      return "Suspense";
    case Fa:
      return "SuspenseList";
  }
  if ("object" === typeof a) switch (a.$$typeof) {
    case Ca:
      return (a.displayName || "Context") + ".Consumer";
    case Ba:
      return (a._context.displayName || "Context") + ".Provider";
    case Da:
      var b = a.render;
      a = a.displayName;
      a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
      return a;
    case Ga:
      return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
    case Ha:
      b = a._payload;
      a = a._init;
      try {
        return Qa(a(b));
      } catch (c) {
      }
  }
  return null;
}
function Ra(a) {
  var b = a.type;
  switch (a.tag) {
    case 24:
      return "Cache";
    case 9:
      return (b.displayName || "Context") + ".Consumer";
    case 10:
      return (b._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return b;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Qa(b);
    case 8:
      return b === za ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if ("function" === typeof b) return b.displayName || b.name || null;
      if ("string" === typeof b) return b;
  }
  return null;
}
function Sa(a) {
  switch (typeof a) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return a;
    case "object":
      return a;
    default:
      return "";
  }
}
function Ta(a) {
  var b = a.type;
  return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
}
function Ua(a) {
  var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
  if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
    var e = c.get, f2 = c.set;
    Object.defineProperty(a, b, { configurable: true, get: function() {
      return e.call(this);
    }, set: function(a2) {
      d = "" + a2;
      f2.call(this, a2);
    } });
    Object.defineProperty(a, b, { enumerable: c.enumerable });
    return { getValue: function() {
      return d;
    }, setValue: function(a2) {
      d = "" + a2;
    }, stopTracking: function() {
      a._valueTracker = null;
      delete a[b];
    } };
  }
}
function Va(a) {
  a._valueTracker || (a._valueTracker = Ua(a));
}
function Wa(a) {
  if (!a) return false;
  var b = a._valueTracker;
  if (!b) return true;
  var c = b.getValue();
  var d = "";
  a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
  a = d;
  return a !== c ? (b.setValue(a), true) : false;
}
function Xa(a) {
  a = a || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof a) return null;
  try {
    return a.activeElement || a.body;
  } catch (b) {
    return a.body;
  }
}
function Ya(a, b) {
  var c = b.checked;
  return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
}
function Za(a, b) {
  var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
  c = Sa(null != b.value ? b.value : c);
  a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
}
function ab(a, b) {
  b = b.checked;
  null != b && ta(a, "checked", b, false);
}
function bb(a, b) {
  ab(a, b);
  var c = Sa(b.value), d = b.type;
  if (null != c) if ("number" === d) {
    if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
  } else a.value !== "" + c && (a.value = "" + c);
  else if ("submit" === d || "reset" === d) {
    a.removeAttribute("value");
    return;
  }
  b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
  null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
}
function db(a, b, c) {
  if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
    var d = b.type;
    if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
    b = "" + a._wrapperState.initialValue;
    c || b === a.value || (a.value = b);
    a.defaultValue = b;
  }
  c = a.name;
  "" !== c && (a.name = "");
  a.defaultChecked = !!a._wrapperState.initialChecked;
  "" !== c && (a.name = c);
}
function cb(a, b, c) {
  if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
}
var eb = Array.isArray;
function fb(a, b, c, d) {
  a = a.options;
  if (b) {
    b = {};
    for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
    for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
  } else {
    c = "" + Sa(c);
    b = null;
    for (e = 0; e < a.length; e++) {
      if (a[e].value === c) {
        a[e].selected = true;
        d && (a[e].defaultSelected = true);
        return;
      }
      null !== b || a[e].disabled || (b = a[e]);
    }
    null !== b && (b.selected = true);
  }
}
function gb(a, b) {
  if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
  return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
}
function hb(a, b) {
  var c = b.value;
  if (null == c) {
    c = b.children;
    b = b.defaultValue;
    if (null != c) {
      if (null != b) throw Error(p(92));
      if (eb(c)) {
        if (1 < c.length) throw Error(p(93));
        c = c[0];
      }
      b = c;
    }
    null == b && (b = "");
    c = b;
  }
  a._wrapperState = { initialValue: Sa(c) };
}
function ib(a, b) {
  var c = Sa(b.value), d = Sa(b.defaultValue);
  null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
  null != d && (a.defaultValue = "" + d);
}
function jb(a) {
  var b = a.textContent;
  b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
}
function kb(a) {
  switch (a) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function lb(a, b) {
  return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
}
var mb, nb = function(a) {
  return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
    MSApp.execUnsafeLocalFunction(function() {
      return a(b, c, d, e);
    });
  } : a;
}(function(a, b) {
  if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
  else {
    mb = mb || document.createElement("div");
    mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
    for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
    for (; b.firstChild; ) a.appendChild(b.firstChild);
  }
});
function ob(a, b) {
  if (b) {
    var c = a.firstChild;
    if (c && c === a.lastChild && 3 === c.nodeType) {
      c.nodeValue = b;
      return;
    }
  }
  a.textContent = b;
}
var pb = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
}, qb = ["Webkit", "ms", "Moz", "O"];
Object.keys(pb).forEach(function(a) {
  qb.forEach(function(b) {
    b = b + a.charAt(0).toUpperCase() + a.substring(1);
    pb[b] = pb[a];
  });
});
function rb(a, b, c) {
  return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
}
function sb(a, b) {
  a = a.style;
  for (var c in b) if (b.hasOwnProperty(c)) {
    var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
    "float" === c && (c = "cssFloat");
    d ? a.setProperty(c, e) : a[c] = e;
  }
}
var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
function ub(a, b) {
  if (b) {
    if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
    if (null != b.dangerouslySetInnerHTML) {
      if (null != b.children) throw Error(p(60));
      if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
    }
    if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
  }
}
function vb(a, b) {
  if (-1 === a.indexOf("-")) return "string" === typeof b.is;
  switch (a) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return false;
    default:
      return true;
  }
}
var wb = null;
function xb(a) {
  a = a.target || a.srcElement || window;
  a.correspondingUseElement && (a = a.correspondingUseElement);
  return 3 === a.nodeType ? a.parentNode : a;
}
var yb = null, zb = null, Ab = null;
function Bb(a) {
  if (a = Cb(a)) {
    if ("function" !== typeof yb) throw Error(p(280));
    var b = a.stateNode;
    b && (b = Db(b), yb(a.stateNode, a.type, b));
  }
}
function Eb(a) {
  zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
}
function Fb() {
  if (zb) {
    var a = zb, b = Ab;
    Ab = zb = null;
    Bb(a);
    if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
  }
}
function Gb(a, b) {
  return a(b);
}
function Hb() {
}
var Ib = false;
function Jb(a, b, c) {
  if (Ib) return a(b, c);
  Ib = true;
  try {
    return Gb(a, b, c);
  } finally {
    if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
  }
}
function Kb(a, b) {
  var c = a.stateNode;
  if (null === c) return null;
  var d = Db(c);
  if (null === d) return null;
  c = d[b];
  a: switch (b) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
      a = !d;
      break a;
    default:
      a = false;
  }
  if (a) return null;
  if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
  return c;
}
var Lb = false;
if (ia) try {
  var Mb = {};
  Object.defineProperty(Mb, "passive", { get: function() {
    Lb = true;
  } });
  window.addEventListener("test", Mb, Mb);
  window.removeEventListener("test", Mb, Mb);
} catch (a) {
  Lb = false;
}
function Nb(a, b, c, d, e, f2, g, h, k2) {
  var l2 = Array.prototype.slice.call(arguments, 3);
  try {
    b.apply(c, l2);
  } catch (m2) {
    this.onError(m2);
  }
}
var Ob = false, Pb = null, Qb = false, Rb = null, Sb = { onError: function(a) {
  Ob = true;
  Pb = a;
} };
function Tb(a, b, c, d, e, f2, g, h, k2) {
  Ob = false;
  Pb = null;
  Nb.apply(Sb, arguments);
}
function Ub(a, b, c, d, e, f2, g, h, k2) {
  Tb.apply(this, arguments);
  if (Ob) {
    if (Ob) {
      var l2 = Pb;
      Ob = false;
      Pb = null;
    } else throw Error(p(198));
    Qb || (Qb = true, Rb = l2);
  }
}
function Vb(a) {
  var b = a, c = a;
  if (a.alternate) for (; b.return; ) b = b.return;
  else {
    a = b;
    do
      b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
    while (a);
  }
  return 3 === b.tag ? c : null;
}
function Wb(a) {
  if (13 === a.tag) {
    var b = a.memoizedState;
    null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
    if (null !== b) return b.dehydrated;
  }
  return null;
}
function Xb(a) {
  if (Vb(a) !== a) throw Error(p(188));
}
function Yb(a) {
  var b = a.alternate;
  if (!b) {
    b = Vb(a);
    if (null === b) throw Error(p(188));
    return b !== a ? null : a;
  }
  for (var c = a, d = b; ; ) {
    var e = c.return;
    if (null === e) break;
    var f2 = e.alternate;
    if (null === f2) {
      d = e.return;
      if (null !== d) {
        c = d;
        continue;
      }
      break;
    }
    if (e.child === f2.child) {
      for (f2 = e.child; f2; ) {
        if (f2 === c) return Xb(e), a;
        if (f2 === d) return Xb(e), b;
        f2 = f2.sibling;
      }
      throw Error(p(188));
    }
    if (c.return !== d.return) c = e, d = f2;
    else {
      for (var g = false, h = e.child; h; ) {
        if (h === c) {
          g = true;
          c = e;
          d = f2;
          break;
        }
        if (h === d) {
          g = true;
          d = e;
          c = f2;
          break;
        }
        h = h.sibling;
      }
      if (!g) {
        for (h = f2.child; h; ) {
          if (h === c) {
            g = true;
            c = f2;
            d = e;
            break;
          }
          if (h === d) {
            g = true;
            d = f2;
            c = e;
            break;
          }
          h = h.sibling;
        }
        if (!g) throw Error(p(189));
      }
    }
    if (c.alternate !== d) throw Error(p(190));
  }
  if (3 !== c.tag) throw Error(p(188));
  return c.stateNode.current === c ? a : b;
}
function Zb(a) {
  a = Yb(a);
  return null !== a ? $b(a) : null;
}
function $b(a) {
  if (5 === a.tag || 6 === a.tag) return a;
  for (a = a.child; null !== a; ) {
    var b = $b(a);
    if (null !== b) return b;
    a = a.sibling;
  }
  return null;
}
var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
function mc(a) {
  if (lc && "function" === typeof lc.onCommitFiberRoot) try {
    lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
  } catch (b) {
  }
}
var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
function nc(a) {
  a >>>= 0;
  return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
}
var rc = 64, sc = 4194304;
function tc(a) {
  switch (a & -a) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return a & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return a & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return a;
  }
}
function uc(a, b) {
  var c = a.pendingLanes;
  if (0 === c) return 0;
  var d = 0, e = a.suspendedLanes, f2 = a.pingedLanes, g = c & 268435455;
  if (0 !== g) {
    var h = g & ~e;
    0 !== h ? d = tc(h) : (f2 &= g, 0 !== f2 && (d = tc(f2)));
  } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f2 && (d = tc(f2));
  if (0 === d) return 0;
  if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f2 = b & -b, e >= f2 || 16 === e && 0 !== (f2 & 4194240))) return b;
  0 !== (d & 4) && (d |= c & 16);
  b = a.entangledLanes;
  if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
  return d;
}
function vc(a, b) {
  switch (a) {
    case 1:
    case 2:
    case 4:
      return b + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return b + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function wc(a, b) {
  for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f2 = a.pendingLanes; 0 < f2; ) {
    var g = 31 - oc(f2), h = 1 << g, k2 = e[g];
    if (-1 === k2) {
      if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
    } else k2 <= b && (a.expiredLanes |= h);
    f2 &= ~h;
  }
}
function xc(a) {
  a = a.pendingLanes & -1073741825;
  return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
}
function yc() {
  var a = rc;
  rc <<= 1;
  0 === (rc & 4194240) && (rc = 64);
  return a;
}
function zc(a) {
  for (var b = [], c = 0; 31 > c; c++) b.push(a);
  return b;
}
function Ac(a, b, c) {
  a.pendingLanes |= b;
  536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
  a = a.eventTimes;
  b = 31 - oc(b);
  a[b] = c;
}
function Bc(a, b) {
  var c = a.pendingLanes & ~b;
  a.pendingLanes = b;
  a.suspendedLanes = 0;
  a.pingedLanes = 0;
  a.expiredLanes &= b;
  a.mutableReadLanes &= b;
  a.entangledLanes &= b;
  b = a.entanglements;
  var d = a.eventTimes;
  for (a = a.expirationTimes; 0 < c; ) {
    var e = 31 - oc(c), f2 = 1 << e;
    b[e] = 0;
    d[e] = -1;
    a[e] = -1;
    c &= ~f2;
  }
}
function Cc(a, b) {
  var c = a.entangledLanes |= b;
  for (a = a.entanglements; c; ) {
    var d = 31 - oc(c), e = 1 << d;
    e & b | a[d] & b && (a[d] |= b);
    c &= ~e;
  }
}
var C = 0;
function Dc(a) {
  a &= -a;
  return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
}
var Ec, Fc, Gc, Hc, Ic, Jc = false, Kc = [], Lc = null, Mc = null, Nc = null, Oc = /* @__PURE__ */ new Map(), Pc = /* @__PURE__ */ new Map(), Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a, b) {
  switch (a) {
    case "focusin":
    case "focusout":
      Lc = null;
      break;
    case "dragenter":
    case "dragleave":
      Mc = null;
      break;
    case "mouseover":
    case "mouseout":
      Nc = null;
      break;
    case "pointerover":
    case "pointerout":
      Oc.delete(b.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Pc.delete(b.pointerId);
  }
}
function Tc(a, b, c, d, e, f2) {
  if (null === a || a.nativeEvent !== f2) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f2, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
  a.eventSystemFlags |= d;
  b = a.targetContainers;
  null !== e && -1 === b.indexOf(e) && b.push(e);
  return a;
}
function Uc(a, b, c, d, e) {
  switch (b) {
    case "focusin":
      return Lc = Tc(Lc, a, b, c, d, e), true;
    case "dragenter":
      return Mc = Tc(Mc, a, b, c, d, e), true;
    case "mouseover":
      return Nc = Tc(Nc, a, b, c, d, e), true;
    case "pointerover":
      var f2 = e.pointerId;
      Oc.set(f2, Tc(Oc.get(f2) || null, a, b, c, d, e));
      return true;
    case "gotpointercapture":
      return f2 = e.pointerId, Pc.set(f2, Tc(Pc.get(f2) || null, a, b, c, d, e)), true;
  }
  return false;
}
function Vc(a) {
  var b = Wc(a.target);
  if (null !== b) {
    var c = Vb(b);
    if (null !== c) {
      if (b = c.tag, 13 === b) {
        if (b = Wb(c), null !== b) {
          a.blockedOn = b;
          Ic(a.priority, function() {
            Gc(c);
          });
          return;
        }
      } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
        a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
        return;
      }
    }
  }
  a.blockedOn = null;
}
function Xc(a) {
  if (null !== a.blockedOn) return false;
  for (var b = a.targetContainers; 0 < b.length; ) {
    var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
    if (null === c) {
      c = a.nativeEvent;
      var d = new c.constructor(c.type, c);
      wb = d;
      c.target.dispatchEvent(d);
      wb = null;
    } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
    b.shift();
  }
  return true;
}
function Zc(a, b, c) {
  Xc(a) && c.delete(b);
}
function $c() {
  Jc = false;
  null !== Lc && Xc(Lc) && (Lc = null);
  null !== Mc && Xc(Mc) && (Mc = null);
  null !== Nc && Xc(Nc) && (Nc = null);
  Oc.forEach(Zc);
  Pc.forEach(Zc);
}
function ad(a, b) {
  a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
}
function bd(a) {
  function b(b2) {
    return ad(b2, a);
  }
  if (0 < Kc.length) {
    ad(Kc[0], a);
    for (var c = 1; c < Kc.length; c++) {
      var d = Kc[c];
      d.blockedOn === a && (d.blockedOn = null);
    }
  }
  null !== Lc && ad(Lc, a);
  null !== Mc && ad(Mc, a);
  null !== Nc && ad(Nc, a);
  Oc.forEach(b);
  Pc.forEach(b);
  for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
  for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
}
var cd = ua.ReactCurrentBatchConfig, dd = true;
function ed(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 1, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function gd(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 4, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function fd(a, b, c, d) {
  if (dd) {
    var e = Yc(a, b, c, d);
    if (null === e) hd(a, b, d, id, c), Sc(a, d);
    else if (Uc(e, a, b, c, d)) d.stopPropagation();
    else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
      for (; null !== e; ) {
        var f2 = Cb(e);
        null !== f2 && Ec(f2);
        f2 = Yc(a, b, c, d);
        null === f2 && hd(a, b, d, id, c);
        if (f2 === e) break;
        e = f2;
      }
      null !== e && d.stopPropagation();
    } else hd(a, b, d, null, c);
  }
}
var id = null;
function Yc(a, b, c, d) {
  id = null;
  a = xb(d);
  a = Wc(a);
  if (null !== a) if (b = Vb(a), null === b) a = null;
  else if (c = b.tag, 13 === c) {
    a = Wb(b);
    if (null !== a) return a;
    a = null;
  } else if (3 === c) {
    if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
    a = null;
  } else b !== a && (a = null);
  id = a;
  return null;
}
function jd(a) {
  switch (a) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (ec()) {
        case fc:
          return 1;
        case gc:
          return 4;
        case hc:
        case ic:
          return 16;
        case jc:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var kd = null, ld = null, md = null;
function nd() {
  if (md) return md;
  var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f2 = e.length;
  for (a = 0; a < c && b[a] === e[a]; a++) ;
  var g = c - a;
  for (d = 1; d <= g && b[c - d] === e[f2 - d]; d++) ;
  return md = e.slice(a, 1 < d ? 1 - d : void 0);
}
function od(a) {
  var b = a.keyCode;
  "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
  10 === a && (a = 13);
  return 32 <= a || 13 === a ? a : 0;
}
function pd() {
  return true;
}
function qd() {
  return false;
}
function rd(a) {
  function b(b2, d, e, f2, g) {
    this._reactName = b2;
    this._targetInst = e;
    this.type = d;
    this.nativeEvent = f2;
    this.target = g;
    this.currentTarget = null;
    for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f2) : f2[c]);
    this.isDefaultPrevented = (null != f2.defaultPrevented ? f2.defaultPrevented : false === f2.returnValue) ? pd : qd;
    this.isPropagationStopped = qd;
    return this;
  }
  A(b.prototype, { preventDefault: function() {
    this.defaultPrevented = true;
    var a2 = this.nativeEvent;
    a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
  }, stopPropagation: function() {
    var a2 = this.nativeEvent;
    a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
  }, persist: function() {
  }, isPersistent: pd });
  return b;
}
var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
  return a.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, td = rd(sd), ud = A({}, sd, { view: 0, detail: 0 }), vd = rd(ud), wd, xd, yd, Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
  return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
}, movementX: function(a) {
  if ("movementX" in a) return a.movementX;
  a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
  return wd;
}, movementY: function(a) {
  return "movementY" in a ? a.movementY : xd;
} }), Bd = rd(Ad), Cd = A({}, Ad, { dataTransfer: 0 }), Dd = rd(Cd), Ed = A({}, ud, { relatedTarget: 0 }), Fd = rd(Ed), Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Hd = rd(Gd), Id = A({}, sd, { clipboardData: function(a) {
  return "clipboardData" in a ? a.clipboardData : window.clipboardData;
} }), Jd = rd(Id), Kd = A({}, sd, { data: 0 }), Ld = rd(Kd), Md = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, Nd = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Pd(a) {
  var b = this.nativeEvent;
  return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
}
function zd() {
  return Pd;
}
var Qd = A({}, ud, { key: function(a) {
  if (a.key) {
    var b = Md[a.key] || a.key;
    if ("Unidentified" !== b) return b;
  }
  return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
  return "keypress" === a.type ? od(a) : 0;
}, keyCode: function(a) {
  return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
}, which: function(a) {
  return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
} }), Rd = rd(Qd), Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Td = rd(Sd), Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd }), Vd = rd(Ud), Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Xd = rd(Wd), Yd = A({}, Ad, {
  deltaX: function(a) {
    return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
  },
  deltaY: function(a) {
    return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Zd = rd(Yd), $d = [9, 13, 27, 32], ae = ia && "CompositionEvent" in window, be = null;
ia && "documentMode" in document && (be = document.documentMode);
var ce = ia && "TextEvent" in window && !be, de = ia && (!ae || be && 8 < be && 11 >= be), ee = String.fromCharCode(32), fe = false;
function ge(a, b) {
  switch (a) {
    case "keyup":
      return -1 !== $d.indexOf(b.keyCode);
    case "keydown":
      return 229 !== b.keyCode;
    case "keypress":
    case "mousedown":
    case "focusout":
      return true;
    default:
      return false;
  }
}
function he(a) {
  a = a.detail;
  return "object" === typeof a && "data" in a ? a.data : null;
}
var ie = false;
function je(a, b) {
  switch (a) {
    case "compositionend":
      return he(b);
    case "keypress":
      if (32 !== b.which) return null;
      fe = true;
      return ee;
    case "textInput":
      return a = b.data, a === ee && fe ? null : a;
    default:
      return null;
  }
}
function ke(a, b) {
  if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
  switch (a) {
    case "paste":
      return null;
    case "keypress":
      if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
        if (b.char && 1 < b.char.length) return b.char;
        if (b.which) return String.fromCharCode(b.which);
      }
      return null;
    case "compositionend":
      return de && "ko" !== b.locale ? null : b.data;
    default:
      return null;
  }
}
var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
function me(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
}
function ne(a, b, c, d) {
  Eb(d);
  b = oe(b, "onChange");
  0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
}
var pe = null, qe = null;
function re(a) {
  se(a, 0);
}
function te(a) {
  var b = ue(a);
  if (Wa(b)) return a;
}
function ve(a, b) {
  if ("change" === a) return b;
}
var we = false;
if (ia) {
  var xe;
  if (ia) {
    var ye = "oninput" in document;
    if (!ye) {
      var ze = document.createElement("div");
      ze.setAttribute("oninput", "return;");
      ye = "function" === typeof ze.oninput;
    }
    xe = ye;
  } else xe = false;
  we = xe && (!document.documentMode || 9 < document.documentMode);
}
function Ae() {
  pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
}
function Be(a) {
  if ("value" === a.propertyName && te(qe)) {
    var b = [];
    ne(b, qe, a, xb(a));
    Jb(re, b);
  }
}
function Ce(a, b, c) {
  "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
}
function De(a) {
  if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
}
function Ee(a, b) {
  if ("click" === a) return te(b);
}
function Fe(a, b) {
  if ("input" === a || "change" === a) return te(b);
}
function Ge(a, b) {
  return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
}
var He = "function" === typeof Object.is ? Object.is : Ge;
function Ie(a, b) {
  if (He(a, b)) return true;
  if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
  var c = Object.keys(a), d = Object.keys(b);
  if (c.length !== d.length) return false;
  for (d = 0; d < c.length; d++) {
    var e = c[d];
    if (!ja.call(b, e) || !He(a[e], b[e])) return false;
  }
  return true;
}
function Je(a) {
  for (; a && a.firstChild; ) a = a.firstChild;
  return a;
}
function Ke(a, b) {
  var c = Je(a);
  a = 0;
  for (var d; c; ) {
    if (3 === c.nodeType) {
      d = a + c.textContent.length;
      if (a <= b && d >= b) return { node: c, offset: b - a };
      a = d;
    }
    a: {
      for (; c; ) {
        if (c.nextSibling) {
          c = c.nextSibling;
          break a;
        }
        c = c.parentNode;
      }
      c = void 0;
    }
    c = Je(c);
  }
}
function Le(a, b) {
  return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
}
function Me() {
  for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
    try {
      var c = "string" === typeof b.contentWindow.location.href;
    } catch (d) {
      c = false;
    }
    if (c) a = b.contentWindow;
    else break;
    b = Xa(a.document);
  }
  return b;
}
function Ne(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
}
function Oe(a) {
  var b = Me(), c = a.focusedElem, d = a.selectionRange;
  if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
    if (null !== d && Ne(c)) {
      if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
      else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
        a = a.getSelection();
        var e = c.textContent.length, f2 = Math.min(d.start, e);
        d = void 0 === d.end ? f2 : Math.min(d.end, e);
        !a.extend && f2 > d && (e = d, d = f2, f2 = e);
        e = Ke(c, f2);
        var g = Ke(
          c,
          d
        );
        e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f2 > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
      }
    }
    b = [];
    for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
    "function" === typeof c.focus && c.focus();
    for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
  }
}
var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = false;
function Ue(a, b, c) {
  var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
  Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
}
function Ve(a, b) {
  var c = {};
  c[a.toLowerCase()] = b.toLowerCase();
  c["Webkit" + a] = "webkit" + b;
  c["Moz" + a] = "moz" + b;
  return c;
}
var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") }, Xe = {}, Ye = {};
ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
function Ze(a) {
  if (Xe[a]) return Xe[a];
  if (!We[a]) return a;
  var b = We[a], c;
  for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
  return a;
}
var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = /* @__PURE__ */ new Map(), ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a, b) {
  df.set(a, b);
  fa(b, [a]);
}
for (var gf = 0; gf < ef.length; gf++) {
  var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
  ff(jf, "on" + kf);
}
ff($e, "onAnimationEnd");
ff(af, "onAnimationIteration");
ff(bf, "onAnimationStart");
ff("dblclick", "onDoubleClick");
ff("focusin", "onFocus");
ff("focusout", "onBlur");
ff(cf, "onTransitionEnd");
ha("onMouseEnter", ["mouseout", "mouseover"]);
ha("onMouseLeave", ["mouseout", "mouseover"]);
ha("onPointerEnter", ["pointerout", "pointerover"]);
ha("onPointerLeave", ["pointerout", "pointerover"]);
fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a, b, c) {
  var d = a.type || "unknown-event";
  a.currentTarget = c;
  Ub(d, b, void 0, a);
  a.currentTarget = null;
}
function se(a, b) {
  b = 0 !== (b & 4);
  for (var c = 0; c < a.length; c++) {
    var d = a[c], e = d.event;
    d = d.listeners;
    a: {
      var f2 = void 0;
      if (b) for (var g = d.length - 1; 0 <= g; g--) {
        var h = d[g], k2 = h.instance, l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
      else for (g = 0; g < d.length; g++) {
        h = d[g];
        k2 = h.instance;
        l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
    }
  }
  if (Qb) throw a = Rb, Qb = false, Rb = null, a;
}
function D(a, b) {
  var c = b[of];
  void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
  var d = a + "__bubble";
  c.has(d) || (pf(b, a, 2, false), c.add(d));
}
function qf(a, b, c) {
  var d = 0;
  b && (d |= 4);
  pf(c, a, d, b);
}
var rf = "_reactListening" + Math.random().toString(36).slice(2);
function sf(a) {
  if (!a[rf]) {
    a[rf] = true;
    da.forEach(function(b2) {
      "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
    });
    var b = 9 === a.nodeType ? a : a.ownerDocument;
    null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
  }
}
function pf(a, b, c, d) {
  switch (jd(b)) {
    case 1:
      var e = ed;
      break;
    case 4:
      e = gd;
      break;
    default:
      e = fd;
  }
  c = e.bind(null, b, c, a);
  e = void 0;
  !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
  d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
}
function hd(a, b, c, d, e) {
  var f2 = d;
  if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
    if (null === d) return;
    var g = d.tag;
    if (3 === g || 4 === g) {
      var h = d.stateNode.containerInfo;
      if (h === e || 8 === h.nodeType && h.parentNode === e) break;
      if (4 === g) for (g = d.return; null !== g; ) {
        var k2 = g.tag;
        if (3 === k2 || 4 === k2) {
          if (k2 = g.stateNode.containerInfo, k2 === e || 8 === k2.nodeType && k2.parentNode === e) return;
        }
        g = g.return;
      }
      for (; null !== h; ) {
        g = Wc(h);
        if (null === g) return;
        k2 = g.tag;
        if (5 === k2 || 6 === k2) {
          d = f2 = g;
          continue a;
        }
        h = h.parentNode;
      }
    }
    d = d.return;
  }
  Jb(function() {
    var d2 = f2, e2 = xb(c), g2 = [];
    a: {
      var h2 = df.get(a);
      if (void 0 !== h2) {
        var k3 = td, n2 = a;
        switch (a) {
          case "keypress":
            if (0 === od(c)) break a;
          case "keydown":
          case "keyup":
            k3 = Rd;
            break;
          case "focusin":
            n2 = "focus";
            k3 = Fd;
            break;
          case "focusout":
            n2 = "blur";
            k3 = Fd;
            break;
          case "beforeblur":
          case "afterblur":
            k3 = Fd;
            break;
          case "click":
            if (2 === c.button) break a;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            k3 = Bd;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            k3 = Dd;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            k3 = Vd;
            break;
          case $e:
          case af:
          case bf:
            k3 = Hd;
            break;
          case cf:
            k3 = Xd;
            break;
          case "scroll":
            k3 = vd;
            break;
          case "wheel":
            k3 = Zd;
            break;
          case "copy":
          case "cut":
          case "paste":
            k3 = Jd;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            k3 = Td;
        }
        var t2 = 0 !== (b & 4), J2 = !t2 && "scroll" === a, x2 = t2 ? null !== h2 ? h2 + "Capture" : null : h2;
        t2 = [];
        for (var w2 = d2, u2; null !== w2; ) {
          u2 = w2;
          var F2 = u2.stateNode;
          5 === u2.tag && null !== F2 && (u2 = F2, null !== x2 && (F2 = Kb(w2, x2), null != F2 && t2.push(tf(w2, F2, u2))));
          if (J2) break;
          w2 = w2.return;
        }
        0 < t2.length && (h2 = new k3(h2, n2, null, c, e2), g2.push({ event: h2, listeners: t2 }));
      }
    }
    if (0 === (b & 7)) {
      a: {
        h2 = "mouseover" === a || "pointerover" === a;
        k3 = "mouseout" === a || "pointerout" === a;
        if (h2 && c !== wb && (n2 = c.relatedTarget || c.fromElement) && (Wc(n2) || n2[uf])) break a;
        if (k3 || h2) {
          h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
          if (k3) {
            if (n2 = c.relatedTarget || c.toElement, k3 = d2, n2 = n2 ? Wc(n2) : null, null !== n2 && (J2 = Vb(n2), n2 !== J2 || 5 !== n2.tag && 6 !== n2.tag)) n2 = null;
          } else k3 = null, n2 = d2;
          if (k3 !== n2) {
            t2 = Bd;
            F2 = "onMouseLeave";
            x2 = "onMouseEnter";
            w2 = "mouse";
            if ("pointerout" === a || "pointerover" === a) t2 = Td, F2 = "onPointerLeave", x2 = "onPointerEnter", w2 = "pointer";
            J2 = null == k3 ? h2 : ue(k3);
            u2 = null == n2 ? h2 : ue(n2);
            h2 = new t2(F2, w2 + "leave", k3, c, e2);
            h2.target = J2;
            h2.relatedTarget = u2;
            F2 = null;
            Wc(e2) === d2 && (t2 = new t2(x2, w2 + "enter", n2, c, e2), t2.target = u2, t2.relatedTarget = J2, F2 = t2);
            J2 = F2;
            if (k3 && n2) b: {
              t2 = k3;
              x2 = n2;
              w2 = 0;
              for (u2 = t2; u2; u2 = vf(u2)) w2++;
              u2 = 0;
              for (F2 = x2; F2; F2 = vf(F2)) u2++;
              for (; 0 < w2 - u2; ) t2 = vf(t2), w2--;
              for (; 0 < u2 - w2; ) x2 = vf(x2), u2--;
              for (; w2--; ) {
                if (t2 === x2 || null !== x2 && t2 === x2.alternate) break b;
                t2 = vf(t2);
                x2 = vf(x2);
              }
              t2 = null;
            }
            else t2 = null;
            null !== k3 && wf(g2, h2, k3, t2, false);
            null !== n2 && null !== J2 && wf(g2, J2, n2, t2, true);
          }
        }
      }
      a: {
        h2 = d2 ? ue(d2) : window;
        k3 = h2.nodeName && h2.nodeName.toLowerCase();
        if ("select" === k3 || "input" === k3 && "file" === h2.type) var na = ve;
        else if (me(h2)) if (we) na = Fe;
        else {
          na = De;
          var xa = Ce;
        }
        else (k3 = h2.nodeName) && "input" === k3.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
        if (na && (na = na(a, d2))) {
          ne(g2, na, c, e2);
          break a;
        }
        xa && xa(a, h2, d2);
        "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
      }
      xa = d2 ? ue(d2) : window;
      switch (a) {
        case "focusin":
          if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
          break;
        case "focusout":
          Se = Re = Qe = null;
          break;
        case "mousedown":
          Te = true;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Te = false;
          Ue(g2, c, e2);
          break;
        case "selectionchange":
          if (Pe) break;
        case "keydown":
        case "keyup":
          Ue(g2, c, e2);
      }
      var $a;
      if (ae) b: {
        switch (a) {
          case "compositionstart":
            var ba = "onCompositionStart";
            break b;
          case "compositionend":
            ba = "onCompositionEnd";
            break b;
          case "compositionupdate":
            ba = "onCompositionUpdate";
            break b;
        }
        ba = void 0;
      }
      else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
      ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
      if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
    }
    se(g2, b);
  });
}
function tf(a, b, c) {
  return { instance: a, listener: b, currentTarget: c };
}
function oe(a, b) {
  for (var c = b + "Capture", d = []; null !== a; ) {
    var e = a, f2 = e.stateNode;
    5 === e.tag && null !== f2 && (e = f2, f2 = Kb(a, c), null != f2 && d.unshift(tf(a, f2, e)), f2 = Kb(a, b), null != f2 && d.push(tf(a, f2, e)));
    a = a.return;
  }
  return d;
}
function vf(a) {
  if (null === a) return null;
  do
    a = a.return;
  while (a && 5 !== a.tag);
  return a ? a : null;
}
function wf(a, b, c, d, e) {
  for (var f2 = b._reactName, g = []; null !== c && c !== d; ) {
    var h = c, k2 = h.alternate, l2 = h.stateNode;
    if (null !== k2 && k2 === d) break;
    5 === h.tag && null !== l2 && (h = l2, e ? (k2 = Kb(c, f2), null != k2 && g.unshift(tf(c, k2, h))) : e || (k2 = Kb(c, f2), null != k2 && g.push(tf(c, k2, h))));
    c = c.return;
  }
  0 !== g.length && a.push({ event: b, listeners: g });
}
var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
function zf(a) {
  return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
}
function Af(a, b, c) {
  b = zf(b);
  if (zf(a) !== b && c) throw Error(p(425));
}
function Bf() {
}
var Cf = null, Df = null;
function Ef(a, b) {
  return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
}
var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
  return Hf.resolve(null).then(a).catch(If);
} : Ff;
function If(a) {
  setTimeout(function() {
    throw a;
  });
}
function Kf(a, b) {
  var c = b, d = 0;
  do {
    var e = c.nextSibling;
    a.removeChild(c);
    if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
      if (0 === d) {
        a.removeChild(e);
        bd(b);
        return;
      }
      d--;
    } else "$" !== c && "$?" !== c && "$!" !== c || d++;
    c = e;
  } while (c);
  bd(b);
}
function Lf(a) {
  for (; null != a; a = a.nextSibling) {
    var b = a.nodeType;
    if (1 === b || 3 === b) break;
    if (8 === b) {
      b = a.data;
      if ("$" === b || "$!" === b || "$?" === b) break;
      if ("/$" === b) return null;
    }
  }
  return a;
}
function Mf(a) {
  a = a.previousSibling;
  for (var b = 0; a; ) {
    if (8 === a.nodeType) {
      var c = a.data;
      if ("$" === c || "$!" === c || "$?" === c) {
        if (0 === b) return a;
        b--;
      } else "/$" === c && b++;
    }
    a = a.previousSibling;
  }
  return null;
}
var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
function Wc(a) {
  var b = a[Of];
  if (b) return b;
  for (var c = a.parentNode; c; ) {
    if (b = c[uf] || c[Of]) {
      c = b.alternate;
      if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
        if (c = a[Of]) return c;
        a = Mf(a);
      }
      return b;
    }
    a = c;
    c = a.parentNode;
  }
  return null;
}
function Cb(a) {
  a = a[Of] || a[uf];
  return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
}
function ue(a) {
  if (5 === a.tag || 6 === a.tag) return a.stateNode;
  throw Error(p(33));
}
function Db(a) {
  return a[Pf] || null;
}
var Sf = [], Tf = -1;
function Uf(a) {
  return { current: a };
}
function E(a) {
  0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
}
function G(a, b) {
  Tf++;
  Sf[Tf] = a.current;
  a.current = b;
}
var Vf = {}, H = Uf(Vf), Wf = Uf(false), Xf = Vf;
function Yf(a, b) {
  var c = a.type.contextTypes;
  if (!c) return Vf;
  var d = a.stateNode;
  if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
  var e = {}, f2;
  for (f2 in c) e[f2] = b[f2];
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
  return e;
}
function Zf(a) {
  a = a.childContextTypes;
  return null !== a && void 0 !== a;
}
function $f() {
  E(Wf);
  E(H);
}
function ag(a, b, c) {
  if (H.current !== Vf) throw Error(p(168));
  G(H, b);
  G(Wf, c);
}
function bg(a, b, c) {
  var d = a.stateNode;
  b = b.childContextTypes;
  if ("function" !== typeof d.getChildContext) return c;
  d = d.getChildContext();
  for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
  return A({}, c, d);
}
function cg(a) {
  a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
  Xf = H.current;
  G(H, a);
  G(Wf, Wf.current);
  return true;
}
function dg(a, b, c) {
  var d = a.stateNode;
  if (!d) throw Error(p(169));
  c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
  G(Wf, c);
}
var eg = null, fg = false, gg = false;
function hg(a) {
  null === eg ? eg = [a] : eg.push(a);
}
function ig(a) {
  fg = true;
  hg(a);
}
function jg() {
  if (!gg && null !== eg) {
    gg = true;
    var a = 0, b = C;
    try {
      var c = eg;
      for (C = 1; a < c.length; a++) {
        var d = c[a];
        do
          d = d(true);
        while (null !== d);
      }
      eg = null;
      fg = false;
    } catch (e) {
      throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
    } finally {
      C = b, gg = false;
    }
  }
  return null;
}
var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
function tg(a, b) {
  kg[lg++] = ng;
  kg[lg++] = mg;
  mg = a;
  ng = b;
}
function ug(a, b, c) {
  og[pg++] = rg;
  og[pg++] = sg;
  og[pg++] = qg;
  qg = a;
  var d = rg;
  a = sg;
  var e = 32 - oc(d) - 1;
  d &= ~(1 << e);
  c += 1;
  var f2 = 32 - oc(b) + e;
  if (30 < f2) {
    var g = e - e % 5;
    f2 = (d & (1 << g) - 1).toString(32);
    d >>= g;
    e -= g;
    rg = 1 << 32 - oc(b) + e | c << e | d;
    sg = f2 + a;
  } else rg = 1 << f2 | c << e | d, sg = a;
}
function vg(a) {
  null !== a.return && (tg(a, 1), ug(a, 1, 0));
}
function wg(a) {
  for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
  for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
}
var xg = null, yg = null, I = false, zg = null;
function Ag(a, b) {
  var c = Bg(5, null, null, 0);
  c.elementType = "DELETED";
  c.stateNode = b;
  c.return = a;
  b = a.deletions;
  null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
}
function Cg(a, b) {
  switch (a.tag) {
    case 5:
      var c = a.type;
      b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
      return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
    case 6:
      return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
    case 13:
      return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
    default:
      return false;
  }
}
function Dg(a) {
  return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
}
function Eg(a) {
  if (I) {
    var b = yg;
    if (b) {
      var c = b;
      if (!Cg(a, b)) {
        if (Dg(a)) throw Error(p(418));
        b = Lf(c.nextSibling);
        var d = xg;
        b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
      }
    } else {
      if (Dg(a)) throw Error(p(418));
      a.flags = a.flags & -4097 | 2;
      I = false;
      xg = a;
    }
  }
}
function Fg(a) {
  for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
  xg = a;
}
function Gg(a) {
  if (a !== xg) return false;
  if (!I) return Fg(a), I = true, false;
  var b;
  (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
  if (b && (b = yg)) {
    if (Dg(a)) throw Hg(), Error(p(418));
    for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
  }
  Fg(a);
  if (13 === a.tag) {
    a = a.memoizedState;
    a = null !== a ? a.dehydrated : null;
    if (!a) throw Error(p(317));
    a: {
      a = a.nextSibling;
      for (b = 0; a; ) {
        if (8 === a.nodeType) {
          var c = a.data;
          if ("/$" === c) {
            if (0 === b) {
              yg = Lf(a.nextSibling);
              break a;
            }
            b--;
          } else "$" !== c && "$!" !== c && "$?" !== c || b++;
        }
        a = a.nextSibling;
      }
      yg = null;
    }
  } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
  return true;
}
function Hg() {
  for (var a = yg; a; ) a = Lf(a.nextSibling);
}
function Ig() {
  yg = xg = null;
  I = false;
}
function Jg(a) {
  null === zg ? zg = [a] : zg.push(a);
}
var Kg = ua.ReactCurrentBatchConfig;
function Lg(a, b, c) {
  a = c.ref;
  if (null !== a && "function" !== typeof a && "object" !== typeof a) {
    if (c._owner) {
      c = c._owner;
      if (c) {
        if (1 !== c.tag) throw Error(p(309));
        var d = c.stateNode;
      }
      if (!d) throw Error(p(147, a));
      var e = d, f2 = "" + a;
      if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f2) return b.ref;
      b = function(a2) {
        var b2 = e.refs;
        null === a2 ? delete b2[f2] : b2[f2] = a2;
      };
      b._stringRef = f2;
      return b;
    }
    if ("string" !== typeof a) throw Error(p(284));
    if (!c._owner) throw Error(p(290, a));
  }
  return a;
}
function Mg(a, b) {
  a = Object.prototype.toString.call(b);
  throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
}
function Ng(a) {
  var b = a._init;
  return b(a._payload);
}
function Og(a) {
  function b(b2, c2) {
    if (a) {
      var d2 = b2.deletions;
      null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
    }
  }
  function c(c2, d2) {
    if (!a) return null;
    for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
    return null;
  }
  function d(a2, b2) {
    for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
    return a2;
  }
  function e(a2, b2) {
    a2 = Pg(a2, b2);
    a2.index = 0;
    a2.sibling = null;
    return a2;
  }
  function f2(b2, c2, d2) {
    b2.index = d2;
    if (!a) return b2.flags |= 1048576, c2;
    d2 = b2.alternate;
    if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
    b2.flags |= 2;
    return c2;
  }
  function g(b2) {
    a && null === b2.alternate && (b2.flags |= 2);
    return b2;
  }
  function h(a2, b2, c2, d2) {
    if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function k2(a2, b2, c2, d2) {
    var f3 = c2.type;
    if (f3 === ya) return m2(a2, b2, c2.props.children, d2, c2.key);
    if (null !== b2 && (b2.elementType === f3 || "object" === typeof f3 && null !== f3 && f3.$$typeof === Ha && Ng(f3) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
    d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
    d2.ref = Lg(a2, b2, c2);
    d2.return = a2;
    return d2;
  }
  function l2(a2, b2, c2, d2) {
    if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2.children || []);
    b2.return = a2;
    return b2;
  }
  function m2(a2, b2, c2, d2, f3) {
    if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f3), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function q2(a2, b2, c2) {
    if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
    if ("object" === typeof b2 && null !== b2) {
      switch (b2.$$typeof) {
        case va:
          return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
        case wa:
          return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
        case Ha:
          var d2 = b2._init;
          return q2(a2, d2(b2._payload), c2);
      }
      if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
      Mg(a2, b2);
    }
    return null;
  }
  function r2(a2, b2, c2, d2) {
    var e2 = null !== b2 ? b2.key : null;
    if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
    if ("object" === typeof c2 && null !== c2) {
      switch (c2.$$typeof) {
        case va:
          return c2.key === e2 ? k2(a2, b2, c2, d2) : null;
        case wa:
          return c2.key === e2 ? l2(a2, b2, c2, d2) : null;
        case Ha:
          return e2 = c2._init, r2(
            a2,
            b2,
            e2(c2._payload),
            d2
          );
      }
      if (eb(c2) || Ka(c2)) return null !== e2 ? null : m2(a2, b2, c2, d2, null);
      Mg(a2, c2);
    }
    return null;
  }
  function y2(a2, b2, c2, d2, e2) {
    if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
    if ("object" === typeof d2 && null !== d2) {
      switch (d2.$$typeof) {
        case va:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k2(b2, a2, d2, e2);
        case wa:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l2(b2, a2, d2, e2);
        case Ha:
          var f3 = d2._init;
          return y2(a2, b2, c2, f3(d2._payload), e2);
      }
      if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m2(b2, a2, d2, e2, null);
      Mg(b2, d2);
    }
    return null;
  }
  function n2(e2, g2, h2, k3) {
    for (var l3 = null, m3 = null, u2 = g2, w2 = g2 = 0, x2 = null; null !== u2 && w2 < h2.length; w2++) {
      u2.index > w2 ? (x2 = u2, u2 = null) : x2 = u2.sibling;
      var n3 = r2(e2, u2, h2[w2], k3);
      if (null === n3) {
        null === u2 && (u2 = x2);
        break;
      }
      a && u2 && null === n3.alternate && b(e2, u2);
      g2 = f2(n3, g2, w2);
      null === m3 ? l3 = n3 : m3.sibling = n3;
      m3 = n3;
      u2 = x2;
    }
    if (w2 === h2.length) return c(e2, u2), I && tg(e2, w2), l3;
    if (null === u2) {
      for (; w2 < h2.length; w2++) u2 = q2(e2, h2[w2], k3), null !== u2 && (g2 = f2(u2, g2, w2), null === m3 ? l3 = u2 : m3.sibling = u2, m3 = u2);
      I && tg(e2, w2);
      return l3;
    }
    for (u2 = d(e2, u2); w2 < h2.length; w2++) x2 = y2(u2, e2, w2, h2[w2], k3), null !== x2 && (a && null !== x2.alternate && u2.delete(null === x2.key ? w2 : x2.key), g2 = f2(x2, g2, w2), null === m3 ? l3 = x2 : m3.sibling = x2, m3 = x2);
    a && u2.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function t2(e2, g2, h2, k3) {
    var l3 = Ka(h2);
    if ("function" !== typeof l3) throw Error(p(150));
    h2 = l3.call(h2);
    if (null == h2) throw Error(p(151));
    for (var u2 = l3 = null, m3 = g2, w2 = g2 = 0, x2 = null, n3 = h2.next(); null !== m3 && !n3.done; w2++, n3 = h2.next()) {
      m3.index > w2 ? (x2 = m3, m3 = null) : x2 = m3.sibling;
      var t3 = r2(e2, m3, n3.value, k3);
      if (null === t3) {
        null === m3 && (m3 = x2);
        break;
      }
      a && m3 && null === t3.alternate && b(e2, m3);
      g2 = f2(t3, g2, w2);
      null === u2 ? l3 = t3 : u2.sibling = t3;
      u2 = t3;
      m3 = x2;
    }
    if (n3.done) return c(
      e2,
      m3
    ), I && tg(e2, w2), l3;
    if (null === m3) {
      for (; !n3.done; w2++, n3 = h2.next()) n3 = q2(e2, n3.value, k3), null !== n3 && (g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
      I && tg(e2, w2);
      return l3;
    }
    for (m3 = d(e2, m3); !n3.done; w2++, n3 = h2.next()) n3 = y2(m3, e2, w2, n3.value, k3), null !== n3 && (a && null !== n3.alternate && m3.delete(null === n3.key ? w2 : n3.key), g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
    a && m3.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function J2(a2, d2, f3, h2) {
    "object" === typeof f3 && null !== f3 && f3.type === ya && null === f3.key && (f3 = f3.props.children);
    if ("object" === typeof f3 && null !== f3) {
      switch (f3.$$typeof) {
        case va:
          a: {
            for (var k3 = f3.key, l3 = d2; null !== l3; ) {
              if (l3.key === k3) {
                k3 = f3.type;
                if (k3 === ya) {
                  if (7 === l3.tag) {
                    c(a2, l3.sibling);
                    d2 = e(l3, f3.props.children);
                    d2.return = a2;
                    a2 = d2;
                    break a;
                  }
                } else if (l3.elementType === k3 || "object" === typeof k3 && null !== k3 && k3.$$typeof === Ha && Ng(k3) === l3.type) {
                  c(a2, l3.sibling);
                  d2 = e(l3, f3.props);
                  d2.ref = Lg(a2, l3, f3);
                  d2.return = a2;
                  a2 = d2;
                  break a;
                }
                c(a2, l3);
                break;
              } else b(a2, l3);
              l3 = l3.sibling;
            }
            f3.type === ya ? (d2 = Tg(f3.props.children, a2.mode, h2, f3.key), d2.return = a2, a2 = d2) : (h2 = Rg(f3.type, f3.key, f3.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f3), h2.return = a2, a2 = h2);
          }
          return g(a2);
        case wa:
          a: {
            for (l3 = f3.key; null !== d2; ) {
              if (d2.key === l3) if (4 === d2.tag && d2.stateNode.containerInfo === f3.containerInfo && d2.stateNode.implementation === f3.implementation) {
                c(a2, d2.sibling);
                d2 = e(d2, f3.children || []);
                d2.return = a2;
                a2 = d2;
                break a;
              } else {
                c(a2, d2);
                break;
              }
              else b(a2, d2);
              d2 = d2.sibling;
            }
            d2 = Sg(f3, a2.mode, h2);
            d2.return = a2;
            a2 = d2;
          }
          return g(a2);
        case Ha:
          return l3 = f3._init, J2(a2, d2, l3(f3._payload), h2);
      }
      if (eb(f3)) return n2(a2, d2, f3, h2);
      if (Ka(f3)) return t2(a2, d2, f3, h2);
      Mg(a2, f3);
    }
    return "string" === typeof f3 && "" !== f3 || "number" === typeof f3 ? (f3 = "" + f3, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f3), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f3, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
  }
  return J2;
}
var Ug = Og(true), Vg = Og(false), Wg = Uf(null), Xg = null, Yg = null, Zg = null;
function $g() {
  Zg = Yg = Xg = null;
}
function ah(a) {
  var b = Wg.current;
  E(Wg);
  a._currentValue = b;
}
function bh(a, b, c) {
  for (; null !== a; ) {
    var d = a.alternate;
    (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
    if (a === c) break;
    a = a.return;
  }
}
function ch(a, b) {
  Xg = a;
  Zg = Yg = null;
  a = a.dependencies;
  null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
}
function eh(a) {
  var b = a._currentValue;
  if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
    if (null === Xg) throw Error(p(308));
    Yg = a;
    Xg.dependencies = { lanes: 0, firstContext: a };
  } else Yg = Yg.next = a;
  return b;
}
var fh = null;
function gh(a) {
  null === fh ? fh = [a] : fh.push(a);
}
function hh(a, b, c, d) {
  var e = b.interleaved;
  null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
  b.interleaved = c;
  return ih(a, d);
}
function ih(a, b) {
  a.lanes |= b;
  var c = a.alternate;
  null !== c && (c.lanes |= b);
  c = a;
  for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
  return 3 === c.tag ? c.stateNode : null;
}
var jh = false;
function kh(a) {
  a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function lh(a, b) {
  a = a.updateQueue;
  b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
}
function mh(a, b) {
  return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
}
function nh(a, b, c) {
  var d = a.updateQueue;
  if (null === d) return null;
  d = d.shared;
  if (0 !== (K & 2)) {
    var e = d.pending;
    null === e ? b.next = b : (b.next = e.next, e.next = b);
    d.pending = b;
    return ih(a, c);
  }
  e = d.interleaved;
  null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
  d.interleaved = b;
  return ih(a, c);
}
function oh(a, b, c) {
  b = b.updateQueue;
  if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
function ph(a, b) {
  var c = a.updateQueue, d = a.alternate;
  if (null !== d && (d = d.updateQueue, c === d)) {
    var e = null, f2 = null;
    c = c.firstBaseUpdate;
    if (null !== c) {
      do {
        var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
        null === f2 ? e = f2 = g : f2 = f2.next = g;
        c = c.next;
      } while (null !== c);
      null === f2 ? e = f2 = b : f2 = f2.next = b;
    } else e = f2 = b;
    c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f2, shared: d.shared, effects: d.effects };
    a.updateQueue = c;
    return;
  }
  a = c.lastBaseUpdate;
  null === a ? c.firstBaseUpdate = b : a.next = b;
  c.lastBaseUpdate = b;
}
function qh(a, b, c, d) {
  var e = a.updateQueue;
  jh = false;
  var f2 = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
  if (null !== h) {
    e.shared.pending = null;
    var k2 = h, l2 = k2.next;
    k2.next = null;
    null === g ? f2 = l2 : g.next = l2;
    g = k2;
    var m2 = a.alternate;
    null !== m2 && (m2 = m2.updateQueue, h = m2.lastBaseUpdate, h !== g && (null === h ? m2.firstBaseUpdate = l2 : h.next = l2, m2.lastBaseUpdate = k2));
  }
  if (null !== f2) {
    var q2 = e.baseState;
    g = 0;
    m2 = l2 = k2 = null;
    h = f2;
    do {
      var r2 = h.lane, y2 = h.eventTime;
      if ((d & r2) === r2) {
        null !== m2 && (m2 = m2.next = {
          eventTime: y2,
          lane: 0,
          tag: h.tag,
          payload: h.payload,
          callback: h.callback,
          next: null
        });
        a: {
          var n2 = a, t2 = h;
          r2 = b;
          y2 = c;
          switch (t2.tag) {
            case 1:
              n2 = t2.payload;
              if ("function" === typeof n2) {
                q2 = n2.call(y2, q2, r2);
                break a;
              }
              q2 = n2;
              break a;
            case 3:
              n2.flags = n2.flags & -65537 | 128;
            case 0:
              n2 = t2.payload;
              r2 = "function" === typeof n2 ? n2.call(y2, q2, r2) : n2;
              if (null === r2 || void 0 === r2) break a;
              q2 = A({}, q2, r2);
              break a;
            case 2:
              jh = true;
          }
        }
        null !== h.callback && 0 !== h.lane && (a.flags |= 64, r2 = e.effects, null === r2 ? e.effects = [h] : r2.push(h));
      } else y2 = { eventTime: y2, lane: r2, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m2 ? (l2 = m2 = y2, k2 = q2) : m2 = m2.next = y2, g |= r2;
      h = h.next;
      if (null === h) if (h = e.shared.pending, null === h) break;
      else r2 = h, h = r2.next, r2.next = null, e.lastBaseUpdate = r2, e.shared.pending = null;
    } while (1);
    null === m2 && (k2 = q2);
    e.baseState = k2;
    e.firstBaseUpdate = l2;
    e.lastBaseUpdate = m2;
    b = e.shared.interleaved;
    if (null !== b) {
      e = b;
      do
        g |= e.lane, e = e.next;
      while (e !== b);
    } else null === f2 && (e.shared.lanes = 0);
    rh |= g;
    a.lanes = g;
    a.memoizedState = q2;
  }
}
function sh(a, b, c) {
  a = b.effects;
  b.effects = null;
  if (null !== a) for (b = 0; b < a.length; b++) {
    var d = a[b], e = d.callback;
    if (null !== e) {
      d.callback = null;
      d = c;
      if ("function" !== typeof e) throw Error(p(191, e));
      e.call(d);
    }
  }
}
var th = {}, uh = Uf(th), vh = Uf(th), wh = Uf(th);
function xh(a) {
  if (a === th) throw Error(p(174));
  return a;
}
function yh(a, b) {
  G(wh, b);
  G(vh, a);
  G(uh, th);
  a = b.nodeType;
  switch (a) {
    case 9:
    case 11:
      b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
      break;
    default:
      a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
  }
  E(uh);
  G(uh, b);
}
function zh() {
  E(uh);
  E(vh);
  E(wh);
}
function Ah(a) {
  xh(wh.current);
  var b = xh(uh.current);
  var c = lb(b, a.type);
  b !== c && (G(vh, a), G(uh, c));
}
function Bh(a) {
  vh.current === a && (E(uh), E(vh));
}
var L = Uf(0);
function Ch(a) {
  for (var b = a; null !== b; ) {
    if (13 === b.tag) {
      var c = b.memoizedState;
      if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
    } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
      if (0 !== (b.flags & 128)) return b;
    } else if (null !== b.child) {
      b.child.return = b;
      b = b.child;
      continue;
    }
    if (b === a) break;
    for (; null === b.sibling; ) {
      if (null === b.return || b.return === a) return null;
      b = b.return;
    }
    b.sibling.return = b.return;
    b = b.sibling;
  }
  return null;
}
var Dh = [];
function Eh() {
  for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
  Dh.length = 0;
}
var Fh = ua.ReactCurrentDispatcher, Gh = ua.ReactCurrentBatchConfig, Hh = 0, M = null, N = null, O = null, Ih = false, Jh = false, Kh = 0, Lh = 0;
function P() {
  throw Error(p(321));
}
function Mh(a, b) {
  if (null === b) return false;
  for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
  return true;
}
function Nh(a, b, c, d, e, f2) {
  Hh = f2;
  M = b;
  b.memoizedState = null;
  b.updateQueue = null;
  b.lanes = 0;
  Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
  a = c(d, e);
  if (Jh) {
    f2 = 0;
    do {
      Jh = false;
      Kh = 0;
      if (25 <= f2) throw Error(p(301));
      f2 += 1;
      O = N = null;
      b.updateQueue = null;
      Fh.current = Qh;
      a = c(d, e);
    } while (Jh);
  }
  Fh.current = Rh;
  b = null !== N && null !== N.next;
  Hh = 0;
  O = N = M = null;
  Ih = false;
  if (b) throw Error(p(300));
  return a;
}
function Sh() {
  var a = 0 !== Kh;
  Kh = 0;
  return a;
}
function Th() {
  var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  null === O ? M.memoizedState = O = a : O = O.next = a;
  return O;
}
function Uh() {
  if (null === N) {
    var a = M.alternate;
    a = null !== a ? a.memoizedState : null;
  } else a = N.next;
  var b = null === O ? M.memoizedState : O.next;
  if (null !== b) O = b, N = a;
  else {
    if (null === a) throw Error(p(310));
    N = a;
    a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
    null === O ? M.memoizedState = O = a : O = O.next = a;
  }
  return O;
}
function Vh(a, b) {
  return "function" === typeof b ? b(a) : b;
}
function Wh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = N, e = d.baseQueue, f2 = c.pending;
  if (null !== f2) {
    if (null !== e) {
      var g = e.next;
      e.next = f2.next;
      f2.next = g;
    }
    d.baseQueue = e = f2;
    c.pending = null;
  }
  if (null !== e) {
    f2 = e.next;
    d = d.baseState;
    var h = g = null, k2 = null, l2 = f2;
    do {
      var m2 = l2.lane;
      if ((Hh & m2) === m2) null !== k2 && (k2 = k2.next = { lane: 0, action: l2.action, hasEagerState: l2.hasEagerState, eagerState: l2.eagerState, next: null }), d = l2.hasEagerState ? l2.eagerState : a(d, l2.action);
      else {
        var q2 = {
          lane: m2,
          action: l2.action,
          hasEagerState: l2.hasEagerState,
          eagerState: l2.eagerState,
          next: null
        };
        null === k2 ? (h = k2 = q2, g = d) : k2 = k2.next = q2;
        M.lanes |= m2;
        rh |= m2;
      }
      l2 = l2.next;
    } while (null !== l2 && l2 !== f2);
    null === k2 ? g = d : k2.next = h;
    He(d, b.memoizedState) || (dh = true);
    b.memoizedState = d;
    b.baseState = g;
    b.baseQueue = k2;
    c.lastRenderedState = d;
  }
  a = c.interleaved;
  if (null !== a) {
    e = a;
    do
      f2 = e.lane, M.lanes |= f2, rh |= f2, e = e.next;
    while (e !== a);
  } else null === e && (c.lanes = 0);
  return [b.memoizedState, c.dispatch];
}
function Xh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = c.dispatch, e = c.pending, f2 = b.memoizedState;
  if (null !== e) {
    c.pending = null;
    var g = e = e.next;
    do
      f2 = a(f2, g.action), g = g.next;
    while (g !== e);
    He(f2, b.memoizedState) || (dh = true);
    b.memoizedState = f2;
    null === b.baseQueue && (b.baseState = f2);
    c.lastRenderedState = f2;
  }
  return [f2, d];
}
function Yh() {
}
function Zh(a, b) {
  var c = M, d = Uh(), e = b(), f2 = !He(d.memoizedState, e);
  f2 && (d.memoizedState = e, dh = true);
  d = d.queue;
  $h(ai.bind(null, c, d, a), [a]);
  if (d.getSnapshot !== b || f2 || null !== O && O.memoizedState.tag & 1) {
    c.flags |= 2048;
    bi(9, ci.bind(null, c, d, e, b), void 0, null);
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(c, b, e);
  }
  return e;
}
function di(a, b, c) {
  a.flags |= 16384;
  a = { getSnapshot: b, value: c };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
}
function ci(a, b, c, d) {
  b.value = c;
  b.getSnapshot = d;
  ei(b) && fi(a);
}
function ai(a, b, c) {
  return c(function() {
    ei(b) && fi(a);
  });
}
function ei(a) {
  var b = a.getSnapshot;
  a = a.value;
  try {
    var c = b();
    return !He(a, c);
  } catch (d) {
    return true;
  }
}
function fi(a) {
  var b = ih(a, 1);
  null !== b && gi(b, a, 1, -1);
}
function hi(a) {
  var b = Th();
  "function" === typeof a && (a = a());
  b.memoizedState = b.baseState = a;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
  b.queue = a;
  a = a.dispatch = ii.bind(null, M, a);
  return [b.memoizedState, a];
}
function bi(a, b, c, d) {
  a = { tag: a, create: b, destroy: c, deps: d, next: null };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
  return a;
}
function ji() {
  return Uh().memoizedState;
}
function ki(a, b, c, d) {
  var e = Th();
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
}
function li(a, b, c, d) {
  var e = Uh();
  d = void 0 === d ? null : d;
  var f2 = void 0;
  if (null !== N) {
    var g = N.memoizedState;
    f2 = g.destroy;
    if (null !== d && Mh(d, g.deps)) {
      e.memoizedState = bi(b, c, f2, d);
      return;
    }
  }
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, f2, d);
}
function mi(a, b) {
  return ki(8390656, 8, a, b);
}
function $h(a, b) {
  return li(2048, 8, a, b);
}
function ni(a, b) {
  return li(4, 2, a, b);
}
function oi(a, b) {
  return li(4, 4, a, b);
}
function pi(a, b) {
  if ("function" === typeof b) return a = a(), b(a), function() {
    b(null);
  };
  if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
    b.current = null;
  };
}
function qi(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return li(4, 4, pi.bind(null, b, a), c);
}
function ri() {
}
function si(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  c.memoizedState = [a, b];
  return a;
}
function ti(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  a = a();
  c.memoizedState = [a, b];
  return a;
}
function ui(a, b, c) {
  if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
  He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
  return b;
}
function vi(a, b) {
  var c = C;
  C = 0 !== c && 4 > c ? c : 4;
  a(true);
  var d = Gh.transition;
  Gh.transition = {};
  try {
    a(false), b();
  } finally {
    C = c, Gh.transition = d;
  }
}
function wi() {
  return Uh().memoizedState;
}
function xi(a, b, c) {
  var d = yi(a);
  c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, c);
  else if (c = hh(a, b, c, d), null !== c) {
    var e = R();
    gi(c, a, d, e);
    Bi(c, b, d);
  }
}
function ii(a, b, c) {
  var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, e);
  else {
    var f2 = a.alternate;
    if (0 === a.lanes && (null === f2 || 0 === f2.lanes) && (f2 = b.lastRenderedReducer, null !== f2)) try {
      var g = b.lastRenderedState, h = f2(g, c);
      e.hasEagerState = true;
      e.eagerState = h;
      if (He(h, g)) {
        var k2 = b.interleaved;
        null === k2 ? (e.next = e, gh(b)) : (e.next = k2.next, k2.next = e);
        b.interleaved = e;
        return;
      }
    } catch (l2) {
    } finally {
    }
    c = hh(a, b, e, d);
    null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
  }
}
function zi(a) {
  var b = a.alternate;
  return a === M || null !== b && b === M;
}
function Ai(a, b) {
  Jh = Ih = true;
  var c = a.pending;
  null === c ? b.next = b : (b.next = c.next, c.next = b);
  a.pending = b;
}
function Bi(a, b, c) {
  if (0 !== (c & 4194240)) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false }, Oh = { readContext: eh, useCallback: function(a, b) {
  Th().memoizedState = [a, void 0 === b ? null : b];
  return a;
}, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return ki(
    4194308,
    4,
    pi.bind(null, b, a),
    c
  );
}, useLayoutEffect: function(a, b) {
  return ki(4194308, 4, a, b);
}, useInsertionEffect: function(a, b) {
  return ki(4, 2, a, b);
}, useMemo: function(a, b) {
  var c = Th();
  b = void 0 === b ? null : b;
  a = a();
  c.memoizedState = [a, b];
  return a;
}, useReducer: function(a, b, c) {
  var d = Th();
  b = void 0 !== c ? c(b) : b;
  d.memoizedState = d.baseState = b;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
  d.queue = a;
  a = a.dispatch = xi.bind(null, M, a);
  return [d.memoizedState, a];
}, useRef: function(a) {
  var b = Th();
  a = { current: a };
  return b.memoizedState = a;
}, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
  return Th().memoizedState = a;
}, useTransition: function() {
  var a = hi(false), b = a[0];
  a = vi.bind(null, a[1]);
  Th().memoizedState = a;
  return [b, a];
}, useMutableSource: function() {
}, useSyncExternalStore: function(a, b, c) {
  var d = M, e = Th();
  if (I) {
    if (void 0 === c) throw Error(p(407));
    c = c();
  } else {
    c = b();
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(d, b, c);
  }
  e.memoizedState = c;
  var f2 = { value: c, getSnapshot: b };
  e.queue = f2;
  mi(ai.bind(
    null,
    d,
    f2,
    a
  ), [a]);
  d.flags |= 2048;
  bi(9, ci.bind(null, d, f2, c, b), void 0, null);
  return c;
}, useId: function() {
  var a = Th(), b = Q.identifierPrefix;
  if (I) {
    var c = sg;
    var d = rg;
    c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
    b = ":" + b + "R" + c;
    c = Kh++;
    0 < c && (b += "H" + c.toString(32));
    b += ":";
  } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
  return a.memoizedState = b;
}, unstable_isNewReconciler: false }, Ph = {
  readContext: eh,
  useCallback: si,
  useContext: eh,
  useEffect: $h,
  useImperativeHandle: qi,
  useInsertionEffect: ni,
  useLayoutEffect: oi,
  useMemo: ti,
  useReducer: Wh,
  useRef: ji,
  useState: function() {
    return Wh(Vh);
  },
  useDebugValue: ri,
  useDeferredValue: function(a) {
    var b = Uh();
    return ui(b, N.memoizedState, a);
  },
  useTransition: function() {
    var a = Wh(Vh)[0], b = Uh().memoizedState;
    return [a, b];
  },
  useMutableSource: Yh,
  useSyncExternalStore: Zh,
  useId: wi,
  unstable_isNewReconciler: false
}, Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
  return Xh(Vh);
}, useDebugValue: ri, useDeferredValue: function(a) {
  var b = Uh();
  return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
}, useTransition: function() {
  var a = Xh(Vh)[0], b = Uh().memoizedState;
  return [a, b];
}, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
function Ci(a, b) {
  if (a && a.defaultProps) {
    b = A({}, b);
    a = a.defaultProps;
    for (var c in a) void 0 === b[c] && (b[c] = a[c]);
    return b;
  }
  return b;
}
function Di(a, b, c, d) {
  b = a.memoizedState;
  c = c(d, b);
  c = null === c || void 0 === c ? b : A({}, b, c);
  a.memoizedState = c;
  0 === a.lanes && (a.updateQueue.baseState = c);
}
var Ei = { isMounted: function(a) {
  return (a = a._reactInternals) ? Vb(a) === a : false;
}, enqueueSetState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueReplaceState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.tag = 1;
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueForceUpdate: function(a, b) {
  a = a._reactInternals;
  var c = R(), d = yi(a), e = mh(c, d);
  e.tag = 2;
  void 0 !== b && null !== b && (e.callback = b);
  b = nh(a, e, d);
  null !== b && (gi(b, a, d, c), oh(b, a, d));
} };
function Fi(a, b, c, d, e, f2, g) {
  a = a.stateNode;
  return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f2, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f2) : true;
}
function Gi(a, b, c) {
  var d = false, e = Vf;
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? f2 = eh(f2) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f2 = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
  b = new b(c, f2);
  a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
  b.updater = Ei;
  a.stateNode = b;
  b._reactInternals = a;
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f2);
  return b;
}
function Hi(a, b, c, d) {
  a = b.state;
  "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
  "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
  b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
}
function Ii(a, b, c, d) {
  var e = a.stateNode;
  e.props = c;
  e.state = a.memoizedState;
  e.refs = {};
  kh(a);
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? e.context = eh(f2) : (f2 = Zf(b) ? Xf : H.current, e.context = Yf(a, f2));
  e.state = a.memoizedState;
  f2 = b.getDerivedStateFromProps;
  "function" === typeof f2 && (Di(a, b, f2, c), e.state = a.memoizedState);
  "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
  "function" === typeof e.componentDidMount && (a.flags |= 4194308);
}
function Ji(a, b) {
  try {
    var c = "", d = b;
    do
      c += Pa(d), d = d.return;
    while (d);
    var e = c;
  } catch (f2) {
    e = "\nError generating stack: " + f2.message + "\n" + f2.stack;
  }
  return { value: a, source: b, stack: e, digest: null };
}
function Ki(a, b, c) {
  return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
}
function Li(a, b) {
  try {
    console.error(b.value);
  } catch (c) {
    setTimeout(function() {
      throw c;
    });
  }
}
var Mi = "function" === typeof WeakMap ? WeakMap : Map;
function Ni(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  c.payload = { element: null };
  var d = b.value;
  c.callback = function() {
    Oi || (Oi = true, Pi = d);
    Li(a, b);
  };
  return c;
}
function Qi(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  var d = a.type.getDerivedStateFromError;
  if ("function" === typeof d) {
    var e = b.value;
    c.payload = function() {
      return d(e);
    };
    c.callback = function() {
      Li(a, b);
    };
  }
  var f2 = a.stateNode;
  null !== f2 && "function" === typeof f2.componentDidCatch && (c.callback = function() {
    Li(a, b);
    "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
    var c2 = b.stack;
    this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
  });
  return c;
}
function Si(a, b, c) {
  var d = a.pingCache;
  if (null === d) {
    d = a.pingCache = new Mi();
    var e = /* @__PURE__ */ new Set();
    d.set(b, e);
  } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
  e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
}
function Ui(a) {
  do {
    var b;
    if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
    if (b) return a;
    a = a.return;
  } while (null !== a);
  return null;
}
function Vi(a, b, c, d, e) {
  if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
  a.flags |= 65536;
  a.lanes = e;
  return a;
}
var Wi = ua.ReactCurrentOwner, dh = false;
function Xi(a, b, c, d) {
  b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
}
function Yi(a, b, c, d, e) {
  c = c.render;
  var f2 = b.ref;
  ch(b, e);
  d = Nh(a, b, c, d, f2, e);
  c = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && c && vg(b);
  b.flags |= 1;
  Xi(a, b, d, e);
  return b.child;
}
function $i(a, b, c, d, e) {
  if (null === a) {
    var f2 = c.type;
    if ("function" === typeof f2 && !aj(f2) && void 0 === f2.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f2, bj(a, b, f2, d, e);
    a = Rg(c.type, null, d, b, b.mode, e);
    a.ref = b.ref;
    a.return = b;
    return b.child = a;
  }
  f2 = a.child;
  if (0 === (a.lanes & e)) {
    var g = f2.memoizedProps;
    c = c.compare;
    c = null !== c ? c : Ie;
    if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
  }
  b.flags |= 1;
  a = Pg(f2, d);
  a.ref = b.ref;
  a.return = b;
  return b.child = a;
}
function bj(a, b, c, d, e) {
  if (null !== a) {
    var f2 = a.memoizedProps;
    if (Ie(f2, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f2, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
    else return b.lanes = a.lanes, Zi(a, b, e);
  }
  return cj(a, b, c, d, e);
}
function dj(a, b, c) {
  var d = b.pendingProps, e = d.children, f2 = null !== a ? a.memoizedState : null;
  if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
  else {
    if (0 === (c & 1073741824)) return a = null !== f2 ? f2.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
    b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
    d = null !== f2 ? f2.baseLanes : c;
    G(ej, fj);
    fj |= d;
  }
  else null !== f2 ? (d = f2.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
  Xi(a, b, e, c);
  return b.child;
}
function gj(a, b) {
  var c = b.ref;
  if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
}
function cj(a, b, c, d, e) {
  var f2 = Zf(c) ? Xf : H.current;
  f2 = Yf(b, f2);
  ch(b, e);
  c = Nh(a, b, c, d, f2, e);
  d = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && d && vg(b);
  b.flags |= 1;
  Xi(a, b, c, e);
  return b.child;
}
function hj(a, b, c, d, e) {
  if (Zf(c)) {
    var f2 = true;
    cg(b);
  } else f2 = false;
  ch(b, e);
  if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
  else if (null === a) {
    var g = b.stateNode, h = b.memoizedProps;
    g.props = h;
    var k2 = g.context, l2 = c.contextType;
    "object" === typeof l2 && null !== l2 ? l2 = eh(l2) : (l2 = Zf(c) ? Xf : H.current, l2 = Yf(b, l2));
    var m2 = c.getDerivedStateFromProps, q2 = "function" === typeof m2 || "function" === typeof g.getSnapshotBeforeUpdate;
    q2 || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k2 !== l2) && Hi(b, g, d, l2);
    jh = false;
    var r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    k2 = b.memoizedState;
    h !== d || r2 !== k2 || Wf.current || jh ? ("function" === typeof m2 && (Di(b, c, m2, d), k2 = b.memoizedState), (h = jh || Fi(b, c, h, d, r2, k2, l2)) ? (q2 || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k2), g.props = d, g.state = k2, g.context = l2, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
  } else {
    g = b.stateNode;
    lh(a, b);
    h = b.memoizedProps;
    l2 = b.type === b.elementType ? h : Ci(b.type, h);
    g.props = l2;
    q2 = b.pendingProps;
    r2 = g.context;
    k2 = c.contextType;
    "object" === typeof k2 && null !== k2 ? k2 = eh(k2) : (k2 = Zf(c) ? Xf : H.current, k2 = Yf(b, k2));
    var y2 = c.getDerivedStateFromProps;
    (m2 = "function" === typeof y2 || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q2 || r2 !== k2) && Hi(b, g, d, k2);
    jh = false;
    r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    var n2 = b.memoizedState;
    h !== q2 || r2 !== n2 || Wf.current || jh ? ("function" === typeof y2 && (Di(b, c, y2, d), n2 = b.memoizedState), (l2 = jh || Fi(b, c, l2, d, r2, n2, k2) || false) ? (m2 || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n2, k2), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n2, k2)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n2), g.props = d, g.state = n2, g.context = k2, d = l2) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), d = false);
  }
  return jj(a, b, c, d, f2, e);
}
function jj(a, b, c, d, e, f2) {
  gj(a, b);
  var g = 0 !== (b.flags & 128);
  if (!d && !g) return e && dg(b, c, false), Zi(a, b, f2);
  d = b.stateNode;
  Wi.current = b;
  var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
  b.flags |= 1;
  null !== a && g ? (b.child = Ug(b, a.child, null, f2), b.child = Ug(b, null, h, f2)) : Xi(a, b, h, f2);
  b.memoizedState = d.state;
  e && dg(b, c, true);
  return b.child;
}
function kj(a) {
  var b = a.stateNode;
  b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
  yh(a, b.containerInfo);
}
function lj(a, b, c, d, e) {
  Ig();
  Jg(e);
  b.flags |= 256;
  Xi(a, b, c, d);
  return b.child;
}
var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
function nj(a) {
  return { baseLanes: a, cachePool: null, transitions: null };
}
function oj(a, b, c) {
  var d = b.pendingProps, e = L.current, f2 = false, g = 0 !== (b.flags & 128), h;
  (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
  if (h) f2 = true, b.flags &= -129;
  else if (null === a || null !== a.memoizedState) e |= 1;
  G(L, e & 1);
  if (null === a) {
    Eg(b);
    a = b.memoizedState;
    if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
    g = d.children;
    a = d.fallback;
    return f2 ? (d = b.mode, f2 = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f2 ? (f2.childLanes = 0, f2.pendingProps = g) : f2 = pj(g, d, 0, null), a = Tg(a, d, c, null), f2.return = b, a.return = b, f2.sibling = a, b.child = f2, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
  }
  e = a.memoizedState;
  if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
  if (f2) {
    f2 = d.fallback;
    g = b.mode;
    e = a.child;
    h = e.sibling;
    var k2 = { mode: "hidden", children: d.children };
    0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k2, b.deletions = null) : (d = Pg(e, k2), d.subtreeFlags = e.subtreeFlags & 14680064);
    null !== h ? f2 = Pg(h, f2) : (f2 = Tg(f2, g, c, null), f2.flags |= 2);
    f2.return = b;
    d.return = b;
    d.sibling = f2;
    b.child = d;
    d = f2;
    f2 = b.child;
    g = a.child.memoizedState;
    g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
    f2.memoizedState = g;
    f2.childLanes = a.childLanes & ~c;
    b.memoizedState = mj;
    return d;
  }
  f2 = a.child;
  a = f2.sibling;
  d = Pg(f2, { mode: "visible", children: d.children });
  0 === (b.mode & 1) && (d.lanes = c);
  d.return = b;
  d.sibling = null;
  null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
  b.child = d;
  b.memoizedState = null;
  return d;
}
function qj(a, b) {
  b = pj({ mode: "visible", children: b }, a.mode, 0, null);
  b.return = a;
  return a.child = b;
}
function sj(a, b, c, d) {
  null !== d && Jg(d);
  Ug(b, a.child, null, c);
  a = qj(b, b.pendingProps.children);
  a.flags |= 2;
  b.memoizedState = null;
  return a;
}
function rj(a, b, c, d, e, f2, g) {
  if (c) {
    if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
    if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
    f2 = d.fallback;
    e = b.mode;
    d = pj({ mode: "visible", children: d.children }, e, 0, null);
    f2 = Tg(f2, e, g, null);
    f2.flags |= 2;
    d.return = b;
    f2.return = b;
    d.sibling = f2;
    b.child = d;
    0 !== (b.mode & 1) && Ug(b, a.child, null, g);
    b.child.memoizedState = nj(g);
    b.memoizedState = mj;
    return f2;
  }
  if (0 === (b.mode & 1)) return sj(a, b, g, null);
  if ("$!" === e.data) {
    d = e.nextSibling && e.nextSibling.dataset;
    if (d) var h = d.dgst;
    d = h;
    f2 = Error(p(419));
    d = Ki(f2, d, void 0);
    return sj(a, b, g, d);
  }
  h = 0 !== (g & a.childLanes);
  if (dh || h) {
    d = Q;
    if (null !== d) {
      switch (g & -g) {
        case 4:
          e = 2;
          break;
        case 16:
          e = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          e = 32;
          break;
        case 536870912:
          e = 268435456;
          break;
        default:
          e = 0;
      }
      e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
      0 !== e && e !== f2.retryLane && (f2.retryLane = e, ih(a, e), gi(d, a, e, -1));
    }
    tj();
    d = Ki(Error(p(421)));
    return sj(a, b, g, d);
  }
  if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
  a = f2.treeContext;
  yg = Lf(e.nextSibling);
  xg = b;
  I = true;
  zg = null;
  null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
  b = qj(b, d.children);
  b.flags |= 4096;
  return b;
}
function vj(a, b, c) {
  a.lanes |= b;
  var d = a.alternate;
  null !== d && (d.lanes |= b);
  bh(a.return, b, c);
}
function wj(a, b, c, d, e) {
  var f2 = a.memoizedState;
  null === f2 ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f2.isBackwards = b, f2.rendering = null, f2.renderingStartTime = 0, f2.last = d, f2.tail = c, f2.tailMode = e);
}
function xj(a, b, c) {
  var d = b.pendingProps, e = d.revealOrder, f2 = d.tail;
  Xi(a, b, d.children, c);
  d = L.current;
  if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
  else {
    if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
      if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
      else if (19 === a.tag) vj(a, c, b);
      else if (null !== a.child) {
        a.child.return = a;
        a = a.child;
        continue;
      }
      if (a === b) break a;
      for (; null === a.sibling; ) {
        if (null === a.return || a.return === b) break a;
        a = a.return;
      }
      a.sibling.return = a.return;
      a = a.sibling;
    }
    d &= 1;
  }
  G(L, d);
  if (0 === (b.mode & 1)) b.memoizedState = null;
  else switch (e) {
    case "forwards":
      c = b.child;
      for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
      c = e;
      null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
      wj(b, false, e, c, f2);
      break;
    case "backwards":
      c = null;
      e = b.child;
      for (b.child = null; null !== e; ) {
        a = e.alternate;
        if (null !== a && null === Ch(a)) {
          b.child = e;
          break;
        }
        a = e.sibling;
        e.sibling = c;
        c = e;
        e = a;
      }
      wj(b, true, c, null, f2);
      break;
    case "together":
      wj(b, false, null, null, void 0);
      break;
    default:
      b.memoizedState = null;
  }
  return b.child;
}
function ij(a, b) {
  0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
}
function Zi(a, b, c) {
  null !== a && (b.dependencies = a.dependencies);
  rh |= b.lanes;
  if (0 === (c & b.childLanes)) return null;
  if (null !== a && b.child !== a.child) throw Error(p(153));
  if (null !== b.child) {
    a = b.child;
    c = Pg(a, a.pendingProps);
    b.child = c;
    for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
    c.sibling = null;
  }
  return b.child;
}
function yj(a, b, c) {
  switch (b.tag) {
    case 3:
      kj(b);
      Ig();
      break;
    case 5:
      Ah(b);
      break;
    case 1:
      Zf(b.type) && cg(b);
      break;
    case 4:
      yh(b, b.stateNode.containerInfo);
      break;
    case 10:
      var d = b.type._context, e = b.memoizedProps.value;
      G(Wg, d._currentValue);
      d._currentValue = e;
      break;
    case 13:
      d = b.memoizedState;
      if (null !== d) {
        if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
        if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
        G(L, L.current & 1);
        a = Zi(a, b, c);
        return null !== a ? a.sibling : null;
      }
      G(L, L.current & 1);
      break;
    case 19:
      d = 0 !== (c & b.childLanes);
      if (0 !== (a.flags & 128)) {
        if (d) return xj(a, b, c);
        b.flags |= 128;
      }
      e = b.memoizedState;
      null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
      G(L, L.current);
      if (d) break;
      else return null;
    case 22:
    case 23:
      return b.lanes = 0, dj(a, b, c);
  }
  return Zi(a, b, c);
}
var zj, Aj, Bj, Cj;
zj = function(a, b) {
  for (var c = b.child; null !== c; ) {
    if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
    else if (4 !== c.tag && null !== c.child) {
      c.child.return = c;
      c = c.child;
      continue;
    }
    if (c === b) break;
    for (; null === c.sibling; ) {
      if (null === c.return || c.return === b) return;
      c = c.return;
    }
    c.sibling.return = c.return;
    c = c.sibling;
  }
};
Aj = function() {
};
Bj = function(a, b, c, d) {
  var e = a.memoizedProps;
  if (e !== d) {
    a = b.stateNode;
    xh(uh.current);
    var f2 = null;
    switch (c) {
      case "input":
        e = Ya(a, e);
        d = Ya(a, d);
        f2 = [];
        break;
      case "select":
        e = A({}, e, { value: void 0 });
        d = A({}, d, { value: void 0 });
        f2 = [];
        break;
      case "textarea":
        e = gb(a, e);
        d = gb(a, d);
        f2 = [];
        break;
      default:
        "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
    }
    ub(c, d);
    var g;
    c = null;
    for (l2 in e) if (!d.hasOwnProperty(l2) && e.hasOwnProperty(l2) && null != e[l2]) if ("style" === l2) {
      var h = e[l2];
      for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
    } else "dangerouslySetInnerHTML" !== l2 && "children" !== l2 && "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && "autoFocus" !== l2 && (ea.hasOwnProperty(l2) ? f2 || (f2 = []) : (f2 = f2 || []).push(l2, null));
    for (l2 in d) {
      var k2 = d[l2];
      h = null != e ? e[l2] : void 0;
      if (d.hasOwnProperty(l2) && k2 !== h && (null != k2 || null != h)) if ("style" === l2) if (h) {
        for (g in h) !h.hasOwnProperty(g) || k2 && k2.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
        for (g in k2) k2.hasOwnProperty(g) && h[g] !== k2[g] && (c || (c = {}), c[g] = k2[g]);
      } else c || (f2 || (f2 = []), f2.push(
        l2,
        c
      )), c = k2;
      else "dangerouslySetInnerHTML" === l2 ? (k2 = k2 ? k2.__html : void 0, h = h ? h.__html : void 0, null != k2 && h !== k2 && (f2 = f2 || []).push(l2, k2)) : "children" === l2 ? "string" !== typeof k2 && "number" !== typeof k2 || (f2 = f2 || []).push(l2, "" + k2) : "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && (ea.hasOwnProperty(l2) ? (null != k2 && "onScroll" === l2 && D("scroll", a), f2 || h === k2 || (f2 = [])) : (f2 = f2 || []).push(l2, k2));
    }
    c && (f2 = f2 || []).push("style", c);
    var l2 = f2;
    if (b.updateQueue = l2) b.flags |= 4;
  }
};
Cj = function(a, b, c, d) {
  c !== d && (b.flags |= 4);
};
function Dj(a, b) {
  if (!I) switch (a.tailMode) {
    case "hidden":
      b = a.tail;
      for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
      null === c ? a.tail = null : c.sibling = null;
      break;
    case "collapsed":
      c = a.tail;
      for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
      null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
  }
}
function S(a) {
  var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
  if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
  else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
  a.subtreeFlags |= d;
  a.childLanes = c;
  return b;
}
function Ej(a, b, c) {
  var d = b.pendingProps;
  wg(b);
  switch (b.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return S(b), null;
    case 1:
      return Zf(b.type) && $f(), S(b), null;
    case 3:
      d = b.stateNode;
      zh();
      E(Wf);
      E(H);
      Eh();
      d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
      if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
      Aj(a, b);
      S(b);
      return null;
    case 5:
      Bh(b);
      var e = xh(wh.current);
      c = b.type;
      if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      else {
        if (!d) {
          if (null === b.stateNode) throw Error(p(166));
          S(b);
          return null;
        }
        a = xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.type;
          var f2 = b.memoizedProps;
          d[Of] = b;
          d[Pf] = f2;
          a = 0 !== (b.mode & 1);
          switch (c) {
            case "dialog":
              D("cancel", d);
              D("close", d);
              break;
            case "iframe":
            case "object":
            case "embed":
              D("load", d);
              break;
            case "video":
            case "audio":
              for (e = 0; e < lf.length; e++) D(lf[e], d);
              break;
            case "source":
              D("error", d);
              break;
            case "img":
            case "image":
            case "link":
              D(
                "error",
                d
              );
              D("load", d);
              break;
            case "details":
              D("toggle", d);
              break;
            case "input":
              Za(d, f2);
              D("invalid", d);
              break;
            case "select":
              d._wrapperState = { wasMultiple: !!f2.multiple };
              D("invalid", d);
              break;
            case "textarea":
              hb(d, f2), D("invalid", d);
          }
          ub(c, f2);
          e = null;
          for (var g in f2) if (f2.hasOwnProperty(g)) {
            var h = f2[g];
            "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f2.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f2.suppressHydrationWarning && Af(
              d.textContent,
              h,
              a
            ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
          }
          switch (c) {
            case "input":
              Va(d);
              db(d, f2, true);
              break;
            case "textarea":
              Va(d);
              jb(d);
              break;
            case "select":
            case "option":
              break;
            default:
              "function" === typeof f2.onClick && (d.onclick = Bf);
          }
          d = e;
          b.updateQueue = d;
          null !== d && (b.flags |= 4);
        } else {
          g = 9 === e.nodeType ? e : e.ownerDocument;
          "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
          "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
          a[Of] = b;
          a[Pf] = d;
          zj(a, b, false, false);
          b.stateNode = a;
          a: {
            g = vb(c, d);
            switch (c) {
              case "dialog":
                D("cancel", a);
                D("close", a);
                e = d;
                break;
              case "iframe":
              case "object":
              case "embed":
                D("load", a);
                e = d;
                break;
              case "video":
              case "audio":
                for (e = 0; e < lf.length; e++) D(lf[e], a);
                e = d;
                break;
              case "source":
                D("error", a);
                e = d;
                break;
              case "img":
              case "image":
              case "link":
                D(
                  "error",
                  a
                );
                D("load", a);
                e = d;
                break;
              case "details":
                D("toggle", a);
                e = d;
                break;
              case "input":
                Za(a, d);
                e = Ya(a, d);
                D("invalid", a);
                break;
              case "option":
                e = d;
                break;
              case "select":
                a._wrapperState = { wasMultiple: !!d.multiple };
                e = A({}, d, { value: void 0 });
                D("invalid", a);
                break;
              case "textarea":
                hb(a, d);
                e = gb(a, d);
                D("invalid", a);
                break;
              default:
                e = d;
            }
            ub(c, e);
            h = e;
            for (f2 in h) if (h.hasOwnProperty(f2)) {
              var k2 = h[f2];
              "style" === f2 ? sb(a, k2) : "dangerouslySetInnerHTML" === f2 ? (k2 = k2 ? k2.__html : void 0, null != k2 && nb(a, k2)) : "children" === f2 ? "string" === typeof k2 ? ("textarea" !== c || "" !== k2) && ob(a, k2) : "number" === typeof k2 && ob(a, "" + k2) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (ea.hasOwnProperty(f2) ? null != k2 && "onScroll" === f2 && D("scroll", a) : null != k2 && ta(a, f2, k2, g));
            }
            switch (c) {
              case "input":
                Va(a);
                db(a, d, false);
                break;
              case "textarea":
                Va(a);
                jb(a);
                break;
              case "option":
                null != d.value && a.setAttribute("value", "" + Sa(d.value));
                break;
              case "select":
                a.multiple = !!d.multiple;
                f2 = d.value;
                null != f2 ? fb(a, !!d.multiple, f2, false) : null != d.defaultValue && fb(
                  a,
                  !!d.multiple,
                  d.defaultValue,
                  true
                );
                break;
              default:
                "function" === typeof e.onClick && (a.onclick = Bf);
            }
            switch (c) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                d = !!d.autoFocus;
                break a;
              case "img":
                d = true;
                break a;
              default:
                d = false;
            }
          }
          d && (b.flags |= 4);
        }
        null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      }
      S(b);
      return null;
    case 6:
      if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
      else {
        if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
        c = xh(wh.current);
        xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.memoizedProps;
          d[Of] = b;
          if (f2 = d.nodeValue !== c) {
            if (a = xg, null !== a) switch (a.tag) {
              case 3:
                Af(d.nodeValue, c, 0 !== (a.mode & 1));
                break;
              case 5:
                true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
            }
          }
          f2 && (b.flags |= 4);
        } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
      }
      S(b);
      return null;
    case 13:
      E(L);
      d = b.memoizedState;
      if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
        if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f2 = false;
        else if (f2 = Gg(b), null !== d && null !== d.dehydrated) {
          if (null === a) {
            if (!f2) throw Error(p(318));
            f2 = b.memoizedState;
            f2 = null !== f2 ? f2.dehydrated : null;
            if (!f2) throw Error(p(317));
            f2[Of] = b;
          } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
          S(b);
          f2 = false;
        } else null !== zg && (Fj(zg), zg = null), f2 = true;
        if (!f2) return b.flags & 65536 ? b : null;
      }
      if (0 !== (b.flags & 128)) return b.lanes = c, b;
      d = null !== d;
      d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
      null !== b.updateQueue && (b.flags |= 4);
      S(b);
      return null;
    case 4:
      return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
    case 10:
      return ah(b.type._context), S(b), null;
    case 17:
      return Zf(b.type) && $f(), S(b), null;
    case 19:
      E(L);
      f2 = b.memoizedState;
      if (null === f2) return S(b), null;
      d = 0 !== (b.flags & 128);
      g = f2.rendering;
      if (null === g) if (d) Dj(f2, false);
      else {
        if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
          g = Ch(a);
          if (null !== g) {
            b.flags |= 128;
            Dj(f2, false);
            d = g.updateQueue;
            null !== d && (b.updateQueue = d, b.flags |= 4);
            b.subtreeFlags = 0;
            d = c;
            for (c = b.child; null !== c; ) f2 = c, a = d, f2.flags &= 14680066, g = f2.alternate, null === g ? (f2.childLanes = 0, f2.lanes = a, f2.child = null, f2.subtreeFlags = 0, f2.memoizedProps = null, f2.memoizedState = null, f2.updateQueue = null, f2.dependencies = null, f2.stateNode = null) : (f2.childLanes = g.childLanes, f2.lanes = g.lanes, f2.child = g.child, f2.subtreeFlags = 0, f2.deletions = null, f2.memoizedProps = g.memoizedProps, f2.memoizedState = g.memoizedState, f2.updateQueue = g.updateQueue, f2.type = g.type, a = g.dependencies, f2.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
            G(L, L.current & 1 | 2);
            return b.child;
          }
          a = a.sibling;
        }
        null !== f2.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
      }
      else {
        if (!d) if (a = Ch(g), null !== a) {
          if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f2, true), null === f2.tail && "hidden" === f2.tailMode && !g.alternate && !I) return S(b), null;
        } else 2 * B() - f2.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
        f2.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f2.last, null !== c ? c.sibling = g : b.child = g, f2.last = g);
      }
      if (null !== f2.tail) return b = f2.tail, f2.rendering = b, f2.tail = b.sibling, f2.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
      S(b);
      return null;
    case 22:
    case 23:
      return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(p(156, b.tag));
}
function Ij(a, b) {
  wg(b);
  switch (b.tag) {
    case 1:
      return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 3:
      return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
    case 5:
      return Bh(b), null;
    case 13:
      E(L);
      a = b.memoizedState;
      if (null !== a && null !== a.dehydrated) {
        if (null === b.alternate) throw Error(p(340));
        Ig();
      }
      a = b.flags;
      return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 19:
      return E(L), null;
    case 4:
      return zh(), null;
    case 10:
      return ah(b.type._context), null;
    case 22:
    case 23:
      return Hj(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Jj = false, U = false, Kj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
function Lj(a, b) {
  var c = a.ref;
  if (null !== c) if ("function" === typeof c) try {
    c(null);
  } catch (d) {
    W(a, b, d);
  }
  else c.current = null;
}
function Mj(a, b, c) {
  try {
    c();
  } catch (d) {
    W(a, b, d);
  }
}
var Nj = false;
function Oj(a, b) {
  Cf = dd;
  a = Me();
  if (Ne(a)) {
    if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
    else a: {
      c = (c = a.ownerDocument) && c.defaultView || window;
      var d = c.getSelection && c.getSelection();
      if (d && 0 !== d.rangeCount) {
        c = d.anchorNode;
        var e = d.anchorOffset, f2 = d.focusNode;
        d = d.focusOffset;
        try {
          c.nodeType, f2.nodeType;
        } catch (F2) {
          c = null;
          break a;
        }
        var g = 0, h = -1, k2 = -1, l2 = 0, m2 = 0, q2 = a, r2 = null;
        b: for (; ; ) {
          for (var y2; ; ) {
            q2 !== c || 0 !== e && 3 !== q2.nodeType || (h = g + e);
            q2 !== f2 || 0 !== d && 3 !== q2.nodeType || (k2 = g + d);
            3 === q2.nodeType && (g += q2.nodeValue.length);
            if (null === (y2 = q2.firstChild)) break;
            r2 = q2;
            q2 = y2;
          }
          for (; ; ) {
            if (q2 === a) break b;
            r2 === c && ++l2 === e && (h = g);
            r2 === f2 && ++m2 === d && (k2 = g);
            if (null !== (y2 = q2.nextSibling)) break;
            q2 = r2;
            r2 = q2.parentNode;
          }
          q2 = y2;
        }
        c = -1 === h || -1 === k2 ? null : { start: h, end: k2 };
      } else c = null;
    }
    c = c || { start: 0, end: 0 };
  } else c = null;
  Df = { focusedElem: a, selectionRange: c };
  dd = false;
  for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
  else for (; null !== V; ) {
    b = V;
    try {
      var n2 = b.alternate;
      if (0 !== (b.flags & 1024)) switch (b.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (null !== n2) {
            var t2 = n2.memoizedProps, J2 = n2.memoizedState, x2 = b.stateNode, w2 = x2.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Ci(b.type, t2), J2);
            x2.__reactInternalSnapshotBeforeUpdate = w2;
          }
          break;
        case 3:
          var u2 = b.stateNode.containerInfo;
          1 === u2.nodeType ? u2.textContent = "" : 9 === u2.nodeType && u2.documentElement && u2.removeChild(u2.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(p(163));
      }
    } catch (F2) {
      W(b, b.return, F2);
    }
    a = b.sibling;
    if (null !== a) {
      a.return = b.return;
      V = a;
      break;
    }
    V = b.return;
  }
  n2 = Nj;
  Nj = false;
  return n2;
}
function Pj(a, b, c) {
  var d = b.updateQueue;
  d = null !== d ? d.lastEffect : null;
  if (null !== d) {
    var e = d = d.next;
    do {
      if ((e.tag & a) === a) {
        var f2 = e.destroy;
        e.destroy = void 0;
        void 0 !== f2 && Mj(b, c, f2);
      }
      e = e.next;
    } while (e !== d);
  }
}
function Qj(a, b) {
  b = b.updateQueue;
  b = null !== b ? b.lastEffect : null;
  if (null !== b) {
    var c = b = b.next;
    do {
      if ((c.tag & a) === a) {
        var d = c.create;
        c.destroy = d();
      }
      c = c.next;
    } while (c !== b);
  }
}
function Rj(a) {
  var b = a.ref;
  if (null !== b) {
    var c = a.stateNode;
    switch (a.tag) {
      case 5:
        a = c;
        break;
      default:
        a = c;
    }
    "function" === typeof b ? b(a) : b.current = a;
  }
}
function Sj(a) {
  var b = a.alternate;
  null !== b && (a.alternate = null, Sj(b));
  a.child = null;
  a.deletions = null;
  a.sibling = null;
  5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
  a.stateNode = null;
  a.return = null;
  a.dependencies = null;
  a.memoizedProps = null;
  a.memoizedState = null;
  a.pendingProps = null;
  a.stateNode = null;
  a.updateQueue = null;
}
function Tj(a) {
  return 5 === a.tag || 3 === a.tag || 4 === a.tag;
}
function Uj(a) {
  a: for (; ; ) {
    for (; null === a.sibling; ) {
      if (null === a.return || Tj(a.return)) return null;
      a = a.return;
    }
    a.sibling.return = a.return;
    for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
      if (a.flags & 2) continue a;
      if (null === a.child || 4 === a.tag) continue a;
      else a.child.return = a, a = a.child;
    }
    if (!(a.flags & 2)) return a.stateNode;
  }
}
function Vj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
  else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
}
function Wj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
  else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
}
var X$1 = null, Xj = false;
function Yj(a, b, c) {
  for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
}
function Zj(a, b, c) {
  if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
    lc.onCommitFiberUnmount(kc, c);
  } catch (h) {
  }
  switch (c.tag) {
    case 5:
      U || Lj(c, b);
    case 6:
      var d = X$1, e = Xj;
      X$1 = null;
      Yj(a, b, c);
      X$1 = d;
      Xj = e;
      null !== X$1 && (Xj ? (a = X$1, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X$1.removeChild(c.stateNode));
      break;
    case 18:
      null !== X$1 && (Xj ? (a = X$1, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X$1, c.stateNode));
      break;
    case 4:
      d = X$1;
      e = Xj;
      X$1 = c.stateNode.containerInfo;
      Xj = true;
      Yj(a, b, c);
      X$1 = d;
      Xj = e;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
        e = d = d.next;
        do {
          var f2 = e, g = f2.destroy;
          f2 = f2.tag;
          void 0 !== g && (0 !== (f2 & 2) ? Mj(c, b, g) : 0 !== (f2 & 4) && Mj(c, b, g));
          e = e.next;
        } while (e !== d);
      }
      Yj(a, b, c);
      break;
    case 1:
      if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
        d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
      } catch (h) {
        W(c, b, h);
      }
      Yj(a, b, c);
      break;
    case 21:
      Yj(a, b, c);
      break;
    case 22:
      c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
      break;
    default:
      Yj(a, b, c);
  }
}
function ak(a) {
  var b = a.updateQueue;
  if (null !== b) {
    a.updateQueue = null;
    var c = a.stateNode;
    null === c && (c = a.stateNode = new Kj());
    b.forEach(function(b2) {
      var d = bk.bind(null, a, b2);
      c.has(b2) || (c.add(b2), b2.then(d, d));
    });
  }
}
function ck(a, b) {
  var c = b.deletions;
  if (null !== c) for (var d = 0; d < c.length; d++) {
    var e = c[d];
    try {
      var f2 = a, g = b, h = g;
      a: for (; null !== h; ) {
        switch (h.tag) {
          case 5:
            X$1 = h.stateNode;
            Xj = false;
            break a;
          case 3:
            X$1 = h.stateNode.containerInfo;
            Xj = true;
            break a;
          case 4:
            X$1 = h.stateNode.containerInfo;
            Xj = true;
            break a;
        }
        h = h.return;
      }
      if (null === X$1) throw Error(p(160));
      Zj(f2, g, e);
      X$1 = null;
      Xj = false;
      var k2 = e.alternate;
      null !== k2 && (k2.return = null);
      e.return = null;
    } catch (l2) {
      W(e, b, l2);
    }
  }
  if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
}
function dk(a, b) {
  var c = a.alternate, d = a.flags;
  switch (a.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      ck(b, a);
      ek(a);
      if (d & 4) {
        try {
          Pj(3, a, a.return), Qj(3, a);
        } catch (t2) {
          W(a, a.return, t2);
        }
        try {
          Pj(5, a, a.return);
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 1:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      break;
    case 5:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      if (a.flags & 32) {
        var e = a.stateNode;
        try {
          ob(e, "");
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      if (d & 4 && (e = a.stateNode, null != e)) {
        var f2 = a.memoizedProps, g = null !== c ? c.memoizedProps : f2, h = a.type, k2 = a.updateQueue;
        a.updateQueue = null;
        if (null !== k2) try {
          "input" === h && "radio" === f2.type && null != f2.name && ab(e, f2);
          vb(h, g);
          var l2 = vb(h, f2);
          for (g = 0; g < k2.length; g += 2) {
            var m2 = k2[g], q2 = k2[g + 1];
            "style" === m2 ? sb(e, q2) : "dangerouslySetInnerHTML" === m2 ? nb(e, q2) : "children" === m2 ? ob(e, q2) : ta(e, m2, q2, l2);
          }
          switch (h) {
            case "input":
              bb(e, f2);
              break;
            case "textarea":
              ib(e, f2);
              break;
            case "select":
              var r2 = e._wrapperState.wasMultiple;
              e._wrapperState.wasMultiple = !!f2.multiple;
              var y2 = f2.value;
              null != y2 ? fb(e, !!f2.multiple, y2, false) : r2 !== !!f2.multiple && (null != f2.defaultValue ? fb(
                e,
                !!f2.multiple,
                f2.defaultValue,
                true
              ) : fb(e, !!f2.multiple, f2.multiple ? [] : "", false));
          }
          e[Pf] = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 6:
      ck(b, a);
      ek(a);
      if (d & 4) {
        if (null === a.stateNode) throw Error(p(162));
        e = a.stateNode;
        f2 = a.memoizedProps;
        try {
          e.nodeValue = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 3:
      ck(b, a);
      ek(a);
      if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
        bd(b.containerInfo);
      } catch (t2) {
        W(a, a.return, t2);
      }
      break;
    case 4:
      ck(b, a);
      ek(a);
      break;
    case 13:
      ck(b, a);
      ek(a);
      e = a.child;
      e.flags & 8192 && (f2 = null !== e.memoizedState, e.stateNode.isHidden = f2, !f2 || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
      d & 4 && ak(a);
      break;
    case 22:
      m2 = null !== c && null !== c.memoizedState;
      a.mode & 1 ? (U = (l2 = U) || m2, ck(b, a), U = l2) : ck(b, a);
      ek(a);
      if (d & 8192) {
        l2 = null !== a.memoizedState;
        if ((a.stateNode.isHidden = l2) && !m2 && 0 !== (a.mode & 1)) for (V = a, m2 = a.child; null !== m2; ) {
          for (q2 = V = m2; null !== V; ) {
            r2 = V;
            y2 = r2.child;
            switch (r2.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Pj(4, r2, r2.return);
                break;
              case 1:
                Lj(r2, r2.return);
                var n2 = r2.stateNode;
                if ("function" === typeof n2.componentWillUnmount) {
                  d = r2;
                  c = r2.return;
                  try {
                    b = d, n2.props = b.memoizedProps, n2.state = b.memoizedState, n2.componentWillUnmount();
                  } catch (t2) {
                    W(d, c, t2);
                  }
                }
                break;
              case 5:
                Lj(r2, r2.return);
                break;
              case 22:
                if (null !== r2.memoizedState) {
                  gk(q2);
                  continue;
                }
            }
            null !== y2 ? (y2.return = r2, V = y2) : gk(q2);
          }
          m2 = m2.sibling;
        }
        a: for (m2 = null, q2 = a; ; ) {
          if (5 === q2.tag) {
            if (null === m2) {
              m2 = q2;
              try {
                e = q2.stateNode, l2 ? (f2 = e.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (h = q2.stateNode, k2 = q2.memoizedProps.style, g = void 0 !== k2 && null !== k2 && k2.hasOwnProperty("display") ? k2.display : null, h.style.display = rb("display", g));
              } catch (t2) {
                W(a, a.return, t2);
              }
            }
          } else if (6 === q2.tag) {
            if (null === m2) try {
              q2.stateNode.nodeValue = l2 ? "" : q2.memoizedProps;
            } catch (t2) {
              W(a, a.return, t2);
            }
          } else if ((22 !== q2.tag && 23 !== q2.tag || null === q2.memoizedState || q2 === a) && null !== q2.child) {
            q2.child.return = q2;
            q2 = q2.child;
            continue;
          }
          if (q2 === a) break a;
          for (; null === q2.sibling; ) {
            if (null === q2.return || q2.return === a) break a;
            m2 === q2 && (m2 = null);
            q2 = q2.return;
          }
          m2 === q2 && (m2 = null);
          q2.sibling.return = q2.return;
          q2 = q2.sibling;
        }
      }
      break;
    case 19:
      ck(b, a);
      ek(a);
      d & 4 && ak(a);
      break;
    case 21:
      break;
    default:
      ck(
        b,
        a
      ), ek(a);
  }
}
function ek(a) {
  var b = a.flags;
  if (b & 2) {
    try {
      a: {
        for (var c = a.return; null !== c; ) {
          if (Tj(c)) {
            var d = c;
            break a;
          }
          c = c.return;
        }
        throw Error(p(160));
      }
      switch (d.tag) {
        case 5:
          var e = d.stateNode;
          d.flags & 32 && (ob(e, ""), d.flags &= -33);
          var f2 = Uj(a);
          Wj(a, f2, e);
          break;
        case 3:
        case 4:
          var g = d.stateNode.containerInfo, h = Uj(a);
          Vj(a, h, g);
          break;
        default:
          throw Error(p(161));
      }
    } catch (k2) {
      W(a, a.return, k2);
    }
    a.flags &= -3;
  }
  b & 4096 && (a.flags &= -4097);
}
function hk(a, b, c) {
  V = a;
  ik(a);
}
function ik(a, b, c) {
  for (var d = 0 !== (a.mode & 1); null !== V; ) {
    var e = V, f2 = e.child;
    if (22 === e.tag && d) {
      var g = null !== e.memoizedState || Jj;
      if (!g) {
        var h = e.alternate, k2 = null !== h && null !== h.memoizedState || U;
        h = Jj;
        var l2 = U;
        Jj = g;
        if ((U = k2) && !l2) for (V = e; null !== V; ) g = V, k2 = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k2 ? (k2.return = g, V = k2) : jk(e);
        for (; null !== f2; ) V = f2, ik(f2), f2 = f2.sibling;
        V = e;
        Jj = h;
        U = l2;
      }
      kk(a);
    } else 0 !== (e.subtreeFlags & 8772) && null !== f2 ? (f2.return = e, V = f2) : kk(a);
  }
}
function kk(a) {
  for (; null !== V; ) {
    var b = V;
    if (0 !== (b.flags & 8772)) {
      var c = b.alternate;
      try {
        if (0 !== (b.flags & 8772)) switch (b.tag) {
          case 0:
          case 11:
          case 15:
            U || Qj(5, b);
            break;
          case 1:
            var d = b.stateNode;
            if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
            else {
              var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
              d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
            }
            var f2 = b.updateQueue;
            null !== f2 && sh(b, f2, d);
            break;
          case 3:
            var g = b.updateQueue;
            if (null !== g) {
              c = null;
              if (null !== b.child) switch (b.child.tag) {
                case 5:
                  c = b.child.stateNode;
                  break;
                case 1:
                  c = b.child.stateNode;
              }
              sh(b, g, c);
            }
            break;
          case 5:
            var h = b.stateNode;
            if (null === c && b.flags & 4) {
              c = h;
              var k2 = b.memoizedProps;
              switch (b.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  k2.autoFocus && c.focus();
                  break;
                case "img":
                  k2.src && (c.src = k2.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (null === b.memoizedState) {
              var l2 = b.alternate;
              if (null !== l2) {
                var m2 = l2.memoizedState;
                if (null !== m2) {
                  var q2 = m2.dehydrated;
                  null !== q2 && bd(q2);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(p(163));
        }
        U || b.flags & 512 && Rj(b);
      } catch (r2) {
        W(b, b.return, r2);
      }
    }
    if (b === a) {
      V = null;
      break;
    }
    c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function gk(a) {
  for (; null !== V; ) {
    var b = V;
    if (b === a) {
      V = null;
      break;
    }
    var c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function jk(a) {
  for (; null !== V; ) {
    var b = V;
    try {
      switch (b.tag) {
        case 0:
        case 11:
        case 15:
          var c = b.return;
          try {
            Qj(4, b);
          } catch (k2) {
            W(b, c, k2);
          }
          break;
        case 1:
          var d = b.stateNode;
          if ("function" === typeof d.componentDidMount) {
            var e = b.return;
            try {
              d.componentDidMount();
            } catch (k2) {
              W(b, e, k2);
            }
          }
          var f2 = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, f2, k2);
          }
          break;
        case 5:
          var g = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, g, k2);
          }
      }
    } catch (k2) {
      W(b, b.return, k2);
    }
    if (b === a) {
      V = null;
      break;
    }
    var h = b.sibling;
    if (null !== h) {
      h.return = b.return;
      V = h;
      break;
    }
    V = b.return;
  }
}
var lk = Math.ceil, mk = ua.ReactCurrentDispatcher, nk = ua.ReactCurrentOwner, ok = ua.ReactCurrentBatchConfig, K = 0, Q = null, Y = null, Z = 0, fj = 0, ej = Uf(0), T = 0, pk = null, rh = 0, qk = 0, rk = 0, sk = null, tk = null, fk = 0, Gj = Infinity, uk = null, Oi = false, Pi = null, Ri = null, vk = false, wk = null, xk = 0, yk = 0, zk = null, Ak = -1, Bk = 0;
function R() {
  return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
}
function yi(a) {
  if (0 === (a.mode & 1)) return 1;
  if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
  if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
  a = C;
  if (0 !== a) return a;
  a = window.event;
  a = void 0 === a ? 16 : jd(a.type);
  return a;
}
function gi(a, b, c, d) {
  if (50 < yk) throw yk = 0, zk = null, Error(p(185));
  Ac(a, c, d);
  if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
}
function Dk(a, b) {
  var c = a.callbackNode;
  wc(a, b);
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
  else if (b = d & -d, a.callbackPriority !== b) {
    null != c && bc(c);
    if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
      0 === (K & 6) && jg();
    }), c = null;
    else {
      switch (Dc(d)) {
        case 1:
          c = fc;
          break;
        case 4:
          c = gc;
          break;
        case 16:
          c = hc;
          break;
        case 536870912:
          c = jc;
          break;
        default:
          c = hc;
      }
      c = Fk(c, Gk.bind(null, a));
    }
    a.callbackPriority = b;
    a.callbackNode = c;
  }
}
function Gk(a, b) {
  Ak = -1;
  Bk = 0;
  if (0 !== (K & 6)) throw Error(p(327));
  var c = a.callbackNode;
  if (Hk() && a.callbackNode !== c) return null;
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) return null;
  if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
  else {
    b = d;
    var e = K;
    K |= 2;
    var f2 = Jk();
    if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
    do
      try {
        Lk();
        break;
      } catch (h) {
        Mk(a, h);
      }
    while (1);
    $g();
    mk.current = f2;
    K = e;
    null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
  }
  if (0 !== b) {
    2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
    if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
    if (6 === b) Ck(a, d);
    else {
      e = a.current.alternate;
      if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f2 = xc(a), 0 !== f2 && (d = f2, b = Nk(a, f2))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
      a.finishedWork = e;
      a.finishedLanes = d;
      switch (b) {
        case 0:
        case 1:
          throw Error(p(345));
        case 2:
          Pk(a, tk, uk);
          break;
        case 3:
          Ck(a, d);
          if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
            if (0 !== uc(a, 0)) break;
            e = a.suspendedLanes;
            if ((e & d) !== d) {
              R();
              a.pingedLanes |= a.suspendedLanes & e;
              break;
            }
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 4:
          Ck(a, d);
          if ((d & 4194240) === d) break;
          b = a.eventTimes;
          for (e = -1; 0 < d; ) {
            var g = 31 - oc(d);
            f2 = 1 << g;
            g = b[g];
            g > e && (e = g);
            d &= ~f2;
          }
          d = e;
          d = B() - d;
          d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
          if (10 < d) {
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 5:
          Pk(a, tk, uk);
          break;
        default:
          throw Error(p(329));
      }
    }
  }
  Dk(a, B());
  return a.callbackNode === c ? Gk.bind(null, a) : null;
}
function Nk(a, b) {
  var c = sk;
  a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
  a = Ik(a, b);
  2 !== a && (b = tk, tk = c, null !== b && Fj(b));
  return a;
}
function Fj(a) {
  null === tk ? tk = a : tk.push.apply(tk, a);
}
function Ok(a) {
  for (var b = a; ; ) {
    if (b.flags & 16384) {
      var c = b.updateQueue;
      if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
        var e = c[d], f2 = e.getSnapshot;
        e = e.value;
        try {
          if (!He(f2(), e)) return false;
        } catch (g) {
          return false;
        }
      }
    }
    c = b.child;
    if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
    else {
      if (b === a) break;
      for (; null === b.sibling; ) {
        if (null === b.return || b.return === a) return true;
        b = b.return;
      }
      b.sibling.return = b.return;
      b = b.sibling;
    }
  }
  return true;
}
function Ck(a, b) {
  b &= ~rk;
  b &= ~qk;
  a.suspendedLanes |= b;
  a.pingedLanes &= ~b;
  for (a = a.expirationTimes; 0 < b; ) {
    var c = 31 - oc(b), d = 1 << c;
    a[c] = -1;
    b &= ~d;
  }
}
function Ek(a) {
  if (0 !== (K & 6)) throw Error(p(327));
  Hk();
  var b = uc(a, 0);
  if (0 === (b & 1)) return Dk(a, B()), null;
  var c = Ik(a, b);
  if (0 !== a.tag && 2 === c) {
    var d = xc(a);
    0 !== d && (b = d, c = Nk(a, d));
  }
  if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
  if (6 === c) throw Error(p(345));
  a.finishedWork = a.current.alternate;
  a.finishedLanes = b;
  Pk(a, tk, uk);
  Dk(a, B());
  return null;
}
function Qk(a, b) {
  var c = K;
  K |= 1;
  try {
    return a(b);
  } finally {
    K = c, 0 === K && (Gj = B() + 500, fg && jg());
  }
}
function Rk(a) {
  null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
  var b = K;
  K |= 1;
  var c = ok.transition, d = C;
  try {
    if (ok.transition = null, C = 1, a) return a();
  } finally {
    C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
  }
}
function Hj() {
  fj = ej.current;
  E(ej);
}
function Kk(a, b) {
  a.finishedWork = null;
  a.finishedLanes = 0;
  var c = a.timeoutHandle;
  -1 !== c && (a.timeoutHandle = -1, Gf(c));
  if (null !== Y) for (c = Y.return; null !== c; ) {
    var d = c;
    wg(d);
    switch (d.tag) {
      case 1:
        d = d.type.childContextTypes;
        null !== d && void 0 !== d && $f();
        break;
      case 3:
        zh();
        E(Wf);
        E(H);
        Eh();
        break;
      case 5:
        Bh(d);
        break;
      case 4:
        zh();
        break;
      case 13:
        E(L);
        break;
      case 19:
        E(L);
        break;
      case 10:
        ah(d.type._context);
        break;
      case 22:
      case 23:
        Hj();
    }
    c = c.return;
  }
  Q = a;
  Y = a = Pg(a.current, null);
  Z = fj = b;
  T = 0;
  pk = null;
  rk = qk = rh = 0;
  tk = sk = null;
  if (null !== fh) {
    for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
      c.interleaved = null;
      var e = d.next, f2 = c.pending;
      if (null !== f2) {
        var g = f2.next;
        f2.next = e;
        d.next = g;
      }
      c.pending = d;
    }
    fh = null;
  }
  return a;
}
function Mk(a, b) {
  do {
    var c = Y;
    try {
      $g();
      Fh.current = Rh;
      if (Ih) {
        for (var d = M.memoizedState; null !== d; ) {
          var e = d.queue;
          null !== e && (e.pending = null);
          d = d.next;
        }
        Ih = false;
      }
      Hh = 0;
      O = N = M = null;
      Jh = false;
      Kh = 0;
      nk.current = null;
      if (null === c || null === c.return) {
        T = 1;
        pk = b;
        Y = null;
        break;
      }
      a: {
        var f2 = a, g = c.return, h = c, k2 = b;
        b = Z;
        h.flags |= 32768;
        if (null !== k2 && "object" === typeof k2 && "function" === typeof k2.then) {
          var l2 = k2, m2 = h, q2 = m2.tag;
          if (0 === (m2.mode & 1) && (0 === q2 || 11 === q2 || 15 === q2)) {
            var r2 = m2.alternate;
            r2 ? (m2.updateQueue = r2.updateQueue, m2.memoizedState = r2.memoizedState, m2.lanes = r2.lanes) : (m2.updateQueue = null, m2.memoizedState = null);
          }
          var y2 = Ui(g);
          if (null !== y2) {
            y2.flags &= -257;
            Vi(y2, g, h, f2, b);
            y2.mode & 1 && Si(f2, l2, b);
            b = y2;
            k2 = l2;
            var n2 = b.updateQueue;
            if (null === n2) {
              var t2 = /* @__PURE__ */ new Set();
              t2.add(k2);
              b.updateQueue = t2;
            } else n2.add(k2);
            break a;
          } else {
            if (0 === (b & 1)) {
              Si(f2, l2, b);
              tj();
              break a;
            }
            k2 = Error(p(426));
          }
        } else if (I && h.mode & 1) {
          var J2 = Ui(g);
          if (null !== J2) {
            0 === (J2.flags & 65536) && (J2.flags |= 256);
            Vi(J2, g, h, f2, b);
            Jg(Ji(k2, h));
            break a;
          }
        }
        f2 = k2 = Ji(k2, h);
        4 !== T && (T = 2);
        null === sk ? sk = [f2] : sk.push(f2);
        f2 = g;
        do {
          switch (f2.tag) {
            case 3:
              f2.flags |= 65536;
              b &= -b;
              f2.lanes |= b;
              var x2 = Ni(f2, k2, b);
              ph(f2, x2);
              break a;
            case 1:
              h = k2;
              var w2 = f2.type, u2 = f2.stateNode;
              if (0 === (f2.flags & 128) && ("function" === typeof w2.getDerivedStateFromError || null !== u2 && "function" === typeof u2.componentDidCatch && (null === Ri || !Ri.has(u2)))) {
                f2.flags |= 65536;
                b &= -b;
                f2.lanes |= b;
                var F2 = Qi(f2, h, b);
                ph(f2, F2);
                break a;
              }
          }
          f2 = f2.return;
        } while (null !== f2);
      }
      Sk(c);
    } catch (na) {
      b = na;
      Y === c && null !== c && (Y = c = c.return);
      continue;
    }
    break;
  } while (1);
}
function Jk() {
  var a = mk.current;
  mk.current = Rh;
  return null === a ? Rh : a;
}
function tj() {
  if (0 === T || 3 === T || 2 === T) T = 4;
  null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
}
function Ik(a, b) {
  var c = K;
  K |= 2;
  var d = Jk();
  if (Q !== a || Z !== b) uk = null, Kk(a, b);
  do
    try {
      Tk();
      break;
    } catch (e) {
      Mk(a, e);
    }
  while (1);
  $g();
  K = c;
  mk.current = d;
  if (null !== Y) throw Error(p(261));
  Q = null;
  Z = 0;
  return T;
}
function Tk() {
  for (; null !== Y; ) Uk(Y);
}
function Lk() {
  for (; null !== Y && !cc(); ) Uk(Y);
}
function Uk(a) {
  var b = Vk(a.alternate, a, fj);
  a.memoizedProps = a.pendingProps;
  null === b ? Sk(a) : Y = b;
  nk.current = null;
}
function Sk(a) {
  var b = a;
  do {
    var c = b.alternate;
    a = b.return;
    if (0 === (b.flags & 32768)) {
      if (c = Ej(c, b, fj), null !== c) {
        Y = c;
        return;
      }
    } else {
      c = Ij(c, b);
      if (null !== c) {
        c.flags &= 32767;
        Y = c;
        return;
      }
      if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
      else {
        T = 6;
        Y = null;
        return;
      }
    }
    b = b.sibling;
    if (null !== b) {
      Y = b;
      return;
    }
    Y = b = a;
  } while (null !== b);
  0 === T && (T = 5);
}
function Pk(a, b, c) {
  var d = C, e = ok.transition;
  try {
    ok.transition = null, C = 1, Wk(a, b, c, d);
  } finally {
    ok.transition = e, C = d;
  }
  return null;
}
function Wk(a, b, c, d) {
  do
    Hk();
  while (null !== wk);
  if (0 !== (K & 6)) throw Error(p(327));
  c = a.finishedWork;
  var e = a.finishedLanes;
  if (null === c) return null;
  a.finishedWork = null;
  a.finishedLanes = 0;
  if (c === a.current) throw Error(p(177));
  a.callbackNode = null;
  a.callbackPriority = 0;
  var f2 = c.lanes | c.childLanes;
  Bc(a, f2);
  a === Q && (Y = Q = null, Z = 0);
  0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
    Hk();
    return null;
  }));
  f2 = 0 !== (c.flags & 15990);
  if (0 !== (c.subtreeFlags & 15990) || f2) {
    f2 = ok.transition;
    ok.transition = null;
    var g = C;
    C = 1;
    var h = K;
    K |= 4;
    nk.current = null;
    Oj(a, c);
    dk(c, a);
    Oe(Df);
    dd = !!Cf;
    Df = Cf = null;
    a.current = c;
    hk(c);
    dc();
    K = h;
    C = g;
    ok.transition = f2;
  } else a.current = c;
  vk && (vk = false, wk = a, xk = e);
  f2 = a.pendingLanes;
  0 === f2 && (Ri = null);
  mc(c.stateNode);
  Dk(a, B());
  if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
  if (Oi) throw Oi = false, a = Pi, Pi = null, a;
  0 !== (xk & 1) && 0 !== a.tag && Hk();
  f2 = a.pendingLanes;
  0 !== (f2 & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
  jg();
  return null;
}
function Hk() {
  if (null !== wk) {
    var a = Dc(xk), b = ok.transition, c = C;
    try {
      ok.transition = null;
      C = 16 > a ? 16 : a;
      if (null === wk) var d = false;
      else {
        a = wk;
        wk = null;
        xk = 0;
        if (0 !== (K & 6)) throw Error(p(331));
        var e = K;
        K |= 4;
        for (V = a.current; null !== V; ) {
          var f2 = V, g = f2.child;
          if (0 !== (V.flags & 16)) {
            var h = f2.deletions;
            if (null !== h) {
              for (var k2 = 0; k2 < h.length; k2++) {
                var l2 = h[k2];
                for (V = l2; null !== V; ) {
                  var m2 = V;
                  switch (m2.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(8, m2, f2);
                  }
                  var q2 = m2.child;
                  if (null !== q2) q2.return = m2, V = q2;
                  else for (; null !== V; ) {
                    m2 = V;
                    var r2 = m2.sibling, y2 = m2.return;
                    Sj(m2);
                    if (m2 === l2) {
                      V = null;
                      break;
                    }
                    if (null !== r2) {
                      r2.return = y2;
                      V = r2;
                      break;
                    }
                    V = y2;
                  }
                }
              }
              var n2 = f2.alternate;
              if (null !== n2) {
                var t2 = n2.child;
                if (null !== t2) {
                  n2.child = null;
                  do {
                    var J2 = t2.sibling;
                    t2.sibling = null;
                    t2 = J2;
                  } while (null !== t2);
                }
              }
              V = f2;
            }
          }
          if (0 !== (f2.subtreeFlags & 2064) && null !== g) g.return = f2, V = g;
          else b: for (; null !== V; ) {
            f2 = V;
            if (0 !== (f2.flags & 2048)) switch (f2.tag) {
              case 0:
              case 11:
              case 15:
                Pj(9, f2, f2.return);
            }
            var x2 = f2.sibling;
            if (null !== x2) {
              x2.return = f2.return;
              V = x2;
              break b;
            }
            V = f2.return;
          }
        }
        var w2 = a.current;
        for (V = w2; null !== V; ) {
          g = V;
          var u2 = g.child;
          if (0 !== (g.subtreeFlags & 2064) && null !== u2) u2.return = g, V = u2;
          else b: for (g = w2; null !== V; ) {
            h = V;
            if (0 !== (h.flags & 2048)) try {
              switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  Qj(9, h);
              }
            } catch (na) {
              W(h, h.return, na);
            }
            if (h === g) {
              V = null;
              break b;
            }
            var F2 = h.sibling;
            if (null !== F2) {
              F2.return = h.return;
              V = F2;
              break b;
            }
            V = h.return;
          }
        }
        K = e;
        jg();
        if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
          lc.onPostCommitFiberRoot(kc, a);
        } catch (na) {
        }
        d = true;
      }
      return d;
    } finally {
      C = c, ok.transition = b;
    }
  }
  return false;
}
function Xk(a, b, c) {
  b = Ji(c, b);
  b = Ni(a, b, 1);
  a = nh(a, b, 1);
  b = R();
  null !== a && (Ac(a, 1, b), Dk(a, b));
}
function W(a, b, c) {
  if (3 === a.tag) Xk(a, a, c);
  else for (; null !== b; ) {
    if (3 === b.tag) {
      Xk(b, a, c);
      break;
    } else if (1 === b.tag) {
      var d = b.stateNode;
      if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
        a = Ji(c, a);
        a = Qi(b, a, 1);
        b = nh(b, a, 1);
        a = R();
        null !== b && (Ac(b, 1, a), Dk(b, a));
        break;
      }
    }
    b = b.return;
  }
}
function Ti(a, b, c) {
  var d = a.pingCache;
  null !== d && d.delete(b);
  b = R();
  a.pingedLanes |= a.suspendedLanes & c;
  Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
  Dk(a, b);
}
function Yk(a, b) {
  0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
  var c = R();
  a = ih(a, b);
  null !== a && (Ac(a, b, c), Dk(a, c));
}
function uj(a) {
  var b = a.memoizedState, c = 0;
  null !== b && (c = b.retryLane);
  Yk(a, c);
}
function bk(a, b) {
  var c = 0;
  switch (a.tag) {
    case 13:
      var d = a.stateNode;
      var e = a.memoizedState;
      null !== e && (c = e.retryLane);
      break;
    case 19:
      d = a.stateNode;
      break;
    default:
      throw Error(p(314));
  }
  null !== d && d.delete(b);
  Yk(a, c);
}
var Vk;
Vk = function(a, b, c) {
  if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
  else {
    if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
    dh = 0 !== (a.flags & 131072) ? true : false;
  }
  else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
  b.lanes = 0;
  switch (b.tag) {
    case 2:
      var d = b.type;
      ij(a, b);
      a = b.pendingProps;
      var e = Yf(b, H.current);
      ch(b, c);
      e = Nh(null, b, d, a, e, c);
      var f2 = Sh();
      b.flags |= 1;
      "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f2 = true, cg(b)) : f2 = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f2, c)) : (b.tag = 0, I && f2 && vg(b), Xi(null, b, e, c), b = b.child);
      return b;
    case 16:
      d = b.elementType;
      a: {
        ij(a, b);
        a = b.pendingProps;
        e = d._init;
        d = e(d._payload);
        b.type = d;
        e = b.tag = Zk(d);
        a = Ci(d, a);
        switch (e) {
          case 0:
            b = cj(null, b, d, a, c);
            break a;
          case 1:
            b = hj(null, b, d, a, c);
            break a;
          case 11:
            b = Yi(null, b, d, a, c);
            break a;
          case 14:
            b = $i(null, b, d, Ci(d.type, a), c);
            break a;
        }
        throw Error(p(
          306,
          d,
          ""
        ));
      }
      return b;
    case 0:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
    case 1:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
    case 3:
      a: {
        kj(b);
        if (null === a) throw Error(p(387));
        d = b.pendingProps;
        f2 = b.memoizedState;
        e = f2.element;
        lh(a, b);
        qh(b, d, null, c);
        var g = b.memoizedState;
        d = g.element;
        if (f2.isDehydrated) if (f2 = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f2, b.memoizedState = f2, b.flags & 256) {
          e = Ji(Error(p(423)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else if (d !== e) {
          e = Ji(Error(p(424)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
        else {
          Ig();
          if (d === e) {
            b = Zi(a, b, c);
            break a;
          }
          Xi(a, b, d, c);
        }
        b = b.child;
      }
      return b;
    case 5:
      return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f2 = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f2 && Ef(d, f2) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
    case 6:
      return null === a && Eg(b), null;
    case 13:
      return oj(a, b, c);
    case 4:
      return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
    case 11:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
    case 7:
      return Xi(a, b, b.pendingProps, c), b.child;
    case 8:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 12:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 10:
      a: {
        d = b.type._context;
        e = b.pendingProps;
        f2 = b.memoizedProps;
        g = e.value;
        G(Wg, d._currentValue);
        d._currentValue = g;
        if (null !== f2) if (He(f2.value, g)) {
          if (f2.children === e.children && !Wf.current) {
            b = Zi(a, b, c);
            break a;
          }
        } else for (f2 = b.child, null !== f2 && (f2.return = b); null !== f2; ) {
          var h = f2.dependencies;
          if (null !== h) {
            g = f2.child;
            for (var k2 = h.firstContext; null !== k2; ) {
              if (k2.context === d) {
                if (1 === f2.tag) {
                  k2 = mh(-1, c & -c);
                  k2.tag = 2;
                  var l2 = f2.updateQueue;
                  if (null !== l2) {
                    l2 = l2.shared;
                    var m2 = l2.pending;
                    null === m2 ? k2.next = k2 : (k2.next = m2.next, m2.next = k2);
                    l2.pending = k2;
                  }
                }
                f2.lanes |= c;
                k2 = f2.alternate;
                null !== k2 && (k2.lanes |= c);
                bh(
                  f2.return,
                  c,
                  b
                );
                h.lanes |= c;
                break;
              }
              k2 = k2.next;
            }
          } else if (10 === f2.tag) g = f2.type === b.type ? null : f2.child;
          else if (18 === f2.tag) {
            g = f2.return;
            if (null === g) throw Error(p(341));
            g.lanes |= c;
            h = g.alternate;
            null !== h && (h.lanes |= c);
            bh(g, c, b);
            g = f2.sibling;
          } else g = f2.child;
          if (null !== g) g.return = f2;
          else for (g = f2; null !== g; ) {
            if (g === b) {
              g = null;
              break;
            }
            f2 = g.sibling;
            if (null !== f2) {
              f2.return = g.return;
              g = f2;
              break;
            }
            g = g.return;
          }
          f2 = g;
        }
        Xi(a, b, e.children, c);
        b = b.child;
      }
      return b;
    case 9:
      return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
    case 14:
      return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
    case 15:
      return bj(a, b, b.type, b.pendingProps, c);
    case 17:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
    case 19:
      return xj(a, b, c);
    case 22:
      return dj(a, b, c);
  }
  throw Error(p(156, b.tag));
};
function Fk(a, b) {
  return ac(a, b);
}
function $k(a, b, c, d) {
  this.tag = a;
  this.key = c;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = b;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = d;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function Bg(a, b, c, d) {
  return new $k(a, b, c, d);
}
function aj(a) {
  a = a.prototype;
  return !(!a || !a.isReactComponent);
}
function Zk(a) {
  if ("function" === typeof a) return aj(a) ? 1 : 0;
  if (void 0 !== a && null !== a) {
    a = a.$$typeof;
    if (a === Da) return 11;
    if (a === Ga) return 14;
  }
  return 2;
}
function Pg(a, b) {
  var c = a.alternate;
  null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
  c.flags = a.flags & 14680064;
  c.childLanes = a.childLanes;
  c.lanes = a.lanes;
  c.child = a.child;
  c.memoizedProps = a.memoizedProps;
  c.memoizedState = a.memoizedState;
  c.updateQueue = a.updateQueue;
  b = a.dependencies;
  c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
  c.sibling = a.sibling;
  c.index = a.index;
  c.ref = a.ref;
  return c;
}
function Rg(a, b, c, d, e, f2) {
  var g = 2;
  d = a;
  if ("function" === typeof a) aj(a) && (g = 1);
  else if ("string" === typeof a) g = 5;
  else a: switch (a) {
    case ya:
      return Tg(c.children, e, f2, b);
    case za:
      g = 8;
      e |= 8;
      break;
    case Aa:
      return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f2, a;
    case Ea:
      return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f2, a;
    case Fa:
      return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f2, a;
    case Ia:
      return pj(c, e, f2, b);
    default:
      if ("object" === typeof a && null !== a) switch (a.$$typeof) {
        case Ba:
          g = 10;
          break a;
        case Ca:
          g = 9;
          break a;
        case Da:
          g = 11;
          break a;
        case Ga:
          g = 14;
          break a;
        case Ha:
          g = 16;
          d = null;
          break a;
      }
      throw Error(p(130, null == a ? a : typeof a, ""));
  }
  b = Bg(g, c, b, e);
  b.elementType = a;
  b.type = d;
  b.lanes = f2;
  return b;
}
function Tg(a, b, c, d) {
  a = Bg(7, a, d, b);
  a.lanes = c;
  return a;
}
function pj(a, b, c, d) {
  a = Bg(22, a, d, b);
  a.elementType = Ia;
  a.lanes = c;
  a.stateNode = { isHidden: false };
  return a;
}
function Qg(a, b, c) {
  a = Bg(6, a, null, b);
  a.lanes = c;
  return a;
}
function Sg(a, b, c) {
  b = Bg(4, null !== a.children ? a.children : [], a.key, b);
  b.lanes = c;
  b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
  return b;
}
function al(a, b, c, d, e) {
  this.tag = b;
  this.containerInfo = a;
  this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.callbackNode = this.pendingContext = this.context = null;
  this.callbackPriority = 0;
  this.eventTimes = zc(0);
  this.expirationTimes = zc(-1);
  this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
  this.entanglements = zc(0);
  this.identifierPrefix = d;
  this.onRecoverableError = e;
  this.mutableSourceEagerHydrationData = null;
}
function bl(a, b, c, d, e, f2, g, h, k2) {
  a = new al(a, b, c, h, k2);
  1 === b ? (b = 1, true === f2 && (b |= 8)) : b = 0;
  f2 = Bg(3, null, null, b);
  a.current = f2;
  f2.stateNode = a;
  f2.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
  kh(f2);
  return a;
}
function cl(a, b, c) {
  var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
}
function dl(a) {
  if (!a) return Vf;
  a = a._reactInternals;
  a: {
    if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
    var b = a;
    do {
      switch (b.tag) {
        case 3:
          b = b.stateNode.context;
          break a;
        case 1:
          if (Zf(b.type)) {
            b = b.stateNode.__reactInternalMemoizedMergedChildContext;
            break a;
          }
      }
      b = b.return;
    } while (null !== b);
    throw Error(p(171));
  }
  if (1 === a.tag) {
    var c = a.type;
    if (Zf(c)) return bg(a, c, b);
  }
  return b;
}
function el(a, b, c, d, e, f2, g, h, k2) {
  a = bl(c, d, true, a, e, f2, g, h, k2);
  a.context = dl(null);
  c = a.current;
  d = R();
  e = yi(c);
  f2 = mh(d, e);
  f2.callback = void 0 !== b && null !== b ? b : null;
  nh(c, f2, e);
  a.current.lanes = e;
  Ac(a, e, d);
  Dk(a, d);
  return a;
}
function fl(a, b, c, d) {
  var e = b.current, f2 = R(), g = yi(e);
  c = dl(c);
  null === b.context ? b.context = c : b.pendingContext = c;
  b = mh(f2, g);
  b.payload = { element: a };
  d = void 0 === d ? null : d;
  null !== d && (b.callback = d);
  a = nh(e, b, g);
  null !== a && (gi(a, e, g, f2), oh(a, e, g));
  return g;
}
function gl(a) {
  a = a.current;
  if (!a.child) return null;
  switch (a.child.tag) {
    case 5:
      return a.child.stateNode;
    default:
      return a.child.stateNode;
  }
}
function hl(a, b) {
  a = a.memoizedState;
  if (null !== a && null !== a.dehydrated) {
    var c = a.retryLane;
    a.retryLane = 0 !== c && c < b ? c : b;
  }
}
function il(a, b) {
  hl(a, b);
  (a = a.alternate) && hl(a, b);
}
function jl() {
  return null;
}
var kl = "function" === typeof reportError ? reportError : function(a) {
  console.error(a);
};
function ll(a) {
  this._internalRoot = a;
}
ml.prototype.render = ll.prototype.render = function(a) {
  var b = this._internalRoot;
  if (null === b) throw Error(p(409));
  fl(a, b, null, null);
};
ml.prototype.unmount = ll.prototype.unmount = function() {
  var a = this._internalRoot;
  if (null !== a) {
    this._internalRoot = null;
    var b = a.containerInfo;
    Rk(function() {
      fl(null, a, null, null);
    });
    b[uf] = null;
  }
};
function ml(a) {
  this._internalRoot = a;
}
ml.prototype.unstable_scheduleHydration = function(a) {
  if (a) {
    var b = Hc();
    a = { blockedOn: null, target: a, priority: b };
    for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
    Qc.splice(c, 0, a);
    0 === c && Vc(a);
  }
};
function nl(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
}
function ol(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
}
function pl() {
}
function ql(a, b, c, d, e) {
  if (e) {
    if ("function" === typeof d) {
      var f2 = d;
      d = function() {
        var a2 = gl(g);
        f2.call(a2);
      };
    }
    var g = el(b, d, a, 0, null, false, false, "", pl);
    a._reactRootContainer = g;
    a[uf] = g.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    Rk();
    return g;
  }
  for (; e = a.lastChild; ) a.removeChild(e);
  if ("function" === typeof d) {
    var h = d;
    d = function() {
      var a2 = gl(k2);
      h.call(a2);
    };
  }
  var k2 = bl(a, 0, false, null, null, false, false, "", pl);
  a._reactRootContainer = k2;
  a[uf] = k2.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  Rk(function() {
    fl(b, k2, c, d);
  });
  return k2;
}
function rl(a, b, c, d, e) {
  var f2 = c._reactRootContainer;
  if (f2) {
    var g = f2;
    if ("function" === typeof e) {
      var h = e;
      e = function() {
        var a2 = gl(g);
        h.call(a2);
      };
    }
    fl(b, g, a, e);
  } else g = ql(c, b, a, e, d);
  return gl(g);
}
Ec = function(a) {
  switch (a.tag) {
    case 3:
      var b = a.stateNode;
      if (b.current.memoizedState.isDehydrated) {
        var c = tc(b.pendingLanes);
        0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
      }
      break;
    case 13:
      Rk(function() {
        var b2 = ih(a, 1);
        if (null !== b2) {
          var c2 = R();
          gi(b2, a, 1, c2);
        }
      }), il(a, 1);
  }
};
Fc = function(a) {
  if (13 === a.tag) {
    var b = ih(a, 134217728);
    if (null !== b) {
      var c = R();
      gi(b, a, 134217728, c);
    }
    il(a, 134217728);
  }
};
Gc = function(a) {
  if (13 === a.tag) {
    var b = yi(a), c = ih(a, b);
    if (null !== c) {
      var d = R();
      gi(c, a, b, d);
    }
    il(a, b);
  }
};
Hc = function() {
  return C;
};
Ic = function(a, b) {
  var c = C;
  try {
    return C = a, b();
  } finally {
    C = c;
  }
};
yb = function(a, b, c) {
  switch (b) {
    case "input":
      bb(a, c);
      b = c.name;
      if ("radio" === c.type && null != b) {
        for (c = a; c.parentNode; ) c = c.parentNode;
        c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
        for (b = 0; b < c.length; b++) {
          var d = c[b];
          if (d !== a && d.form === a.form) {
            var e = Db(d);
            if (!e) throw Error(p(90));
            Wa(d);
            bb(d, e);
          }
        }
      }
      break;
    case "textarea":
      ib(a, c);
      break;
    case "select":
      b = c.value, null != b && fb(a, !!c.multiple, b, false);
  }
};
Gb = Qk;
Hb = Rk;
var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] }, tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
  a = Zb(a);
  return null === a ? null : a.stateNode;
}, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!vl.isDisabled && vl.supportsFiber) try {
    kc = vl.inject(ul), lc = vl;
  } catch (a) {
  }
}
reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
reactDom_production_min.createPortal = function(a, b) {
  var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
  if (!nl(b)) throw Error(p(200));
  return cl(a, b, null, c);
};
reactDom_production_min.createRoot = function(a, b) {
  if (!nl(a)) throw Error(p(299));
  var c = false, d = "", e = kl;
  null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
  b = bl(a, 1, false, null, null, c, false, d, e);
  a[uf] = b.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  return new ll(b);
};
reactDom_production_min.findDOMNode = function(a) {
  if (null == a) return null;
  if (1 === a.nodeType) return a;
  var b = a._reactInternals;
  if (void 0 === b) {
    if ("function" === typeof a.render) throw Error(p(188));
    a = Object.keys(a).join(",");
    throw Error(p(268, a));
  }
  a = Zb(b);
  a = null === a ? null : a.stateNode;
  return a;
};
reactDom_production_min.flushSync = function(a) {
  return Rk(a);
};
reactDom_production_min.hydrate = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, true, c);
};
reactDom_production_min.hydrateRoot = function(a, b, c) {
  if (!nl(a)) throw Error(p(405));
  var d = null != c && c.hydratedSources || null, e = false, f2 = "", g = kl;
  null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f2 = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
  b = el(b, null, a, 1, null != c ? c : null, e, false, f2, g);
  a[uf] = b.current;
  sf(a);
  if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
    c,
    e
  );
  return new ml(b);
};
reactDom_production_min.render = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, false, c);
};
reactDom_production_min.unmountComponentAtNode = function(a) {
  if (!ol(a)) throw Error(p(40));
  return a._reactRootContainer ? (Rk(function() {
    rl(null, null, a, false, function() {
      a._reactRootContainer = null;
      a[uf] = null;
    });
  }), true) : false;
};
reactDom_production_min.unstable_batchedUpdates = Qk;
reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
  if (!ol(c)) throw Error(p(200));
  if (null == a || void 0 === a._reactInternals) throw Error(p(38));
  return rl(a, b, c, false, d);
};
reactDom_production_min.version = "18.3.1-next-f1338f8080-20240426";
function checkDCE() {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
    return;
  }
  try {
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    console.error(err);
  }
}
{
  checkDCE();
  reactDom.exports = reactDom_production_min;
}
var reactDomExports = reactDom.exports;
const ReactDOM = /* @__PURE__ */ getDefaultExportFromCjs(reactDomExports);
var m = reactDomExports;
{
  client.createRoot = m.createRoot;
  client.hydrateRoot = m.hydrateRoot;
}
function AppShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col h-screen bg-bg-base text-text-primary overflow-hidden", children });
}
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && array.indexOf(className) === index;
}).join(" ");
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Icon = reactExports.forwardRef(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => {
    return reactExports.createElement(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: mergeClasses("lucide", className),
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => reactExports.createElement(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const createLucideIcon = (iconName, iconNode) => {
  const Component = reactExports.forwardRef(
    ({ className, ...props }, ref) => reactExports.createElement(Icon, {
      ref,
      iconNode,
      className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
      ...props
    })
  );
  Component.displayName = `${iconName}`;
  return Component;
};
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Activity = createLucideIcon("Activity", [
  [
    "path",
    {
      d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
      key: "169zse"
    }
  ]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Archive = createLucideIcon("Archive", [
  ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1", key: "1wp1u1" }],
  ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8", key: "1s80jp" }],
  ["path", { d: "M10 12h4", key: "a56b0p" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArrowRight = createLucideIcon("ArrowRight", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const BarChart2 = createLucideIcon("BarChart2", [
  ["line", { x1: "18", x2: "18", y1: "20", y2: "10", key: "1xfpm4" }],
  ["line", { x1: "12", x2: "12", y1: "20", y2: "4", key: "be30l9" }],
  ["line", { x1: "6", x2: "6", y1: "20", y2: "14", key: "1r4le6" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const BookOpen = createLucideIcon("BookOpen", [
  ["path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", key: "vv98re" }],
  ["path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z", key: "1cyq3y" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Brain = createLucideIcon("Brain", [
  [
    "path",
    {
      d: "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",
      key: "l5xja"
    }
  ],
  [
    "path",
    {
      d: "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",
      key: "ep3f8r"
    }
  ],
  ["path", { d: "M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4", key: "1p4c4q" }],
  ["path", { d: "M17.599 6.5a3 3 0 0 0 .399-1.375", key: "tmeiqw" }],
  ["path", { d: "M6.003 5.125A3 3 0 0 0 6.401 6.5", key: "105sqy" }],
  ["path", { d: "M3.477 10.896a4 4 0 0 1 .585-.396", key: "ql3yin" }],
  ["path", { d: "M19.938 10.5a4 4 0 0 1 .585.396", key: "1qfode" }],
  ["path", { d: "M6 18a4 4 0 0 1-1.967-.516", key: "2e4loj" }],
  ["path", { d: "M19.967 17.484A4 4 0 0 1 18 18", key: "159ez6" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ChevronDown = createLucideIcon("ChevronDown", [
  ["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ChevronRight = createLucideIcon("ChevronRight", [
  ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ChevronUp = createLucideIcon("ChevronUp", [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CircleAlert = createLucideIcon("CircleAlert", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CircleCheck = createLucideIcon("CircleCheck", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CircleX = createLucideIcon("CircleX", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  ["path", { d: "m9 9 6 6", key: "z0biqf" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Clock = createLucideIcon("Clock", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Code = createLucideIcon("Code", [
  ["polyline", { points: "16 18 22 12 16 6", key: "z7tu5w" }],
  ["polyline", { points: "8 6 2 12 8 18", key: "1eg1df" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Copy = createLucideIcon("Copy", [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Cpu = createLucideIcon("Cpu", [
  ["rect", { width: "16", height: "16", x: "4", y: "4", rx: "2", key: "14l7u7" }],
  ["rect", { width: "6", height: "6", x: "9", y: "9", rx: "1", key: "5aljv4" }],
  ["path", { d: "M15 2v2", key: "13l42r" }],
  ["path", { d: "M15 20v2", key: "15mkzm" }],
  ["path", { d: "M2 15h2", key: "1gxd5l" }],
  ["path", { d: "M2 9h2", key: "1bbxkp" }],
  ["path", { d: "M20 15h2", key: "19e6y8" }],
  ["path", { d: "M20 9h2", key: "19tzq7" }],
  ["path", { d: "M9 2v2", key: "165o2o" }],
  ["path", { d: "M9 20v2", key: "i2bqo8" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Database = createLucideIcon("Database", [
  ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
  ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
  ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Download = createLucideIcon("Download", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "7 10 12 15 17 10", key: "2ggqvy" }],
  ["line", { x1: "12", x2: "12", y1: "15", y2: "3", key: "1vk2je" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FileCode = createLucideIcon("FileCode", [
  ["path", { d: "M10 12.5 8 15l2 2.5", key: "1tg20x" }],
  ["path", { d: "m14 12.5 2 2.5-2 2.5", key: "yinavb" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z", key: "1mlx9k" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FileText = createLucideIcon("FileText", [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FlaskConical = createLucideIcon("FlaskConical", [
  [
    "path",
    {
      d: "M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2",
      key: "pzvekw"
    }
  ],
  ["path", { d: "M8.5 2h7", key: "csnxdl" }],
  ["path", { d: "M7 16h10", key: "wp8him" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Gauge = createLucideIcon("Gauge", [
  ["path", { d: "m12 14 4-4", key: "9kzdfg" }],
  ["path", { d: "M3.34 19a10 10 0 1 1 17.32 0", key: "19p75a" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const GitBranch = createLucideIcon("GitBranch", [
  ["line", { x1: "6", x2: "6", y1: "3", y2: "15", key: "17qcm7" }],
  ["circle", { cx: "18", cy: "6", r: "3", key: "1h7g24" }],
  ["circle", { cx: "6", cy: "18", r: "3", key: "fqmcym" }],
  ["path", { d: "M18 9a9 9 0 0 1-9 9", key: "n2h4wq" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const GitPullRequest = createLucideIcon("GitPullRequest", [
  ["circle", { cx: "18", cy: "18", r: "3", key: "1xkwt0" }],
  ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
  ["path", { d: "M13 6h3a2 2 0 0 1 2 2v7", key: "1yeb86" }],
  ["line", { x1: "6", x2: "6", y1: "9", y2: "21", key: "rroup" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const HardDrive = createLucideIcon("HardDrive", [
  ["line", { x1: "22", x2: "2", y1: "12", y2: "12", key: "1y58io" }],
  [
    "path",
    {
      d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
      key: "oot6mr"
    }
  ],
  ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16", key: "sgf278" }],
  ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16", key: "1l4acy" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const History = createLucideIcon("History", [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M12 7v5l4 2", key: "1fdv2h" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Info = createLucideIcon("Info", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 16v-4", key: "1dtifu" }],
  ["path", { d: "M12 8h.01", key: "e9boi3" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LayoutDashboard = createLucideIcon("LayoutDashboard", [
  ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
  ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" }],
  ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" }],
  ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LoaderCircle = createLucideIcon("LoaderCircle", [
  ["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Loader = createLucideIcon("Loader", [
  ["path", { d: "M12 2v4", key: "3427ic" }],
  ["path", { d: "m16.2 7.8 2.9-2.9", key: "r700ao" }],
  ["path", { d: "M18 12h4", key: "wj9ykh" }],
  ["path", { d: "m16.2 16.2 2.9 2.9", key: "1bxg5t" }],
  ["path", { d: "M12 18v4", key: "jadmvz" }],
  ["path", { d: "m4.9 19.1 2.9-2.9", key: "bwix9q" }],
  ["path", { d: "M2 12h4", key: "j09sii" }],
  ["path", { d: "m4.9 4.9 2.9 2.9", key: "giyufr" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Lock = createLucideIcon("Lock", [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const MessageSquare = createLucideIcon("MessageSquare", [
  ["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", key: "1lielz" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Mic = createLucideIcon("Mic", [
  ["path", { d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z", key: "131961" }],
  ["path", { d: "M19 10v2a7 7 0 0 1-14 0v-2", key: "1vc78b" }],
  ["line", { x1: "12", x2: "12", y1: "19", y2: "22", key: "x3vr5v" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Network = createLucideIcon("Network", [
  ["rect", { x: "16", y: "16", width: "6", height: "6", rx: "1", key: "4q2zg0" }],
  ["rect", { x: "2", y: "16", width: "6", height: "6", rx: "1", key: "8cvhb9" }],
  ["rect", { x: "9", y: "2", width: "6", height: "6", rx: "1", key: "1egb70" }],
  ["path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3", key: "1jsf9p" }],
  ["path", { d: "M12 12V8", key: "2874zd" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Pause = createLucideIcon("Pause", [
  ["rect", { x: "14", y: "4", width: "4", height: "16", rx: "1", key: "zuxfzm" }],
  ["rect", { x: "6", y: "4", width: "4", height: "16", rx: "1", key: "1okwgv" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Play = createLucideIcon("Play", [
  ["polygon", { points: "6 3 20 12 6 21 6 3", key: "1oa8hb" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Plus = createLucideIcon("Plus", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Puzzle = createLucideIcon("Puzzle", [
  [
    "path",
    {
      d: "M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z",
      key: "i0oyt7"
    }
  ]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const RefreshCw = createLucideIcon("RefreshCw", [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const RotateCw = createLucideIcon("RotateCw", [
  ["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8", key: "1p45f6" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Save = createLucideIcon("Save", [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Search = createLucideIcon("Search", [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Send = createLucideIcon("Send", [
  ["path", { d: "m22 2-7 20-4-9-9-4Z", key: "1q3vgg" }],
  ["path", { d: "M22 2 11 13", key: "nzbqef" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Server = createLucideIcon("Server", [
  ["rect", { width: "20", height: "8", x: "2", y: "2", rx: "2", ry: "2", key: "ngkwjq" }],
  ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2", ry: "2", key: "iecqi9" }],
  ["line", { x1: "6", x2: "6.01", y1: "6", y2: "6", key: "16zg32" }],
  ["line", { x1: "6", x2: "6.01", y1: "18", y2: "18", key: "nzw8ys" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Settings$1 = createLucideIcon("Settings", [
  [
    "path",
    {
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      key: "1qme2f"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ShieldAlert = createLucideIcon("ShieldAlert", [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ],
  ["path", { d: "M12 8v4", key: "1got3b" }],
  ["path", { d: "M12 16h.01", key: "1drbdi" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ShieldCheck = createLucideIcon("ShieldCheck", [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Shield = createLucideIcon("Shield", [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Smartphone = createLucideIcon("Smartphone", [
  ["rect", { width: "14", height: "20", x: "5", y: "2", rx: "2", ry: "2", key: "1yt0o3" }],
  ["path", { d: "M12 18h.01", key: "mhygvu" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Square = createLucideIcon("Square", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Tag = createLucideIcon("Tag", [
  [
    "path",
    {
      d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
      key: "vktsd0"
    }
  ],
  ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor", key: "kqv944" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Thermometer = createLucideIcon("Thermometer", [
  ["path", { d: "M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z", key: "17jzev" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ToggleLeft = createLucideIcon("ToggleLeft", [
  ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "6", ry: "6", key: "f2vt7d" }],
  ["circle", { cx: "8", cy: "12", r: "2", key: "1nvbw3" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ToggleRight = createLucideIcon("ToggleRight", [
  ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "6", ry: "6", key: "f2vt7d" }],
  ["circle", { cx: "16", cy: "12", r: "2", key: "4ma0v8" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Trash2 = createLucideIcon("Trash2", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const TrendingDown = createLucideIcon("TrendingDown", [
  ["polyline", { points: "22 17 13.5 8.5 8.5 13.5 2 7", key: "1r2t7k" }],
  ["polyline", { points: "16 17 22 17 22 11", key: "11uiuu" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const TrendingUp = createLucideIcon("TrendingUp", [
  ["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17", key: "126l90" }],
  ["polyline", { points: "16 7 22 7 22 13", key: "kwv8wd" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const TriangleAlert = createLucideIcon("TriangleAlert", [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Upload = createLucideIcon("Upload", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
  ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Users = createLucideIcon("Users", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Volume2 = createLucideIcon("Volume2", [
  ["polygon", { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5", key: "16drj5" }],
  ["path", { d: "M15.54 8.46a5 5 0 0 1 0 7.07", key: "ltjumu" }],
  ["path", { d: "M19.07 4.93a10 10 0 0 1 0 14.14", key: "1kegas" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const WifiOff = createLucideIcon("WifiOff", [
  ["path", { d: "M12 20h.01", key: "zekei9" }],
  ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0", key: "1bycff" }],
  ["path", { d: "M5 12.859a10 10 0 0 1 5.17-2.69", key: "1dl1wf" }],
  ["path", { d: "M19 12.859a10 10 0 0 0-2.007-1.523", key: "4k23kn" }],
  ["path", { d: "M2 8.82a15 15 0 0 1 4.177-2.643", key: "1grhjp" }],
  ["path", { d: "M22 8.82a15 15 0 0 0-11.288-3.764", key: "z3jwby" }],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Workflow = createLucideIcon("Workflow", [
  ["rect", { width: "8", height: "8", x: "3", y: "3", rx: "2", key: "by2w9f" }],
  ["path", { d: "M7 11v4a2 2 0 0 0 2 2h4", key: "xkn7yn" }],
  ["rect", { width: "8", height: "8", x: "13", y: "13", rx: "2", key: "1cgmvn" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const X = createLucideIcon("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);
/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Zap = createLucideIcon("Zap", [
  [
    "path",
    {
      d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
      key: "1xq2db"
    }
  ]
]);
const __vite_import_meta_env__$1 = {};
const createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState2 = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => {
    if ((__vite_import_meta_env__$1 ? "production" : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
      );
    }
    listeners.clear();
  };
  const api = { setState, getState: getState2, getInitialState, subscribe, destroy };
  const initialState = state = createState(setState, getState2, api);
  return api;
};
const createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
var withSelector = { exports: {} };
var withSelector_production = {};
var shim$2 = { exports: {} };
var useSyncExternalStoreShim_production = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React$1 = reactExports;
function is$1(x2, y2) {
  return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
}
var objectIs$1 = "function" === typeof Object.is ? Object.is : is$1, useState = React$1.useState, useEffect$1 = React$1.useEffect, useLayoutEffect = React$1.useLayoutEffect, useDebugValue$2 = React$1.useDebugValue;
function useSyncExternalStore$2(subscribe, getSnapshot) {
  var value = getSnapshot(), _useState = useState({ inst: { value, getSnapshot } }), inst = _useState[0].inst, forceUpdate = _useState[1];
  useLayoutEffect(
    function() {
      inst.value = value;
      inst.getSnapshot = getSnapshot;
      checkIfSnapshotChanged(inst) && forceUpdate({ inst });
    },
    [subscribe, value, getSnapshot]
  );
  useEffect$1(
    function() {
      checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      return subscribe(function() {
        checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      });
    },
    [subscribe]
  );
  useDebugValue$2(value);
  return value;
}
function checkIfSnapshotChanged(inst) {
  var latestGetSnapshot = inst.getSnapshot;
  inst = inst.value;
  try {
    var nextValue = latestGetSnapshot();
    return !objectIs$1(inst, nextValue);
  } catch (error) {
    return true;
  }
}
function useSyncExternalStore$1(subscribe, getSnapshot) {
  return getSnapshot();
}
var shim$1 = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
useSyncExternalStoreShim_production.useSyncExternalStore = void 0 !== React$1.useSyncExternalStore ? React$1.useSyncExternalStore : shim$1;
{
  shim$2.exports = useSyncExternalStoreShim_production;
}
var shimExports = shim$2.exports;
/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React = reactExports, shim = shimExports;
function is(x2, y2) {
  return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
}
var objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue$1 = React.useDebugValue;
withSelector_production.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
  var instRef = useRef(null);
  if (null === instRef.current) {
    var inst = { hasValue: false, value: null };
    instRef.current = inst;
  } else inst = instRef.current;
  instRef = useMemo(
    function() {
      function memoizedSelector(nextSnapshot) {
        if (!hasMemo) {
          hasMemo = true;
          memoizedSnapshot = nextSnapshot;
          nextSnapshot = selector(nextSnapshot);
          if (void 0 !== isEqual && inst.hasValue) {
            var currentSelection = inst.value;
            if (isEqual(currentSelection, nextSnapshot))
              return memoizedSelection = currentSelection;
          }
          return memoizedSelection = nextSnapshot;
        }
        currentSelection = memoizedSelection;
        if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
        var nextSelection = selector(nextSnapshot);
        if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
          return memoizedSnapshot = nextSnapshot, currentSelection;
        memoizedSnapshot = nextSnapshot;
        return memoizedSelection = nextSelection;
      }
      var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
      return [
        function() {
          return memoizedSelector(getSnapshot());
        },
        null === maybeGetServerSnapshot ? void 0 : function() {
          return memoizedSelector(maybeGetServerSnapshot());
        }
      ];
    },
    [getSnapshot, getServerSnapshot, selector, isEqual]
  );
  var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
  useEffect(
    function() {
      inst.hasValue = true;
      inst.value = value;
    },
    [value]
  );
  useDebugValue$1(value);
  return value;
};
{
  withSelector.exports = withSelector_production;
}
var withSelectorExports = withSelector.exports;
const useSyncExternalStoreExports = /* @__PURE__ */ getDefaultExportFromCjs(withSelectorExports);
const __vite_import_meta_env__ = {};
const { useDebugValue } = React$2;
const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;
let didWarnAboutEqualityFn = false;
const identity = (arg) => arg;
function useStore(api, selector = identity, equalityFn) {
  if ((__vite_import_meta_env__ ? "production" : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
    console.warn(
      "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
    );
    didWarnAboutEqualityFn = true;
  }
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getInitialState,
    selector,
    equalityFn
  );
  useDebugValue(slice);
  return slice;
}
const createImpl = (createState) => {
  if ((__vite_import_meta_env__ ? "production" : void 0) !== "production" && typeof createState !== "function") {
    console.warn(
      "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
    );
  }
  const api = typeof createState === "function" ? createStore(createState) : createState;
  const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
const create = (createState) => createState ? createImpl(createState) : createImpl;
const useNavigationStore = create((set) => ({
  active: "dashboard",
  setActive: (section) => set({ active: section })
}));
const DEFAULT_VOICE_SETTINGS = {
  modelSize: "base",
  language: "en",
  autoInsert: false,
  playTTS: true,
  recordAudio: true
};
const useVoiceStore = create((set) => ({
  // Initial state
  transcriptions: [],
  currentTranscript: "",
  isRecording: false,
  isProcessing: false,
  recordingDuration: 0,
  settings: DEFAULT_VOICE_SETTINGS,
  isPanelOpen: false,
  serviceReady: false,
  transcriptionError: null,
  // Transcription actions
  addTranscription: (entry) => set((state) => ({
    transcriptions: [
      {
        id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...entry
      },
      ...state.transcriptions
    ]
  })),
  clearTranscriptions: () => set({ transcriptions: [] }),
  deleteTranscription: (id2) => set((state) => ({
    transcriptions: state.transcriptions.filter((t2) => t2.id !== id2)
  })),
  setCurrentTranscript: (text) => set({ currentTranscript: text }),
  // Recording state actions
  setIsRecording: (recording) => set({ isRecording: recording }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setRecordingDuration: (duration) => set({ recordingDuration: duration }),
  incrementRecordingDuration: () => set((state) => ({
    recordingDuration: state.recordingDuration + 1
  })),
  // Settings actions
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  })),
  resetSettings: () => set({ settings: DEFAULT_VOICE_SETTINGS }),
  // UI actions
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  setServiceReady: (ready) => set({ serviceReady: ready }),
  setTranscriptionError: (error) => set({ transcriptionError: error })
}));
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "models", label: "Models", icon: Cpu },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "training", label: "Training", icon: Zap },
  { id: "federation", label: "Federation", icon: Network },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "enterprise", label: "Enterprise", icon: Database },
  { id: "decisiongraph", label: "Decision Graph", icon: GitBranch },
  { id: "orchestration", label: "Orchestration", icon: Workflow },
  { id: "orgintelligence", label: "Org Intel", icon: Users },
  { id: "personacouncil", label: "Code Council", icon: Shield },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "messaging", label: "IM Bridge", icon: Smartphone },
  { id: "semanticsearch", label: "Code Search", icon: Search },
  { id: "plugins", label: "Plugins", icon: Puzzle },
  { id: "prreview", label: "PR Review", icon: GitPullRequest },
  { id: "finetune", label: "Fine-tune", icon: FlaskConical },
  { id: "federationcore", label: "Fed Core", icon: Network },
  { id: "codecompletion", label: "Completions", icon: Code },
  { id: "memory", label: "Memory", icon: Brain }
];
const bottomItems = [
  { id: "settings", label: "Settings", icon: Settings$1 }
];
function Sidebar() {
  const { active, setActive } = useNavigationStore();
  const { isPanelOpen, setPanelOpen } = useVoiceStore();
  const navButton = (item) => {
    const isActive = active === item.id;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setActive(item.id),
        "aria-current": isActive ? "page" : void 0,
        className: [
          "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          isActive ? "bg-accent-500/10 text-accent-400 border-l-2 border-accent-500" : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-2"
        ].join(" "),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { size: 16, "aria-hidden": true }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
        ]
      },
      item.id
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "aside",
    {
      className: "w-[220px] flex flex-col bg-bg-surface-1 border-r border-border-subtle flex-shrink-0",
      "aria-label": "Main navigation",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-4 border-b border-border-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary font-semibold text-sm", children: "Sovereign Coder" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 py-2", "aria-label": "Primary navigation", children: navItems.map(navButton) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-2 border-t border-border-subtle space-y-2", children: [
          bottomItems.map(navButton),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setPanelOpen(!isPanelOpen),
              "aria-label": isPanelOpen ? "Close voice panel" : "Open voice panel",
              className: [
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                isPanelOpen ? "bg-accent-500/10 text-accent-400 border-l-2 border-accent-500" : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-2"
              ].join(" "),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { size: 16, "aria-hidden": true }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Voice" })
              ]
            }
          )
        ] })
      ]
    }
  );
}
const useSystemStore = create((set) => ({
  activeModel: null,
  tokensPerSec: null,
  gpuName: null,
  vramUsed: null,
  vramTotal: null,
  gpuTemp: null,
  trainingStatus: "idle",
  federationPeers: 0,
  ollamaOnline: false,
  theme: "dark",
  setTheme: (theme) => set({ theme })
}));
const useKnowledgeLibraryStore = create((set) => ({
  // Initial state
  snippets: [],
  decisions: [],
  memoryMarkdown: "",
  domainStats: [],
  totalItems: 0,
  isIndexing: false,
  searchQuery: "",
  searchResults: [],
  injectionEnabled: true,
  // Actions
  setSnippets: (snippets) => set({ snippets }),
  setDecisions: (decisions) => set({ decisions }),
  setSearchResults: (results) => set({ searchResults: results }),
  setMemoryMarkdown: (content) => set({ memoryMarkdown: content }),
  setDomainStats: (stats) => set({ domainStats: stats }),
  setTotalItems: (count2) => set({ totalItems: count2 }),
  setIsIndexing: (indexing) => set({ isIndexing: indexing }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setInjectionEnabled: (enabled) => set({ injectionEnabled: enabled }),
  removeSnippet: (id2) => set((state) => ({ snippets: state.snippets.filter((s) => s.id !== id2) }))
}));
function StatusBar() {
  const {
    activeModel,
    tokensPerSec,
    vramUsed,
    vramTotal,
    gpuTemp,
    trainingStatus,
    federationPeers
  } = useSystemStore();
  const { serviceReady, isRecording } = useVoiceStore();
  const { totalItems } = useKnowledgeLibraryStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "footer",
    {
      role: "status",
      "aria-label": "System status",
      className: "h-[28px] flex items-center px-3 gap-3 bg-bg-surface-1 border-t border-border-subtle text-[11px] text-text-secondary flex-shrink-0 overflow-hidden",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 bg-local-badge-bg text-local-badge-fg px-2 py-0.5 rounded-sm flex-shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 9, "aria-hidden": true }),
          "Running Locally"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", className: "text-border-default", children: "|" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary truncate max-w-[200px]", children: activeModel ?? "No model loaded" }),
        vramUsed !== null && vramTotal !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", className: "text-border-default", children: "|" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-shrink-0", children: [
            "GPU ",
            vramUsed.toFixed(1),
            "/",
            vramTotal,
            " GB",
            gpuTemp !== null && ` · ${gpuTemp}°C`
          ] })
        ] }),
        tokensPerSec !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", className: "text-border-default", children: "|" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-shrink-0", children: [
            Math.round(tokensPerSec),
            " tok/s"
          ] })
        ] }),
        trainingStatus === "running" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", className: "text-border-default", children: "|" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-yellow-400 flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 10, "aria-hidden": true }),
            "Training: Running"
          ] })
        ] }),
        federationPeers > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", className: "text-border-default", children: "|" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-green-400 flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Network, { size: 10, "aria-hidden": true }),
            federationPeers,
            " peers"
          ] })
        ] }),
        totalItems > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", className: "text-border-default", children: "|" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-shrink-0", children: [
            totalItems,
            " snippets"
          ] })
        ] }),
        (serviceReady || isRecording) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", className: "text-border-default", children: "|" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `flex items-center gap-1 flex-shrink-0 ${isRecording ? "text-red-400" : serviceReady ? "text-green-400" : "text-yellow-400"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { size: 10, "aria-hidden": true }),
            isRecording ? "Recording" : serviceReady ? "Voice Ready" : "Voice Loading"
          ] })
        ] })
      ]
    }
  );
}
function composeEventHandlers(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
  return function handleEvent(event) {
    originalEventHandler?.(event);
    if (checkForDefaultPrevented === false || !event.defaultPrevented) {
      return ourEventHandler?.(event);
    }
  };
}
function setRef(ref, value) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== void 0) {
    ref.current = value;
  }
}
function composeRefs(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup == "function") {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup == "function") {
            cleanup();
          } else {
            setRef(refs[i], null);
          }
        }
      };
    }
  };
}
function useComposedRefs(...refs) {
  return reactExports.useCallback(composeRefs(...refs), refs);
}
function createContext2(rootComponentName, defaultContext) {
  const Context = reactExports.createContext(defaultContext);
  const Provider = (props) => {
    const { children, ...context } = props;
    const value = reactExports.useMemo(() => context, Object.values(context));
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Context.Provider, { value, children });
  };
  Provider.displayName = rootComponentName + "Provider";
  function useContext2(consumerName) {
    const context = reactExports.useContext(Context);
    if (context) return context;
    if (defaultContext !== void 0) return defaultContext;
    throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
  }
  return [Provider, useContext2];
}
function createContextScope(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext3(rootComponentName, defaultContext) {
    const BaseContext = reactExports.createContext(defaultContext);
    const index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    const Provider = (props) => {
      const { scope, children, ...context } = props;
      const Context = scope?.[scopeName]?.[index] || BaseContext;
      const value = reactExports.useMemo(() => context, Object.values(context));
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Context.Provider, { value, children });
    };
    Provider.displayName = rootComponentName + "Provider";
    function useContext2(consumerName, scope) {
      const Context = scope?.[scopeName]?.[index] || BaseContext;
      const context = reactExports.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return [Provider, useContext2];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return reactExports.createContext(defaultContext);
    });
    return function useScope(scope) {
      const contexts = scope?.[scopeName] || scopeContexts;
      return reactExports.useMemo(
        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
        [scope, contexts]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [createContext3, composeContextScopes(createScope, ...createContextScopeDeps)];
}
function composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = () => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return { ...nextScopes2, ...currentScope };
      }, {});
      return reactExports.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
    };
  };
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}
var useLayoutEffect2 = globalThis?.document ? reactExports.useLayoutEffect : () => {
};
var useReactId = React$3[" useId ".trim().toString()] || (() => void 0);
var count$1 = 0;
function useId(deterministicId) {
  const [id2, setId] = reactExports.useState(useReactId());
  useLayoutEffect2(() => {
    setId((reactId) => reactId ?? String(count$1++));
  }, [deterministicId]);
  return deterministicId || (id2 ? `radix-${id2}` : "");
}
var useInsertionEffect = React$3[" useInsertionEffect ".trim().toString()] || useLayoutEffect2;
function useControllableState({
  prop,
  defaultProp,
  onChange = () => {
  },
  caller
}) {
  const [uncontrolledProp, setUncontrolledProp, onChangeRef] = useUncontrolledState({
    defaultProp,
    onChange
  });
  const isControlled = prop !== void 0;
  const value = isControlled ? prop : uncontrolledProp;
  {
    const isControlledRef = reactExports.useRef(prop !== void 0);
    reactExports.useEffect(() => {
      const wasControlled = isControlledRef.current;
      if (wasControlled !== isControlled) {
        const from = wasControlled ? "controlled" : "uncontrolled";
        const to = isControlled ? "controlled" : "uncontrolled";
        console.warn(
          `${caller} is changing from ${from} to ${to}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
        );
      }
      isControlledRef.current = isControlled;
    }, [isControlled, caller]);
  }
  const setValue = reactExports.useCallback(
    (nextValue) => {
      if (isControlled) {
        const value2 = isFunction(nextValue) ? nextValue(prop) : nextValue;
        if (value2 !== prop) {
          onChangeRef.current?.(value2);
        }
      } else {
        setUncontrolledProp(nextValue);
      }
    },
    [isControlled, prop, setUncontrolledProp, onChangeRef]
  );
  return [value, setValue];
}
function useUncontrolledState({
  defaultProp,
  onChange
}) {
  const [value, setValue] = reactExports.useState(defaultProp);
  const prevValueRef = reactExports.useRef(value);
  const onChangeRef = reactExports.useRef(onChange);
  useInsertionEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  reactExports.useEffect(() => {
    if (prevValueRef.current !== value) {
      onChangeRef.current?.(value);
      prevValueRef.current = value;
    }
  }, [value, prevValueRef]);
  return [value, setValue, onChangeRef];
}
function isFunction(value) {
  return typeof value === "function";
}
// @__NO_SIDE_EFFECTS__
function createSlot(ownerName) {
  const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
  const Slot2 = reactExports.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    const childrenArray = reactExports.Children.toArray(children);
    const slottable = childrenArray.find(isSlottable);
    if (slottable) {
      const newElement = slottable.props.children;
      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
          return reactExports.isValidElement(newElement) ? newElement.props.children : null;
        } else {
          return child;
        }
      });
      return /* @__PURE__ */ jsxRuntimeExports.jsx(SlotClone, { ...slotProps, ref: forwardedRef, children: reactExports.isValidElement(newElement) ? reactExports.cloneElement(newElement, void 0, newChildren) : null });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(SlotClone, { ...slotProps, ref: forwardedRef, children });
  });
  Slot2.displayName = `${ownerName}.Slot`;
  return Slot2;
}
// @__NO_SIDE_EFFECTS__
function createSlotClone(ownerName) {
  const SlotClone = reactExports.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    if (reactExports.isValidElement(children)) {
      const childrenRef = getElementRef$1(children);
      const props2 = mergeProps(slotProps, children.props);
      if (children.type !== reactExports.Fragment) {
        props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
      }
      return reactExports.cloneElement(children, props2);
    }
    return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
  });
  SlotClone.displayName = `${ownerName}.SlotClone`;
  return SlotClone;
}
var SLOTTABLE_IDENTIFIER = Symbol("radix.slottable");
function isSlottable(child) {
  return reactExports.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
}
function mergeProps(slotProps, childProps) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args) => {
          const result = childPropValue(...args);
          slotPropValue(...args);
          return result;
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
    }
  }
  return { ...slotProps, ...overrideProps };
}
function getElementRef$1(element) {
  let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.ref;
  }
  getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.props.ref;
  }
  return element.props.ref || element.ref;
}
var NODES = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
];
var Primitive = NODES.reduce((primitive, node) => {
  const Slot2 = /* @__PURE__ */ createSlot(`Primitive.${node}`);
  const Node2 = reactExports.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? Slot2 : node;
    if (typeof window !== "undefined") {
      window[Symbol.for("radix-ui")] = true;
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Comp, { ...primitiveProps, ref: forwardedRef });
  });
  Node2.displayName = `Primitive.${node}`;
  return { ...primitive, [node]: Node2 };
}, {});
function dispatchDiscreteCustomEvent(target, event) {
  if (target) reactDomExports.flushSync(() => target.dispatchEvent(event));
}
function useCallbackRef$1(callback) {
  const callbackRef = reactExports.useRef(callback);
  reactExports.useEffect(() => {
    callbackRef.current = callback;
  });
  return reactExports.useMemo(() => (...args) => callbackRef.current?.(...args), []);
}
function useEscapeKeydown(onEscapeKeyDownProp, ownerDocument = globalThis?.document) {
  const onEscapeKeyDown = useCallbackRef$1(onEscapeKeyDownProp);
  reactExports.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onEscapeKeyDown(event);
      }
    };
    ownerDocument.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => ownerDocument.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [onEscapeKeyDown, ownerDocument]);
}
var DISMISSABLE_LAYER_NAME = "DismissableLayer";
var CONTEXT_UPDATE = "dismissableLayer.update";
var POINTER_DOWN_OUTSIDE = "dismissableLayer.pointerDownOutside";
var FOCUS_OUTSIDE = "dismissableLayer.focusOutside";
var originalBodyPointerEvents;
var DismissableLayerContext = reactExports.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
});
var DismissableLayer = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      disableOutsidePointerEvents = false,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onDismiss,
      ...layerProps
    } = props;
    const context = reactExports.useContext(DismissableLayerContext);
    const [node, setNode] = reactExports.useState(null);
    const ownerDocument = node?.ownerDocument ?? globalThis?.document;
    const [, force] = reactExports.useState({});
    const composedRefs = useComposedRefs(forwardedRef, (node2) => setNode(node2));
    const layers = Array.from(context.layers);
    const [highestLayerWithOutsidePointerEventsDisabled] = [...context.layersWithOutsidePointerEventsDisabled].slice(-1);
    const highestLayerWithOutsidePointerEventsDisabledIndex = layers.indexOf(highestLayerWithOutsidePointerEventsDisabled);
    const index = node ? layers.indexOf(node) : -1;
    const isBodyPointerEventsDisabled = context.layersWithOutsidePointerEventsDisabled.size > 0;
    const isPointerEventsEnabled = index >= highestLayerWithOutsidePointerEventsDisabledIndex;
    const pointerDownOutside = usePointerDownOutside((event) => {
      const target = event.target;
      const isPointerDownOnBranch = [...context.branches].some((branch) => branch.contains(target));
      if (!isPointerEventsEnabled || isPointerDownOnBranch) return;
      onPointerDownOutside?.(event);
      onInteractOutside?.(event);
      if (!event.defaultPrevented) onDismiss?.();
    }, ownerDocument);
    const focusOutside = useFocusOutside((event) => {
      const target = event.target;
      const isFocusInBranch = [...context.branches].some((branch) => branch.contains(target));
      if (isFocusInBranch) return;
      onFocusOutside?.(event);
      onInteractOutside?.(event);
      if (!event.defaultPrevented) onDismiss?.();
    }, ownerDocument);
    useEscapeKeydown((event) => {
      const isHighestLayer = index === context.layers.size - 1;
      if (!isHighestLayer) return;
      onEscapeKeyDown?.(event);
      if (!event.defaultPrevented && onDismiss) {
        event.preventDefault();
        onDismiss();
      }
    }, ownerDocument);
    reactExports.useEffect(() => {
      if (!node) return;
      if (disableOutsidePointerEvents) {
        if (context.layersWithOutsidePointerEventsDisabled.size === 0) {
          originalBodyPointerEvents = ownerDocument.body.style.pointerEvents;
          ownerDocument.body.style.pointerEvents = "none";
        }
        context.layersWithOutsidePointerEventsDisabled.add(node);
      }
      context.layers.add(node);
      dispatchUpdate();
      return () => {
        if (disableOutsidePointerEvents && context.layersWithOutsidePointerEventsDisabled.size === 1) {
          ownerDocument.body.style.pointerEvents = originalBodyPointerEvents;
        }
      };
    }, [node, ownerDocument, disableOutsidePointerEvents, context]);
    reactExports.useEffect(() => {
      return () => {
        if (!node) return;
        context.layers.delete(node);
        context.layersWithOutsidePointerEventsDisabled.delete(node);
        dispatchUpdate();
      };
    }, [node, context]);
    reactExports.useEffect(() => {
      const handleUpdate = () => force({});
      document.addEventListener(CONTEXT_UPDATE, handleUpdate);
      return () => document.removeEventListener(CONTEXT_UPDATE, handleUpdate);
    }, []);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        ...layerProps,
        ref: composedRefs,
        style: {
          pointerEvents: isBodyPointerEventsDisabled ? isPointerEventsEnabled ? "auto" : "none" : void 0,
          ...props.style
        },
        onFocusCapture: composeEventHandlers(props.onFocusCapture, focusOutside.onFocusCapture),
        onBlurCapture: composeEventHandlers(props.onBlurCapture, focusOutside.onBlurCapture),
        onPointerDownCapture: composeEventHandlers(
          props.onPointerDownCapture,
          pointerDownOutside.onPointerDownCapture
        )
      }
    );
  }
);
DismissableLayer.displayName = DISMISSABLE_LAYER_NAME;
var BRANCH_NAME = "DismissableLayerBranch";
var DismissableLayerBranch = reactExports.forwardRef((props, forwardedRef) => {
  const context = reactExports.useContext(DismissableLayerContext);
  const ref = reactExports.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  reactExports.useEffect(() => {
    const node = ref.current;
    if (node) {
      context.branches.add(node);
      return () => {
        context.branches.delete(node);
      };
    }
  }, [context.branches]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.div, { ...props, ref: composedRefs });
});
DismissableLayerBranch.displayName = BRANCH_NAME;
function usePointerDownOutside(onPointerDownOutside, ownerDocument = globalThis?.document) {
  const handlePointerDownOutside = useCallbackRef$1(onPointerDownOutside);
  const isPointerInsideReactTreeRef = reactExports.useRef(false);
  const handleClickRef = reactExports.useRef(() => {
  });
  reactExports.useEffect(() => {
    const handlePointerDown = (event) => {
      if (event.target && !isPointerInsideReactTreeRef.current) {
        let handleAndDispatchPointerDownOutsideEvent2 = function() {
          handleAndDispatchCustomEvent(
            POINTER_DOWN_OUTSIDE,
            handlePointerDownOutside,
            eventDetail,
            { discrete: true }
          );
        };
        const eventDetail = { originalEvent: event };
        if (event.pointerType === "touch") {
          ownerDocument.removeEventListener("click", handleClickRef.current);
          handleClickRef.current = handleAndDispatchPointerDownOutsideEvent2;
          ownerDocument.addEventListener("click", handleClickRef.current, { once: true });
        } else {
          handleAndDispatchPointerDownOutsideEvent2();
        }
      } else {
        ownerDocument.removeEventListener("click", handleClickRef.current);
      }
      isPointerInsideReactTreeRef.current = false;
    };
    const timerId = window.setTimeout(() => {
      ownerDocument.addEventListener("pointerdown", handlePointerDown);
    }, 0);
    return () => {
      window.clearTimeout(timerId);
      ownerDocument.removeEventListener("pointerdown", handlePointerDown);
      ownerDocument.removeEventListener("click", handleClickRef.current);
    };
  }, [ownerDocument, handlePointerDownOutside]);
  return {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => isPointerInsideReactTreeRef.current = true
  };
}
function useFocusOutside(onFocusOutside, ownerDocument = globalThis?.document) {
  const handleFocusOutside = useCallbackRef$1(onFocusOutside);
  const isFocusInsideReactTreeRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    const handleFocus = (event) => {
      if (event.target && !isFocusInsideReactTreeRef.current) {
        const eventDetail = { originalEvent: event };
        handleAndDispatchCustomEvent(FOCUS_OUTSIDE, handleFocusOutside, eventDetail, {
          discrete: false
        });
      }
    };
    ownerDocument.addEventListener("focusin", handleFocus);
    return () => ownerDocument.removeEventListener("focusin", handleFocus);
  }, [ownerDocument, handleFocusOutside]);
  return {
    onFocusCapture: () => isFocusInsideReactTreeRef.current = true,
    onBlurCapture: () => isFocusInsideReactTreeRef.current = false
  };
}
function dispatchUpdate() {
  const event = new CustomEvent(CONTEXT_UPDATE);
  document.dispatchEvent(event);
}
function handleAndDispatchCustomEvent(name, handler, detail, { discrete }) {
  const target = detail.originalEvent.target;
  const event = new CustomEvent(name, { bubbles: false, cancelable: true, detail });
  if (handler) target.addEventListener(name, handler, { once: true });
  if (discrete) {
    dispatchDiscreteCustomEvent(target, event);
  } else {
    target.dispatchEvent(event);
  }
}
var AUTOFOCUS_ON_MOUNT = "focusScope.autoFocusOnMount";
var AUTOFOCUS_ON_UNMOUNT = "focusScope.autoFocusOnUnmount";
var EVENT_OPTIONS$1 = { bubbles: false, cancelable: true };
var FOCUS_SCOPE_NAME = "FocusScope";
var FocusScope = reactExports.forwardRef((props, forwardedRef) => {
  const {
    loop = false,
    trapped = false,
    onMountAutoFocus: onMountAutoFocusProp,
    onUnmountAutoFocus: onUnmountAutoFocusProp,
    ...scopeProps
  } = props;
  const [container, setContainer] = reactExports.useState(null);
  const onMountAutoFocus = useCallbackRef$1(onMountAutoFocusProp);
  const onUnmountAutoFocus = useCallbackRef$1(onUnmountAutoFocusProp);
  const lastFocusedElementRef = reactExports.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, (node) => setContainer(node));
  const focusScope = reactExports.useRef({
    paused: false,
    pause() {
      this.paused = true;
    },
    resume() {
      this.paused = false;
    }
  }).current;
  reactExports.useEffect(() => {
    if (trapped) {
      let handleFocusIn2 = function(event) {
        if (focusScope.paused || !container) return;
        const target = event.target;
        if (container.contains(target)) {
          lastFocusedElementRef.current = target;
        } else {
          focus(lastFocusedElementRef.current, { select: true });
        }
      }, handleFocusOut2 = function(event) {
        if (focusScope.paused || !container) return;
        const relatedTarget = event.relatedTarget;
        if (relatedTarget === null) return;
        if (!container.contains(relatedTarget)) {
          focus(lastFocusedElementRef.current, { select: true });
        }
      }, handleMutations2 = function(mutations) {
        const focusedElement = document.activeElement;
        if (focusedElement !== document.body) return;
        for (const mutation of mutations) {
          if (mutation.removedNodes.length > 0) focus(container);
        }
      };
      document.addEventListener("focusin", handleFocusIn2);
      document.addEventListener("focusout", handleFocusOut2);
      const mutationObserver = new MutationObserver(handleMutations2);
      if (container) mutationObserver.observe(container, { childList: true, subtree: true });
      return () => {
        document.removeEventListener("focusin", handleFocusIn2);
        document.removeEventListener("focusout", handleFocusOut2);
        mutationObserver.disconnect();
      };
    }
  }, [trapped, container, focusScope.paused]);
  reactExports.useEffect(() => {
    if (container) {
      focusScopesStack.add(focusScope);
      const previouslyFocusedElement = document.activeElement;
      const hasFocusedCandidate = container.contains(previouslyFocusedElement);
      if (!hasFocusedCandidate) {
        const mountEvent = new CustomEvent(AUTOFOCUS_ON_MOUNT, EVENT_OPTIONS$1);
        container.addEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
        container.dispatchEvent(mountEvent);
        if (!mountEvent.defaultPrevented) {
          focusFirst$1(removeLinks(getTabbableCandidates(container)), { select: true });
          if (document.activeElement === previouslyFocusedElement) {
            focus(container);
          }
        }
      }
      return () => {
        container.removeEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
        setTimeout(() => {
          const unmountEvent = new CustomEvent(AUTOFOCUS_ON_UNMOUNT, EVENT_OPTIONS$1);
          container.addEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
          container.dispatchEvent(unmountEvent);
          if (!unmountEvent.defaultPrevented) {
            focus(previouslyFocusedElement ?? document.body, { select: true });
          }
          container.removeEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
          focusScopesStack.remove(focusScope);
        }, 0);
      };
    }
  }, [container, onMountAutoFocus, onUnmountAutoFocus, focusScope]);
  const handleKeyDown = reactExports.useCallback(
    (event) => {
      if (!loop && !trapped) return;
      if (focusScope.paused) return;
      const isTabKey = event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey;
      const focusedElement = document.activeElement;
      if (isTabKey && focusedElement) {
        const container2 = event.currentTarget;
        const [first, last] = getTabbableEdges(container2);
        const hasTabbableElementsInside = first && last;
        if (!hasTabbableElementsInside) {
          if (focusedElement === container2) event.preventDefault();
        } else {
          if (!event.shiftKey && focusedElement === last) {
            event.preventDefault();
            if (loop) focus(first, { select: true });
          } else if (event.shiftKey && focusedElement === first) {
            event.preventDefault();
            if (loop) focus(last, { select: true });
          }
        }
      }
    },
    [loop, trapped, focusScope.paused]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.div, { tabIndex: -1, ...scopeProps, ref: composedRefs, onKeyDown: handleKeyDown });
});
FocusScope.displayName = FOCUS_SCOPE_NAME;
function focusFirst$1(candidates, { select = false } = {}) {
  const previouslyFocusedElement = document.activeElement;
  for (const candidate of candidates) {
    focus(candidate, { select });
    if (document.activeElement !== previouslyFocusedElement) return;
  }
}
function getTabbableEdges(container) {
  const candidates = getTabbableCandidates(container);
  const first = findVisible(candidates, container);
  const last = findVisible(candidates.reverse(), container);
  return [first, last];
}
function getTabbableCandidates(container) {
  const nodes = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const isHiddenInput = node.tagName === "INPUT" && node.type === "hidden";
      if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP;
      return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}
function findVisible(elements, container) {
  for (const element of elements) {
    if (!isHidden(element, { upTo: container })) return element;
  }
}
function isHidden(node, { upTo }) {
  if (getComputedStyle(node).visibility === "hidden") return true;
  while (node) {
    if (upTo !== void 0 && node === upTo) return false;
    if (getComputedStyle(node).display === "none") return true;
    node = node.parentElement;
  }
  return false;
}
function isSelectableInput(element) {
  return element instanceof HTMLInputElement && "select" in element;
}
function focus(element, { select = false } = {}) {
  if (element && element.focus) {
    const previouslyFocusedElement = document.activeElement;
    element.focus({ preventScroll: true });
    if (element !== previouslyFocusedElement && isSelectableInput(element) && select)
      element.select();
  }
}
var focusScopesStack = createFocusScopesStack();
function createFocusScopesStack() {
  let stack = [];
  return {
    add(focusScope) {
      const activeFocusScope = stack[0];
      if (focusScope !== activeFocusScope) {
        activeFocusScope?.pause();
      }
      stack = arrayRemove(stack, focusScope);
      stack.unshift(focusScope);
    },
    remove(focusScope) {
      stack = arrayRemove(stack, focusScope);
      stack[0]?.resume();
    }
  };
}
function arrayRemove(array, item) {
  const updatedArray = [...array];
  const index = updatedArray.indexOf(item);
  if (index !== -1) {
    updatedArray.splice(index, 1);
  }
  return updatedArray;
}
function removeLinks(items) {
  return items.filter((item) => item.tagName !== "A");
}
var PORTAL_NAME$1 = "Portal";
var Portal$1 = reactExports.forwardRef((props, forwardedRef) => {
  const { container: containerProp, ...portalProps } = props;
  const [mounted, setMounted] = reactExports.useState(false);
  useLayoutEffect2(() => setMounted(true), []);
  const container = containerProp || mounted && globalThis?.document?.body;
  return container ? ReactDOM.createPortal(/* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.div, { ...portalProps, ref: forwardedRef }), container) : null;
});
Portal$1.displayName = PORTAL_NAME$1;
function useStateMachine(initialState, machine) {
  return reactExports.useReducer((state, event) => {
    const nextState = machine[state][event];
    return nextState ?? state;
  }, initialState);
}
var Presence = (props) => {
  const { present, children } = props;
  const presence = usePresence(present);
  const child = typeof children === "function" ? children({ present: presence.isPresent }) : reactExports.Children.only(children);
  const ref = useComposedRefs(presence.ref, getElementRef(child));
  const forceMount = typeof children === "function";
  return forceMount || presence.isPresent ? reactExports.cloneElement(child, { ref }) : null;
};
Presence.displayName = "Presence";
function usePresence(present) {
  const [node, setNode] = reactExports.useState();
  const stylesRef = reactExports.useRef(null);
  const prevPresentRef = reactExports.useRef(present);
  const prevAnimationNameRef = reactExports.useRef("none");
  const initialState = present ? "mounted" : "unmounted";
  const [state, send] = useStateMachine(initialState, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  reactExports.useEffect(() => {
    const currentAnimationName = getAnimationName(stylesRef.current);
    prevAnimationNameRef.current = state === "mounted" ? currentAnimationName : "none";
  }, [state]);
  useLayoutEffect2(() => {
    const styles = stylesRef.current;
    const wasPresent = prevPresentRef.current;
    const hasPresentChanged = wasPresent !== present;
    if (hasPresentChanged) {
      const prevAnimationName = prevAnimationNameRef.current;
      const currentAnimationName = getAnimationName(styles);
      if (present) {
        send("MOUNT");
      } else if (currentAnimationName === "none" || styles?.display === "none") {
        send("UNMOUNT");
      } else {
        const isAnimating = prevAnimationName !== currentAnimationName;
        if (wasPresent && isAnimating) {
          send("ANIMATION_OUT");
        } else {
          send("UNMOUNT");
        }
      }
      prevPresentRef.current = present;
    }
  }, [present, send]);
  useLayoutEffect2(() => {
    if (node) {
      let timeoutId;
      const ownerWindow = node.ownerDocument.defaultView ?? window;
      const handleAnimationEnd = (event) => {
        const currentAnimationName = getAnimationName(stylesRef.current);
        const isCurrentAnimation = currentAnimationName.includes(CSS.escape(event.animationName));
        if (event.target === node && isCurrentAnimation) {
          send("ANIMATION_END");
          if (!prevPresentRef.current) {
            const currentFillMode = node.style.animationFillMode;
            node.style.animationFillMode = "forwards";
            timeoutId = ownerWindow.setTimeout(() => {
              if (node.style.animationFillMode === "forwards") {
                node.style.animationFillMode = currentFillMode;
              }
            });
          }
        }
      };
      const handleAnimationStart = (event) => {
        if (event.target === node) {
          prevAnimationNameRef.current = getAnimationName(stylesRef.current);
        }
      };
      node.addEventListener("animationstart", handleAnimationStart);
      node.addEventListener("animationcancel", handleAnimationEnd);
      node.addEventListener("animationend", handleAnimationEnd);
      return () => {
        ownerWindow.clearTimeout(timeoutId);
        node.removeEventListener("animationstart", handleAnimationStart);
        node.removeEventListener("animationcancel", handleAnimationEnd);
        node.removeEventListener("animationend", handleAnimationEnd);
      };
    } else {
      send("ANIMATION_END");
    }
  }, [node, send]);
  return {
    isPresent: ["mounted", "unmountSuspended"].includes(state),
    ref: reactExports.useCallback((node2) => {
      stylesRef.current = node2 ? getComputedStyle(node2) : null;
      setNode(node2);
    }, [])
  };
}
function getAnimationName(styles) {
  return styles?.animationName || "none";
}
function getElementRef(element) {
  let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.ref;
  }
  getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.props.ref;
  }
  return element.props.ref || element.ref;
}
var count = 0;
function useFocusGuards() {
  reactExports.useEffect(() => {
    const edgeGuards = document.querySelectorAll("[data-radix-focus-guard]");
    document.body.insertAdjacentElement("afterbegin", edgeGuards[0] ?? createFocusGuard());
    document.body.insertAdjacentElement("beforeend", edgeGuards[1] ?? createFocusGuard());
    count++;
    return () => {
      if (count === 1) {
        document.querySelectorAll("[data-radix-focus-guard]").forEach((node) => node.remove());
      }
      count--;
    };
  }, []);
}
function createFocusGuard() {
  const element = document.createElement("span");
  element.setAttribute("data-radix-focus-guard", "");
  element.tabIndex = 0;
  element.style.outline = "none";
  element.style.opacity = "0";
  element.style.position = "fixed";
  element.style.pointerEvents = "none";
  return element;
}
var __assign = function() {
  __assign = Object.assign || function __assign2(t2) {
    for (var s, i = 1, n2 = arguments.length; i < n2; i++) {
      s = arguments[i];
      for (var p2 in s) if (Object.prototype.hasOwnProperty.call(s, p2)) t2[p2] = s[p2];
    }
    return t2;
  };
  return __assign.apply(this, arguments);
};
function __rest(s, e) {
  var t2 = {};
  for (var p2 in s) if (Object.prototype.hasOwnProperty.call(s, p2) && e.indexOf(p2) < 0)
    t2[p2] = s[p2];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p2 = Object.getOwnPropertySymbols(s); i < p2.length; i++) {
      if (e.indexOf(p2[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p2[i]))
        t2[p2[i]] = s[p2[i]];
    }
  return t2;
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l2 = from.length, ar; i < l2; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}
typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};
var zeroRightClassName = "right-scroll-bar-position";
var fullWidthClassName = "width-before-scroll-bar";
var noScrollbarsClassName = "with-scroll-bars-hidden";
var removedBarSizeVariable = "--removed-body-scroll-bar-size";
function assignRef(ref, value) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
  return ref;
}
function useCallbackRef(initialValue, callback) {
  var ref = reactExports.useState(function() {
    return {
      // value
      value: initialValue,
      // last callback
      callback,
      // "memoized" public interface
      facade: {
        get current() {
          return ref.value;
        },
        set current(value) {
          var last = ref.value;
          if (last !== value) {
            ref.value = value;
            ref.callback(value, last);
          }
        }
      }
    };
  })[0];
  ref.callback = callback;
  return ref.facade;
}
var useIsomorphicLayoutEffect = typeof window !== "undefined" ? reactExports.useLayoutEffect : reactExports.useEffect;
var currentValues = /* @__PURE__ */ new WeakMap();
function useMergeRefs(refs, defaultValue) {
  var callbackRef = useCallbackRef(null, function(newValue) {
    return refs.forEach(function(ref) {
      return assignRef(ref, newValue);
    });
  });
  useIsomorphicLayoutEffect(function() {
    var oldValue = currentValues.get(callbackRef);
    if (oldValue) {
      var prevRefs_1 = new Set(oldValue);
      var nextRefs_1 = new Set(refs);
      var current_1 = callbackRef.current;
      prevRefs_1.forEach(function(ref) {
        if (!nextRefs_1.has(ref)) {
          assignRef(ref, null);
        }
      });
      nextRefs_1.forEach(function(ref) {
        if (!prevRefs_1.has(ref)) {
          assignRef(ref, current_1);
        }
      });
    }
    currentValues.set(callbackRef, refs);
  }, [refs]);
  return callbackRef;
}
function ItoI(a) {
  return a;
}
function innerCreateMedium(defaults, middleware) {
  if (middleware === void 0) {
    middleware = ItoI;
  }
  var buffer = [];
  var assigned = false;
  var medium = {
    read: function() {
      if (assigned) {
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      }
      if (buffer.length) {
        return buffer[buffer.length - 1];
      }
      return defaults;
    },
    useMedium: function(data) {
      var item = middleware(data, assigned);
      buffer.push(item);
      return function() {
        buffer = buffer.filter(function(x2) {
          return x2 !== item;
        });
      };
    },
    assignSyncMedium: function(cb2) {
      assigned = true;
      while (buffer.length) {
        var cbs = buffer;
        buffer = [];
        cbs.forEach(cb2);
      }
      buffer = {
        push: function(x2) {
          return cb2(x2);
        },
        filter: function() {
          return buffer;
        }
      };
    },
    assignMedium: function(cb2) {
      assigned = true;
      var pendingQueue = [];
      if (buffer.length) {
        var cbs = buffer;
        buffer = [];
        cbs.forEach(cb2);
        pendingQueue = buffer;
      }
      var executeQueue = function() {
        var cbs2 = pendingQueue;
        pendingQueue = [];
        cbs2.forEach(cb2);
      };
      var cycle = function() {
        return Promise.resolve().then(executeQueue);
      };
      cycle();
      buffer = {
        push: function(x2) {
          pendingQueue.push(x2);
          cycle();
        },
        filter: function(filter) {
          pendingQueue = pendingQueue.filter(filter);
          return buffer;
        }
      };
    }
  };
  return medium;
}
function createSidecarMedium(options) {
  if (options === void 0) {
    options = {};
  }
  var medium = innerCreateMedium(null);
  medium.options = __assign({ async: true, ssr: false }, options);
  return medium;
}
var SideCar$1 = function(_a) {
  var sideCar = _a.sideCar, rest = __rest(_a, ["sideCar"]);
  if (!sideCar) {
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  }
  var Target = sideCar.read();
  if (!Target) {
    throw new Error("Sidecar medium not found");
  }
  return reactExports.createElement(Target, __assign({}, rest));
};
SideCar$1.isSideCarExport = true;
function exportSidecar(medium, exported) {
  medium.useMedium(exported);
  return SideCar$1;
}
var effectCar = createSidecarMedium();
var nothing = function() {
  return;
};
var RemoveScroll = reactExports.forwardRef(function(props, parentRef) {
  var ref = reactExports.useRef(null);
  var _a = reactExports.useState({
    onScrollCapture: nothing,
    onWheelCapture: nothing,
    onTouchMoveCapture: nothing
  }), callbacks = _a[0], setCallbacks = _a[1];
  var forwardProps = props.forwardProps, children = props.children, className = props.className, removeScrollBar = props.removeScrollBar, enabled = props.enabled, shards = props.shards, sideCar = props.sideCar, noRelative = props.noRelative, noIsolation = props.noIsolation, inert = props.inert, allowPinchZoom = props.allowPinchZoom, _b = props.as, Container = _b === void 0 ? "div" : _b, gapMode = props.gapMode, rest = __rest(props, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]);
  var SideCar2 = sideCar;
  var containerRef = useMergeRefs([ref, parentRef]);
  var containerProps = __assign(__assign({}, rest), callbacks);
  return reactExports.createElement(
    reactExports.Fragment,
    null,
    enabled && reactExports.createElement(SideCar2, { sideCar: effectCar, removeScrollBar, shards, noRelative, noIsolation, inert, setCallbacks, allowPinchZoom: !!allowPinchZoom, lockRef: ref, gapMode }),
    forwardProps ? reactExports.cloneElement(reactExports.Children.only(children), __assign(__assign({}, containerProps), { ref: containerRef })) : reactExports.createElement(Container, __assign({}, containerProps, { className, ref: containerRef }), children)
  );
});
RemoveScroll.defaultProps = {
  enabled: true,
  removeScrollBar: true,
  inert: false
};
RemoveScroll.classNames = {
  fullWidth: fullWidthClassName,
  zeroRight: zeroRightClassName
};
var getNonce = function() {
  if (typeof __webpack_nonce__ !== "undefined") {
    return __webpack_nonce__;
  }
  return void 0;
};
function makeStyleTag() {
  if (!document)
    return null;
  var tag = document.createElement("style");
  tag.type = "text/css";
  var nonce = getNonce();
  if (nonce) {
    tag.setAttribute("nonce", nonce);
  }
  return tag;
}
function injectStyles(tag, css) {
  if (tag.styleSheet) {
    tag.styleSheet.cssText = css;
  } else {
    tag.appendChild(document.createTextNode(css));
  }
}
function insertStyleTag(tag) {
  var head = document.head || document.getElementsByTagName("head")[0];
  head.appendChild(tag);
}
var stylesheetSingleton = function() {
  var counter = 0;
  var stylesheet = null;
  return {
    add: function(style) {
      if (counter == 0) {
        if (stylesheet = makeStyleTag()) {
          injectStyles(stylesheet, style);
          insertStyleTag(stylesheet);
        }
      }
      counter++;
    },
    remove: function() {
      counter--;
      if (!counter && stylesheet) {
        stylesheet.parentNode && stylesheet.parentNode.removeChild(stylesheet);
        stylesheet = null;
      }
    }
  };
};
var styleHookSingleton = function() {
  var sheet = stylesheetSingleton();
  return function(styles, isDynamic) {
    reactExports.useEffect(function() {
      sheet.add(styles);
      return function() {
        sheet.remove();
      };
    }, [styles && isDynamic]);
  };
};
var styleSingleton = function() {
  var useStyle = styleHookSingleton();
  var Sheet = function(_a) {
    var styles = _a.styles, dynamic = _a.dynamic;
    useStyle(styles, dynamic);
    return null;
  };
  return Sheet;
};
var zeroGap = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
};
var parse = function(x2) {
  return parseInt(x2 || "", 10) || 0;
};
var getOffset = function(gapMode) {
  var cs = window.getComputedStyle(document.body);
  var left = cs[gapMode === "padding" ? "paddingLeft" : "marginLeft"];
  var top = cs[gapMode === "padding" ? "paddingTop" : "marginTop"];
  var right = cs[gapMode === "padding" ? "paddingRight" : "marginRight"];
  return [parse(left), parse(top), parse(right)];
};
var getGapWidth = function(gapMode) {
  if (gapMode === void 0) {
    gapMode = "margin";
  }
  if (typeof window === "undefined") {
    return zeroGap;
  }
  var offsets = getOffset(gapMode);
  var documentWidth = document.documentElement.clientWidth;
  var windowWidth = window.innerWidth;
  return {
    left: offsets[0],
    top: offsets[1],
    right: offsets[2],
    gap: Math.max(0, windowWidth - documentWidth + offsets[2] - offsets[0])
  };
};
var Style = styleSingleton();
var lockAttribute = "data-scroll-locked";
var getStyles = function(_a, allowRelative, gapMode, important) {
  var left = _a.left, top = _a.top, right = _a.right, gap = _a.gap;
  if (gapMode === void 0) {
    gapMode = "margin";
  }
  return "\n  .".concat(noScrollbarsClassName, " {\n   overflow: hidden ").concat(important, ";\n   padding-right: ").concat(gap, "px ").concat(important, ";\n  }\n  body[").concat(lockAttribute, "] {\n    overflow: hidden ").concat(important, ";\n    overscroll-behavior: contain;\n    ").concat([
    allowRelative && "position: relative ".concat(important, ";"),
    gapMode === "margin" && "\n    padding-left: ".concat(left, "px;\n    padding-top: ").concat(top, "px;\n    padding-right: ").concat(right, "px;\n    margin-left:0;\n    margin-top:0;\n    margin-right: ").concat(gap, "px ").concat(important, ";\n    "),
    gapMode === "padding" && "padding-right: ".concat(gap, "px ").concat(important, ";")
  ].filter(Boolean).join(""), "\n  }\n  \n  .").concat(zeroRightClassName, " {\n    right: ").concat(gap, "px ").concat(important, ";\n  }\n  \n  .").concat(fullWidthClassName, " {\n    margin-right: ").concat(gap, "px ").concat(important, ";\n  }\n  \n  .").concat(zeroRightClassName, " .").concat(zeroRightClassName, " {\n    right: 0 ").concat(important, ";\n  }\n  \n  .").concat(fullWidthClassName, " .").concat(fullWidthClassName, " {\n    margin-right: 0 ").concat(important, ";\n  }\n  \n  body[").concat(lockAttribute, "] {\n    ").concat(removedBarSizeVariable, ": ").concat(gap, "px;\n  }\n");
};
var getCurrentUseCounter = function() {
  var counter = parseInt(document.body.getAttribute(lockAttribute) || "0", 10);
  return isFinite(counter) ? counter : 0;
};
var useLockAttribute = function() {
  reactExports.useEffect(function() {
    document.body.setAttribute(lockAttribute, (getCurrentUseCounter() + 1).toString());
    return function() {
      var newCounter = getCurrentUseCounter() - 1;
      if (newCounter <= 0) {
        document.body.removeAttribute(lockAttribute);
      } else {
        document.body.setAttribute(lockAttribute, newCounter.toString());
      }
    };
  }, []);
};
var RemoveScrollBar = function(_a) {
  var noRelative = _a.noRelative, noImportant = _a.noImportant, _b = _a.gapMode, gapMode = _b === void 0 ? "margin" : _b;
  useLockAttribute();
  var gap = reactExports.useMemo(function() {
    return getGapWidth(gapMode);
  }, [gapMode]);
  return reactExports.createElement(Style, { styles: getStyles(gap, !noRelative, gapMode, !noImportant ? "!important" : "") });
};
var passiveSupported = false;
if (typeof window !== "undefined") {
  try {
    var options = Object.defineProperty({}, "passive", {
      get: function() {
        passiveSupported = true;
        return true;
      }
    });
    window.addEventListener("test", options, options);
    window.removeEventListener("test", options, options);
  } catch (err) {
    passiveSupported = false;
  }
}
var nonPassive = passiveSupported ? { passive: false } : false;
var alwaysContainsScroll = function(node) {
  return node.tagName === "TEXTAREA";
};
var elementCanBeScrolled = function(node, overflow) {
  if (!(node instanceof Element)) {
    return false;
  }
  var styles = window.getComputedStyle(node);
  return (
    // not-not-scrollable
    styles[overflow] !== "hidden" && // contains scroll inside self
    !(styles.overflowY === styles.overflowX && !alwaysContainsScroll(node) && styles[overflow] === "visible")
  );
};
var elementCouldBeVScrolled = function(node) {
  return elementCanBeScrolled(node, "overflowY");
};
var elementCouldBeHScrolled = function(node) {
  return elementCanBeScrolled(node, "overflowX");
};
var locationCouldBeScrolled = function(axis, node) {
  var ownerDocument = node.ownerDocument;
  var current = node;
  do {
    if (typeof ShadowRoot !== "undefined" && current instanceof ShadowRoot) {
      current = current.host;
    }
    var isScrollable = elementCouldBeScrolled(axis, current);
    if (isScrollable) {
      var _a = getScrollVariables(axis, current), scrollHeight = _a[1], clientHeight = _a[2];
      if (scrollHeight > clientHeight) {
        return true;
      }
    }
    current = current.parentNode;
  } while (current && current !== ownerDocument.body);
  return false;
};
var getVScrollVariables = function(_a) {
  var scrollTop = _a.scrollTop, scrollHeight = _a.scrollHeight, clientHeight = _a.clientHeight;
  return [
    scrollTop,
    scrollHeight,
    clientHeight
  ];
};
var getHScrollVariables = function(_a) {
  var scrollLeft = _a.scrollLeft, scrollWidth = _a.scrollWidth, clientWidth = _a.clientWidth;
  return [
    scrollLeft,
    scrollWidth,
    clientWidth
  ];
};
var elementCouldBeScrolled = function(axis, node) {
  return axis === "v" ? elementCouldBeVScrolled(node) : elementCouldBeHScrolled(node);
};
var getScrollVariables = function(axis, node) {
  return axis === "v" ? getVScrollVariables(node) : getHScrollVariables(node);
};
var getDirectionFactor = function(axis, direction) {
  return axis === "h" && direction === "rtl" ? -1 : 1;
};
var handleScroll = function(axis, endTarget, event, sourceDelta, noOverscroll) {
  var directionFactor = getDirectionFactor(axis, window.getComputedStyle(endTarget).direction);
  var delta = directionFactor * sourceDelta;
  var target = event.target;
  var targetInLock = endTarget.contains(target);
  var shouldCancelScroll = false;
  var isDeltaPositive = delta > 0;
  var availableScroll = 0;
  var availableScrollTop = 0;
  do {
    if (!target) {
      break;
    }
    var _a = getScrollVariables(axis, target), position = _a[0], scroll_1 = _a[1], capacity = _a[2];
    var elementScroll = scroll_1 - capacity - directionFactor * position;
    if (position || elementScroll) {
      if (elementCouldBeScrolled(axis, target)) {
        availableScroll += elementScroll;
        availableScrollTop += position;
      }
    }
    var parent_1 = target.parentNode;
    target = parent_1 && parent_1.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? parent_1.host : parent_1;
  } while (
    // portaled content
    !targetInLock && target !== document.body || // self content
    targetInLock && (endTarget.contains(target) || endTarget === target)
  );
  if (isDeltaPositive && (Math.abs(availableScroll) < 1 || false)) {
    shouldCancelScroll = true;
  } else if (!isDeltaPositive && (Math.abs(availableScrollTop) < 1 || false)) {
    shouldCancelScroll = true;
  }
  return shouldCancelScroll;
};
var getTouchXY = function(event) {
  return "changedTouches" in event ? [event.changedTouches[0].clientX, event.changedTouches[0].clientY] : [0, 0];
};
var getDeltaXY = function(event) {
  return [event.deltaX, event.deltaY];
};
var extractRef = function(ref) {
  return ref && "current" in ref ? ref.current : ref;
};
var deltaCompare = function(x2, y2) {
  return x2[0] === y2[0] && x2[1] === y2[1];
};
var generateStyle = function(id2) {
  return "\n  .block-interactivity-".concat(id2, " {pointer-events: none;}\n  .allow-interactivity-").concat(id2, " {pointer-events: all;}\n");
};
var idCounter = 0;
var lockStack = [];
function RemoveScrollSideCar(props) {
  var shouldPreventQueue = reactExports.useRef([]);
  var touchStartRef = reactExports.useRef([0, 0]);
  var activeAxis = reactExports.useRef();
  var id2 = reactExports.useState(idCounter++)[0];
  var Style2 = reactExports.useState(styleSingleton)[0];
  var lastProps = reactExports.useRef(props);
  reactExports.useEffect(function() {
    lastProps.current = props;
  }, [props]);
  reactExports.useEffect(function() {
    if (props.inert) {
      document.body.classList.add("block-interactivity-".concat(id2));
      var allow_1 = __spreadArray([props.lockRef.current], (props.shards || []).map(extractRef), true).filter(Boolean);
      allow_1.forEach(function(el2) {
        return el2.classList.add("allow-interactivity-".concat(id2));
      });
      return function() {
        document.body.classList.remove("block-interactivity-".concat(id2));
        allow_1.forEach(function(el2) {
          return el2.classList.remove("allow-interactivity-".concat(id2));
        });
      };
    }
    return;
  }, [props.inert, props.lockRef.current, props.shards]);
  var shouldCancelEvent = reactExports.useCallback(function(event, parent) {
    if ("touches" in event && event.touches.length === 2 || event.type === "wheel" && event.ctrlKey) {
      return !lastProps.current.allowPinchZoom;
    }
    var touch = getTouchXY(event);
    var touchStart = touchStartRef.current;
    var deltaX = "deltaX" in event ? event.deltaX : touchStart[0] - touch[0];
    var deltaY = "deltaY" in event ? event.deltaY : touchStart[1] - touch[1];
    var currentAxis;
    var target = event.target;
    var moveDirection = Math.abs(deltaX) > Math.abs(deltaY) ? "h" : "v";
    if ("touches" in event && moveDirection === "h" && target.type === "range") {
      return false;
    }
    var selection = window.getSelection();
    var anchorNode = selection && selection.anchorNode;
    var isTouchingSelection = anchorNode ? anchorNode === target || anchorNode.contains(target) : false;
    if (isTouchingSelection) {
      return false;
    }
    var canBeScrolledInMainDirection = locationCouldBeScrolled(moveDirection, target);
    if (!canBeScrolledInMainDirection) {
      return true;
    }
    if (canBeScrolledInMainDirection) {
      currentAxis = moveDirection;
    } else {
      currentAxis = moveDirection === "v" ? "h" : "v";
      canBeScrolledInMainDirection = locationCouldBeScrolled(moveDirection, target);
    }
    if (!canBeScrolledInMainDirection) {
      return false;
    }
    if (!activeAxis.current && "changedTouches" in event && (deltaX || deltaY)) {
      activeAxis.current = currentAxis;
    }
    if (!currentAxis) {
      return true;
    }
    var cancelingAxis = activeAxis.current || currentAxis;
    return handleScroll(cancelingAxis, parent, event, cancelingAxis === "h" ? deltaX : deltaY);
  }, []);
  var shouldPrevent = reactExports.useCallback(function(_event) {
    var event = _event;
    if (!lockStack.length || lockStack[lockStack.length - 1] !== Style2) {
      return;
    }
    var delta = "deltaY" in event ? getDeltaXY(event) : getTouchXY(event);
    var sourceEvent = shouldPreventQueue.current.filter(function(e) {
      return e.name === event.type && (e.target === event.target || event.target === e.shadowParent) && deltaCompare(e.delta, delta);
    })[0];
    if (sourceEvent && sourceEvent.should) {
      if (event.cancelable) {
        event.preventDefault();
      }
      return;
    }
    if (!sourceEvent) {
      var shardNodes = (lastProps.current.shards || []).map(extractRef).filter(Boolean).filter(function(node) {
        return node.contains(event.target);
      });
      var shouldStop = shardNodes.length > 0 ? shouldCancelEvent(event, shardNodes[0]) : !lastProps.current.noIsolation;
      if (shouldStop) {
        if (event.cancelable) {
          event.preventDefault();
        }
      }
    }
  }, []);
  var shouldCancel = reactExports.useCallback(function(name, delta, target, should) {
    var event = { name, delta, target, should, shadowParent: getOutermostShadowParent(target) };
    shouldPreventQueue.current.push(event);
    setTimeout(function() {
      shouldPreventQueue.current = shouldPreventQueue.current.filter(function(e) {
        return e !== event;
      });
    }, 1);
  }, []);
  var scrollTouchStart = reactExports.useCallback(function(event) {
    touchStartRef.current = getTouchXY(event);
    activeAxis.current = void 0;
  }, []);
  var scrollWheel = reactExports.useCallback(function(event) {
    shouldCancel(event.type, getDeltaXY(event), event.target, shouldCancelEvent(event, props.lockRef.current));
  }, []);
  var scrollTouchMove = reactExports.useCallback(function(event) {
    shouldCancel(event.type, getTouchXY(event), event.target, shouldCancelEvent(event, props.lockRef.current));
  }, []);
  reactExports.useEffect(function() {
    lockStack.push(Style2);
    props.setCallbacks({
      onScrollCapture: scrollWheel,
      onWheelCapture: scrollWheel,
      onTouchMoveCapture: scrollTouchMove
    });
    document.addEventListener("wheel", shouldPrevent, nonPassive);
    document.addEventListener("touchmove", shouldPrevent, nonPassive);
    document.addEventListener("touchstart", scrollTouchStart, nonPassive);
    return function() {
      lockStack = lockStack.filter(function(inst) {
        return inst !== Style2;
      });
      document.removeEventListener("wheel", shouldPrevent, nonPassive);
      document.removeEventListener("touchmove", shouldPrevent, nonPassive);
      document.removeEventListener("touchstart", scrollTouchStart, nonPassive);
    };
  }, []);
  var removeScrollBar = props.removeScrollBar, inert = props.inert;
  return reactExports.createElement(
    reactExports.Fragment,
    null,
    inert ? reactExports.createElement(Style2, { styles: generateStyle(id2) }) : null,
    removeScrollBar ? reactExports.createElement(RemoveScrollBar, { noRelative: props.noRelative, gapMode: props.gapMode }) : null
  );
}
function getOutermostShadowParent(node) {
  var shadowParent = null;
  while (node !== null) {
    if (node instanceof ShadowRoot) {
      shadowParent = node.host;
      node = node.host;
    }
    node = node.parentNode;
  }
  return shadowParent;
}
const SideCar = exportSidecar(effectCar, RemoveScrollSideCar);
var ReactRemoveScroll = reactExports.forwardRef(function(props, ref) {
  return reactExports.createElement(RemoveScroll, __assign({}, props, { ref, sideCar: SideCar }));
});
ReactRemoveScroll.classNames = RemoveScroll.classNames;
var getDefaultParent = function(originalTarget) {
  if (typeof document === "undefined") {
    return null;
  }
  var sampleTarget = Array.isArray(originalTarget) ? originalTarget[0] : originalTarget;
  return sampleTarget.ownerDocument.body;
};
var counterMap = /* @__PURE__ */ new WeakMap();
var uncontrolledNodes = /* @__PURE__ */ new WeakMap();
var markerMap = {};
var lockCount = 0;
var unwrapHost = function(node) {
  return node && (node.host || unwrapHost(node.parentNode));
};
var correctTargets = function(parent, targets) {
  return targets.map(function(target) {
    if (parent.contains(target)) {
      return target;
    }
    var correctedTarget = unwrapHost(target);
    if (correctedTarget && parent.contains(correctedTarget)) {
      return correctedTarget;
    }
    console.error("aria-hidden", target, "in not contained inside", parent, ". Doing nothing");
    return null;
  }).filter(function(x2) {
    return Boolean(x2);
  });
};
var applyAttributeToOthers = function(originalTarget, parentNode, markerName, controlAttribute) {
  var targets = correctTargets(parentNode, Array.isArray(originalTarget) ? originalTarget : [originalTarget]);
  if (!markerMap[markerName]) {
    markerMap[markerName] = /* @__PURE__ */ new WeakMap();
  }
  var markerCounter = markerMap[markerName];
  var hiddenNodes = [];
  var elementsToKeep = /* @__PURE__ */ new Set();
  var elementsToStop = new Set(targets);
  var keep = function(el2) {
    if (!el2 || elementsToKeep.has(el2)) {
      return;
    }
    elementsToKeep.add(el2);
    keep(el2.parentNode);
  };
  targets.forEach(keep);
  var deep = function(parent) {
    if (!parent || elementsToStop.has(parent)) {
      return;
    }
    Array.prototype.forEach.call(parent.children, function(node) {
      if (elementsToKeep.has(node)) {
        deep(node);
      } else {
        try {
          var attr = node.getAttribute(controlAttribute);
          var alreadyHidden = attr !== null && attr !== "false";
          var counterValue = (counterMap.get(node) || 0) + 1;
          var markerValue = (markerCounter.get(node) || 0) + 1;
          counterMap.set(node, counterValue);
          markerCounter.set(node, markerValue);
          hiddenNodes.push(node);
          if (counterValue === 1 && alreadyHidden) {
            uncontrolledNodes.set(node, true);
          }
          if (markerValue === 1) {
            node.setAttribute(markerName, "true");
          }
          if (!alreadyHidden) {
            node.setAttribute(controlAttribute, "true");
          }
        } catch (e) {
          console.error("aria-hidden: cannot operate on ", node, e);
        }
      }
    });
  };
  deep(parentNode);
  elementsToKeep.clear();
  lockCount++;
  return function() {
    hiddenNodes.forEach(function(node) {
      var counterValue = counterMap.get(node) - 1;
      var markerValue = markerCounter.get(node) - 1;
      counterMap.set(node, counterValue);
      markerCounter.set(node, markerValue);
      if (!counterValue) {
        if (!uncontrolledNodes.has(node)) {
          node.removeAttribute(controlAttribute);
        }
        uncontrolledNodes.delete(node);
      }
      if (!markerValue) {
        node.removeAttribute(markerName);
      }
    });
    lockCount--;
    if (!lockCount) {
      counterMap = /* @__PURE__ */ new WeakMap();
      counterMap = /* @__PURE__ */ new WeakMap();
      uncontrolledNodes = /* @__PURE__ */ new WeakMap();
      markerMap = {};
    }
  };
};
var hideOthers = function(originalTarget, parentNode, markerName) {
  if (markerName === void 0) {
    markerName = "data-aria-hidden";
  }
  var targets = Array.from(Array.isArray(originalTarget) ? originalTarget : [originalTarget]);
  var activeParentNode = getDefaultParent(originalTarget);
  if (!activeParentNode) {
    return function() {
      return null;
    };
  }
  targets.push.apply(targets, Array.from(activeParentNode.querySelectorAll("[aria-live], script")));
  return applyAttributeToOthers(targets, activeParentNode, markerName, "aria-hidden");
};
var DIALOG_NAME = "Dialog";
var [createDialogContext] = createContextScope(DIALOG_NAME);
var [DialogProvider, useDialogContext] = createDialogContext(DIALOG_NAME);
var Dialog = (props) => {
  const {
    __scopeDialog,
    children,
    open: openProp,
    defaultOpen,
    onOpenChange,
    modal = true
  } = props;
  const triggerRef = reactExports.useRef(null);
  const contentRef = reactExports.useRef(null);
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: DIALOG_NAME
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    DialogProvider,
    {
      scope: __scopeDialog,
      triggerRef,
      contentRef,
      contentId: useId(),
      titleId: useId(),
      descriptionId: useId(),
      open,
      onOpenChange: setOpen,
      onOpenToggle: reactExports.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
      modal,
      children
    }
  );
};
Dialog.displayName = DIALOG_NAME;
var TRIGGER_NAME$1 = "DialogTrigger";
var DialogTrigger = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDialog, ...triggerProps } = props;
    const context = useDialogContext(TRIGGER_NAME$1, __scopeDialog);
    const composedTriggerRef = useComposedRefs(forwardedRef, context.triggerRef);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": context.open,
        "aria-controls": context.contentId,
        "data-state": getState$1(context.open),
        ...triggerProps,
        ref: composedTriggerRef,
        onClick: composeEventHandlers(props.onClick, context.onOpenToggle)
      }
    );
  }
);
DialogTrigger.displayName = TRIGGER_NAME$1;
var PORTAL_NAME = "DialogPortal";
var [PortalProvider, usePortalContext] = createDialogContext(PORTAL_NAME, {
  forceMount: void 0
});
var DialogPortal = (props) => {
  const { __scopeDialog, forceMount, children, container } = props;
  const context = useDialogContext(PORTAL_NAME, __scopeDialog);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PortalProvider, { scope: __scopeDialog, forceMount, children: reactExports.Children.map(children, (child) => /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Portal$1, { asChild: true, container, children: child }) })) });
};
DialogPortal.displayName = PORTAL_NAME;
var OVERLAY_NAME = "DialogOverlay";
var DialogOverlay = reactExports.forwardRef(
  (props, forwardedRef) => {
    const portalContext = usePortalContext(OVERLAY_NAME, props.__scopeDialog);
    const { forceMount = portalContext.forceMount, ...overlayProps } = props;
    const context = useDialogContext(OVERLAY_NAME, props.__scopeDialog);
    return context.modal ? /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlayImpl, { ...overlayProps, ref: forwardedRef }) }) : null;
  }
);
DialogOverlay.displayName = OVERLAY_NAME;
var Slot = /* @__PURE__ */ createSlot("DialogOverlay.RemoveScroll");
var DialogOverlayImpl = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDialog, ...overlayProps } = props;
    const context = useDialogContext(OVERLAY_NAME, __scopeDialog);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ jsxRuntimeExports.jsx(ReactRemoveScroll, { as: Slot, allowPinchZoom: true, shards: [context.contentRef], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.div,
        {
          "data-state": getState$1(context.open),
          ...overlayProps,
          ref: forwardedRef,
          style: { pointerEvents: "auto", ...overlayProps.style }
        }
      ) })
    );
  }
);
var CONTENT_NAME$1 = "DialogContent";
var DialogContent = reactExports.forwardRef(
  (props, forwardedRef) => {
    const portalContext = usePortalContext(CONTENT_NAME$1, props.__scopeDialog);
    const { forceMount = portalContext.forceMount, ...contentProps } = props;
    const context = useDialogContext(CONTENT_NAME$1, props.__scopeDialog);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.open, children: context.modal ? /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContentModal, { ...contentProps, ref: forwardedRef }) : /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContentNonModal, { ...contentProps, ref: forwardedRef }) });
  }
);
DialogContent.displayName = CONTENT_NAME$1;
var DialogContentModal = reactExports.forwardRef(
  (props, forwardedRef) => {
    const context = useDialogContext(CONTENT_NAME$1, props.__scopeDialog);
    const contentRef = reactExports.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, context.contentRef, contentRef);
    reactExports.useEffect(() => {
      const content = contentRef.current;
      if (content) return hideOthers(content);
    }, []);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DialogContentImpl,
      {
        ...props,
        ref: composedRefs,
        trapFocus: context.open,
        disableOutsidePointerEvents: true,
        onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, (event) => {
          event.preventDefault();
          context.triggerRef.current?.focus();
        }),
        onPointerDownOutside: composeEventHandlers(props.onPointerDownOutside, (event) => {
          const originalEvent = event.detail.originalEvent;
          const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
          const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
          if (isRightClick) event.preventDefault();
        }),
        onFocusOutside: composeEventHandlers(
          props.onFocusOutside,
          (event) => event.preventDefault()
        )
      }
    );
  }
);
var DialogContentNonModal = reactExports.forwardRef(
  (props, forwardedRef) => {
    const context = useDialogContext(CONTENT_NAME$1, props.__scopeDialog);
    const hasInteractedOutsideRef = reactExports.useRef(false);
    const hasPointerDownOutsideRef = reactExports.useRef(false);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DialogContentImpl,
      {
        ...props,
        ref: forwardedRef,
        trapFocus: false,
        disableOutsidePointerEvents: false,
        onCloseAutoFocus: (event) => {
          props.onCloseAutoFocus?.(event);
          if (!event.defaultPrevented) {
            if (!hasInteractedOutsideRef.current) context.triggerRef.current?.focus();
            event.preventDefault();
          }
          hasInteractedOutsideRef.current = false;
          hasPointerDownOutsideRef.current = false;
        },
        onInteractOutside: (event) => {
          props.onInteractOutside?.(event);
          if (!event.defaultPrevented) {
            hasInteractedOutsideRef.current = true;
            if (event.detail.originalEvent.type === "pointerdown") {
              hasPointerDownOutsideRef.current = true;
            }
          }
          const target = event.target;
          const targetIsTrigger = context.triggerRef.current?.contains(target);
          if (targetIsTrigger) event.preventDefault();
          if (event.detail.originalEvent.type === "focusin" && hasPointerDownOutsideRef.current) {
            event.preventDefault();
          }
        }
      }
    );
  }
);
var DialogContentImpl = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDialog, trapFocus, onOpenAutoFocus, onCloseAutoFocus, ...contentProps } = props;
    const context = useDialogContext(CONTENT_NAME$1, __scopeDialog);
    const contentRef = reactExports.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, contentRef);
    useFocusGuards();
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FocusScope,
        {
          asChild: true,
          loop: true,
          trapped: trapFocus,
          onMountAutoFocus: onOpenAutoFocus,
          onUnmountAutoFocus: onCloseAutoFocus,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            DismissableLayer,
            {
              role: "dialog",
              id: context.contentId,
              "aria-describedby": context.descriptionId,
              "aria-labelledby": context.titleId,
              "data-state": getState$1(context.open),
              ...contentProps,
              ref: composedRefs,
              onDismiss: () => context.onOpenChange(false)
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TitleWarning, { titleId: context.titleId }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DescriptionWarning, { contentRef, descriptionId: context.descriptionId })
      ] })
    ] });
  }
);
var TITLE_NAME = "DialogTitle";
var DialogTitle = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDialog, ...titleProps } = props;
    const context = useDialogContext(TITLE_NAME, __scopeDialog);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.h2, { id: context.titleId, ...titleProps, ref: forwardedRef });
  }
);
DialogTitle.displayName = TITLE_NAME;
var DESCRIPTION_NAME = "DialogDescription";
var DialogDescription = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDialog, ...descriptionProps } = props;
    const context = useDialogContext(DESCRIPTION_NAME, __scopeDialog);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.p, { id: context.descriptionId, ...descriptionProps, ref: forwardedRef });
  }
);
DialogDescription.displayName = DESCRIPTION_NAME;
var CLOSE_NAME = "DialogClose";
var DialogClose = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDialog, ...closeProps } = props;
    const context = useDialogContext(CLOSE_NAME, __scopeDialog);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.button,
      {
        type: "button",
        ...closeProps,
        ref: forwardedRef,
        onClick: composeEventHandlers(props.onClick, () => context.onOpenChange(false))
      }
    );
  }
);
DialogClose.displayName = CLOSE_NAME;
function getState$1(open) {
  return open ? "open" : "closed";
}
var TITLE_WARNING_NAME = "DialogTitleWarning";
var [WarningProvider, useWarningContext] = createContext2(TITLE_WARNING_NAME, {
  contentName: CONTENT_NAME$1,
  titleName: TITLE_NAME,
  docsSlug: "dialog"
});
var TitleWarning = ({ titleId }) => {
  const titleWarningContext = useWarningContext(TITLE_WARNING_NAME);
  const MESSAGE = `\`${titleWarningContext.contentName}\` requires a \`${titleWarningContext.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${titleWarningContext.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${titleWarningContext.docsSlug}`;
  reactExports.useEffect(() => {
    if (titleId) {
      const hasTitle = document.getElementById(titleId);
      if (!hasTitle) console.error(MESSAGE);
    }
  }, [MESSAGE, titleId]);
  return null;
};
var DESCRIPTION_WARNING_NAME = "DialogDescriptionWarning";
var DescriptionWarning = ({ contentRef, descriptionId }) => {
  const descriptionWarningContext = useWarningContext(DESCRIPTION_WARNING_NAME);
  const MESSAGE = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${descriptionWarningContext.contentName}}.`;
  reactExports.useEffect(() => {
    const describedById = contentRef.current?.getAttribute("aria-describedby");
    if (descriptionId && describedById) {
      const hasDescription = document.getElementById(descriptionId);
      if (!hasDescription) console.warn(MESSAGE);
    }
  }, [MESSAGE, contentRef, descriptionId]);
  return null;
};
var Root$1 = Dialog;
var Trigger$1 = DialogTrigger;
var Portal = DialogPortal;
var Overlay = DialogOverlay;
var Content$1 = DialogContent;
var Title = DialogTitle;
var Close = DialogClose;
const useCommandPaletteStore = create((set) => ({
  open: false,
  openPalette: () => set({ open: true }),
  closePalette: () => set({ open: false }),
  togglePalette: () => set((s) => ({ open: !s.open }))
}));
const useModelsStore = create((set) => ({
  installed: [],
  selected: null,
  setSelected: (name) => set({ selected: name }),
  setInstalled: (models) => set({ installed: models, selected: models[0]?.name ?? null })
}));
const ACTIONS = [
  { id: "chat", label: "Open Chat", icon: MessageSquare, section: "chat" },
  { id: "training", label: "Start Training", icon: Zap, section: "training" },
  { id: "models", label: "Browse Models", icon: Download, section: "models" }
];
function CommandPalette() {
  const { open, closePalette, togglePalette } = useCommandPaletteStore();
  const { installed } = useModelsStore();
  const { setActive } = useNavigationStore();
  const [query, setQuery] = reactExports.useState("");
  const inputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        togglePalette();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [togglePalette]);
  reactExports.useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);
  const q2 = query.toLowerCase();
  const filteredModels = installed.filter((m2) => m2.name.toLowerCase().includes(q2));
  const filteredActions = ACTIONS.filter((a) => a.label.toLowerCase().includes(q2));
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root$1, { open, onOpenChange: (v2) => !v2 && closePalette(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Portal, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Overlay, { className: "fixed inset-0 bg-bg-base/60 z-50" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Content$1,
      {
        "aria-describedby": void 0,
        className: "fixed top-[20%] left-1/2 -translate-x-1/2 w-[640px] max-h-[480px] bg-bg-elevated border border-border-strong rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Title, { className: "sr-only", children: "Command Palette" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 border-b border-border-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: inputRef,
              value: query,
              onChange: (e) => setQuery(e.target.value),
              placeholder: "Type a model name or command...",
              className: "w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none focus-visible:ring-1 focus-visible:ring-accent-500 rounded",
              "aria-label": "Command palette search"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-y-auto flex-1 p-2", children: [
            filteredModels.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-2 py-1 text-[10px] font-medium text-text-muted uppercase tracking-wider", children: "Models" }),
              filteredModels.map((m2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => {
                    useModelsStore.getState().setSelected(m2.name);
                    closePalette();
                  },
                  className: "w-full flex items-center gap-3 px-2 py-2 text-sm text-text-primary hover:bg-bg-surface-3 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { size: 14, className: "text-text-muted flex-shrink-0", "aria-hidden": true }),
                    m2.name
                  ]
                },
                m2.name
              ))
            ] }),
            filteredActions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-2 py-1 text-[10px] font-medium text-text-muted uppercase tracking-wider", children: "Actions" }),
              filteredActions.map(({ id: id2, label, icon: Icon2, section }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => {
                    setActive(section);
                    closePalette();
                  },
                  className: "w-full flex items-center gap-3 px-2 py-2 text-sm text-text-primary hover:bg-bg-surface-3 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { size: 14, className: "text-text-muted flex-shrink-0", "aria-hidden": true }),
                    label
                  ]
                },
                id2
              ))
            ] }),
            filteredModels.length === 0 && filteredActions.length === 0 && query && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "px-2 py-4 text-sm text-text-muted text-center", children: [
              "No results for “",
              query,
              "”"
            ] })
          ] })
        ]
      }
    )
  ] }) });
}
class ErrorBoundary extends React$2.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", this.props.label ?? "Unnamed", error, info.componentStack);
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full p-8 text-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 40, className: "text-red-400", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary font-semibold text-lg", children: "Something went wrong" }),
          this.props.label && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm mt-1", children: this.props.label }),
          this.state.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-xs mt-2 font-mono max-w-md break-words", children: this.state.error.message })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: this.handleReset,
            className: "px-4 py-2 text-sm bg-accent-500 hover:bg-accent-400 text-text-primary rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            children: "Try again"
          }
        )
      ] });
    }
    return this.props.children;
  }
}
function SystemHealth() {
  const { gpuTemp, vramUsed, vramTotal, tokensPerSec, activeModel } = useSystemStore();
  const [metrics, setMetrics] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const newMetrics = [];
    const tempStatus = gpuTemp == null ? "healthy" : gpuTemp > 85 ? "critical" : gpuTemp > 75 ? "warning" : "healthy";
    newMetrics.push({
      name: "GPU Temperature",
      status: tempStatus,
      value: gpuTemp != null ? `${gpuTemp}°C` : "N/A",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Thermometer, { size: 16, "aria-hidden": "true" })
    });
    const vramPercent = vramUsed != null && vramTotal != null && vramTotal > 0 ? vramUsed / vramTotal * 100 : null;
    const vramStatus = vramPercent == null ? "healthy" : vramPercent > 90 ? "critical" : vramPercent > 75 ? "warning" : "healthy";
    newMetrics.push({
      name: "VRAM Usage",
      status: vramStatus,
      value: vramUsed != null && vramTotal != null && vramPercent != null ? `${vramUsed}/${vramTotal} GB (${Math.round(vramPercent)}%)` : "N/A",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(HardDrive, { size: 16, "aria-hidden": "true" })
    });
    const tokStatus = tokensPerSec != null && tokensPerSec < 10 ? "warning" : "healthy";
    newMetrics.push({
      name: "Inference Speed",
      status: tokStatus,
      value: tokensPerSec != null ? `${tokensPerSec} tok/s` : "N/A",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 16, "aria-hidden": "true" })
    });
    const modelStatus = activeModel ? "healthy" : "warning";
    newMetrics.push({
      name: "Model Status",
      status: modelStatus,
      value: activeModel ? "Loaded" : "No model",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { size: 16, "aria-hidden": "true" })
    });
    setMetrics(newMetrics);
  }, [gpuTemp, vramUsed, vramTotal, tokensPerSec, activeModel]);
  const statusColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/10 border-green-500";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500";
      case "critical":
        return "bg-red-500/10 border-red-500";
      default:
        return "bg-bg-surface-2 border-border-default";
    }
  };
  const statusTextColor = (status) => {
    switch (status) {
      case "healthy":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-text-secondary";
    }
  };
  const criticalCount = metrics.filter((m2) => m2.status === "critical").length;
  const warningCount = metrics.filter((m2) => m2.status === "warning").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-text-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 20, "aria-hidden": "true" }),
        "System Health"
      ] }),
      (criticalCount > 0 || warningCount > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs flex items-center gap-2", children: [
        criticalCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-1 bg-red-500/20 text-red-400 rounded", children: [
          criticalCount,
          " critical"
        ] }),
        warningCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded", children: [
          warningCount,
          " warning"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: metrics.map((metric, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `border-l-4 rounded-md p-4 ${statusColor(metric.status)}`,
        role: "status",
        "aria-label": `${metric.name}: ${metric.value}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-sm font-medium text-text-secondary flex items-center gap-2", children: [
              metric.icon,
              metric.name
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-semibold ${statusTextColor(metric.status)}`, children: metric.status === "healthy" ? "✓ OK" : metric.status === "warning" ? "⚠ Warning" : "⚠ Critical" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-mono text-text-primary", children: metric.value })
        ]
      },
      idx
    )) }),
    criticalCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 p-4 bg-red-500/10 border border-red-500 rounded-md flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16, className: "text-red-400 flex-shrink-0 mt-0.5", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-red-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold mb-1", children: "System Issues Detected" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Please check your GPU temperature and VRAM usage. Consider reducing model size or context length." })
      ] })
    ] })
  ] });
}
function BenchmarkPanel() {
  const [isRunning, setIsRunning] = reactExports.useState(false);
  const [results, setResults] = reactExports.useState([
    {
      name: "Inference Speed",
      score: 45,
      unit: "tok/s",
      baseline: 38,
      improvement: "+18%"
    },
    {
      name: "Memory Efficiency",
      score: 87,
      unit: "%",
      baseline: 82,
      improvement: "+6%"
    },
    {
      name: "Latency (first token)",
      score: 245,
      unit: "ms",
      baseline: 312,
      improvement: "-21%"
    },
    {
      name: "Throughput",
      score: 1024,
      unit: "tokens/min",
      baseline: 876,
      improvement: "+17%"
    }
  ]);
  const { activeModel } = useSystemStore();
  const handleRunBenchmark = async () => {
    setIsRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    setIsRunning(false);
  };
  const handleExportResults = () => {
    try {
      const csv = [
        ["Benchmark", "Score", "Unit", "Baseline", "Improvement"],
        ...results.map((r2) => [r2.name, r2.score, r2.unit, r2.baseline || "-", r2.improvement || "-"])
      ].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      if (typeof window.URL?.createObjectURL !== "function") {
        console.warn("Export not available in this environment");
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `benchmark-${(/* @__PURE__ */ new Date()).toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export results:", error);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-semibold text-text-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { size: 20, "aria-hidden": "true" }),
        "Performance Benchmark"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "flex items-center gap-2 px-3 py-1.5 bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-white text-xs font-medium rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            onClick: handleRunBenchmark,
            disabled: isRunning || !activeModel,
            "aria-label": isRunning ? "Benchmark running..." : "Run benchmark",
            children: isRunning ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCw, { size: 14, className: "animate-spin", "aria-hidden": "true" }),
              "Running..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 14, "aria-hidden": "true" }),
              "Run"
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "flex items-center gap-2 px-3 py-1.5 border border-border-default hover:bg-bg-surface-3 text-text-secondary text-xs font-medium rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            onClick: handleExportResults,
            "aria-label": "Export benchmark results",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14, "aria-hidden": "true" }),
              "Export"
            ]
          }
        )
      ] })
    ] }),
    !activeModel && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-sm text-yellow-300 mb-6", children: "Load a model to run benchmarks" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: results.map((result, idx) => {
      const isImprovement = result.improvement?.startsWith("+");
      const improvementColor = isImprovement ? "text-green-400" : "text-green-400";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "bg-bg-surface-3 border border-border-subtle rounded-md p-4",
          role: "article",
          "aria-label": `${result.name}: ${result.score} ${result.unit}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-text-secondary", children: result.name }),
              result.improvement && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-semibold ${improvementColor}`, children: result.improvement })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-bold text-text-primary", children: result.score }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-muted", children: result.unit })
            ] }),
            result.baseline && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-text-muted", children: [
              "Baseline: ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-secondary font-mono", children: [
                result.baseline,
                " ",
                result.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-2 bg-bg-base rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "h-full bg-accent-500 rounded-full transition-all",
                style: { width: `${Math.min(result.score / (result.baseline || result.score) * 100, 100)}%` },
                "aria-hidden": "true"
              }
            ) })
          ]
        },
        idx
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 p-4 bg-bg-base border border-border-subtle rounded-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-semibold text-text-secondary mb-2", children: "Last Run" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-text-muted", children: [
        (/* @__PURE__ */ new Date()).toLocaleString(),
        " • Model: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary font-mono", children: activeModel || "None" })
      ] })
    ] })
  ] });
}
function SystemPanel() {
  const [activeTab, setActiveTab] = reactExports.useState("health");
  const [isExpanded, setIsExpanded] = reactExports.useState(true);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-1 border-b border-border-default", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "w-full px-6 py-3 flex items-center justify-between hover:bg-bg-surface-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-accent-500",
        onClick: () => setIsExpanded(!isExpanded),
        "aria-expanded": isExpanded,
        "aria-label": "System panel",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-text-primary", children: "System Information" }),
          isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 18, "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 18, "aria-hidden": "true" })
        ]
      }
    ),
    isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-4 border-t border-border-default", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-6 border-b border-border-subtle", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: `px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-t ${activeTab === "health" ? "text-accent-500 border-b-2 border-accent-500" : "text-text-secondary hover:text-text-primary"}`,
            onClick: () => setActiveTab("health"),
            "aria-selected": activeTab === "health",
            role: "tab",
            children: "Health"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: `px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-t ${activeTab === "benchmark" ? "text-accent-500 border-b-2 border-accent-500" : "text-text-secondary hover:text-text-primary"}`,
            onClick: () => setActiveTab("benchmark"),
            "aria-selected": activeTab === "benchmark",
            role: "tab",
            children: "Benchmark"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "tabpanel", "aria-label": activeTab === "health" ? "Health" : "Benchmark", children: [
        activeTab === "health" && /* @__PURE__ */ jsxRuntimeExports.jsx(SystemHealth, {}),
        activeTab === "benchmark" && /* @__PURE__ */ jsxRuntimeExports.jsx(BenchmarkPanel, {})
      ] })
    ] })
  ] });
}
function VramBar({ used, total }) {
  const pct = used != null && total != null && total > 0 ? Math.min(used / total * 100, 100) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "w-full h-2 bg-bg-surface-3 rounded-full overflow-hidden",
      role: "progressbar",
      "aria-valuenow": Math.round(pct),
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-label": "VRAM usage",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full bg-accent-500 rounded-full transition-all duration-300",
          style: { width: `${pct}%` }
        }
      )
    }
  );
}
function HealthDot({ status }) {
  const color = status === "ok" ? "bg-green-500" : status === "warn" ? "bg-yellow-400" : "bg-text-muted";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block w-2 h-2 rounded-full ${color}`, "aria-hidden": "true" });
}
function Dashboard() {
  const { activeModel, tokensPerSec, vramUsed, vramTotal, gpuTemp, trainingStatus, ollamaOnline } = useSystemStore();
  const setActive = useNavigationStore((s) => s.setActive);
  const inferenceStatus = ollamaOnline ? "ok" : "idle";
  const gpuStatus = gpuTemp != null && gpuTemp > 85 ? "warn" : gpuTemp != null && gpuTemp > 0 ? "ok" : "idle";
  const trainingDotStatus = trainingStatus === "running" ? "ok" : "idle";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-testid": "screen-dashboard", className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-text-primary", children: activeModel ?? "No model loaded" }),
          activeModel && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-local-badge-bg text-local-badge-fg", children: "local" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-muted", children: tokensPerSec != null && tokensPerSec > 0 ? `${tokensPerSec} tok/s` : "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(VramBar, { used: vramUsed, total: vramTotal }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-text-muted", children: [
        vramUsed != null ? vramUsed.toFixed(1) : "—",
        " /",
        " ",
        vramTotal != null ? vramTotal.toFixed(1) : "—",
        " GB VRAM"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          onClick: () => setActive("chat"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 16, "aria-hidden": "true" }),
            "Open Chat"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-text-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HealthDot, { status: inferenceStatus }),
        "Inference: ",
        ollamaOnline ? "Ready" : "Offline"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HealthDot, { status: gpuStatus }),
        "GPU: ",
        gpuTemp != null && gpuTemp > 0 ? `${gpuTemp}°C` : "N/A"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HealthDot, { status: trainingDotStatus }),
        "Training: ",
        trainingStatus === "running" ? "Running" : "Idle"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          onClick: () => setActive("chat"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 16, "aria-hidden": "true" }),
            "Open Chat"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          onClick: () => setActive("training"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 16, "aria-hidden": "true" }),
            "Start Training"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          onClick: () => setActive("models"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 16, "aria-hidden": "true" }),
            "Browse Models"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          onClick: () => setActive("settings"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 16, "aria-hidden": "true" }),
            "System Health"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SystemPanel, {})
  ] });
}
function createCollection(name) {
  const PROVIDER_NAME = name + "CollectionProvider";
  const [createCollectionContext, createCollectionScope2] = createContextScope(PROVIDER_NAME);
  const [CollectionProviderImpl, useCollectionContext] = createCollectionContext(
    PROVIDER_NAME,
    { collectionRef: { current: null }, itemMap: /* @__PURE__ */ new Map() }
  );
  const CollectionProvider = (props) => {
    const { scope, children } = props;
    const ref = React$2.useRef(null);
    const itemMap = React$2.useRef(/* @__PURE__ */ new Map()).current;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(CollectionProviderImpl, { scope, itemMap, collectionRef: ref, children });
  };
  CollectionProvider.displayName = PROVIDER_NAME;
  const COLLECTION_SLOT_NAME = name + "CollectionSlot";
  const CollectionSlotImpl = /* @__PURE__ */ createSlot(COLLECTION_SLOT_NAME);
  const CollectionSlot = React$2.forwardRef(
    (props, forwardedRef) => {
      const { scope, children } = props;
      const context = useCollectionContext(COLLECTION_SLOT_NAME, scope);
      const composedRefs = useComposedRefs(forwardedRef, context.collectionRef);
      return /* @__PURE__ */ jsxRuntimeExports.jsx(CollectionSlotImpl, { ref: composedRefs, children });
    }
  );
  CollectionSlot.displayName = COLLECTION_SLOT_NAME;
  const ITEM_SLOT_NAME = name + "CollectionItemSlot";
  const ITEM_DATA_ATTR = "data-radix-collection-item";
  const CollectionItemSlotImpl = /* @__PURE__ */ createSlot(ITEM_SLOT_NAME);
  const CollectionItemSlot = React$2.forwardRef(
    (props, forwardedRef) => {
      const { scope, children, ...itemData } = props;
      const ref = React$2.useRef(null);
      const composedRefs = useComposedRefs(forwardedRef, ref);
      const context = useCollectionContext(ITEM_SLOT_NAME, scope);
      React$2.useEffect(() => {
        context.itemMap.set(ref, { ref, ...itemData });
        return () => void context.itemMap.delete(ref);
      });
      return /* @__PURE__ */ jsxRuntimeExports.jsx(CollectionItemSlotImpl, { ...{ [ITEM_DATA_ATTR]: "" }, ref: composedRefs, children });
    }
  );
  CollectionItemSlot.displayName = ITEM_SLOT_NAME;
  function useCollection2(scope) {
    const context = useCollectionContext(name + "CollectionConsumer", scope);
    const getItems = React$2.useCallback(() => {
      const collectionNode = context.collectionRef.current;
      if (!collectionNode) return [];
      const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`));
      const items = Array.from(context.itemMap.values());
      const orderedItems = items.sort(
        (a, b) => orderedNodes.indexOf(a.ref.current) - orderedNodes.indexOf(b.ref.current)
      );
      return orderedItems;
    }, [context.collectionRef, context.itemMap]);
    return getItems;
  }
  return [
    { Provider: CollectionProvider, Slot: CollectionSlot, ItemSlot: CollectionItemSlot },
    useCollection2,
    createCollectionScope2
  ];
}
var DirectionContext = reactExports.createContext(void 0);
function useDirection(localDir) {
  const globalDir = reactExports.useContext(DirectionContext);
  return localDir || globalDir || "ltr";
}
var ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
var EVENT_OPTIONS = { bubbles: false, cancelable: true };
var GROUP_NAME = "RovingFocusGroup";
var [Collection, useCollection, createCollectionScope] = createCollection(GROUP_NAME);
var [createRovingFocusGroupContext, createRovingFocusGroupScope] = createContextScope(
  GROUP_NAME,
  [createCollectionScope]
);
var [RovingFocusProvider, useRovingFocusContext] = createRovingFocusGroupContext(GROUP_NAME);
var RovingFocusGroup = reactExports.forwardRef(
  (props, forwardedRef) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Provider, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Slot, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RovingFocusGroupImpl, { ...props, ref: forwardedRef }) }) });
  }
);
RovingFocusGroup.displayName = GROUP_NAME;
var RovingFocusGroupImpl = reactExports.forwardRef((props, forwardedRef) => {
  const {
    __scopeRovingFocusGroup,
    orientation,
    loop = false,
    dir,
    currentTabStopId: currentTabStopIdProp,
    defaultCurrentTabStopId,
    onCurrentTabStopIdChange,
    onEntryFocus,
    preventScrollOnEntryFocus = false,
    ...groupProps
  } = props;
  const ref = reactExports.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const direction = useDirection(dir);
  const [currentTabStopId, setCurrentTabStopId] = useControllableState({
    prop: currentTabStopIdProp,
    defaultProp: defaultCurrentTabStopId ?? null,
    onChange: onCurrentTabStopIdChange,
    caller: GROUP_NAME
  });
  const [isTabbingBackOut, setIsTabbingBackOut] = reactExports.useState(false);
  const handleEntryFocus = useCallbackRef$1(onEntryFocus);
  const getItems = useCollection(__scopeRovingFocusGroup);
  const isClickFocusRef = reactExports.useRef(false);
  const [focusableItemsCount, setFocusableItemsCount] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const node = ref.current;
    if (node) {
      node.addEventListener(ENTRY_FOCUS, handleEntryFocus);
      return () => node.removeEventListener(ENTRY_FOCUS, handleEntryFocus);
    }
  }, [handleEntryFocus]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    RovingFocusProvider,
    {
      scope: __scopeRovingFocusGroup,
      orientation,
      dir: direction,
      loop,
      currentTabStopId,
      onItemFocus: reactExports.useCallback(
        (tabStopId) => setCurrentTabStopId(tabStopId),
        [setCurrentTabStopId]
      ),
      onItemShiftTab: reactExports.useCallback(() => setIsTabbingBackOut(true), []),
      onFocusableItemAdd: reactExports.useCallback(
        () => setFocusableItemsCount((prevCount) => prevCount + 1),
        []
      ),
      onFocusableItemRemove: reactExports.useCallback(
        () => setFocusableItemsCount((prevCount) => prevCount - 1),
        []
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.div,
        {
          tabIndex: isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0,
          "data-orientation": orientation,
          ...groupProps,
          ref: composedRefs,
          style: { outline: "none", ...props.style },
          onMouseDown: composeEventHandlers(props.onMouseDown, () => {
            isClickFocusRef.current = true;
          }),
          onFocus: composeEventHandlers(props.onFocus, (event) => {
            const isKeyboardFocus = !isClickFocusRef.current;
            if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
              const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS);
              event.currentTarget.dispatchEvent(entryFocusEvent);
              if (!entryFocusEvent.defaultPrevented) {
                const items = getItems().filter((item) => item.focusable);
                const activeItem = items.find((item) => item.active);
                const currentItem = items.find((item) => item.id === currentTabStopId);
                const candidateItems = [activeItem, currentItem, ...items].filter(
                  Boolean
                );
                const candidateNodes = candidateItems.map((item) => item.ref.current);
                focusFirst(candidateNodes, preventScrollOnEntryFocus);
              }
            }
            isClickFocusRef.current = false;
          }),
          onBlur: composeEventHandlers(props.onBlur, () => setIsTabbingBackOut(false))
        }
      )
    }
  );
});
var ITEM_NAME$1 = "RovingFocusGroupItem";
var RovingFocusGroupItem = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeRovingFocusGroup,
      focusable = true,
      active = false,
      tabStopId,
      children,
      ...itemProps
    } = props;
    const autoId = useId();
    const id2 = tabStopId || autoId;
    const context = useRovingFocusContext(ITEM_NAME$1, __scopeRovingFocusGroup);
    const isCurrentTabStop = context.currentTabStopId === id2;
    const getItems = useCollection(__scopeRovingFocusGroup);
    const { onFocusableItemAdd, onFocusableItemRemove, currentTabStopId } = context;
    reactExports.useEffect(() => {
      if (focusable) {
        onFocusableItemAdd();
        return () => onFocusableItemRemove();
      }
    }, [focusable, onFocusableItemAdd, onFocusableItemRemove]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Collection.ItemSlot,
      {
        scope: __scopeRovingFocusGroup,
        id: id2,
        focusable,
        active,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.span,
          {
            tabIndex: isCurrentTabStop ? 0 : -1,
            "data-orientation": context.orientation,
            ...itemProps,
            ref: forwardedRef,
            onMouseDown: composeEventHandlers(props.onMouseDown, (event) => {
              if (!focusable) event.preventDefault();
              else context.onItemFocus(id2);
            }),
            onFocus: composeEventHandlers(props.onFocus, () => context.onItemFocus(id2)),
            onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
              if (event.key === "Tab" && event.shiftKey) {
                context.onItemShiftTab();
                return;
              }
              if (event.target !== event.currentTarget) return;
              const focusIntent = getFocusIntent(event, context.orientation, context.dir);
              if (focusIntent !== void 0) {
                if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                event.preventDefault();
                const items = getItems().filter((item) => item.focusable);
                let candidateNodes = items.map((item) => item.ref.current);
                if (focusIntent === "last") candidateNodes.reverse();
                else if (focusIntent === "prev" || focusIntent === "next") {
                  if (focusIntent === "prev") candidateNodes.reverse();
                  const currentIndex = candidateNodes.indexOf(event.currentTarget);
                  candidateNodes = context.loop ? wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
                }
                setTimeout(() => focusFirst(candidateNodes));
              }
            }),
            children: typeof children === "function" ? children({ isCurrentTabStop, hasTabStop: currentTabStopId != null }) : children
          }
        )
      }
    );
  }
);
RovingFocusGroupItem.displayName = ITEM_NAME$1;
var MAP_KEY_TO_FOCUS_INTENT = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function getDirectionAwareKey(key, dir) {
  if (dir !== "rtl") return key;
  return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
}
function getFocusIntent(event, orientation, dir) {
  const key = getDirectionAwareKey(event.key, dir);
  if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key)) return void 0;
  if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key)) return void 0;
  return MAP_KEY_TO_FOCUS_INTENT[key];
}
function focusFirst(candidates, preventScroll = false) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus({ preventScroll });
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}
function wrapArray(array, startIndex) {
  return array.map((_, index) => array[(startIndex + index) % array.length]);
}
var Root = RovingFocusGroup;
var Item = RovingFocusGroupItem;
var TABS_NAME = "Tabs";
var [createTabsContext] = createContextScope(TABS_NAME, [
  createRovingFocusGroupScope
]);
var useRovingFocusGroupScope$1 = createRovingFocusGroupScope();
var [TabsProvider, useTabsContext] = createTabsContext(TABS_NAME);
var Tabs = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeTabs,
      value: valueProp,
      onValueChange,
      defaultValue,
      orientation = "horizontal",
      dir,
      activationMode = "automatic",
      ...tabsProps
    } = props;
    const direction = useDirection(dir);
    const [value, setValue] = useControllableState({
      prop: valueProp,
      onChange: onValueChange,
      defaultProp: defaultValue ?? "",
      caller: TABS_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      TabsProvider,
      {
        scope: __scopeTabs,
        baseId: useId(),
        value,
        onValueChange: setValue,
        orientation,
        dir: direction,
        activationMode,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            dir: direction,
            "data-orientation": orientation,
            ...tabsProps,
            ref: forwardedRef
          }
        )
      }
    );
  }
);
Tabs.displayName = TABS_NAME;
var TAB_LIST_NAME = "TabsList";
var TabsList = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeTabs, loop = true, ...listProps } = props;
    const context = useTabsContext(TAB_LIST_NAME, __scopeTabs);
    const rovingFocusGroupScope = useRovingFocusGroupScope$1(__scopeTabs);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Root,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        orientation: context.orientation,
        dir: context.dir,
        loop,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            role: "tablist",
            "aria-orientation": context.orientation,
            ...listProps,
            ref: forwardedRef
          }
        )
      }
    );
  }
);
TabsList.displayName = TAB_LIST_NAME;
var TRIGGER_NAME = "TabsTrigger";
var TabsTrigger = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeTabs, value, disabled = false, ...triggerProps } = props;
    const context = useTabsContext(TRIGGER_NAME, __scopeTabs);
    const rovingFocusGroupScope = useRovingFocusGroupScope$1(__scopeTabs);
    const triggerId = makeTriggerId(context.baseId, value);
    const contentId = makeContentId(context.baseId, value);
    const isSelected = value === context.value;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Item,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        focusable: !disabled,
        active: isSelected,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.button,
          {
            type: "button",
            role: "tab",
            "aria-selected": isSelected,
            "aria-controls": contentId,
            "data-state": isSelected ? "active" : "inactive",
            "data-disabled": disabled ? "" : void 0,
            disabled,
            id: triggerId,
            ...triggerProps,
            ref: forwardedRef,
            onMouseDown: composeEventHandlers(props.onMouseDown, (event) => {
              if (!disabled && event.button === 0 && event.ctrlKey === false) {
                context.onValueChange(value);
              } else {
                event.preventDefault();
              }
            }),
            onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
              if ([" ", "Enter"].includes(event.key)) context.onValueChange(value);
            }),
            onFocus: composeEventHandlers(props.onFocus, () => {
              const isAutomaticActivation = context.activationMode !== "manual";
              if (!isSelected && !disabled && isAutomaticActivation) {
                context.onValueChange(value);
              }
            })
          }
        )
      }
    );
  }
);
TabsTrigger.displayName = TRIGGER_NAME;
var CONTENT_NAME = "TabsContent";
var TabsContent = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeTabs, value, forceMount, children, ...contentProps } = props;
    const context = useTabsContext(CONTENT_NAME, __scopeTabs);
    const triggerId = makeTriggerId(context.baseId, value);
    const contentId = makeContentId(context.baseId, value);
    const isSelected = value === context.value;
    const isMountAnimationPreventedRef = reactExports.useRef(isSelected);
    reactExports.useEffect(() => {
      const rAF = requestAnimationFrame(() => isMountAnimationPreventedRef.current = false);
      return () => cancelAnimationFrame(rAF);
    }, []);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || isSelected, children: ({ present }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "data-state": isSelected ? "active" : "inactive",
        "data-orientation": context.orientation,
        role: "tabpanel",
        "aria-labelledby": triggerId,
        hidden: !present,
        id: contentId,
        tabIndex: 0,
        ...contentProps,
        ref: forwardedRef,
        style: {
          ...props.style,
          animationDuration: isMountAnimationPreventedRef.current ? "0s" : void 0
        },
        children: present && children
      }
    ) });
  }
);
TabsContent.displayName = CONTENT_NAME;
function makeTriggerId(baseId, value) {
  return `${baseId}-trigger-${value}`;
}
function makeContentId(baseId, value) {
  return `${baseId}-content-${value}`;
}
var Root2$1 = Tabs;
var List = TabsList;
var Trigger = TabsTrigger;
var Content = TabsContent;
function ModelCard({
  id: id2,
  name,
  params,
  arch,
  format,
  description,
  downloadStatus,
  onDownload
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4 flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-accent-500/10 text-accent-400 text-xs px-2 py-0.5 rounded font-mono", children: params }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded", children: arch }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-text-primary", children: name })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-secondary line-clamp-2", children: description }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded", children: format }),
      downloadStatus === "idle" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          onClick: () => onDownload(id2),
          "aria-label": `Download ${name}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14, "aria-hidden": "true" }),
            "Download"
          ]
        }
      ),
      downloadStatus === "downloading" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "border border-border-default text-text-secondary rounded-md px-3 py-2 text-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-not-allowed opacity-70",
          disabled: true,
          "aria-label": `Downloading ${name}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 14, className: "animate-spin", "aria-hidden": "true" }),
            "Downloading…"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "status", "aria-live": "polite", "aria-atomic": "true", className: "sr-only", children: downloadStatus === "done" ? `${name} downloaded` : "" }),
      downloadStatus === "done" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border-default text-text-secondary rounded-md px-3 py-2 text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14, className: "text-green-400", "aria-hidden": "true" }),
        "Downloaded"
      ] }),
      downloadStatus === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-2 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          onClick: () => onDownload(id2),
          "aria-label": `Retry downloading ${name}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 14, className: "text-red-400", "aria-hidden": "true" }),
            "Retry"
          ]
        }
      )
    ] })
  ] });
}
const MODEL_MANAGER_BASE_URL = "http://localhost:8002";
function useModelManager() {
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const checkHealth = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/health`);
      if (!response.ok) throw new Error(`Health check failed: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  const getMirrorInfo = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/mirror`);
      if (!response.ok) throw new Error(`Failed to get mirror info: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  const getSwitchMirrorInstructions = reactExports.useCallback(
    async (mirrorName) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/mirror/switch?mirror_name=${mirrorName}`, {
          method: "POST"
        });
        if (!response.ok) throw new Error(`Failed to switch mirror: ${response.statusText}`);
        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const listModels = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/models`);
      if (!response.ok) throw new Error(`Failed to list models: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  const downloadModel = reactExports.useCallback(async (modelId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/models/${modelId}/download`, {
        method: "POST"
      });
      if (!response.ok) throw new Error(`Failed to download model: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  const setActiveModel = reactExports.useCallback(async (modelId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/models/${modelId}/set-active`, {
        method: "POST"
      });
      if (!response.ok) throw new Error(`Failed to set active model: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  return {
    loading,
    error,
    checkHealth,
    getMirrorInfo,
    getSwitchMirrorInstructions,
    listModels,
    downloadModel,
    setActiveModel
  };
}
const STAFF_PICKS = [
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    name: "Llama 3.1 8B Instruct",
    params: "8B",
    arch: "llama",
    format: "GGUF",
    description: "Meta's latest instruction-tuned Llama model, excellent for coding and chat"
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B Instruct v0.3",
    params: "7B",
    arch: "mistral",
    format: "GGUF",
    description: "Fast and capable instruction model from Mistral AI"
  },
  {
    id: "Qwen/Qwen2.5-Coder-7B-Instruct",
    name: "Qwen 2.5 Coder 7B",
    params: "7B",
    arch: "qwen2",
    format: "GGUF",
    description: "Specialized coding model with strong code generation"
  },
  {
    id: "microsoft/Phi-3.5-mini-instruct",
    name: "Phi-3.5 Mini Instruct",
    params: "3.8B",
    arch: "phi3",
    format: "GGUF",
    description: "Microsoft's compact model with surprisingly strong reasoning"
  },
  {
    id: "google/gemma-2-9b-it",
    name: "Gemma 2 9B Instruct",
    params: "9B",
    arch: "gemma2",
    format: "GGUF",
    description: "Google's latest efficient instruction model"
  },
  {
    id: "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct",
    name: "DeepSeek Coder V2 Lite",
    params: "16B",
    arch: "deepseek",
    format: "GGUF",
    description: "Powerful coding model with strong algorithmic reasoning"
  },
  {
    id: "NousResearch/Hermes-3-Llama-3.1-8B",
    name: "Hermes 3 Llama 3.1 8B",
    params: "8B",
    arch: "llama",
    format: "GGUF",
    description: "Fine-tuned for function calling and agentic tasks"
  },
  {
    id: "codellama/CodeLlama-13b-Instruct-hf",
    name: "Code Llama 13B Instruct",
    params: "13B",
    arch: "llama",
    format: "GGUF",
    description: "Meta's specialized code generation model"
  }
];
function HuggingFacePanel() {
  const { checkHealth, listModels, downloadModel } = useModelManager();
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [debouncedQuery, setDebouncedQuery] = reactExports.useState("");
  const [downloadStatuses, setDownloadStatuses] = reactExports.useState(/* @__PURE__ */ new Map());
  const [isOffline, setIsOffline] = reactExports.useState(false);
  const debounceRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    checkHealth().then((result) => {
      setIsOffline(result === null);
    });
  }, [checkHealth]);
  reactExports.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);
  reactExports.useEffect(() => {
    const poll = async () => {
      const result = await listModels();
      if (!result) return;
      setDownloadStatuses((prev) => {
        const next = new Map(prev);
        result.cached_models.forEach((m2) => {
          if (m2.cached && prev.get(m2.id) !== "done") {
            next.set(m2.id, "done");
          }
        });
        return next;
      });
    };
    void poll();
    const id2 = setInterval(poll, 3e3);
    return () => clearInterval(id2);
  }, [listModels]);
  const handleDownload = reactExports.useCallback(
    async (modelId) => {
      setDownloadStatuses((prev) => new Map(prev).set(modelId, "downloading"));
      try {
        const result = await downloadModel(modelId);
        if (!result) {
          setDownloadStatuses((prev) => new Map(prev).set(modelId, "error"));
        }
      } catch {
        setDownloadStatuses((prev) => new Map(prev).set(modelId, "error"));
      }
    },
    [downloadModel]
  );
  const showSearchResults = debouncedQuery.trim().length > 0;
  const displayedModels = showSearchResults ? STAFF_PICKS.filter(
    (m2) => m2.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || m2.id.toLowerCase().includes(debouncedQuery.toLowerCase()) || m2.arch.toLowerCase().includes(debouncedQuery.toLowerCase())
  ) : STAFF_PICKS;
  const activeDownloads = Array.from(downloadStatuses.entries()).filter(([, s]) => s === "downloading");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 flex flex-col gap-6 max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-text-primary", children: "Download from HuggingFace" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-secondary mt-1", children: "Models are downloaded via the local Model Manager service" })
    ] }),
    isOffline && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        role: "alert",
        className: "bg-yellow-400/10 border border-yellow-400/30 rounded-md px-4 py-3 flex items-center gap-3",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { size: 16, className: "text-yellow-400 flex-shrink-0", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-yellow-400", children: "Model Manager service is offline (port 8002). Start it to enable HuggingFace downloads." })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Search,
        {
          size: 16,
          className: "absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none",
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          placeholder: "Search HuggingFace models (e.g. mistral, llama, gemma)...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: "w-full bg-bg-surface-2 border border-border-default rounded-md pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500",
          "aria-label": "Search HuggingFace models"
        }
      )
    ] }),
    activeDownloads.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3", children: "Active Downloads" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "flex flex-col gap-2", children: activeDownloads.map(([modelId]) => {
        const model = STAFF_PICKS.find((m2) => m2.id === modelId);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "li",
          {
            className: "text-sm text-text-secondary flex items-center gap-2 bg-bg-surface-2 border border-border-default rounded-md px-4 py-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-accent-500 animate-pulse flex-shrink-0", "aria-hidden": "true" }),
              model ? model.name : modelId,
              " — downloading"
            ]
          },
          modelId
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3", children: showSearchResults ? "Search results" : "Staff Picks" }),
      displayedModels.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-text-muted", children: [
        "No models found for “",
        debouncedQuery,
        "”"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { role: "list", className: "flex flex-col gap-3 list-none p-0 m-0", children: displayedModels.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        ModelCard,
        {
          ...model,
          downloadStatus: downloadStatuses.get(model.id) ?? "idle",
          onDownload: handleDownload
        }
      ) }, model.id)) })
    ] })
  ] });
}
function formatSize(bytes) {
  return (bytes / 1e9).toFixed(1) + " GB";
}
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}
function EmptySelection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full gap-4 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Server, { size: 48, className: "text-text-muted", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-text-primary", children: "Select a model" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-muted", children: "Choose a model from the list to view details" })
  ] });
}
function ModelDetail({ model }) {
  const activeModel = useSystemStore((s) => s.activeModel);
  const isActive = model.name === activeModel;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-6 max-w-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "h2",
          {
            className: "text-2xl font-semibold text-text-primary break-words",
            title: model.name,
            children: model.name
          }
        ) }),
        isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 24, className: "text-green-500", role: "img", "aria-label": "Active model" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-text-muted", children: [
        formatSize(model.size),
        " • Modified ",
        formatDate(model.modified_at)
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 min-h-[80px] flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold", children: "Digest" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-text-primary font-mono break-all flex-1", title: model.digest, children: [
          model.digest.slice(0, 16),
          "..."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 min-h-[80px] flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold", children: "Size" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-primary font-mono", children: formatSize(model.size) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 min-h-[80px] flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold", children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-yellow-500"}`, "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-primary font-mono", children: isActive ? "Active" : "Installed" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 min-h-[80px] flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold", children: "Modified" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-primary font-mono", children: formatDate(model.modified_at) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          onClick: () => useSystemStore.setState({ activeModel: model.name }),
          "aria-label": `Set ${model.name} as active`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14, "aria-hidden": "true" }),
            "Set as Active"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          disabled: true,
          className: "border border-border-default text-text-secondary text-sm font-medium px-4 py-2 rounded-md cursor-not-allowed opacity-50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors",
          "aria-label": `Fine-tune ${model.name}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 14, "aria-hidden": "true" }),
            "Fine-tune"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          disabled: true,
          className: "border border-border-default text-red-400 text-sm font-medium px-4 py-2 rounded-md cursor-not-allowed opacity-50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors",
          "aria-label": `Delete ${model.name}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14, "aria-hidden": "true" }),
            "Delete"
          ]
        }
      )
    ] })
  ] });
}
function Models() {
  const { installed, selected, setSelected } = useModelsStore();
  const activeModel = useSystemStore((s) => s.activeModel);
  const ollamaOnline = useSystemStore((s) => s.ollamaOnline);
  const selectedModel = installed.find((m2) => m2.name === selected) ?? null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-testid": "screen-models", className: "flex flex-col h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "installed", className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      List,
      {
        className: "flex shrink-0 border-b border-border-default bg-bg-surface-1 px-4 gap-1",
        "aria-label": "Models navigation",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Trigger,
            {
              value: "installed",
              className: "px-4 py-2.5 text-sm font-medium text-text-secondary cursor-pointer border-b-2 border-transparent data-[state=active]:border-accent-500 data-[state=active]:text-text-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors -mb-px",
              children: [
                "Installed (",
                installed.length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Trigger,
            {
              value: "download",
              className: "px-4 py-2.5 text-sm font-medium text-text-secondary cursor-pointer border-b-2 border-transparent data-[state=active]:border-accent-500 data-[state=active]:text-text-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors -mb-px",
              children: "Download from HuggingFace"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "installed", className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[200px] shrink-0 bg-bg-surface-1 border-r border-border-default overflow-y-auto flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-4 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wide", children: "Installed" }),
        installed.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-4 py-2 text-xs text-text-muted", children: "No models installed" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { role: "list", "aria-label": "Installed models", children: installed.map((model) => {
          const isSelected = model.name === selected;
          const isActive = model.name === activeModel;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              "aria-pressed": isSelected,
              "aria-label": isActive ? `${model.name} (active)` : model.name,
              title: model.name,
              className: `w-full text-left px-4 py-2.5 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent-500 flex items-center gap-2 ${isSelected ? "bg-accent-500/10 text-text-primary border-l-2 border-accent-500" : "text-text-secondary hover:bg-bg-surface-3"}`,
              onClick: () => setSelected(model.name),
              children: [
                isActive && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14, className: "text-green-500 flex-shrink-0", "aria-hidden": "true" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate flex-1", title: model.name, children: model.name })
              ]
            }
          ) }, model.name);
        }) }),
        !ollamaOnline && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-2 text-xs text-text-muted flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { size: 12, "aria-hidden": "true" }),
          "Ollama offline"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 bg-bg-base overflow-auto", children: selectedModel ? /* @__PURE__ */ jsxRuntimeExports.jsx(ModelDetail, { model: selectedModel }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EmptySelection, {}) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "download", className: "flex-1 overflow-auto bg-bg-base", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HuggingFacePanel, {}) })
  ] }) });
}
const useChatStore = create((set) => ({
  messages: [],
  knowledgeContext: "",
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  appendToLast: (chunk) => set((state) => {
    const messages = [...state.messages];
    const last = messages[messages.length - 1];
    if (!last) return state;
    messages[messages.length - 1] = { ...last, content: last.content + chunk };
    return { messages };
  }),
  setLastStreaming: (streaming) => set((state) => {
    const messages = [...state.messages];
    const last = messages[messages.length - 1];
    if (!last) return state;
    messages[messages.length - 1] = { ...last, streaming };
    return { messages };
  }),
  setKnowledgeContext: (ctx) => set({ knowledgeContext: ctx }),
  clear: () => set({ messages: [] })
}));
const useAgentStore = create((set) => ({
  agentMode: false,
  setAgentMode: (enabled) => set({ agentMode: enabled }),
  toolCalls: [],
  addToolCall: (call) => set((state) => ({
    toolCalls: [...state.toolCalls, {
      ...call,
      id: `tool-${Date.now()}`,
      timestamp: Date.now()
    }]
  })),
  updateToolCall: (id2, updates) => set((state) => ({
    toolCalls: state.toolCalls.map((tc2) => tc2.id === id2 ? { ...tc2, ...updates } : tc2)
  })),
  clearToolCalls: () => set({ toolCalls: [] }),
  fileChanges: [],
  addFileChange: (change) => set((state) => ({
    fileChanges: [...state.fileChanges, {
      ...change,
      id: `change-${Date.now()}`
    }]
  })),
  updateFileChange: (id2, accepted) => set((state) => ({
    fileChanges: state.fileChanges.map((fc2) => fc2.id === id2 ? { ...fc2, accepted } : fc2)
  })),
  clearFileChanges: () => set({ fileChanges: [] }),
  dryRun: false,
  setDryRun: (enabled) => set({ dryRun: enabled })
}));
const BASE = "http://localhost:11434";
const ollamaClient = {
  async getModels() {
    try {
      const res = await fetch(`${BASE}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.models ?? [];
    } catch {
      return [];
    }
  },
  async isOnline() {
    try {
      const res = await fetch(`${BASE}/api/tags`, {
        signal: AbortSignal.timeout(2e3)
      });
      return res.ok;
    } catch {
      return false;
    }
  },
  async *streamChat(model, messages) {
    let res;
    try {
      res = await fetch(`${BASE}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true })
      });
    } catch {
      return;
    }
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
          }
        }
      }
    } catch {
    } finally {
      reader.releaseLock();
    }
  }
};
const streamChat = ollamaClient.streamChat.bind(ollamaClient);
function ToolTrace({ expanded = true }) {
  const { toolCalls } = useAgentStore();
  const [expandedId, setExpandedId] = reactExports.useState(null);
  if (toolCalls.length === 0) {
    return null;
  }
  const statusIcon = (call) => {
    switch (call.status) {
      case "thinking":
      case "executing":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 14, className: "animate-spin text-blue-400", "aria-hidden": "true" });
      case "done":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14, className: "text-green-500", "aria-hidden": "true" });
      case "error":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 14, className: "text-red-400", "aria-hidden": "true" });
    }
  };
  const statusLabel = (call) => {
    return {
      thinking: "Thinking",
      executing: "Running",
      done: "Done",
      error: "Error"
    }[call.status];
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border-t border-border-default p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-text-primary mb-3", children: "Tool Calls" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: toolCalls.map((call) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-bg-surface-3 border border-border-subtle rounded-md overflow-hidden",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setExpandedId(expandedId === call.id ? null : call.id),
              className: "w-full px-3 py-2 flex items-center gap-2 hover:bg-bg-elevated cursor-pointer transition-colors",
              "aria-expanded": expandedId === call.id,
              "aria-label": `Tool call: ${call.name}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-shrink-0", children: statusIcon(call) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-left text-sm text-text-secondary", children: call.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-muted", children: statusLabel(call) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChevronDown,
                  {
                    size: 14,
                    className: `flex-shrink-0 transition-transform ${expandedId === call.id ? "rotate-180" : ""}`,
                    "aria-hidden": "true"
                  }
                )
              ]
            }
          ),
          expandedId === call.id && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 bg-bg-base border-t border-border-subtle space-y-2 text-xs", children: [
            Object.entries(call.inputs).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted font-medium mb-1", children: "Inputs:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-bg-surface-2 p-2 rounded text-text-code overflow-auto max-h-40 font-mono text-xs", children: JSON.stringify(call.inputs, null, 2) })
            ] }),
            call.output && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted font-medium mb-1", children: "Output:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-bg-surface-2 p-2 rounded text-text-code overflow-auto max-h-40 font-mono text-xs", children: call.output })
            ] }),
            call.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 font-medium mb-1", children: "Error:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-red-500/10 p-2 rounded text-red-300 overflow-auto max-h-40 font-mono text-xs", children: call.error })
            ] })
          ] })
        ]
      },
      call.id
    )) })
  ] });
}
function DiffViewer() {
  const { fileChanges, updateFileChange } = useAgentStore();
  const [expandedId, setExpandedId] = reactExports.useState(null);
  if (fileChanges.length === 0) {
    return null;
  }
  const pendingChanges = fileChanges.filter((fc2) => fc2.accepted === null);
  const acceptedChanges = fileChanges.filter((fc2) => fc2.accepted === true);
  const rejectedChanges = fileChanges.filter((fc2) => fc2.accepted === false);
  const renderChangeItem = (change) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-3 border border-border-subtle rounded-md overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 bg-bg-surface-2 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-text-muted", children: change.file }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-1 rounded ${change.type === "create" ? "bg-green-500/20 text-green-400" : change.type === "modify" ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"}`, children: change.type === "create" ? "Create" : change.type === "modify" ? "Modify" : "Delete" })
    ] }),
    change.accepted === null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 flex gap-2 bg-bg-base border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => updateFileChange(change.id, true),
          className: "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-medium rounded cursor-pointer transition-colors",
          "aria-label": "Accept change",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14, "aria-hidden": "true" }),
            "Accept"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => updateFileChange(change.id, false),
          className: "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white text-xs font-medium rounded cursor-pointer transition-colors",
          "aria-label": "Reject change",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 14, "aria-hidden": "true" }),
            "Reject"
          ]
        }
      )
    ] }),
    change.accepted !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `px-3 py-2 flex items-center gap-2 ${change.accepted ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`, children: [
      change.accepted ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14, "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 14, "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium", children: change.accepted ? "Accepted" : "Rejected" })
    ] }),
    expandedId === change.id && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "px-3 py-2 bg-bg-base border-t border-border-subtle text-text-code font-mono text-xs overflow-auto max-h-60", children: change.diff }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setExpandedId(expandedId === change.id ? null : change.id),
        className: "w-full px-3 py-2 text-xs text-text-secondary hover:text-text-primary cursor-pointer transition-colors border-t border-border-subtle",
        "aria-label": `${expandedId === change.id ? "Hide" : "Show"} diff for ${change.file}`,
        children: expandedId === change.id ? "Hide diff" : "View diff"
      }
    )
  ] }, change.id);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border-t border-border-default p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-text-primary mb-3", children: "File Changes" }),
    pendingChanges.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs text-text-secondary font-medium mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 12, "aria-hidden": "true" }),
        "Pending Review (",
        pendingChanges.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: pendingChanges.map(renderChangeItem) })
    ] }),
    acceptedChanges.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs text-green-400 font-medium mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 12, "aria-hidden": "true" }),
        "Accepted (",
        acceptedChanges.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: acceptedChanges.map(renderChangeItem) })
    ] }),
    rejectedChanges.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs text-red-400 font-medium mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 12, "aria-hidden": "true" }),
        "Rejected (",
        rejectedChanges.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: rejectedChanges.map(renderChangeItem) })
    ] })
  ] });
}
const VOICE_SERVICE_URL = "http://localhost:8000";
const HEALTH_CHECK_INTERVAL = 5e3;
const useVoiceService = () => {
  const { setServiceReady, setTranscriptionError } = useVoiceStore();
  const healthCheckIntervalRef = reactExports.useRef(null);
  const checkServiceHealth = reactExports.useCallback(async () => {
    try {
      const response = await fetch(`${VOICE_SERVICE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setServiceReady(data.asr_loaded && data.tts_loaded);
        setTranscriptionError(null);
        return true;
      } else {
        setServiceReady(false);
        return false;
      }
    } catch (error) {
      setServiceReady(false);
      setTranscriptionError("Voice service unreachable");
      return false;
    }
  }, [setServiceReady, setTranscriptionError]);
  reactExports.useEffect(() => {
    checkServiceHealth();
    healthCheckIntervalRef.current = setInterval(checkServiceHealth, HEALTH_CHECK_INTERVAL);
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [checkServiceHealth]);
  const transcribeAudio = reactExports.useCallback(
    async (audioData, language = "en") => {
      try {
        const formData = new FormData();
        formData.append("file", audioData, "audio.wav");
        formData.append("language", language);
        const response = await fetch(`${VOICE_SERVICE_URL}/transcribe`, {
          method: "POST",
          body: formData
        });
        if (response.ok) {
          const data = await response.json();
          setTranscriptionError(null);
          return data;
        } else {
          const error = await response.text();
          setTranscriptionError(`Transcription failed: ${error}`);
          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setTranscriptionError(`Transcription error: ${errorMessage}`);
        return null;
      }
    },
    [setTranscriptionError]
  );
  const synthesizeText = reactExports.useCallback(
    async (text, language = "en") => {
      try {
        const response = await fetch(`${VOICE_SERVICE_URL}/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language })
        });
        if (response.ok) {
          const data = await response.json();
          setTranscriptionError(null);
          return data;
        } else {
          const error = await response.text();
          setTranscriptionError(`Synthesis failed: ${error}`);
          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setTranscriptionError(`Synthesis error: ${errorMessage}`);
        return null;
      }
    },
    [setTranscriptionError]
  );
  const getServiceDetails = reactExports.useCallback(async () => {
    try {
      const response = await fetch(`${VOICE_SERVICE_URL}/health/detailed`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }, []);
  return {
    checkServiceHealth,
    transcribeAudio,
    synthesizeText,
    getServiceDetails
  };
};
function Waveform$1({ isRecording, audioContext, analyser, className = "" }) {
  const canvasRef = reactExports.useRef(null);
  const animationIdRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!isRecording || !canvasRef.current || !analyser) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.fillStyle = "rgb(13, 13, 13)";
      ctx.fillRect(0, 0, rect.width, rect.height);
      const barWidth = rect.width / bufferLength * 2.5;
      let x2 = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 255 * rect.height;
        const hue = (1 - dataArray[i] / 255) * 120;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x2, rect.height - barHeight, barWidth, barHeight);
        x2 += barWidth + 1;
      }
    };
    draw();
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isRecording, analyser]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      className: `w-full bg-bg-base border border-border-default rounded-md ${className}`,
      style: { minHeight: "80px" },
      "aria-label": "Audio waveform visualization"
    }
  );
}
function VoiceInput$1({ onTranscriptionComplete }) {
  const {
    isRecording,
    isProcessing,
    recordingDuration,
    settings,
    setIsRecording,
    setIsProcessing,
    setRecordingDuration,
    addTranscription,
    setCurrentTranscript
  } = useVoiceStore();
  const { transcribeAudio } = useVoiceService();
  const mediaRecorderRef = reactExports.useRef(null);
  const audioChunksRef = reactExports.useRef([]);
  const audioContextRef = reactExports.useRef(null);
  const analyserRef = reactExports.useRef(null);
  const streamRef = reactExports.useRef(null);
  const recordingIntervalRef = reactExports.useRef(null);
  const fileInputRef = reactExports.useRef(null);
  const [audioBlob, setAudioBlob] = reactExports.useState(null);
  const startRecording = reactExports.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const source = audioContextRef.current.createMediaStreamSource(stream);
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
      }
      source.connect(analyserRef.current);
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        setIsProcessing(true);
        const result = await transcribeAudio(blob, settings.language);
        if (result) {
          setCurrentTranscript(result.text);
          addTranscription({
            text: result.text,
            language: result.language,
            confidence: result.confidence,
            duration: result.duration,
            timestamp: Date.now()
          });
          onTranscriptionComplete?.(result.text);
        }
        setIsProcessing(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1e3);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [transcribeAudio, settings.language, setIsRecording, setRecordingDuration, addTranscription, setCurrentTranscript, onTranscriptionComplete]);
  const stopRecording = reactExports.useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording, setIsRecording]);
  const handleFileUpload = reactExports.useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsProcessing(true);
      const result = await transcribeAudio(file, settings.language);
      if (result) {
        setCurrentTranscript(result.text);
        addTranscription({
          text: result.text,
          language: result.language,
          confidence: result.confidence,
          duration: result.duration,
          timestamp: Date.now()
        });
        onTranscriptionComplete?.(result.text);
      }
      setIsProcessing(false);
      event.target.value = "";
    },
    [transcribeAudio, settings.language, addTranscription, setCurrentTranscript, setIsProcessing, onTranscriptionComplete]
  );
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 bg-bg-surface-2 border border-border-default rounded-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-text-primary", children: "Voice Input" }),
      isRecording && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-red-400", children: formatDuration(recordingDuration) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Waveform$1, { isRecording, audioContext: audioContextRef.current || void 0, analyser: analyserRef.current || void 0 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: isRecording ? stopRecording : startRecording,
          disabled: isProcessing,
          className: `flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors ${isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-accent-500 hover:bg-accent-400 text-text-primary"} disabled:opacity-50 disabled:cursor-not-allowed`,
          children: isProcessing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, className: "animate-spin", "aria-hidden": "true" }),
            "Processing..."
          ] }) : isRecording ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { size: 16, "aria-hidden": "true" }),
            "Stop Recording"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { size: 16, "aria-hidden": "true" }),
            "Start Recording"
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => fileInputRef.current?.click(),
          disabled: isProcessing || isRecording,
          className: "px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center gap-2 border border-border-default text-text-secondary hover:bg-bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 16, "aria-hidden": "true" }),
            "Upload"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: "audio/*",
          onChange: handleFileUpload,
          className: "hidden",
          "aria-label": "Upload audio file"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `inline-block w-2 h-2 rounded-full ${isProcessing ? "bg-yellow-400" : isRecording ? "bg-red-400 animate-pulse" : "bg-green-500"}`,
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary", children: isProcessing ? "Processing..." : isRecording ? "Recording..." : "Ready" })
    ] })
  ] });
}
function VoiceOutput$1({ text = "", onPlaybackComplete }) {
  const { settings, currentTranscript } = useVoiceStore();
  const { synthesizeText } = useVoiceService();
  const [isSynthesizing, setSynthesizing] = reactExports.useState(false);
  const [isPlaying, setIsPlaying] = reactExports.useState(false);
  const audioRef = React$2.useRef(null);
  const textToSpeak = text || currentTranscript;
  const handleSpeak = reactExports.useCallback(async () => {
    if (!textToSpeak.trim()) return;
    setSynthesizing(true);
    const result = await synthesizeText(textToSpeak, settings.language);
    if (result?.audio_url) {
      if (audioRef.current) {
        audioRef.current.src = result.audio_url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
    setSynthesizing(false);
  }, [textToSpeak, settings.language, synthesizeText]);
  const handleStop = reactExports.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);
  const handleAudioEnded = reactExports.useCallback(() => {
    setIsPlaying(false);
    onPlaybackComplete?.();
  }, [onPlaybackComplete]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 bg-bg-surface-2 border border-border-default rounded-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-text-primary", children: "Voice Output" }),
      isPlaying && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-accent-500 animate-pulse", children: "Playing..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-bg-surface-1 border border-border-subtle rounded-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-secondary break-words max-h-32 overflow-y-auto", children: textToSpeak || "—" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: isPlaying ? handleStop : handleSpeak,
        disabled: isSynthesizing || !textToSpeak.trim(),
        className: `flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors ${isPlaying ? "bg-red-500 hover:bg-red-600 text-white" : "bg-accent-500 hover:bg-accent-400 text-text-primary"} disabled:opacity-50 disabled:cursor-not-allowed`,
        children: isSynthesizing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, className: "animate-spin", "aria-hidden": "true" }),
          "Synthesizing..."
        ] }) : isPlaying ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { size: 16, "aria-hidden": "true" }),
          "Stop"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { size: 16, "aria-hidden": "true" }),
          "Speak"
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "audio",
      {
        ref: audioRef,
        onEnded: handleAudioEnded,
        onPlay: () => setIsPlaying(true),
        onPause: () => setIsPlaying(false),
        className: "hidden",
        "aria-label": "TTS audio playback"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `inline-block w-2 h-2 rounded-full ${isSynthesizing ? "bg-yellow-400" : isPlaying ? "bg-blue-400 animate-pulse" : "bg-green-500"}`,
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary", children: isSynthesizing ? "Synthesizing..." : isPlaying ? "Playing..." : textToSpeak.trim() ? "Ready" : "No text" })
    ] })
  ] });
}
function VoiceSettings$1() {
  const { settings, updateSettings } = useVoiceStore();
  const handleModelSizeChange = reactExports.useCallback(
    (value) => {
      updateSettings({ modelSize: value });
    },
    [updateSettings]
  );
  const handleLanguageChange = reactExports.useCallback(
    (value) => {
      updateSettings({ language: value });
    },
    [updateSettings]
  );
  const handleToggleSetting = reactExports.useCallback(
    (key, value) => {
      updateSettings({ [key]: value });
    },
    [updateSettings]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4 bg-bg-surface-2 border border-border-default rounded-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-text-primary", children: "Voice Settings" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-medium text-text-secondary", children: "Speech Recognition Model" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: settings.modelSize,
            onChange: (e) => handleModelSizeChange(e.target.value),
            className: "w-full appearance-none px-3 py-2 bg-bg-surface-1 border border-border-default rounded-md text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "base", children: "Base (80M) - Fast" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "small", children: "Small (140M) - Balanced" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "Medium (300M) - More Accurate" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "large", children: "Large (700M) - Most Accurate" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ChevronDown,
          {
            size: 16,
            className: "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary",
            "aria-hidden": "true"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "Larger models are slower but more accurate" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-medium text-text-secondary", children: "Language" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: settings.language,
            onChange: (e) => handleLanguageChange(e.target.value),
            className: "w-full appearance-none px-3 py-2 bg-bg-surface-1 border border-border-default rounded-md text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "English" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "es", children: "Spanish" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fr", children: "French" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "de", children: "German" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "zh", children: "Chinese" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ja", children: "Japanese" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ChevronDown,
          {
            size: 16,
            className: "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary",
            "aria-hidden": "true"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 border-t border-border-subtle pt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: settings.autoInsert,
            onChange: (e) => handleToggleSetting("autoInsert", e.target.checked),
            className: "w-4 h-4 rounded border border-border-default bg-bg-surface-1 text-accent-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-500"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Auto-insert transcription" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: settings.playTTS,
            onChange: (e) => handleToggleSetting("playTTS", e.target.checked),
            className: "w-4 h-4 rounded border border-border-default bg-bg-surface-1 text-accent-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-500"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Play text-to-speech" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: settings.recordAudio,
            onChange: (e) => handleToggleSetting("recordAudio", e.target.checked),
            className: "w-4 h-4 rounded border border-border-default bg-bg-surface-1 text-accent-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-500"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Record audio locally" })
      ] })
    ] })
  ] });
}
function TranscriptionHistory$1() {
  const { transcriptions, deleteTranscription, clearTranscriptions } = useVoiceStore();
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const filteredTranscriptions = reactExports.useMemo(() => {
    if (!searchQuery.trim()) return transcriptions;
    const query = searchQuery.toLowerCase();
    return transcriptions.filter((t2) => t2.text.toLowerCase().includes(query));
  }, [transcriptions, searchQuery]);
  const handleExport = () => {
    const dataToExport = {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      total: filteredTranscriptions.length,
      transcriptions: filteredTranscriptions.map((t2) => ({
        text: t2.text,
        language: t2.language,
        confidence: t2.confidence,
        duration: t2.duration,
        timestamp: new Date(t2.timestamp).toISOString()
      }))
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcriptions-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  const formatConfidence = (confidence) => {
    return `${Math.round(confidence * 100)}%`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 bg-bg-surface-2 border border-border-default rounded-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-text-primary", children: "Transcription History" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-text-muted", children: [
        filteredTranscriptions.length,
        " items"
      ] })
    ] }),
    transcriptions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          placeholder: "Search transcriptions...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: "w-full pl-9 pr-3 py-2 bg-bg-surface-1 border border-border-default rounded-md text-sm text-text-primary placeholder-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        }
      )
    ] }),
    transcriptions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: handleExport,
          disabled: filteredTranscriptions.length === 0,
          className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer border border-border-default text-text-secondary hover:bg-bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 16, "aria-hidden": "true" }),
            "Export"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => clearTranscriptions(),
          className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer border border-border-default text-red-400 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 16, "aria-hidden": "true" }),
            "Clear All"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-96 overflow-y-auto", children: filteredTranscriptions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-muted py-4 text-center", children: transcriptions.length === 0 ? "No transcriptions yet" : "No matches found" }) : filteredTranscriptions.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-bg-surface-1 border border-border-subtle rounded-md space-y-2 hover:border-border-default transition-colors", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-primary flex-1 break-words line-clamp-2", children: entry.text }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => deleteTranscription(entry.id),
            className: "flex-shrink-0 p-1.5 hover:bg-red-500/10 rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            "aria-label": `Delete "${entry.text}"`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14, className: "text-red-400", "aria-hidden": "true" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-text-muted space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: entry.language.toUpperCase() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Confidence: ",
          formatConfidence(entry.confidence)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          entry.duration.toFixed(1),
          "s"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-right", children: formatTime(entry.timestamp) })
      ] })
    ] }, entry.id)) })
  ] });
}
function VoicePanel$1({ onTranscriptionComplete }) {
  const [activeTab, setActiveTab] = reactExports.useState("input");
  const [isExpanded, setIsExpanded] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-1 border-b border-border-default", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "w-full px-6 py-3 flex items-center justify-between hover:bg-bg-surface-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-accent-500",
        onClick: () => setIsExpanded(!isExpanded),
        "aria-expanded": isExpanded,
        "aria-label": "Voice controls",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-text-primary", children: "Voice Controls" }),
          isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 18, "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 18, "aria-hidden": "true" })
        ]
      }
    ),
    isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-4 border-t border-border-default space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 border-b border-border-subtle overflow-x-auto", children: [
        { id: "input", label: "Input" },
        { id: "output", label: "Output" },
        { id: "settings", label: "Settings" },
        { id: "history", label: "History" }
      ].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setActiveTab(tab.id),
          className: `px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-t whitespace-nowrap ${activeTab === tab.id ? "text-accent-500 border-b-2 border-accent-500" : "text-text-secondary hover:text-text-primary"}`,
          "aria-selected": activeTab === tab.id,
          role: "tab",
          children: tab.label
        },
        tab.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "tabpanel", className: "space-y-4", children: [
        activeTab === "input" && /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceInput$1, { onTranscriptionComplete }),
        activeTab === "output" && /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceOutput$1, { onPlaybackComplete: void 0 }),
        activeTab === "settings" && /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceSettings$1, {}),
        activeTab === "history" && /* @__PURE__ */ jsxRuntimeExports.jsx(TranscriptionHistory$1, {})
      ] })
    ] })
  ] });
}
class TrainingServiceClient {
  baseUrl;
  constructor(baseUrl) {
    this.baseUrl = baseUrl || void 0 || "http://localhost:8001";
  }
  /**
   * Log a completion event with full KPI envelope (§3.2 completion events)
   */
  async logCompletionEvent(payload) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        console.error(`[Training] Failed to log event: ${response.status}`);
        return { event_id: "error", created_at: (/* @__PURE__ */ new Date()).toISOString() };
      }
      return await response.json();
    } catch (error) {
      console.error("[Training] Error logging completion event:", error);
      return { event_id: "error", created_at: (/* @__PURE__ */ new Date()).toISOString() };
    }
  }
  /**
   * Log an inference event with full KPI envelope (§3.2 inference events)
   * Fires-and-forgets — never throws, never blocks the UI.
   */
  async logInferenceEvent(payload) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, event_type: payload.event_name })
      });
      if (!response.ok) {
        console.warn(`[Telemetry] inference event ${payload.event_name} → ${response.status}`);
      }
    } catch {
    }
  }
  /**
   * Get training statistics (total events, success rate, etc.)
   */
  async getStats() {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/stats`);
      if (!response.ok) {
        console.error(`[Training] Failed to get stats: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[Training] Error fetching stats:", error);
      return null;
    }
  }
  /**
   * Get current training status (active cycle, progress, etc.)
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/status`);
      if (!response.ok) {
        console.error(`[Training] Failed to get status: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[Training] Error fetching status:", error);
      return null;
    }
  }
  /**
   * Get current deployed model version
   */
  async getVersion(modelId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/version/${modelId}`);
      if (!response.ok) {
        console.error(`[Training] Failed to get version: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[Training] Error fetching version:", error);
      return null;
    }
  }
  /**
   * Check if training service is reachable
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
let instance;
function getTrainingClient() {
  if (!instance) {
    instance = new TrainingServiceClient();
  }
  return instance;
}
function useTrainingService() {
  const client2 = getTrainingClient();
  const [isServiceAvailable, setIsServiceAvailable] = reactExports.useState(false);
  const [trainingStatus, setTrainingStatus] = reactExports.useState(null);
  const [eventCount, setEventCount] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const checkHealth = async () => {
      const available = await client2.healthCheck();
      setIsServiceAvailable(available);
      if (available) {
        const stats = await client2.getStats();
        if (stats) {
          setEventCount(stats.total_events);
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 3e4);
    return () => clearInterval(interval);
  }, [client2]);
  const logCompletion = reactExports.useCallback(
    async (payload) => {
      if (!isServiceAvailable) {
        console.warn("[Training] Service not available, skipping event");
        return { event_id: "skipped", created_at: (/* @__PURE__ */ new Date()).toISOString() };
      }
      try {
        const result = await client2.logCompletionEvent(payload);
        const stats = await client2.getStats();
        if (stats) {
          setEventCount(stats.total_events);
        }
        return result;
      } catch (error) {
        console.error("[Training] Error logging completion:", error);
        return { event_id: "error", created_at: (/* @__PURE__ */ new Date()).toISOString() };
      }
    },
    [client2, isServiceAvailable]
  );
  const logInference = reactExports.useCallback(
    async (payload) => {
      if (!isServiceAvailable) return;
      await client2.logInferenceEvent(payload);
    },
    [client2, isServiceAvailable]
  );
  const getStatus = reactExports.useCallback(async () => {
    if (!isServiceAvailable) return null;
    const status = await client2.getStatus();
    if (status) {
      setTrainingStatus(status);
    }
    return status;
  }, [client2, isServiceAvailable]);
  const getStats = reactExports.useCallback(async () => {
    if (!isServiceAvailable) return null;
    return await client2.getStats();
  }, [client2, isServiceAvailable]);
  return {
    // Methods
    logCompletion,
    logInference,
    getStatus,
    getStats,
    // State
    isServiceAvailable,
    isTraining: trainingStatus?.is_training ?? false,
    trainingStatus,
    eventCount
  };
}
const TELEMETRY_VERSION = "1.0";
function getOrCreateSessionId() {
  const KEY = "sc_session_id";
  const existing = sessionStorage.getItem(KEY);
  if (existing) return existing;
  const id2 = crypto.randomUUID();
  sessionStorage.setItem(KEY, id2);
  return id2;
}
function getInstallationIdHash() {
  const KEY = "sc_installation_id_hash";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const id2 = crypto.randomUUID();
  localStorage.setItem(KEY, id2);
  return id2;
}
function buildEnvelope(eventName, modelId, runtimeBackend = "ollama", projectIdHash = "local", correlationId) {
  return {
    event_name: eventName,
    event_version: TELEMETRY_VERSION,
    timestamp_utc: (/* @__PURE__ */ new Date()).toISOString(),
    session_id: getOrCreateSessionId(),
    installation_id_hash: getInstallationIdHash(),
    project_id_hash: projectIdHash,
    client_version: "0.8.0",
    platform: navigator.platform || "unknown",
    runtime_backend: runtimeBackend,
    model_id: modelId,
    correlation_id: correlationId ?? crypto.randomUUID()
  };
}
function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${isUser ? "justify-end" : "justify-start"} mb-4`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `max-w-[70%] rounded-lg px-4 py-3 text-sm ${isUser ? "bg-accent-500 text-text-primary" : "bg-bg-surface-2 border border-border-default text-text-primary"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap", children: message.content }),
        message.streaming && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-2 h-4 bg-accent-400 animate-pulse ml-1 align-middle", "aria-hidden": "true" })
      ]
    }
  ) });
}
function Chat() {
  const [input, setInput] = reactExports.useState("");
  const [isStreaming, setIsStreaming] = reactExports.useState(false);
  const [voicePanelExpanded, setVoicePanelExpanded] = reactExports.useState(false);
  const { messages, addMessage, appendToLast, setLastStreaming, clear } = useChatStore();
  const activeModel = useSystemStore((s) => s.activeModel);
  const { agentMode, setAgentMode, dryRun, setDryRun } = useAgentStore();
  const { isProcessing } = useVoiceStore();
  const { logCompletion: logTrainingCompletion, logInference, isServiceAvailable: isTrainingServiceAvailable } = useTrainingService();
  const bottomRef = reactExports.useRef(null);
  const lastUserPromptRef = reactExports.useRef("");
  reactExports.useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages]);
  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: text
    };
    addMessage(userMsg);
    lastUserPromptRef.current = text;
    setInput("");
    const assistantMsg = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      streaming: true
    };
    addMessage(assistantMsg);
    setIsStreaming(true);
    const model = activeModel || "llama3.1:8b";
    const apiMessages = [...messages, userMsg].map((m2) => ({ role: m2.role, content: m2.content }));
    const correlationId = crypto.randomUUID();
    const inferenceStart = performance.now();
    let firstTokenTime = null;
    let chunkCount = 0;
    let totalChars = 0;
    void logInference({
      ...buildEnvelope("inference_request_started", model, "ollama", "local", correlationId)
    });
    try {
      for await (const chunk of streamChat(model, apiMessages)) {
        if (chunkCount === 0) {
          firstTokenTime = performance.now();
          const firstTokenLatencyMs = firstTokenTime - inferenceStart;
          void logInference({
            ...buildEnvelope("inference_first_token_emitted", model, "ollama", "local", correlationId),
            first_token_latency_ms: Math.round(firstTokenLatencyMs)
          });
          const lastMessage2 = useChatStore.getState().messages.at(-1);
          if (lastMessage2 && lastUserPromptRef.current && isTrainingServiceAvailable) {
            void logTrainingCompletion({
              ...buildEnvelope("completion_suggested", model, "ollama", "local", correlationId),
              prompt: lastUserPromptRef.current,
              completion: chunk,
              event_type: "completion_suggested",
              language: "text",
              completion_type: "chat",
              accepted_boolean: void 0
              // not yet known
            });
          }
        }
        chunkCount++;
        totalChars += chunk.length;
        appendToLast(chunk);
      }
      const totalMs = performance.now() - inferenceStart;
      const estimatedTokens = Math.round(totalChars / 4);
      const tokensPerSecond = totalMs > 0 ? estimatedTokens / totalMs * 1e3 : 0;
      void logInference({
        ...buildEnvelope("inference_request_completed", model, "ollama", "local", correlationId),
        completion_tokens: estimatedTokens,
        tokens_per_second: Math.round(tokensPerSecond * 10) / 10,
        first_token_latency_ms: firstTokenTime != null ? Math.round(firstTokenTime - inferenceStart) : void 0
      });
      const lastMessage = useChatStore.getState().messages.at(-1);
      if (lastMessage && lastUserPromptRef.current && isTrainingServiceAvailable) {
        try {
          await logTrainingCompletion({
            ...buildEnvelope("completion_accepted", model, "ollama", "local", correlationId),
            prompt: lastUserPromptRef.current,
            completion: lastMessage.content,
            event_type: "completion_accepted",
            language: "text",
            completion_type: "chat",
            suggestion_length_tokens: estimatedTokens,
            accepted_boolean: true
          });
        } catch (err) {
          console.error("Failed to log training completion:", err);
        }
      }
    } catch (err) {
      void logInference({
        ...buildEnvelope("inference_request_failed", model, "ollama", "local", correlationId),
        error_message: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setLastStreaming(false);
      setIsStreaming(false);
    }
  }
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
  const modelName = activeModel || "llama3.1:8b";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-testid": "screen-chat", className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-6 py-3 border-b border-border-default bg-bg-surface-1 shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-text-primary", children: modelName }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        agentMode && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: dryRun,
              onChange: (e) => setDryRun(e.target.checked),
              "aria-label": "Dry run mode",
              className: "cursor-pointer"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-secondary", children: "Dry run" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 ${agentMode ? "bg-accent-500 text-text-primary" : "bg-bg-surface-2 text-text-secondary border border-border-default hover:bg-bg-surface-3"}`,
            onClick: () => setAgentMode(!agentMode),
            "aria-pressed": agentMode,
            "aria-label": "Toggle agent mode",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 14, "aria-hidden": "true" }),
              "Agent"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "text-xs text-text-muted hover:text-text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 rounded px-2 py-1",
            onClick: clear,
            "aria-label": "Clear chat history",
            children: "Clear"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-4", children: [
      messages.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-text-muted text-sm mt-8", children: [
        "Start a conversation with ",
        modelName
      ] }),
      messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsx(MessageBubble, { message: msg }, msg.id)),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: bottomRef })
    ] }),
    agentMode && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ToolTrace, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DiffViewer, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 px-6 py-4 border-t border-border-default bg-bg-surface-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 items-end", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          className: "flex-1 bg-bg-surface-2 border border-border-default text-text-primary text-sm rounded-lg px-4 py-3 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 placeholder:text-text-muted min-h-[44px] max-h-[160px]",
          placeholder: "Message...",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: handleKeyDown,
          rows: 1,
          "aria-label": "Chat message input",
          disabled: isStreaming || isProcessing
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary rounded-lg p-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed",
          onClick: handleSend,
          disabled: isStreaming || isProcessing || !input.trim(),
          "aria-label": "Send message",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 16, "aria-hidden": "true" })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 border-t border-border-default bg-bg-surface-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "w-full flex items-center justify-between px-6 py-3 hover:bg-bg-surface-2 transition-colors text-sm font-medium text-text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          onClick: () => setVoicePanelExpanded(!voicePanelExpanded),
          "aria-expanded": voicePanelExpanded,
          "aria-label": "Toggle voice panel",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🎤 Voice Commands" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ChevronDown,
              {
                size: 16,
                className: `transition-transform ${voicePanelExpanded ? "rotate-180" : ""}`,
                "aria-hidden": "true"
              }
            )
          ]
        }
      ),
      voicePanelExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 py-4 border-t border-border-subtle bg-bg-surface-2 max-h-96 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VoicePanel$1, {}) })
    ] })
  ] });
}
function Training() {
  const [isRunning, setIsRunning] = reactExports.useState(false);
  const [schedule, setSchedule] = reactExports.useState("auto");
  const [progress, setProgress] = reactExports.useState(48);
  const { trainingStatus, eventCount, isServiceAvailable } = useTrainingService();
  const trainingRuns = [
    {
      id: "1",
      version: "v1.4",
      sample_count: 847,
      validation_loss: 0.341,
      improvement: 3.2,
      training_time: "4h 12m",
      status: "completed",
      timestamp: "Apr 1, 02:14"
    },
    {
      id: "2",
      version: "v1.3",
      sample_count: 720,
      validation_loss: 0.368,
      improvement: 1.8,
      training_time: "3h 58m",
      status: "completed",
      timestamp: "Mar 31, 22:00"
    },
    {
      id: "3",
      version: "v1.2",
      sample_count: 650,
      validation_loss: 0.375,
      improvement: 0.4,
      training_time: "3h 45m",
      status: "rejected",
      timestamp: "Mar 31, 14:00"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-testid": "screen-training", className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-text-primary", children: "Training Console" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-muted mt-1", children: "Monitor and schedule QLoRA fine-tuning runs" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: `${isRunning ? "text-yellow-400 animate-pulse" : "text-text-muted"}`, size: 20 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-semibold ${isRunning ? "text-yellow-400" : "text-text-muted"}`, children: isRunning ? "RUNNING" : "IDLE" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-text-secondary", children: isRunning ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Iteration 23/48 · Elapsed: 02:18:34 · ETA: 04:01h" }) : "No training active" })
      ] }),
      isRunning && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-text-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Progress" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              progress,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "w-full h-3 bg-bg-surface-3 rounded-full overflow-hidden",
              role: "progressbar",
              "aria-valuenow": progress,
              "aria-valuemin": 0,
              "aria-valuemax": 100,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full bg-accent-500 transition-all duration-300",
                  style: { width: `${progress}%` }
                }
              )
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", children: "Train Loss" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-primary font-semibold", children: [
              "0.312 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-400", children: "↓" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", children: "Val Loss" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-primary font-semibold", children: [
              "0.341 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-400", children: "↓" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", children: "Learning Rate" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary font-mono", children: "1.2e-4" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2 border-t border-border-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted mb-2", children: "GPU: RTX 4090 · VRAM: 22.1/24 GB · Temp: 78°C · TDP: 310W" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setIsRunning(false),
              className: "flex items-center gap-2 px-3 py-2 text-sm rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { size: 14, "aria-hidden": "true" }),
                "Pause"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setIsRunning(false),
              className: "flex items-center gap-2 px-3 py-2 text-sm rounded border border-border-default text-red-400 hover:bg-red-500/10 cursor-pointer",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { size: 14, "aria-hidden": "true" }),
                "Stop"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex items-center gap-2 px-3 py-2 text-sm rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer", children: "View Logs" })
        ] })
      ] }),
      !isRunning && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setIsRunning(true),
          className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-400 text-text-primary rounded font-medium cursor-pointer",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 16, "aria-hidden": "true" }),
            "Start Training"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-text-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, { size: 18, "aria-hidden": "true" }),
        "Data Collection"
      ] }),
      isServiceAvailable ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted", children: "Completion Pairs" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-text-primary", children: "847" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "847 completion pairs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted", children: "Agent Trajectories" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-text-primary", children: "12" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "12 agent trajectories" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted", children: "Correction Pairs" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-text-primary", children: "203" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "203 correction pairs" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary", children: "Training service status:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1 text-text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "• Total events collected: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: eventCount })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "• Service: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-green-400", children: "✓ Running" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "• Training status: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: trainingStatus?.is_training ? "Active" : "Idle" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 border-t border-border-subtle space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", children: "Total training events:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary font-semibold", children: eventCount })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", children: "Service uptime:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary font-semibold", children: trainingStatus?.uptime_seconds ? Math.floor(trainingStatus.uptime_seconds / 3600) + "h" : "-" })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400", children: "⚠ Training service unavailable" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-secondary", children: [
          "Make sure the training service is running at ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs bg-bg-surface-3 px-2 py-1 rounded", children: "http://localhost:8001" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs mt-2", children: "See TRAINING_INTEGRATION.md for setup instructions." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-3 py-1.5 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer", children: "Clear Dataset" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-3 py-1.5 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer", children: "Preview Samples" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-3 py-1.5 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer", children: "Export Dataset" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-text-primary", children: "Schedule" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: ["manual", "auto", "scheduled"].map((mode) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "radio",
            name: "schedule",
            value: mode,
            checked: schedule === mode,
            onChange: (e) => setSchedule(e.target.value),
            className: "w-4 h-4 rounded-full"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-text-secondary", children: [
          mode === "manual" && "Manual (start manually)",
          mode === "auto" && "Auto (train when GPU idle > 10 min)",
          mode === "scheduled" && "Scheduled — Set Time..."
        ] })
      ] }, mode)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-text-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 18, "aria-hidden": "true" }),
        "Version History"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: trainingRuns.map((run) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between p-3 border border-border-subtle rounded-lg hover:bg-bg-surface-3 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-text-primary", children: run.version }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${run.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`, children: run.status === "completed" ? "✓ Submitted" : "✗ Rejected" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-text-muted", children: [
                run.sample_count,
                " samples · ",
                run.training_time,
                " training · Val loss: ",
                run.validation_loss
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-text-primary", children: [
                run.improvement > 0 ? "+" : "",
                run.improvement,
                "% HumanEval"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: run.timestamp })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 ml-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-2 py-1 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-1 cursor-pointer", children: "Load" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-2 py-1 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-1 cursor-pointer", children: "Export" })
            ] })
          ]
        },
        run.id
      )) })
    ] })
  ] });
}
function Federation() {
  const [federations, setFederations] = reactExports.useState([
    {
      id: "1",
      name: "Finance AI Consortium",
      status: "connected",
      peers: 8,
      round: 127,
      contribution: 0.42,
      lastSync: "14 min ago"
    },
    {
      id: "2",
      name: "Open Source Coder Commons",
      status: "offline",
      peers: 0,
      round: 89,
      contribution: 0.38,
      lastSync: "3 days ago"
    }
  ]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-testid": "screen-federation", className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-text-primary", children: "Federation Console" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-muted mt-1", children: "Join federations, contribute gradients, monitor peer network" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-400 text-text-primary rounded font-medium cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16, "aria-hidden": "true" }),
        "Join Federation"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-text-primary", children: "My Federations" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: federations.map((fed) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-start justify-between p-4 border border-border-subtle rounded-lg hover:bg-bg-surface-3/50 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-2 h-2 rounded-full ${fed.status === "connected" ? "bg-green-500" : "bg-text-muted"}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: fed.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${fed.status === "connected" ? "bg-green-500/20 text-green-400" : "bg-text-muted/20 text-text-muted"}`, children: fed.status === "connected" ? `Connected · ${fed.peers} peers` : "Offline — Resume" })
              ] }),
              fed.status === "connected" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-text-muted space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  "Round: ",
                  fed.round,
                  " · My contribution: ",
                  fed.contribution,
                  "% · Epsilon: 0.1"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  "Last sync: ",
                  fed.lastSync,
                  " · Bandwidth: ↑ 120 KB/s  ↓ 45 KB/s"
                ] })
              ] }),
              fed.status === "offline" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-text-muted", children: [
                "Last active: ",
                fed.lastSync
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 ml-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-2 py-1 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-1 cursor-pointer", children: "Details" }),
              fed.status === "connected" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-2 py-1 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-1 cursor-pointer", children: "Pause" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-2 py-1 text-xs rounded border border-border-default text-red-400 hover:bg-red-500/10 cursor-pointer", children: "Leave" })
              ] })
            ] })
          ]
        },
        fed.id
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-text-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 18, "aria-hidden": "true" }),
        "Privacy Status"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-400", children: "✓" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary", children: "Differential Privacy: ON (ε = 0.1, δ = 1e-5)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-400", children: "✓" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary", children: "Secure Aggregation: ON" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-400", children: "✓" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary", children: "Raw code transmitted: NONE" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-400", children: "✓" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary", children: "Gradient encryption: TLS 1.3" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-text-muted border-t border-border-subtle pt-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "What is transmitted:" }),
        " gradient updates only (encrypted)",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "What stays local:" }),
        " all code, training data, chat history"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-text-primary", children: "Network Graph" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video flex items-center justify-center bg-bg-surface-3 rounded border border-border-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-center text-text-muted text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Network, { size: 32, className: "mx-auto opacity-50", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "8 active peers in Finance AI Consortium" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", children: "Latency: 42ms" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 text-xs text-text-muted", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-text-primary font-semibold mb-1", children: "Your Node" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Org-7af3 (anonymous)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-text-primary font-semibold mb-1", children: "Aggregation" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "agg.finai.network" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-text-primary font-semibold mb-1", children: "Connected Peers" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "8 active" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-text-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 18, "aria-hidden": "true" }),
        "Contribution History"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [
        { round: 127, submitted: true, quality: 0.91, reward: 12 },
        { round: 126, submitted: true, quality: 0.88, reward: 11 },
        { round: 125, submitted: true, quality: 0.92, reward: 13 }
      ].map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-2 border border-border-subtle rounded text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-primary font-semibold", children: [
            "Round ",
            entry.round,
            ":"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted ml-2", children: entry.submitted ? "✓ Submitted" : "○ Pending" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-secondary", children: [
            "Quality: ",
            entry.quality.toFixed(2)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-green-400 text-xs", children: [
            "Reward: +",
            entry.reward
          ] })
        ] })
      ] }, entry.round)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border-subtle pt-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Your reputation:" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent-500", children: "847 points" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted mt-1", children: "Top 15% contributor" })
      ] })
    ] })
  ] });
}
function useSize(element) {
  const [size, setSize] = reactExports.useState(void 0);
  useLayoutEffect2(() => {
    if (element) {
      setSize({ width: element.offsetWidth, height: element.offsetHeight });
      const resizeObserver = new ResizeObserver((entries) => {
        if (!Array.isArray(entries)) {
          return;
        }
        if (!entries.length) {
          return;
        }
        const entry = entries[0];
        let width;
        let height;
        if ("borderBoxSize" in entry) {
          const borderSizeEntry = entry["borderBoxSize"];
          const borderSize = Array.isArray(borderSizeEntry) ? borderSizeEntry[0] : borderSizeEntry;
          width = borderSize["inlineSize"];
          height = borderSize["blockSize"];
        } else {
          width = element.offsetWidth;
          height = element.offsetHeight;
        }
        setSize({ width, height });
      });
      resizeObserver.observe(element, { box: "border-box" });
      return () => resizeObserver.unobserve(element);
    } else {
      setSize(void 0);
    }
  }, [element]);
  return size;
}
function usePrevious(value) {
  const ref = reactExports.useRef({ value, previous: value });
  return reactExports.useMemo(() => {
    if (ref.current.value !== value) {
      ref.current.previous = ref.current.value;
      ref.current.value = value;
    }
    return ref.current.previous;
  }, [value]);
}
var RADIO_NAME = "Radio";
var [createRadioContext, createRadioScope] = createContextScope(RADIO_NAME);
var [RadioProvider, useRadioContext] = createRadioContext(RADIO_NAME);
var Radio = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeRadio,
      name,
      checked = false,
      required,
      disabled,
      value = "on",
      onCheck,
      form,
      ...radioProps
    } = props;
    const [button, setButton] = reactExports.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setButton(node));
    const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
    const isFormControl = button ? form || !!button.closest("form") : true;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(RadioProvider, { scope: __scopeRadio, checked, disabled, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.button,
        {
          type: "button",
          role: "radio",
          "aria-checked": checked,
          "data-state": getState(checked),
          "data-disabled": disabled ? "" : void 0,
          disabled,
          value,
          ...radioProps,
          ref: composedRefs,
          onClick: composeEventHandlers(props.onClick, (event) => {
            if (!checked) onCheck?.();
            if (isFormControl) {
              hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
              if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
            }
          })
        }
      ),
      isFormControl && /* @__PURE__ */ jsxRuntimeExports.jsx(
        RadioBubbleInput,
        {
          control: button,
          bubbles: !hasConsumerStoppedPropagationRef.current,
          name,
          value,
          checked,
          required,
          disabled,
          form,
          style: { transform: "translateX(-100%)" }
        }
      )
    ] });
  }
);
Radio.displayName = RADIO_NAME;
var INDICATOR_NAME = "RadioIndicator";
var RadioIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeRadio, forceMount, ...indicatorProps } = props;
    const context = useRadioContext(INDICATOR_NAME, __scopeRadio);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.checked, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.span,
      {
        "data-state": getState(context.checked),
        "data-disabled": context.disabled ? "" : void 0,
        ...indicatorProps,
        ref: forwardedRef
      }
    ) });
  }
);
RadioIndicator.displayName = INDICATOR_NAME;
var BUBBLE_INPUT_NAME = "RadioBubbleInput";
var RadioBubbleInput = reactExports.forwardRef(
  ({
    __scopeRadio,
    control,
    checked,
    bubbles = true,
    ...props
  }, forwardedRef) => {
    const ref = reactExports.useRef(null);
    const composedRefs = useComposedRefs(ref, forwardedRef);
    const prevChecked = usePrevious(checked);
    const controlSize = useSize(control);
    reactExports.useEffect(() => {
      const input = ref.current;
      if (!input) return;
      const inputProto = window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(
        inputProto,
        "checked"
      );
      const setChecked = descriptor.set;
      if (prevChecked !== checked && setChecked) {
        const event = new Event("click", { bubbles });
        setChecked.call(input, checked);
        input.dispatchEvent(event);
      }
    }, [prevChecked, checked, bubbles]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.input,
      {
        type: "radio",
        "aria-hidden": true,
        defaultChecked: checked,
        ...props,
        tabIndex: -1,
        ref: composedRefs,
        style: {
          ...props.style,
          ...controlSize,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0
        }
      }
    );
  }
);
RadioBubbleInput.displayName = BUBBLE_INPUT_NAME;
function getState(checked) {
  return checked ? "checked" : "unchecked";
}
var ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
var RADIO_GROUP_NAME = "RadioGroup";
var [createRadioGroupContext] = createContextScope(RADIO_GROUP_NAME, [
  createRovingFocusGroupScope,
  createRadioScope
]);
var useRovingFocusGroupScope = createRovingFocusGroupScope();
var useRadioScope = createRadioScope();
var [RadioGroupProvider, useRadioGroupContext] = createRadioGroupContext(RADIO_GROUP_NAME);
var RadioGroup = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeRadioGroup,
      name,
      defaultValue,
      value: valueProp,
      required = false,
      disabled = false,
      orientation,
      dir,
      loop = true,
      onValueChange,
      ...groupProps
    } = props;
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeRadioGroup);
    const direction = useDirection(dir);
    const [value, setValue] = useControllableState({
      prop: valueProp,
      defaultProp: defaultValue ?? null,
      onChange: onValueChange,
      caller: RADIO_GROUP_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      RadioGroupProvider,
      {
        scope: __scopeRadioGroup,
        name,
        required,
        disabled,
        value,
        onValueChange: setValue,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Root,
          {
            asChild: true,
            ...rovingFocusGroupScope,
            orientation,
            dir: direction,
            loop,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Primitive.div,
              {
                role: "radiogroup",
                "aria-required": required,
                "aria-orientation": orientation,
                "data-disabled": disabled ? "" : void 0,
                dir: direction,
                ...groupProps,
                ref: forwardedRef
              }
            )
          }
        )
      }
    );
  }
);
RadioGroup.displayName = RADIO_GROUP_NAME;
var ITEM_NAME = "RadioGroupItem";
var RadioGroupItem = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeRadioGroup, disabled, ...itemProps } = props;
    const context = useRadioGroupContext(ITEM_NAME, __scopeRadioGroup);
    const isDisabled = context.disabled || disabled;
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeRadioGroup);
    const radioScope = useRadioScope(__scopeRadioGroup);
    const ref = reactExports.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    const checked = context.value === itemProps.value;
    const isArrowKeyPressedRef = reactExports.useRef(false);
    reactExports.useEffect(() => {
      const handleKeyDown = (event) => {
        if (ARROW_KEYS.includes(event.key)) {
          isArrowKeyPressedRef.current = true;
        }
      };
      const handleKeyUp = () => isArrowKeyPressedRef.current = false;
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
      };
    }, []);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Item,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        focusable: !isDisabled,
        active: checked,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Radio,
          {
            disabled: isDisabled,
            required: context.required,
            checked,
            ...radioScope,
            ...itemProps,
            name: context.name,
            ref: composedRefs,
            onCheck: () => context.onValueChange(itemProps.value),
            onKeyDown: composeEventHandlers((event) => {
              if (event.key === "Enter") event.preventDefault();
            }),
            onFocus: composeEventHandlers(itemProps.onFocus, () => {
              if (isArrowKeyPressedRef.current) ref.current?.click();
            })
          }
        )
      }
    );
  }
);
RadioGroupItem.displayName = ITEM_NAME;
var INDICATOR_NAME2 = "RadioGroupIndicator";
var RadioGroupIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeRadioGroup, ...indicatorProps } = props;
    const radioScope = useRadioScope(__scopeRadioGroup);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RadioIndicator, { ...radioScope, ...indicatorProps, ref: forwardedRef });
  }
);
RadioGroupIndicator.displayName = INDICATOR_NAME2;
var Root2 = RadioGroup;
var Item2 = RadioGroupItem;
const MIRROR_OPTIONS = [
  {
    id: "huggingface",
    name: "HuggingFace (Official)",
    description: "huggingface.co — default, requires VPN in China"
  },
  {
    id: "hf-mirror",
    name: "HF-Mirror (China)",
    description: "hf-mirror.com — fast access from mainland China"
  },
  {
    id: "modelscope",
    name: "ModelScope",
    description: "modelscope.cn — Alibaba open-source model hub"
  }
];
function MirrorSelector() {
  const { getMirrorInfo, getSwitchMirrorInstructions } = useModelManager();
  const [selected, setSelected] = reactExports.useState("huggingface");
  const [status, setStatus] = reactExports.useState("idle");
  reactExports.useEffect(() => {
    getMirrorInfo().then((config) => {
      if (config?.current_mirror) setSelected(config.current_mirror);
    }).catch(() => {
    });
  }, [getMirrorInfo]);
  const handleChange = async (value) => {
    if (value === selected) return;
    setStatus("switching");
    const result = await getSwitchMirrorInstructions(value);
    if (result !== null) {
      setSelected(value);
      setStatus("success");
    } else {
      setStatus("error");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-text-primary text-sm font-medium", children: "HuggingFace Mirror" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-xs mt-1", children: "Select the download mirror for HuggingFace models" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Root2,
      {
        value: selected,
        onValueChange: handleChange,
        disabled: status === "switching",
        className: "flex flex-col gap-2",
        "aria-label": "HuggingFace mirror selection",
        children: MIRROR_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Item2,
          {
            value: option.id,
            type: "button",
            "aria-label": option.name,
            className: [
              "flex items-center gap-3 p-3 rounded-md border cursor-pointer text-left w-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              "transition-colors",
              selected === option.id ? "border-accent-500 bg-accent-500/10" : "border-border-default hover:border-border-strong"
            ].join(" "),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: [
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    selected === option.id ? "border-accent-500" : "border-border-default"
                  ].join(" "),
                  "aria-hidden": "true",
                  children: selected === option.id && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-accent-500" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col text-left", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary text-sm font-medium", children: option.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary text-xs", children: option.description })
              ] })
            ]
          },
          option.id
        ))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "aria-live": "polite", "aria-atomic": "true", className: "mt-3 min-h-[1.25rem]", children: [
      status === "switching" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2 text-text-secondary text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 14, className: "animate-spin", "aria-hidden": "true" }),
        "Switching mirror..."
      ] }),
      status === "success" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-green-400 text-sm", children: "Mirror updated. Restart may be required." }),
      status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm", children: "Failed to switch mirror. Is the model manager running?" })
    ] })
  ] });
}
function Settings() {
  const [activeTab, setActiveTab] = reactExports.useState("general");
  const { theme, setTheme } = useSystemStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-testid": "screen-settings", className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-text-primary", children: "Settings" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-muted mt-1", children: "Configure Sovereign Coder preferences" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 border-b border-border-default", children: ["general", "inference", "privacy"].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setActiveTab(tab),
        className: `px-4 py-3 font-medium text-sm transition-colors ${activeTab === tab ? "text-accent-500 border-b-2 border-accent-500 -mb-1" : "text-text-secondary hover:text-text-primary"}`,
        "aria-current": activeTab === tab ? "page" : void 0,
        children: tab.charAt(0).toUpperCase() + tab.slice(1)
      },
      tab
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl space-y-8", children: [
      activeTab === "general" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: "Model Source" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MirrorSelector, {})
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: "Display" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm text-text-secondary", children: "Theme" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: theme,
                onChange: (e) => setTheme(e.target.value),
                className: "w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "dark", children: "Dark" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "light", children: "Light" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm text-text-secondary", children: "Font Size" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "12", children: "12px (Small)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "14", defaultValue: "14", children: "14px (Default)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "16", children: "16px (Large)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "18", children: "18px (Extra Large)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: "Editor Integration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 bg-bg-surface-2 border border-border-default rounded-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-primary", children: "VSCode Extension" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400", children: "Connected ✓" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Tab to accept completions" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Show ghost text suggestions" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: "Notifications" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Training complete" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Federation sync" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Model update available" })
            ] })
          ] })
        ] })
      ] }),
      activeTab === "inference" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: "Active Model" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 bg-bg-surface-2 border border-border-default rounded-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-primary", children: "Qwen2.5-Coder-32B" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-xs px-2 py-1 rounded border border-border-default text-text-secondary hover:bg-bg-surface-3", children: "Switch" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: "Backend Configuration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm text-text-secondary", children: "Backend" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ollama", children: "Ollama" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "llamacpp", children: "llama.cpp" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "vllm", children: "vLLM" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm text-text-secondary", children: "Ollama Host" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  defaultValue: "http://localhost:11434",
                  className: "flex-1 px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-3 py-2 border border-border-default rounded-md text-text-secondary hover:bg-bg-surface-3 text-sm", children: "Test" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: "Inference Parameters" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm text-text-secondary", children: "Max Context (tokens)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  defaultValue: "32768",
                  className: "w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm text-text-secondary", children: "Max Tokens (response)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  defaultValue: "2048",
                  className: "w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm text-text-secondary", children: "Temperature" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: "0",
                  max: "2",
                  step: "0.1",
                  defaultValue: "0.2",
                  className: "w-full"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-muted", children: "0.2 (focused)" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm text-text-secondary", children: "Top-P" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: "0",
                  max: "1",
                  step: "0.05",
                  defaultValue: "0.95",
                  className: "w-full"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-muted", children: "0.95 (diverse)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Stream responses" })
          ] }) })
        ] })
      ] }),
      activeTab === "privacy" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-green-500/10 border border-green-500/30 rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-green-400 mb-2", children: "Privacy Guarantees" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1 text-xs text-green-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "✓ All inference is local (no cloud calls)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "✓ No telemetry collected" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "✓ No API keys sent externally" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "✓ All data encrypted at rest" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: "Data Storage" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm text-text-secondary", children: "Chat History" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "30", children: "Retain 30 days" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "7", children: "Retain 7 days" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "unlimited", children: "Retain indefinitely" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-3 py-2 text-xs border border-border-default rounded-md text-text-secondary hover:bg-bg-surface-3", children: "Clear Chat History" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-3 py-2 text-xs border border-border-default rounded-md text-text-secondary hover:bg-bg-surface-3", children: "Clear Training Data" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-text-primary", children: "Opt-in Telemetry" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted mb-3", children: "Help improve Sovereign Coder by sharing anonymous data" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Usage analytics (no code)" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "rounded" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-secondary", children: "Crash reports (anonymized)" })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function KnowledgeCard({ snippet, onDelete }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded", children: snippet.language }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded", children: snippet.domain }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto text-text-muted text-xs", children: [
        Math.round(snippet.qualityScore * 100),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-text-primary text-sm font-mono overflow-hidden max-h-[7.5rem] leading-5 whitespace-pre-wrap break-all", children: snippet.text }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs", children: new Date(snippet.createdAt).toLocaleDateString() }),
      onDelete && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onDelete(snippet.id),
          "aria-label": "Delete snippet",
          className: "text-red-400 hover:text-red-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14, "aria-hidden": "true" })
        }
      )
    ] })
  ] });
}
function SnippetBrowser({ snippets, onDelete }) {
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [languageFilter, setLanguageFilter] = reactExports.useState("all");
  const languages = Array.from(new Set(snippets.map((s) => s.language))).sort();
  const filtered = snippets.filter((s) => {
    const matchesQuery = searchQuery === "" || s.text.toLowerCase().includes(searchQuery.toLowerCase()) || s.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = languageFilter === "all" || s.language === languageFilter;
    return matchesQuery && matchesLang;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Search,
          {
            size: 14,
            "aria-hidden": "true",
            className: "absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "Search snippets…",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "bg-bg-surface-3 border border-border-default text-text-primary placeholder-text-muted rounded-md pl-8 pr-3 py-2 text-sm w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: languageFilter,
          onChange: (e) => setLanguageFilter(e.target.value),
          className: "bg-bg-surface-3 border border-border-default text-text-primary rounded-md px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Languages" }),
            languages.map((lang) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: lang, children: lang }, lang))
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-secondary text-sm", children: [
      filtered.length,
      " snippets"
    ] }),
    filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No snippets yet. Start coding to build your knowledge base." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3", children: filtered.map((snippet) => /* @__PURE__ */ jsxRuntimeExports.jsx(KnowledgeCard, { snippet, onDelete }, snippet.id)) })
  ] });
}
function DecisionLog({ decisions }) {
  if (decisions.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No decisions logged yet." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4", children: decisions.map((decision) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "bg-bg-surface-2 border border-border-default rounded-lg p-4",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs block mb-1", children: new Date(decision.timestamp).toLocaleString() }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm mb-1 font-medium", children: decision.summary }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm mb-1", children: decision.rationale }),
        decision.outcome && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-secondary text-sm mb-2", children: [
          "Outcome: ",
          decision.outcome
        ] }),
        decision.alternatives && decision.alternatives.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: decision.alternatives.map((tag, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "bg-bg-surface-3 text-text-muted text-xs rounded px-2 py-0.5",
            children: tag
          },
          idx
        )) })
      ]
    },
    decision.id
  )) });
}
function DomainExpertise({ domains }) {
  if (domains.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No domain expertise tracked yet." });
  }
  const maxCount = Math.max(...domains.map((d) => d.count), 1);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3", children: domains.map((domain) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary text-sm", children: domain.domain }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs", children: domain.count })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-bg-surface-3 rounded-full h-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "bg-accent-500 rounded-full h-1.5 transition-all",
        style: { width: `${domain.count / maxCount * 100}%` }
      }
    ) })
  ] }, `${domain.domain}-${domain.language}`)) });
}
function MemoryEditor({ value, onChange, onSave }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-text-secondary text-sm font-medium", children: "Memory Markdown" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        value,
        onChange: (e) => onChange(e.target.value),
        className: "bg-bg-surface-3 border border-border-default text-text-primary text-sm font-mono w-full h-64 rounded-md p-3 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
        placeholder: "Write notes that will be injected into your AI context…"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs", children: "This markdown is injected into your AI context automatically." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: onSave,
          className: "bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 14, "aria-hidden": "true" }),
            "Save Memory"
          ]
        }
      )
    ] })
  ] });
}
function Knowledge() {
  const {
    snippets,
    decisions,
    domainStats,
    memoryMarkdown,
    totalItems,
    isIndexing,
    setMemoryMarkdown,
    removeSnippet
  } = useKnowledgeLibraryStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 flex flex-col gap-6 h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Knowledge Library" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-text-muted text-sm mt-1", children: [
        totalItems,
        " items",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "·" }),
        isIndexing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 14, "aria-hidden": "true", className: "animate-spin" }),
          "Indexing..."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14, "aria-hidden": "true", className: "text-green-500" }),
          "Ready"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "snippets", className: "flex flex-col gap-4 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        List,
        {
          className: "flex border-b border-border-default",
          "aria-label": "Knowledge sections",
          children: ["snippets", "decisions", "domains", "memory"].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Trigger,
            {
              value: tab,
              className: "px-4 py-2 text-sm text-text-secondary capitalize cursor-pointer\r\n                data-[state=active]:text-text-primary data-[state=active]:border-b-2\r\n                data-[state=active]:border-accent-500 -mb-px\r\n                hover:text-text-primary transition-colors\r\n                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              children: tab.charAt(0).toUpperCase() + tab.slice(1)
            },
            tab
          ))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "snippets", className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SnippetBrowser, { snippets, onDelete: removeSnippet }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "decisions", className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DecisionLog, { decisions }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "domains", className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DomainExpertise, { domains: domainStats }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "memory", className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        MemoryEditor,
        {
          value: memoryMarkdown,
          onChange: setMemoryMarkdown,
          onSave: () => {
          }
        }
      ) })
    ] })
  ] });
}
const useEnterpriseStore = create((set) => ({
  connectors: [],
  auditLog: [],
  auditChainValid: null,
  setConnectors: (connectors) => set({ connectors }),
  addConnector: (connector) => set((s) => ({ connectors: [...s.connectors, connector] })),
  removeConnector: (id2) => set((s) => ({ connectors: s.connectors.filter((c) => c.id !== id2) })),
  setAuditLog: (auditLog) => set({ auditLog }),
  setAuditChainValid: (valid) => set({ auditChainValid: valid }),
  clearConnectors: () => set({ connectors: [] })
}));
const ENTERPRISE_SERVICE_URL = "http://localhost:8004";
function useEnterpriseData() {
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const registerConnector = reactExports.useCallback(
    async (config) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );
  const listConnectors = reactExports.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  const removeConnector = reactExports.useCallback(async (id2) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors/${id2}`, { method: "DELETE" });
      return res.ok;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  const queryConnector = reactExports.useCallback(
    async (id2, params) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors/${id2}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );
  const getSchema = reactExports.useCallback(async (id2) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors/${id2}/schema`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.tables ?? [];
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  const buildContext = reactExports.useCallback(
    async (prompt, connectorIds) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${ENTERPRISE_SERVICE_URL}/context`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, connector_ids: connectorIds })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.enterprise_context;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return "";
      } finally {
        setIsLoading(false);
      }
    },
    []
  );
  const checkHealth = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${ENTERPRISE_SERVICE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }, []);
  return {
    isLoading,
    error,
    registerConnector,
    listConnectors,
    removeConnector,
    queryConnector,
    getSchema,
    buildContext,
    checkHealth
  };
}
function ConnectorCard({ connector, onRemove }) {
  const typeLabel = {
    postgres: "PostgreSQL",
    rest: "REST API",
    sap: "SAP",
    salesforce: "Salesforce"
  }[connector.type];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { size: 16, "aria-hidden": "true", className: "text-accent-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm font-medium", children: connector.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs", children: typeLabel })
      ] }),
      connector.enabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14, "aria-hidden": "true", className: "text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 14, "aria-hidden": "true", className: "text-red-400" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => onRemove(connector.id),
        "aria-label": `Remove ${connector.name} connector`,
        className: "text-text-muted hover:text-red-400 cursor-pointer",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14, "aria-hidden": "true" })
      }
    )
  ] });
}
function ConnectorList() {
  const { connectors, setConnectors, addConnector, removeConnector } = useEnterpriseStore();
  const { listConnectors, registerConnector, removeConnector: apiRemove } = useEnterpriseData();
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    name: "",
    type: "postgres",
    connectionString: "",
    baseUrl: ""
  });
  reactExports.useEffect(() => {
    listConnectors().then(setConnectors);
  }, []);
  const handleAdd = async () => {
    const result = await registerConnector({
      name: form.name,
      type: form.type,
      connectionString: form.connectionString || void 0,
      baseUrl: form.baseUrl || void 0,
      enabled: true
    });
    if (result) {
      addConnector(result);
      setDialogOpen(false);
      setForm({ name: "", type: "postgres", connectionString: "", baseUrl: "" });
    }
  };
  const handleRemove = async (id2) => {
    await apiRemove(id2);
    removeConnector(id2);
  };
  const addDialog = /* @__PURE__ */ jsxRuntimeExports.jsx(Root$1, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Portal, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Overlay, { className: "fixed inset-0 bg-black/60 z-40" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Content$1, { className: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] bg-bg-surface-2 border border-border-default rounded-lg p-6 flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Title, { className: "text-text-primary font-semibold", children: "Add Connector" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Close, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": "Close dialog", className: "text-text-muted hover:text-text-primary cursor-pointer", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16, "aria-hidden": "true" }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary text-sm", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: form.name,
              onChange: (e) => setForm((f2) => ({ ...f2, name: e.target.value })),
              className: "bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary text-sm", children: "Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: form.type,
              onChange: (e) => setForm((f2) => ({ ...f2, type: e.target.value })),
              className: "bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "postgres", children: "PostgreSQL" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "rest", children: "REST API" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sap", children: "SAP" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "salesforce", children: "Salesforce" })
              ]
            }
          )
        ] }),
        form.type === "postgres" && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary text-sm", children: "Connection String" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: form.connectionString,
              onChange: (e) => setForm((f2) => ({ ...f2, connectionString: e.target.value })),
              placeholder: "postgresql://user:pass@host:5432/db",
              className: "bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            }
          )
        ] }),
        form.type === "rest" && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary text-sm", children: "Base URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: form.baseUrl,
              onChange: (e) => setForm((f2) => ({ ...f2, baseUrl: e.target.value })),
              placeholder: "https://api.example.com/v1",
              className: "bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Close, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-2 text-sm cursor-pointer", children: "Cancel" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleAdd,
            disabled: !form.name,
            className: "bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm px-4 py-2 rounded-md cursor-pointer",
            children: "Add"
          }
        )
      ] })
    ] })
  ] }) });
  if (connectors.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-16 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { size: 48, "aria-hidden": "true", className: "text-text-muted" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No connectors registered yet." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setDialogOpen(true),
          className: "bg-accent-500 hover:bg-accent-400 text-text-primary text-sm px-4 py-2 rounded-md cursor-pointer flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16, "aria-hidden": "true" }),
            "Add Connector"
          ]
        }
      ),
      addDialog
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-secondary text-sm", children: [
        connectors.length,
        " connector",
        connectors.length !== 1 ? "s" : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setDialogOpen(true),
          className: "bg-accent-500 hover:bg-accent-400 text-text-primary text-sm px-3 py-1.5 rounded-md cursor-pointer flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14, "aria-hidden": "true" }),
            " Add Connector"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3", children: connectors.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(ConnectorCard, { connector: c, onRemove: handleRemove }, c.id)) }),
    addDialog
  ] });
}
function AuditLogTable() {
  const { auditLog, auditChainValid } = useEnterpriseStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      auditChainValid === true && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-green-500 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 14, "aria-hidden": "true" }),
        "Chain valid"
      ] }),
      auditChainValid === false && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-red-400 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 14, "aria-hidden": "true" }),
        "Chain TAMPERED"
      ] }),
      auditChainValid === null && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs", children: "Chain status unknown" })
    ] }),
    auditLog.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm py-8 text-center", children: "No audit entries yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", "aria-label": "Audit log", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border-default text-text-muted text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-2 px-3 font-medium", children: "Time" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-2 px-3 font-medium", children: "Connector" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-2 px-3 font-medium", children: "Rows" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-2 px-3 font-medium", children: "PII Masked" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: auditLog.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border-subtle hover:bg-bg-surface-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 px-3 text-text-secondary", children: new Date(entry.timestamp).toLocaleTimeString() }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 px-3 text-text-primary font-mono text-xs", children: entry.connectorId.slice(0, 8) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 px-3 text-text-secondary", children: entry.rowsReturned }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 px-3 text-text-secondary", children: entry.piiEntitiesMasked })
      ] }, entry.id)) })
    ] }) })
  ] });
}
const PII_RULES = [
  { entity: "EMAIL_ADDRESS", replacement: "[EMAIL]", example: "john@example.com → [EMAIL]" },
  { entity: "PHONE_NUMBER", replacement: "[PHONE]", example: "555-867-5309 → [PHONE]" },
  { entity: "US_SSN", replacement: "[SSN]", example: "123-45-6789 → [SSN]" },
  { entity: "CREDIT_CARD", replacement: "[CARD]", example: "4111 1111 1111 1111 → [CARD]" },
  { entity: "IP_ADDRESS", replacement: "[IP]", example: "192.168.1.1 → [IP]" },
  { entity: "PERSON", replacement: "[NAME]", example: "John Smith → [NAME]" }
];
function PIIMaskingRules() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "All data from enterprise connectors is automatically masked before entering model context." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: PII_RULES.map((rule) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-bg-surface-2 border border-border-default rounded-md p-3 flex items-center justify-between",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded", children: rule.replacement }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary text-sm", children: rule.entity })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs font-mono", children: rule.example })
        ]
      },
      rule.entity
    )) })
  ] });
}
const tabTriggerClass = "px-3 py-2 text-sm font-medium text-text-muted hover:text-text-primary cursor-pointer border-b-2 border-transparent data-[state=active]:border-accent-500 data-[state=active]:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500";
function Enterprise() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 flex flex-col gap-6 h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold text-text-primary", children: "Enterprise Data" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "connectors", className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(List, { className: "flex gap-1 border-b border-border-default", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trigger, { value: "connectors", className: tabTriggerClass, children: "Connectors" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trigger, { value: "audit", className: tabTriggerClass, children: "Audit Log" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trigger, { value: "pii", className: tabTriggerClass, children: "PII Rules" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "connectors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ConnectorList, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "audit", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuditLogTable, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "pii", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PIIMaskingRules, {}) })
    ] })
  ] });
}
const TYPE_COLORS = {
  ArchitectureDecision: "text-accent-400 bg-accent-500/10",
  Refactor: "text-blue-400 bg-blue-500/10",
  BugFix: "text-red-400 bg-red-500/10",
  FeatureAdd: "text-green-500 bg-green-500/10",
  DependencyChange: "text-yellow-400 bg-yellow-500/10"
};
function DecisionNodeCard({ node }) {
  const colorClass = TYPE_COLORS[node.type];
  const date = new Date(node.timestamp * 1e3).toLocaleDateString();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4 flex gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1 pt-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-accent-500", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px flex-1 bg-border-subtle", "aria-hidden": "true" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col gap-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded ${colorClass}`, children: node.type }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs", children: date }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs", "aria-hidden": "true", children: "·" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs font-mono", children: node.commitHash.slice(0, 7) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm font-medium truncate", children: node.summary }),
      node.rationale && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-xs", children: node.rationale }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs", children: node.author })
    ] })
  ] });
}
function DecisionTimeline({ nodes }) {
  if (nodes.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-16 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(GitBranch, { size: 48, "aria-hidden": "true", className: "text-text-muted" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: 'No decision nodes. Click "Load History" to parse git log.' })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3 overflow-y-auto", children: nodes.map((node) => /* @__PURE__ */ jsxRuntimeExports.jsx(DecisionNodeCard, { node }, node.id)) });
}
function GraphSearchBar({ value, onChange }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, "aria-hidden": "true", className: "absolute left-3 text-text-muted" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "search",
        value,
        onChange: (e) => onChange(e.target.value),
        placeholder: "Search commits: 'bug fixes', 'last 10', 'refactors in auth'...",
        "aria-label": "Search decision graph",
        className: "w-full bg-bg-surface-2 border border-border-default rounded-md pl-9 pr-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
      }
    )
  ] });
}
const useDecisionGraphStore = create((set) => ({
  nodes: [],
  filteredNodes: [],
  searchQuery: "",
  isLoading: false,
  setNodes: (nodes) => set({ nodes, filteredNodes: nodes }),
  setFilteredNodes: (filteredNodes) => set({ filteredNodes }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsLoading: (isLoading) => set({ isLoading }),
  clearGraph: () => set({ nodes: [], filteredNodes: [], searchQuery: "" })
}));
function DecisionGraph() {
  const { nodes, filteredNodes, setFilteredNodes, searchQuery, setSearchQuery } = useDecisionGraphStore();
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredNodes(nodes);
      return;
    }
    const q2 = query.toLowerCase();
    setFilteredNodes(nodes.filter(
      (n2) => n2.summary.toLowerCase().includes(q2) || n2.type.toLowerCase().includes(q2) || n2.author.toLowerCase().includes(q2)
    ));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 flex flex-col gap-6 h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(GitBranch, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold text-text-primary", children: "Decision Graph" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GraphSearchBar, { value: searchQuery, onChange: handleSearch }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DecisionTimeline, { nodes: filteredNodes })
  ] });
}
const useOrchestrationStore = create((set) => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  error: null,
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (session) => set((state) => ({
    sessions: state.sessions.map((s) => s.id === session.id ? session : s)
  })),
  setActiveSession: (id2) => set({ activeSessionId: id2 }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));
const BASE_URL$b = "http://localhost:8006";
function useOrchestration() {
  const { addSession, updateSession, setLoading, setError } = useOrchestrationStore();
  const createSession = reactExports.useCallback(async (req) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL$b}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const session = await res.json();
      addSession(session);
      return session;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [addSession, setLoading, setError]);
  const getSession = reactExports.useCallback(async (sessionId) => {
    try {
      const res = await fetch(`${BASE_URL$b}/sessions/${sessionId}`);
      if (!res.ok) return null;
      const session = await res.json();
      updateSession(session);
      return session;
    } catch {
      return null;
    }
  }, [updateSession]);
  const cancelSession = reactExports.useCallback(async (sessionId) => {
    try {
      const res = await fetch(`${BASE_URL$b}/sessions/${sessionId}`, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  }, []);
  const checkHealth = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$b}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }, []);
  return { createSession, getSession, cancelSession, checkHealth };
}
const statusColors = {
  pending: "text-text-muted",
  running: "text-accent-400",
  completed: "text-green-400",
  failed: "text-red-400",
  cancelled: "text-yellow-400"
};
function AgentCard({ session, isActive, onClick }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      onClick,
      className: `w-full text-left bg-bg-surface-2 border rounded-lg p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors ${isActive ? "border-accent-500" : "border-border-default hover:border-border-strong"}`,
      "aria-pressed": isActive,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { size: 16, "aria-hidden": "true", className: "text-text-muted shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary text-sm font-medium truncate", children: session.goal })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs font-medium ${statusColors[session.status] ?? "text-text-muted"}`, children: [
          session.status.charAt(0).toUpperCase() + session.status.slice(1),
          " · ",
          session.tasks.length,
          " tasks"
        ] })
      ]
    }
  );
}
const statusConfig = {
  pending: { icon: Clock, color: "text-text-muted", bg: "bg-bg-surface-3" },
  running: { icon: LoaderCircle, color: "text-accent-400", bg: "bg-bg-surface-3" },
  completed: { icon: CircleCheck, color: "text-green-400", bg: "bg-green-500/10" },
  failed: { icon: CircleX, color: "text-red-400", bg: "bg-red-500/10" },
  cancelled: { icon: CircleAlert, color: "text-yellow-400", bg: "bg-yellow-500/10" }
};
function TaskNode({ task }) {
  const { icon: Icon2, color, bg: bg2 } = statusConfig[task.status];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${bg2} border border-border-default rounded-lg p-4`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Icon2,
      {
        size: 18,
        className: `${color} mt-0.5 shrink-0 ${task.status === "running" ? "animate-spin" : ""}`,
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm font-medium truncate", children: task.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs mt-1 line-clamp-2", children: task.description }),
      task.result && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-xs mt-2 line-clamp-2", children: task.result }),
      task.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-xs mt-2", children: task.error })
    ] })
  ] }) });
}
function ProgressFeed({ session }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-text-secondary text-xs font-medium uppercase tracking-wide mb-3", children: [
      "Tasks (",
      session.tasks.filter((t2) => t2.status === "completed").length,
      "/",
      session.tasks.length,
      ")"
    ] }),
    session.tasks.map((task) => /* @__PURE__ */ jsxRuntimeExports.jsx(TaskNode, { task }, task.id))
  ] });
}
function Orchestration() {
  const [goal, setGoal] = reactExports.useState("");
  const [context, setContext] = reactExports.useState("");
  const { createSession } = useOrchestration();
  const { sessions, activeSessionId, setActiveSession, isLoading } = useOrchestrationStore();
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const handleCreate = async () => {
    if (!goal.trim()) return;
    const session = await createSession({ goal, context });
    if (session) {
      setActiveSession(session.id);
      setGoal("");
      setContext("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Workflow, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Multi-Agent Orchestration" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Decompose complex goals into parallel sub-agent tasks" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-72 border-r border-border-subtle flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b border-border-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: goal,
              onChange: (e) => setGoal(e.target.value),
              placeholder: "Enter a goal to orchestrate…",
              rows: 3,
              className: "w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              "aria-label": "Orchestration goal"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: context,
              onChange: (e) => setContext(e.target.value),
              placeholder: "Optional context…",
              rows: 2,
              className: "w-full mt-2 bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              "aria-label": "Orchestration context"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handleCreate,
              disabled: isLoading || !goal.trim(),
              className: "mt-3 w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-400 active:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16, "aria-hidden": "true" }),
                isLoading ? "Creating…" : "Create Session"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-2", children: sessions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm text-center py-8", children: "No sessions yet" }) : sessions.map((session) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          AgentCard,
          {
            session,
            isActive: session.id === activeSessionId,
            onClick: () => setActiveSession(session.id)
          },
          session.id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-6", children: activeSession ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-text-primary text-lg font-semibold mb-1", children: activeSession.goal }),
          activeSession.context && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: activeSession.context })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressFeed, { session: activeSession }),
        activeSession.merged_result && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-text-secondary text-xs font-medium uppercase tracking-wide mb-3", children: "Merged Result" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-text-primary text-sm whitespace-pre-wrap", children: activeSession.merged_result })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Workflow, { size: 48, "aria-hidden": "true", className: "text-text-muted mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-lg font-medium mb-2", children: "No session selected" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Create a session to decompose a goal into parallel tasks" })
      ] }) })
    ] })
  ] });
}
const useOrgIntelligenceStore = create((set) => ({
  sharedPatterns: [],
  skillGapReport: null,
  bottlenecks: [],
  searchResults: [],
  isLoading: false,
  error: null,
  setSharedPatterns: (sharedPatterns) => set({ sharedPatterns }),
  addPattern: (pattern) => set((state) => ({ sharedPatterns: [...state.sharedPatterns, pattern] })),
  setSkillGapReport: (skillGapReport) => set({ skillGapReport }),
  setBottlenecks: (bottlenecks) => set({ bottlenecks }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));
const BASE_URL$a = "http://localhost:8007";
function useOrgIntelligence() {
  const { addPattern, setSharedPatterns, setSkillGapReport, setBottlenecks, setSearchResults, setLoading, setError } = useOrgIntelligenceStore();
  const contributePattern = reactExports.useCallback(async (req) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL$a}/patterns/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const pattern = await res.json();
      addPattern(pattern);
      return pattern;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [addPattern, setLoading, setError]);
  const listPatterns = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$a}/patterns/shared`);
      if (!res.ok) return [];
      const patterns = await res.json();
      setSharedPatterns(patterns);
      return patterns;
    } catch {
      return [];
    }
  }, [setSharedPatterns]);
  const searchPatterns = reactExports.useCallback(async (query) => {
    try {
      const res = await fetch(`${BASE_URL$a}/patterns/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      if (!res.ok) return [];
      const results = await res.json();
      setSearchResults(results);
      return results;
    } catch {
      return [];
    }
  }, [setSearchResults]);
  const getSkillGaps = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$a}/analytics/skill-gaps`);
      if (!res.ok) return null;
      const report = await res.json();
      setSkillGapReport(report);
      return report;
    } catch {
      return null;
    }
  }, [setSkillGapReport]);
  const getBottlenecks = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$a}/analytics/bottlenecks`);
      if (!res.ok) return [];
      const bottlenecks = await res.json();
      setBottlenecks(bottlenecks);
      return bottlenecks;
    } catch {
      return [];
    }
  }, [setBottlenecks]);
  return { contributePattern, listPatterns, searchPatterns, getSkillGaps, getBottlenecks };
}
function PatternCard({ pattern }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs font-mono bg-bg-surface-3 px-2 py-0.5 rounded", children: pattern.language }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-text-muted text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 12, "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: pattern.contributor_count })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-text-primary text-xs font-mono overflow-x-auto whitespace-pre-wrap line-clamp-5", children: pattern.pattern_text })
  ] });
}
function SkillGapChart({ report }) {
  if (report.gaps.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "No skill gaps detected — great coverage!" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: report.gaps.map((gap) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 16, "aria-hidden": "true", className: "text-yellow-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary text-sm font-medium capitalize", children: gap.topic.replace("_", " ") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-yellow-400 text-sm font-medium", children: [
        Math.round(gap.adoption_rate * 100),
        "% adoption"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-bg-surface-3 rounded-full h-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-yellow-400 h-1.5 rounded-full", style: { width: `${gap.adoption_rate * 100}%` } }) })
  ] }, gap.topic)) });
}
const severityColors = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-text-muted"
};
function BottleneckList({ bottlenecks }) {
  if (bottlenecks.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm text-center py-8", children: "No bottlenecks detected" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: bottlenecks.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4 flex items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16, "aria-hidden": "true", className: severityColors[b.severity] ?? "text-text-muted" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm font-medium capitalize", children: b.area.replace("_", " ") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-xs", children: b.description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-medium ${severityColors[b.severity]}`, children: b.severity })
  ] }, b.area)) });
}
function ContributePatternDialog() {
  const [open, setOpen] = reactExports.useState(false);
  const [patternText, setPatternText] = reactExports.useState("");
  const [language, setLanguage] = reactExports.useState("typescript");
  const { contributePattern } = useOrgIntelligence();
  const { isLoading } = useOrgIntelligenceStore();
  const handleSubmit = async () => {
    if (!patternText.trim()) return;
    await contributePattern({
      pattern_text: patternText,
      language,
      contributor_id: "anonymous"
    });
    setPatternText("");
    setOpen(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Root$1, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Trigger$1, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "flex items-center gap-2 bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16, "aria-hidden": "true" }),
      "Contribute Pattern"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Portal, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Overlay, { className: "fixed inset-0 bg-black/60 z-50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Content$1, { className: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface-2 border border-border-default rounded-xl p-6 w-[540px] z-50 focus:outline-none", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Title, { className: "text-text-primary text-lg font-semibold", children: "Contribute Pattern" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Close, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-text-muted hover:text-text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded", "aria-label": "Close", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18, "aria-hidden": "true" }) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-text-secondary text-sm mb-2", htmlFor: "pattern-lang", children: "Language" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                id: "pattern-lang",
                value: language,
                onChange: (e) => setLanguage(e.target.value),
                className: "w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "typescript", children: "TypeScript" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "python", children: "Python" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "javascript", children: "JavaScript" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "rust", children: "Rust" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "go", children: "Go" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-text-secondary text-sm mb-2", htmlFor: "pattern-text", children: "Pattern Code" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "pattern-text",
                value: patternText,
                onChange: (e) => setPatternText(e.target.value),
                placeholder: "Paste a reusable code pattern…",
                rows: 8,
                className: "w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm font-mono placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Close, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-4 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500", children: "Cancel" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleSubmit,
              disabled: isLoading || !patternText.trim(),
              className: "bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              children: isLoading ? "Contributing…" : "Contribute"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function OrgIntelligence() {
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const { listPatterns, searchPatterns, getSkillGaps, getBottlenecks } = useOrgIntelligence();
  const { sharedPatterns, skillGapReport, bottlenecks, searchResults } = useOrgIntelligenceStore();
  reactExports.useEffect(() => {
    listPatterns();
    getSkillGaps();
    getBottlenecks();
  }, [listPatterns, getSkillGaps, getBottlenecks]);
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchPatterns(searchQuery);
    }
  };
  const displayPatterns = searchResults.length > 0 ? searchResults : sharedPatterns;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 py-5 border-b border-border-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Org Intelligence" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Share anonymized patterns and discover team insights" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ContributePatternDialog, {})
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "patterns", className: "flex flex-col flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "flex gap-1 px-6 border-b border-border-subtle bg-bg-surface-1", "aria-label": "Org intelligence tabs", children: ["patterns", "skill-gaps", "bottlenecks"].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Trigger,
        {
          value: tab,
          className: "px-4 py-3 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-500 -mb-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 capitalize",
          children: tab.replace("-", " ")
        },
        tab
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "patterns", className: "flex-1 overflow-y-auto p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, "aria-hidden": "true", className: "absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "search",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && handleSearch(),
                placeholder: "Search patterns…",
                className: "w-full bg-bg-surface-3 border border-border-default rounded-md pl-9 pr-3 py-2 text-text-primary text-sm placeholder-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                "aria-label": "Search patterns"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleSearch,
              className: "bg-accent-500 hover:bg-accent-400 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              children: "Search"
            }
          )
        ] }),
        displayPatterns.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 48, "aria-hidden": "true", className: "text-text-muted mx-auto mb-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-lg font-medium mb-2", children: "No patterns yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Contribute your first anonymized code pattern to get started" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: displayPatterns.map((pattern) => /* @__PURE__ */ jsxRuntimeExports.jsx(PatternCard, { pattern }, pattern.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "skill-gaps", className: "flex-1 overflow-y-auto p-6", children: skillGapReport ? /* @__PURE__ */ jsxRuntimeExports.jsx(SkillGapChart, { report: skillGapReport }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm text-center py-8", children: "Loading skill gaps…" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "bottlenecks", className: "flex-1 overflow-y-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BottleneckList, { bottlenecks }) })
    ] })
  ] });
}
const usePersonaCouncilStore = create((set) => ({
  reports: [],
  activeReport: null,
  isReviewing: false,
  error: null,
  addReport: (report) => set((state) => ({ reports: [report, ...state.reports] })),
  setActiveReport: (activeReport) => set({ activeReport }),
  setReviewing: (isReviewing) => set({ isReviewing }),
  setError: (error) => set({ error })
}));
const BASE_URL$9 = "http://localhost:8008";
function usePersonaCouncil() {
  const { addReport, setActiveReport, setReviewing, setError } = usePersonaCouncilStore();
  const reviewCode = reactExports.useCallback(async (req) => {
    setReviewing(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL$9}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const report = await res.json();
      addReport(report);
      setActiveReport(report);
      return report;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setReviewing(false);
    }
  }, [addReport, setActiveReport, setReviewing, setError]);
  const checkHealth = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$9}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }, []);
  return { reviewCode, checkHealth };
}
function getRiskColor(score) {
  if (score >= 7) return "text-red-400 bg-red-500/10 border-red-500/30";
  if (score >= 4) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  if (score > 0) return "text-blue-400 bg-blue-500/10 border-blue-500/30";
  return "text-green-400 bg-green-500/10 border-green-500/30";
}
function RiskScoreBadge({ score, size = "sm" }) {
  const color = getRiskColor(score);
  const label = score >= 7 ? "High" : score >= 4 ? "Medium" : score > 0 ? "Low" : "Clean";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: `inline-flex items-center gap-1 border rounded-full font-medium ${color} ${size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"}`,
      children: [
        score.toFixed(1),
        " · ",
        label
      ]
    }
  );
}
const severityConfig = {
  critical: { icon: CircleX, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  error: { icon: CircleAlert, color: "text-red-400", bg: "bg-red-500/5 border-red-500/15" },
  warning: { icon: TriangleAlert, color: "text-yellow-400", bg: "bg-yellow-500/5 border-yellow-500/20" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/15" }
};
function CritiqueList({ critiques }) {
  if (critiques.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm italic", children: "No issues found by this reviewer." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: critiques.map((item, i) => {
    const { icon: Icon2, color, bg: bg2 } = severityConfig[item.severity];
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `border rounded-lg p-3 ${bg2}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { size: 15, "aria-hidden": "true", className: `${color} mt-0.5 shrink-0` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-primary text-sm font-medium", children: [
          item.title,
          item.line_hint ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-muted font-normal ml-1 text-xs", children: [
            "(line ",
            item.line_hint,
            ")"
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-xs mt-0.5", children: item.description })
      ] })
    ] }) }, i);
  }) });
}
function PersonaCard({ review }) {
  const [expanded, setExpanded] = reactExports.useState(true);
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setExpanded((e) => !e),
        className: "w-full flex items-center justify-between p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
        "aria-expanded": expanded,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronIcon, { size: 16, "aria-hidden": "true", className: "text-text-muted shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm font-medium", children: review.persona_name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-muted text-xs", children: [
                review.critiques.length,
                " issue",
                review.critiques.length !== 1 ? "s" : ""
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(RiskScoreBadge, { score: review.risk_score })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-4 border-t border-border-subtle pt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-xs mb-3", children: review.persona_description }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CritiqueList, { critiques: review.critiques })
    ] })
  ] });
}
function ConsensusPanel({ report }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-5 mb-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-text-primary text-sm font-semibold", children: "Council Consensus" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RiskScoreBadge, { score: report.risk_score.overall, size: "lg" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm mb-4", children: report.consensus_summary }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: Object.entries(report.risk_score.breakdown).map(([name, score]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center justify-between bg-bg-surface-3 rounded-md px-3 py-2",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs truncate", children: name.split(" ")[0] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(RiskScoreBadge, { score })
        ]
      },
      name
    )) })
  ] });
}
const LANGUAGES = ["python", "typescript", "javascript", "rust", "go", "java", "cpp"];
function PersonaCouncil() {
  const [code, setCode] = reactExports.useState("");
  const [language, setLanguage] = reactExports.useState("python");
  const [context, setContext] = reactExports.useState("");
  const { reviewCode } = usePersonaCouncil();
  const { activeReport, isReviewing, error } = usePersonaCouncilStore();
  const handleReview = async () => {
    if (!code.trim()) return;
    await reviewCode({ code, language, context });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Adversarial Persona Council" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "4 expert reviewers stress-test your code before you commit" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-1/2 border-r border-border-subtle flex flex-col p-6 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "council-lang", className: "text-text-secondary text-sm shrink-0", children: "Language:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              id: "council-lang",
              value: language,
              onChange: (e) => setLanguage(e.target.value),
              className: "bg-bg-surface-3 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer",
              children: LANGUAGES.map((l2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: l2, children: l2 }, l2))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: code,
            onChange: (e) => setCode(e.target.value),
            placeholder: "Paste code to review…",
            className: "flex-1 bg-bg-surface-3 border border-border-default rounded-md p-3 text-text-primary text-sm font-mono placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "Code to review"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: context,
            onChange: (e) => setContext(e.target.value),
            placeholder: "Optional context (e.g., 'this handles user auth')…",
            rows: 3,
            className: "bg-bg-surface-3 border border-border-default rounded-md p-3 text-text-primary text-sm placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "Optional context"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleReview,
            disabled: isReviewing || !code.trim(),
            className: "flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-400 active:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary text-sm font-medium px-4 py-2.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 16, "aria-hidden": "true" }),
              isReviewing ? "Reviewing…" : "Review with Council"
            ]
          }
        ),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "text-red-400 text-sm", children: error })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1/2 overflow-y-auto p-6", children: activeReport ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ConsensusPanel, { report: activeReport }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: activeReport.reviews.map((review) => /* @__PURE__ */ jsxRuntimeExports.jsx(PersonaCard, { review }, review.persona_name)) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 48, "aria-hidden": "true", className: "text-text-muted mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-lg font-medium mb-2", children: "No review yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Paste code on the left and click Review to get critiques from 4 expert personas" })
      ] }) })
    ] })
  ] });
}
const useAnalyticsStore = create((set) => ({
  report: null,
  isLoading: false,
  error: null,
  setReport: (report) => set({ report }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));
const BASE_URL$8 = "http://localhost:8009";
function useAnalytics() {
  const { setReport, setLoading, setError } = useAnalyticsStore();
  const ingestEvent = reactExports.useCallback(async (event) => {
    try {
      const res = await fetch(`${BASE_URL$8}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);
  const fetchReport = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, qualRes, roiRes] = await Promise.all([
        fetch(`${BASE_URL$8}/metrics/productivity`),
        fetch(`${BASE_URL$8}/metrics/quality-trends`),
        fetch(`${BASE_URL$8}/metrics/training-roi`)
      ]);
      if (!prodRes.ok || !qualRes.ok || !roiRes.ok) throw new Error("Failed to fetch metrics");
      const [productivity, quality_trends, training_roi] = await Promise.all([
        prodRes.json(),
        qualRes.json(),
        roiRes.json()
      ]);
      const report = {
        generated_at: Date.now() / 1e3,
        total_events: 0,
        productivity,
        quality_trends,
        training_roi
      };
      setReport(report);
      return report;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [setReport, setLoading, setError]);
  const exportReport = reactExports.useCallback(async (format = "json") => {
    try {
      const res = await fetch(`${BASE_URL$8}/reports/export?format=${format}`);
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }, []);
  return { ingestEvent, fetchReport, exportReport };
}
function MetricCard({ label, value, subtext, accent }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `bg-bg-surface-2 border rounded-lg p-5 ${accent ? "border-accent-500/40" : "border-border-default"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs font-medium uppercase tracking-wide mb-2", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-2xl font-bold ${accent ? "text-accent-400" : "text-text-primary"}`, children: value }),
    subtext && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-xs mt-1", children: subtext })
  ] });
}
function TrendChart({ trends }) {
  if (trends.length === 0 || trends.every((t2) => t2.avg_quality_score === 0)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 flex items-center justify-center bg-bg-surface-2 border border-border-default rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No quality data yet" }) });
  }
  const max = Math.max(...trends.map((t2) => t2.avg_quality_score), 1);
  const width = 600;
  const height = 120;
  const padding = 20;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const points = trends.map((t2, i) => {
    const x2 = padding + i / Math.max(trends.length - 1, 1) * plotWidth;
    const y2 = padding + plotHeight - t2.avg_quality_score / max * plotHeight;
    return `${x2},${y2}`;
  }).join(" ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-text-secondary text-xs font-medium uppercase tracking-wide mb-3", children: "Quality Score Trend" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: `0 0 ${width} ${height}`, className: "w-full", "aria-label": "Quality trend chart", role: "img", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points, fill: "none", stroke: "#8B5CF6", strokeWidth: "2" }),
      trends.map((t2, i) => {
        const x2 = padding + i / Math.max(trends.length - 1, 1) * plotWidth;
        const y2 = padding + plotHeight - t2.avg_quality_score / max * plotHeight;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: x2, cy: y2, r: "3", fill: "#8B5CF6" }, i);
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between mt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs", children: trends[0]?.date_label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs", children: trends[trends.length - 1]?.date_label })
    ] })
  ] });
}
function ROITable({ roi }) {
  const rows = [
    { label: "Total Training Runs", value: roi.total_training_runs.toString() },
    { label: "Avg Quality Improvement", value: `${roi.avg_improvement_pct.toFixed(1)}%` },
    { label: "Estimated Time Saved", value: `${roi.time_saved_hours.toFixed(1)}h` },
    { label: "ROI Multiplier", value: `${roi.estimated_roi_multiplier.toFixed(1)}x` }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("caption", { className: "sr-only", children: "Training ROI metrics" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map(({ label, value }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border-subtle last:border-b-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-text-secondary text-sm", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-text-primary text-sm font-medium text-right", children: value })
    ] }, label)) })
  ] }) });
}
function ExportPanel() {
  const [format, setFormat] = reactExports.useState("json");
  const { exportReport } = useAnalytics();
  const handleExport = async () => {
    const data = await exportReport(format);
    if (!data) return;
    const blob = new Blob([data], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-text-primary text-sm font-semibold mb-4", children: "Export Report" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-4 mb-4", children: ["json", "csv"].map((f2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "radio",
          name: "export-format",
          value: f2,
          checked: format === f2,
          onChange: () => setFormat(f2),
          className: "accent-accent-500"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary text-sm uppercase", children: f2 })
    ] }, f2)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: handleExport,
        className: "flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
        "aria-label": `Export analytics report as ${format.toUpperCase()}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 16, "aria-hidden": "true" }),
          "Export as ",
          format.toUpperCase()
        ]
      }
    )
  ] });
}
function Analytics() {
  const { fetchReport } = useAnalytics();
  const { report, isLoading, error } = useAnalyticsStore();
  reactExports.useEffect(() => {
    fetchReport();
  }, [fetchReport]);
  const prod = report?.productivity;
  const roi = report?.training_roi;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 py-5 border-b border-border-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart2, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Analytics" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Local productivity metrics, quality trends, and training ROI" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => fetchReport(),
          disabled: isLoading,
          className: "flex items-center gap-2 border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50",
          "aria-label": "Refresh analytics",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, "aria-hidden": "true", className: isLoading ? "animate-spin" : "" }),
            "Refresh"
          ]
        }
      )
    ] }) }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "alert", className: "mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm", children: error }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "productivity", className: "flex flex-col flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "flex gap-1 px-6 border-b border-border-subtle bg-bg-surface-1", "aria-label": "Analytics tabs", children: ["productivity", "quality", "roi", "export"].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Trigger,
        {
          value: tab,
          className: "px-4 py-3 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-500 -mb-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 capitalize",
          children: tab === "roi" ? "Training ROI" : tab
        },
        tab
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "productivity", className: "flex-1 overflow-y-auto p-6", children: prod ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Total Sessions", value: prod.total_sessions }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Total Tokens", value: prod.total_tokens.toLocaleString() }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Avg Tokens / Session", value: prod.avg_tokens_per_session.toFixed(0) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Acceptance Rate", value: `${(prod.acceptance_rate * 100).toFixed(0)}%`, accent: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Code Reviews", value: prod.total_code_reviews }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(MetricCard, { label: "Training Runs", value: prod.total_training_runs })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: isLoading ? "Loading metrics…" : "No data yet" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "quality", className: "flex-1 overflow-y-auto p-6", children: report?.quality_trends ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendChart, { trends: report.quality_trends }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: isLoading ? "Loading trends…" : "No trend data" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "roi", className: "flex-1 overflow-y-auto p-6", children: roi ? /* @__PURE__ */ jsxRuntimeExports.jsx(ROITable, { roi }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: isLoading ? "Loading ROI…" : "No ROI data" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "export", className: "flex-1 overflow-y-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExportPanel, {}) })
    ] })
  ] });
}
const useMessagingStore = create((set) => ({
  platforms: [],
  messageLog: [],
  isLoading: false,
  error: null,
  setPlatforms: (platforms) => set({ platforms }),
  addLogEntry: (entry) => set((state) => ({ messageLog: [entry, ...state.messageLog].slice(0, 100) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));
const BASE_URL$7 = "http://localhost:8010";
function useMessaging() {
  const { setPlatforms, setLoading, setError, addLogEntry } = useMessagingStore();
  const configurePlatform = reactExports.useCallback(
    async (config) => {
      try {
        const res = await fetch(`${BASE_URL$7}/platforms/configure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config)
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );
  const listPlatforms = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL$7}/platforms`);
      if (!res.ok) throw new Error("Failed to fetch platforms");
      const data = await res.json();
      const withStatus = data.map((p2) => ({
        ...p2,
        connected: !!(p2.bot_token || p2.webhook_url)
      }));
      setPlatforms(withStatus);
      return withStatus;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return [];
    } finally {
      setLoading(false);
    }
  }, [setPlatforms, setLoading, setError]);
  const removePlatform = reactExports.useCallback(async (platform) => {
    try {
      const res = await fetch(`${BASE_URL$7}/platforms/${platform}`, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  }, []);
  const fetchMessageLog = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$7}/messages/log`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }, []);
  const checkHealth = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$7}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }, []);
  return { configurePlatform, listPlatforms, removePlatform, fetchMessageLog, checkHealth };
}
const IM_PLATFORM_LABELS = {
  telegram: "Telegram",
  slack: "Slack",
  discord: "Discord",
  feishu: "Feishu / Lark",
  dingtalk: "DingTalk",
  wechat_work: "WeChat Work",
  whatsapp: "WhatsApp Business",
  line: "LINE"
};
const AVAILABLE_COMMANDS = [
  { name: "status", description: "Get system status", usage: "status" },
  { name: "models", description: "List installed models", usage: "models" },
  { name: "metrics", description: "Get productivity metrics", usage: "metrics" },
  { name: "health", description: "Check all services health", usage: "health" },
  { name: "chat", description: "Chat with AI", usage: "chat <message>" },
  { name: "help", description: "Show available commands", usage: "help" }
];
function PlatformCard({ platform, onRemove, onConfigure }) {
  const label = IM_PLATFORM_LABELS[platform.platform] ?? platform.platform;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      platform.connected ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 16, "aria-hidden": "true", className: "text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 16, "aria-hidden": "true", className: "text-text-muted" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm font-medium", children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-muted text-xs", children: [
          platform.connected ? "Connected" : "Not configured",
          platform.allowed_user_ids.length > 0 && ` · ${platform.allowed_user_ids.length} authorized user(s)`
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onConfigure(platform.platform),
          className: "p-2 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          "aria-label": `Configure ${label}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings$1, { size: 14, "aria-hidden": "true" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onRemove(platform.platform),
          className: "p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          "aria-label": `Remove ${label}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14, "aria-hidden": "true" })
        }
      )
    ] })
  ] });
}
function PlatformConfigDialog({
  open,
  platform,
  onClose,
  onSaved
}) {
  const [botToken, setBotToken] = reactExports.useState("");
  const [webhookUrl, setWebhookUrl] = reactExports.useState("");
  const [allowedIds, setAllowedIds] = reactExports.useState("");
  const { configurePlatform } = useMessaging();
  const label = platform ? IM_PLATFORM_LABELS[platform] ?? platform : "";
  const handleSave = async () => {
    if (!platform) return;
    const config = {
      platform,
      bot_token: botToken || void 0,
      webhook_url: webhookUrl || void 0,
      allowed_user_ids: allowedIds.split(",").map((id2) => id2.trim()).filter(Boolean),
      enabled: true
    };
    const ok2 = await configurePlatform(config);
    if (ok2) {
      onSaved();
      onClose();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root$1, { open, onOpenChange: (v2) => {
    if (!v2) onClose();
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Portal, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Overlay, { className: "fixed inset-0 bg-black/60 z-40" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Content$1,
      {
        className: "fixed inset-0 flex items-center justify-center z-50 p-4",
        "aria-labelledby": "config-dialog-title",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-xl w-full max-w-md p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Title,
              {
                id: "config-dialog-title",
                className: "text-text-primary text-lg font-semibold",
                children: [
                  "Configure ",
                  label
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Close, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: onClose,
                className: "p-1 text-text-muted hover:text-text-primary rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                "aria-label": "Close dialog",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16, "aria-hidden": "true" })
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "bot-token",
                  className: "block text-text-secondary text-xs font-medium mb-1",
                  children: "Bot Token (optional)"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "bot-token",
                  type: "password",
                  value: botToken,
                  onChange: (e) => setBotToken(e.target.value),
                  placeholder: "Enter bot token…",
                  className: "w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "webhook-url",
                  className: "block text-text-secondary text-xs font-medium mb-1",
                  children: "Outbound Webhook URL (optional)"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "webhook-url",
                  type: "url",
                  value: webhookUrl,
                  onChange: (e) => setWebhookUrl(e.target.value),
                  placeholder: "https://…",
                  className: "w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "allowed-ids",
                  className: "block text-text-secondary text-xs font-medium mb-1",
                  children: "Authorized User IDs (comma-separated, leave blank for open access)"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "allowed-ids",
                  type: "text",
                  value: allowedIds,
                  onChange: (e) => setAllowedIds(e.target.value),
                  placeholder: "user123, user456",
                  className: "w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: onClose,
                className: "border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-4 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleSave,
                className: "bg-accent-500 hover:bg-accent-400 text-text-primary rounded-md px-4 py-2 text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                children: "Save"
              }
            )
          ] })
        ] })
      }
    )
  ] }) });
}
function MessageLog({ entries }) {
  if (entries.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-32 gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 24, "aria-hidden": "true", className: "text-text-muted" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No messages yet" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", role: "log", "aria-label": "Message history", children: entries.map((entry, idx) => {
    const platformLabel = IM_PLATFORM_LABELS[entry.platform] ?? entry.platform;
    const date = new Date(entry.timestamp * 1e3);
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-subtle rounded-lg p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-muted", children: timeStr }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-bg-surface-3 text-text-secondary px-2 py-0.5 rounded-full", children: platformLabel }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-text-muted", children: [
          "from ",
          entry.sender_id
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-accent-400 text-xs bg-bg-surface-3 px-2 py-1 rounded flex-shrink-0", children: entry.command }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 12, "aria-hidden": "true", className: "text-text-muted mt-1 flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-secondary text-xs", children: [
          entry.response.slice(0, 120),
          entry.response.length > 120 ? "…" : ""
        ] })
      ] })
    ] }, idx);
  }) });
}
function CommandReference() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-text-primary text-sm font-semibold", children: "Available Commands" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs mt-0.5", children: "Send these commands from your IM platform" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", "aria-label": "Available IM commands", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-bg-surface-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left text-text-muted text-xs font-medium uppercase tracking-wide", children: "Command" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left text-text-muted text-xs font-medium uppercase tracking-wide", children: "Usage" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left text-text-muted text-xs font-medium uppercase tracking-wide", children: "Description" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: AVAILABLE_COMMANDS.map((cmd) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border-subtle", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-accent-400 text-xs", children: cmd.name }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-text-secondary text-xs", children: cmd.usage }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2 text-text-secondary text-sm", children: cmd.description })
      ] }, cmd.name)) })
    ] })
  ] });
}
const ALL_PLATFORMS = [
  "telegram",
  "slack",
  "discord",
  "feishu",
  "dingtalk",
  "wechat_work",
  "whatsapp",
  "line"
];
function Messaging() {
  const { listPlatforms, removePlatform, fetchMessageLog } = useMessaging();
  const { platforms, messageLog, isLoading } = useMessagingStore();
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [selectedPlatform, setSelectedPlatform] = reactExports.useState(null);
  reactExports.useEffect(() => {
    listPlatforms();
    fetchMessageLog().then((entries) => {
      const { addLogEntry } = useMessagingStore.getState();
      entries.forEach((e) => addLogEntry(e));
    });
  }, [listPlatforms, fetchMessageLog]);
  const handleConfigurePlatform = (platform) => {
    setSelectedPlatform(platform);
    setDialogOpen(true);
  };
  const handleRemovePlatform = async (platform) => {
    await removePlatform(platform);
    listPlatforms();
  };
  const webhookBase = "http://localhost:8010/webhooks";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 py-5 border-b border-border-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "IM Bridge" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Monitor and remote-control Sovereign Code via Telegram, Slack, Discord and more" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => listPlatforms(),
            disabled: isLoading,
            className: "flex items-center gap-2 border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50",
            "aria-label": "Refresh platform list",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                RefreshCw,
                {
                  size: 14,
                  "aria-hidden": "true",
                  className: isLoading ? "animate-spin" : ""
                }
              ),
              "Refresh"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              setSelectedPlatform("telegram");
              setDialogOpen(true);
            },
            className: "flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14, "aria-hidden": "true" }),
              "Add Platform"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "platforms", className: "flex flex-col flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        List,
        {
          className: "flex gap-1 px-6 border-b border-border-subtle bg-bg-surface-1",
          "aria-label": "IM Bridge tabs",
          children: [
            { value: "platforms", label: "Platforms" },
            { value: "log", label: "Message Log" },
            { value: "commands", label: "Commands" },
            { value: "setup", label: "Setup Guide" }
          ].map(({ value, label }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Trigger,
            {
              value,
              className: "px-4 py-3 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-500 -mb-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              children: label
            },
            value
          ))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "platforms", className: "flex-1 overflow-y-auto p-6", children: platforms.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-48 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 36, "aria-hidden": "true", className: "text-text-muted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No platforms configured" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setSelectedPlatform("telegram");
              setDialogOpen(true);
            },
            className: "text-accent-400 text-sm hover:underline cursor-pointer",
            children: "Add your first platform"
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: platforms.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        PlatformCard,
        {
          platform: p2,
          onRemove: handleRemovePlatform,
          onConfigure: handleConfigurePlatform
        },
        p2.platform
      )) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "log", className: "flex-1 overflow-y-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageLog, { entries: messageLog }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "commands", className: "flex-1 overflow-y-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CommandReference, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "setup", className: "flex-1 overflow-y-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-5 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-text-primary text-sm font-semibold", children: "Setup Instructions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-secondary text-sm", children: [
          "This service runs locally at",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-accent-400", children: "http://localhost:8010" }),
          ". Configure your IM bot to send webhook events to:"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-bg-surface-3 rounded-md p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("code", { className: "text-text-code text-sm", children: [
          webhookBase,
          "/{platform}"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2 text-text-secondary text-sm list-disc list-inside", children: ALL_PLATFORMS.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary font-medium", children: p2 }),
          " — ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("code", { className: "text-accent-400 text-xs", children: [
            webhookBase,
            "/",
            p2
          ] })
        ] }, p2)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs", children: "For ngrok or public tunneling: expose port 8010 and update your bot webhook URL accordingly." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PlatformConfigDialog,
      {
        open: dialogOpen,
        platform: selectedPlatform,
        onClose: () => setDialogOpen(false),
        onSaved: () => listPlatforms()
      }
    )
  ] });
}
const useSemanticSearchStore = create((set) => ({
  results: [],
  indexStatus: null,
  isSearching: false,
  isIndexing: false,
  error: null,
  query: "",
  setResults: (results) => set({ results }),
  setIndexStatus: (indexStatus) => set({ indexStatus }),
  setSearching: (isSearching) => set({ isSearching }),
  setIndexing: (isIndexing) => set({ isIndexing }),
  setError: (error) => set({ error }),
  setQuery: (query) => set({ query })
}));
const BASE_URL$6 = "http://localhost:8011";
function useSemanticSearch() {
  const { setResults, setIndexStatus, setSearching, setIndexing, setError } = useSemanticSearchStore();
  const search = reactExports.useCallback(async (query, topK = 5) => {
    if (!query.trim()) return [];
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL$6}/search?q=${encodeURIComponent(query)}&top_k=${topK}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search error");
      return [];
    } finally {
      setSearching(false);
    }
  }, [setResults, setSearching, setError]);
  const indexContent = reactExports.useCallback(async (req) => {
    setIndexing(true);
    try {
      const res = await fetch(`${BASE_URL$6}/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req)
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setIndexing(false);
    }
  }, [setIndexing]);
  const clearIndex = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$6}/index`, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  }, []);
  const fetchStatus = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$6}/index/status`);
      if (!res.ok) return null;
      const data = await res.json();
      setIndexStatus(data);
      return data;
    } catch {
      return null;
    }
  }, [setIndexStatus]);
  return { search, indexContent, clearIndex, fetchStatus };
}
function SearchResultCard({ result, rank }) {
  const scorePercent = Math.round(Math.max(0, result.score) * 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-muted text-xs font-mono", children: [
          "#",
          rank
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileCode, { size: 14, "aria-hidden": "true", className: "text-accent-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary text-sm font-medium truncate max-w-xs", children: result.file_path }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-muted text-xs", children: [
          "L",
          result.start_line,
          "–",
          result.end_line
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-muted bg-bg-surface-3 px-2 py-0.5 rounded-full", children: result.language }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full ${scorePercent >= 70 ? "text-green-500 bg-green-500/10" : scorePercent >= 40 ? "text-yellow-400 bg-yellow-400/10" : "text-text-muted bg-bg-surface-3"}`, children: [
          scorePercent,
          "% match"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("pre", { className: "text-text-code text-xs bg-bg-surface-3 rounded-md p-3 overflow-x-auto max-h-24", children: [
      result.chunk_text.slice(0, 300),
      result.chunk_text.length > 300 ? "…" : ""
    ] })
  ] });
}
function IndexStatusBadge({ status }) {
  if (!status) return null;
  const color = status.status === "ready" ? "text-green-500" : status.status === "indexing" ? "text-yellow-400" : "text-text-muted";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { size: 12, "aria-hidden": "true", className: color }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: color, children: [
      status.total_chunks,
      " chunks"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", children: "·" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-muted", children: [
      status.indexed_files,
      " files"
    ] })
  ] });
}
function EmptySearchState() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-64 gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 40, "aria-hidden": "true", className: "text-text-muted" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "Search your codebase by meaning" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs max-w-sm text-center", children: 'Index your code files, then type a natural language query like "function that handles authentication"' })
  ] });
}
function SemanticSearch() {
  const { search, clearIndex, fetchStatus } = useSemanticSearch();
  const { results, indexStatus, isSearching, query, setQuery } = useSemanticSearchStore();
  const [hasSearched, setHasSearched] = reactExports.useState(false);
  const inputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);
  const handleSearch = reactExports.useCallback(async () => {
    if (!query.trim()) return;
    setHasSearched(true);
    await search(query);
  }, [query, search]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };
  const handleClear = async () => {
    await clearIndex();
    await fetchStatus();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Code Search" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(IndexStatusBadge, { status: indexStatus }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => fetchStatus(),
              className: "p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              "aria-label": "Refresh index status",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, "aria-hidden": "true" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleClear,
              className: "p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              "aria-label": "Clear search index",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14, "aria-hidden": "true" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm mb-4", children: "Search your codebase semantically — by meaning, not just keywords" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, "aria-hidden": "true", className: "absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: inputRef,
              type: "search",
              value: query,
              onChange: (e) => setQuery(e.target.value),
              onKeyDown: handleKeyDown,
              placeholder: "Search by intent, e.g. 'authentication middleware' …",
              className: "w-full bg-bg-surface-2 border border-border-default rounded-lg pl-9 pr-4 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500",
              "aria-label": "Semantic search query"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleSearch,
            disabled: isSearching || !query.trim(),
            className: "flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            children: [
              isSearching ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, "aria-hidden": "true" }),
              isSearching ? "Searching…" : "Search"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-6", children: !hasSearched ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptySearchState, {}) : results.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-muted text-sm", children: [
      'No results found for "',
      query,
      '"'
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-muted text-xs mb-3", children: [
        results.length,
        ' result(s) for "',
        query,
        '"'
      ] }),
      results.map((r2, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SearchResultCard, { result: r2, rank: i + 1 }, `${r2.file_path}-${r2.start_line}`))
    ] }) })
  ] });
}
const usePluginStore = create((set) => ({
  plugins: [],
  isLoading: false,
  error: null,
  setPlugins: (plugins) => set({ plugins }),
  addPlugin: (plugin) => set((state) => ({ plugins: [...state.plugins, plugin] })),
  removePlugin: (id2) => set((state) => ({ plugins: state.plugins.filter((p2) => p2.id !== id2) })),
  setEnabled: (id2, enabled) => set((state) => ({
    plugins: state.plugins.map((p2) => p2.id === id2 ? { ...p2, enabled } : p2)
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));
const BASE_URL$5 = "http://localhost:8012";
function usePluginSystem() {
  const { setPlugins, addPlugin, removePlugin, setEnabled, setLoading, setError } = usePluginStore();
  const fetchPlugins = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL$5}/plugins`);
      if (!res.ok) throw new Error("Failed to fetch plugins");
      const data = await res.json();
      setPlugins(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      return [];
    } finally {
      setLoading(false);
    }
  }, [setPlugins, setLoading, setError]);
  const registerPlugin = reactExports.useCallback(async (manifest) => {
    try {
      const res = await fetch(`${BASE_URL$5}/plugins/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest)
      });
      if (res.ok) addPlugin(manifest);
      return res.ok;
    } catch {
      return false;
    }
  }, [addPlugin]);
  const unregisterPlugin = reactExports.useCallback(async (id2) => {
    try {
      const res = await fetch(`${BASE_URL$5}/plugins/${id2}`, { method: "DELETE" });
      if (res.ok) removePlugin(id2);
      return res.ok;
    } catch {
      return false;
    }
  }, [removePlugin]);
  const togglePlugin = reactExports.useCallback(async (id2, enabled) => {
    const endpoint = enabled ? "enable" : "disable";
    try {
      const res = await fetch(`${BASE_URL$5}/plugins/${id2}/${endpoint}`, { method: "PUT" });
      if (res.ok) setEnabled(id2, enabled);
      return res.ok;
    } catch {
      return false;
    }
  }, [setEnabled]);
  const dispatchHook = reactExports.useCallback(async (event) => {
    try {
      const res = await fetch(`${BASE_URL$5}/hooks/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.handled_by ?? [];
    } catch {
      return [];
    }
  }, []);
  return { fetchPlugins, registerPlugin, unregisterPlugin, togglePlugin, dispatchHook };
}
function PluginCard({ plugin, onToggle, onRemove }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { size: 20, "aria-hidden": "true", className: "text-accent-400 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary text-sm font-semibold", children: plugin.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs bg-bg-surface-3 px-1.5 py-0.5 rounded", children: plugin.version })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-xs mb-2", children: plugin.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 flex-wrap", children: plugin.hooks.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-xs text-accent-400 bg-accent-500/10 px-1.5 py-0.5 rounded", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { size: 10, "aria-hidden": "true" }),
          h
        ] }, h)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-muted text-xs mt-1", children: [
          "by ",
          plugin.author
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onToggle(plugin.id, !plugin.enabled),
          className: "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded",
          "aria-label": plugin.enabled ? `Disable ${plugin.name}` : `Enable ${plugin.name}`,
          children: plugin.enabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleRight, { size: 22, "aria-hidden": "true", className: "text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleLeft, { size: 22, "aria-hidden": "true", className: "text-text-muted" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onRemove(plugin.id),
          className: "p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          "aria-label": `Remove ${plugin.name}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14, "aria-hidden": "true" })
        }
      )
    ] })
  ] }) });
}
const BUILTIN_HOOKS = [
  "on_startup",
  "on_chat_message",
  "on_code_review",
  "on_training_complete",
  "on_search_query"
];
function HooksList() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-text-secondary text-sm font-medium mb-3", children: "Available Hooks" }),
    BUILTIN_HOOKS.map((hook) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 bg-bg-surface-3 rounded-md px-3 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 14, "aria-hidden": "true", className: "text-accent-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-text-code text-xs", children: hook })
    ] }, hook))
  ] });
}
function Plugins() {
  const { fetchPlugins, unregisterPlugin, togglePlugin } = usePluginSystem();
  const { plugins, isLoading } = usePluginStore();
  reactExports.useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);
  const handleToggle = (id2, enabled) => togglePlugin(id2, enabled);
  const handleRemove = (id2) => unregisterPlugin(id2);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Plugin Extension System" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => fetchPlugins(),
            className: "p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "Refresh plugins",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, "aria-hidden": "true" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Extend Sovereign Coder with custom plugins" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "installed", className: "flex flex-col flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "flex gap-1 px-6 pt-4 border-b border-border-subtle", children: ["installed", "hooks", "guide"].map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Trigger,
        {
          value: t2,
          className: "text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          children: t2 === "installed" ? `Installed (${plugins.length})` : t2.charAt(0).toUpperCase() + t2.slice(1)
        },
        t2
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "installed", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-text-muted text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "animate-spin", "aria-hidden": "true" }),
          "Loading plugins…"
        ] }) : plugins.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-48 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { size: 40, "aria-hidden": "true", className: "text-text-muted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No plugins installed" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: plugins.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsx(PluginCard, { plugin: p2, onToggle: handleToggle, onRemove: handleRemove }, p2.id)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "hooks", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HooksList, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "guide", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-text-primary text-sm font-medium mb-3", children: "Plugin Development Guide" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-secondary text-sm", children: [
            "Create a manifest JSON and POST to ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-text-code", children: "/plugins/register" }),
            " to install a plugin."
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
const usePRReviewStore = create((set) => ({
  result: null,
  rules: [],
  diff: "",
  isReviewing: false,
  error: null,
  setResult: (result) => set({ result }),
  setRules: (rules) => set({ rules }),
  setDiff: (diff) => set({ diff }),
  setReviewing: (isReviewing) => set({ isReviewing }),
  setError: (error) => set({ error })
}));
const BASE_URL$4 = "http://localhost:8013";
function usePRReview() {
  const { setResult, setRules, setReviewing, setError } = usePRReviewStore();
  const reviewDiff = reactExports.useCallback(
    async (diff, language = "python", rules = []) => {
      if (!diff.trim()) return null;
      setReviewing(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL$4}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diff, language, rules })
        });
        if (!res.ok) throw new Error("Review failed");
        const data = await res.json();
        setResult(data);
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Review error");
        return null;
      } finally {
        setReviewing(false);
      }
    },
    [setResult, setReviewing, setError]
  );
  const fetchRules = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$4}/rules`);
      if (!res.ok) return [];
      const data = await res.json();
      setRules(data.rules ?? []);
      return data.rules ?? [];
    } catch {
      return [];
    }
  }, [setRules]);
  return { reviewDiff, fetchRules };
}
function ReviewSummaryCard({ summary, approved }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `bg-bg-surface-2 border rounded-lg p-4 ${approved ? "border-green-500/50" : "border-red-500/50"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
          approved ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 18, "aria-hidden": "true", className: "text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 18, "aria-hidden": "true", className: "text-red-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary text-sm font-semibold", children: approved ? "Approved" : "Changes Required" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-bg-surface-3 text-text-secondary", children: [
            "Score: ",
            summary.score,
            "/100"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-3 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs", children: "Files" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm font-bold", children: summary.total_files })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-xs", children: "Errors" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm font-bold", children: summary.errors })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-yellow-400 text-xs", children: "Warnings" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-yellow-400 text-sm font-bold", children: summary.warnings })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs", children: "Infos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm font-bold", children: summary.infos })
          ] })
        ] })
      ]
    }
  );
}
const severityIcon = (s) => {
  if (s === "error") return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 14, "aria-hidden": "true", className: "text-red-400" });
  if (s === "warning")
    return /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 14, "aria-hidden": "true", className: "text-yellow-400" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { size: 14, "aria-hidden": "true", className: "text-blue-400" });
};
const severityClass = (s) => {
  if (s === "error") return "border-l-2 border-red-400";
  if (s === "warning") return "border-l-2 border-yellow-400";
  return "border-l-2 border-blue-400";
};
function ReviewCommentList({ comments }) {
  if (comments.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No comments — looking clean!" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: comments.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `bg-bg-surface-2 rounded-md p-3 ${severityClass(c.severity)}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
      severityIcon(c.severity),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-secondary text-xs font-mono", children: [
        c.file_path,
        ":",
        c.line
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs ml-auto", children: c.rule })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-xs", children: c.message })
  ] }, i)) });
}
const SAMPLE_DIFF = `diff --git a/src/auth.py b/src/auth.py
index 1234..5678 100644
--- a/src/auth.py
+++ b/src/auth.py
@@ -10,6 +10,9 @@ class Auth:
 def login(self):
+    password = "hunter2"
+    print("Logging in...")
+    # TODO: add 2FA
     return True`;
function PRReview() {
  const { reviewDiff, fetchRules } = usePRReview();
  const { result, rules, diff, isReviewing, setDiff } = usePRReviewStore();
  reactExports.useEffect(() => {
    fetchRules();
  }, [fetchRules]);
  const handleReview = () => reviewDiff(diff || SAMPLE_DIFF);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(GitPullRequest, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "PR Review Agent" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Automated code review with configurable rules" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "review", className: "flex flex-col flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "flex gap-1 px-6 pt-4 border-b border-border-subtle", children: ["review", "rules", "history"].map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Trigger,
        {
          value: t2,
          className: "text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          children: t2.charAt(0).toUpperCase() + t2.slice(1)
        },
        t2
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "review", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-text-secondary text-xs block mb-1", children: "Paste git diff here" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                value: diff,
                onChange: (e) => setDiff(e.target.value),
                placeholder: SAMPLE_DIFF,
                rows: 6,
                "aria-label": "Git diff input",
                className: "w-full bg-bg-surface-2 border border-border-default rounded-lg px-3 py-2 text-text-code text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handleReview,
              disabled: isReviewing,
              className: "flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 mb-6",
              children: [
                isReviewing ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 14, "aria-hidden": "true" }),
                isReviewing ? "Reviewing…" : "Run Review"
              ]
            }
          ),
          result && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ReviewSummaryCard, { summary: result.summary, approved: result.approved }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-text-secondary text-sm font-medium mb-3", children: [
                "Review Comments (",
                result.comments.length,
                ")"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ReviewCommentList, { comments: result.comments })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "rules", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-text-secondary text-sm font-medium mb-3", children: [
            "Active Rules (",
            rules.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: rules.map((r2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "bg-bg-surface-2 border border-border-default rounded-md px-3 py-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-text-code text-xs", children: r2.id }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `text-xs px-1.5 rounded ${r2.severity === "error" ? "text-red-400 bg-red-500/10" : r2.severity === "warning" ? "text-yellow-400 bg-yellow-400/10" : "text-blue-400 bg-blue-400/10"}`,
                      children: r2.severity
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs mt-1", children: r2.message })
              ]
            },
            r2.id
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "history", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "Review history coming soon." }) })
      ] })
    ] })
  ] });
}
const useFinetuneStore = create((set) => ({
  jobs: [],
  checkpoints: [],
  activeJobId: null,
  isLoading: false,
  error: null,
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  updateJob: (job) => set((state) => ({
    jobs: state.jobs.map((j) => j.job_id === job.job_id ? job : j)
  })),
  setCheckpoints: (checkpoints) => set({ checkpoints }),
  setActiveJobId: (activeJobId) => set({ activeJobId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));
const BASE_URL$3 = "http://localhost:8001";
function useFinetune() {
  const { addJob, updateJob, setJobs, setCheckpoints, setActiveJobId, setLoading, setError } = useFinetuneStore();
  const startJob = reactExports.useCallback(
    async (config) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL$3}/finetune/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config)
        });
        if (!res.ok) throw new Error("Failed to start fine-tune");
        const data = await res.json();
        const jobRes = await fetch(`${BASE_URL$3}/finetune/status/${data.job_id}`);
        const job = await jobRes.json();
        addJob(job);
        setActiveJobId(job.job_id);
        return job;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addJob, setActiveJobId, setLoading, setError]
  );
  const fetchJobs = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$3}/finetune/jobs`);
      if (!res.ok) return [];
      const data = await res.json();
      setJobs(data);
      return data;
    } catch {
      return [];
    }
  }, [setJobs]);
  const stopJob = reactExports.useCallback(
    async (jobId) => {
      try {
        const res = await fetch(`${BASE_URL$3}/finetune/stop/${jobId}`, { method: "POST" });
        if (res.ok) {
          const updated = await fetch(`${BASE_URL$3}/finetune/status/${jobId}`);
          if (updated.ok) updateJob(await updated.json());
        }
        return res.ok;
      } catch {
        return false;
      }
    },
    [updateJob]
  );
  const fetchCheckpoints = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$3}/finetune/checkpoints`);
      if (!res.ok) return [];
      const data = await res.json();
      setCheckpoints(data);
      return data;
    } catch {
      return [];
    }
  }, [setCheckpoints]);
  return { startJob, fetchJobs, stopJob, fetchCheckpoints };
}
function LossCurve({ losses, width = 300, height = 80 }) {
  if (losses.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-20 text-text-muted text-xs", children: "No loss data yet" });
  }
  const max = Math.max(...losses);
  const min = Math.min(...losses);
  const range = max - min || 1;
  const pad = 8;
  const w2 = width - pad * 2;
  const h = height - pad * 2;
  const points = losses.map((l2, i) => {
    const x2 = pad + i / Math.max(losses.length - 1, 1) * w2;
    const y2 = pad + (1 - (l2 - min) / range) * h;
    return `${x2},${y2}`;
  }).join(" ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "svg",
    {
      width,
      height,
      role: "img",
      "aria-label": `Loss curve: ${losses.length} data points, current loss ${losses[losses.length - 1]?.toFixed(3)}`,
      className: "w-full",
      viewBox: `0 0 ${width} ${height}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "polyline",
          {
            points,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 2,
            className: "text-accent-400"
          }
        ),
        losses.map((l2, i) => {
          const x2 = pad + i / Math.max(losses.length - 1, 1) * w2;
          const y2 = pad + (1 - (l2 - min) / range) * h;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: x2, cy: y2, r: 3, className: "fill-accent-500" }, i);
        })
      ]
    }
  );
}
function CheckpointTable({ checkpoints }) {
  if (checkpoints.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No checkpoints yet." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-text-muted border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-2 font-medium", children: "Name" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center py-2 font-medium", children: "Epoch" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center py-2 font-medium", children: "Loss" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-2 font-medium", children: "Path" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: checkpoints.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border-subtle/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-text-primary font-medium", children: c.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-center text-text-secondary", children: c.epoch }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-center text-accent-400", children: c.loss.toFixed(3) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-text-muted font-mono", children: c.path })
    ] }, i)) })
  ] });
}
function StatusIcon({ status }) {
  if (status === "running") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, "aria-hidden": "true", className: "text-yellow-400 animate-spin" });
  }
  if (status === "complete") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14, "aria-hidden": "true", className: "text-green-500" });
  }
  if (status === "failed" || status === "stopped") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 14, "aria-hidden": "true", className: "text-red-400" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 14, "aria-hidden": "true", className: "text-text-muted" });
}
function JobStatusCard({ job, onStop }) {
  const pct = Math.round(job.progress * 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatusIcon, { status: job.status }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-primary text-sm font-medium truncate max-w-xs font-mono", children: job.job_id.slice(0, 8) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs", children: job.status })
      ] }),
      job.status === "running" && onStop && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => onStop(job.job_id),
          className: "flex items-center gap-1 text-xs text-red-400 hover:bg-red-500/10 rounded px-2 py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          "aria-label": "Stop fine-tune job",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { size: 10, "aria-hidden": "true" }),
            "Stop"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 bg-bg-surface-3 rounded-full h-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-accent-500 h-1.5 rounded-full", style: { width: `${pct}%` } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-muted text-xs", children: [
        pct,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-muted text-xs", children: [
      "Epoch ",
      job.current_epoch,
      "/",
      job.total_epochs,
      " · ",
      pct,
      "% complete"
    ] })
  ] });
}
const DEFAULT_CONFIG = {
  base_model: "mistral-7b",
  dataset_path: "./datasets/custom.jsonl",
  learning_rate: 3e-4,
  epochs: 3,
  batch_size: 4,
  lora_rank: 8,
  output_dir: "./finetune-output"
};
function Finetune() {
  const { startJob, fetchJobs, stopJob, fetchCheckpoints } = useFinetune();
  const { jobs, checkpoints, activeJobId, isLoading } = useFinetuneStore();
  const [config, setConfig] = reactExports.useState(DEFAULT_CONFIG);
  reactExports.useEffect(() => {
    fetchJobs();
    fetchCheckpoints();
  }, [fetchJobs, fetchCheckpoints]);
  const activeJob = jobs.find((j) => j.job_id === activeJobId) ?? null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Local Model Fine-tuning" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Fine-tune local models with LoRA on custom datasets" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "configure", className: "flex flex-col flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "flex gap-1 px-6 pt-4 border-b border-border-subtle", children: ["configure", "jobs", "checkpoints", "loss"].map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Trigger,
        {
          value: t2,
          className: "text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          children: t2 === "jobs" ? `Jobs (${jobs.length})` : t2 === "checkpoints" ? `Checkpoints (${checkpoints.length})` : t2.charAt(0).toUpperCase() + t2.slice(1)
        },
        t2
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "configure", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
            { key: "base_model", label: "Base Model", type: "text" },
            { key: "dataset_path", label: "Dataset Path", type: "text" },
            { key: "learning_rate", label: "Learning Rate", type: "number" },
            { key: "epochs", label: "Epochs", type: "number" },
            { key: "batch_size", label: "Batch Size", type: "number" },
            { key: "lora_rank", label: "LoRA Rank", type: "number" }
          ].map(({ key, label, type }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-text-secondary text-xs block mb-1", children: label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type,
                value: config[key],
                onChange: (e) => setConfig((c) => ({
                  ...c,
                  [key]: type === "number" ? parseFloat(e.target.value) : e.target.value
                })),
                className: "w-full bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500",
                "aria-label": label
              }
            )
          ] }, key)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => startJob(config),
              disabled: isLoading,
              className: "flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              children: [
                isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 14, "aria-hidden": "true" }),
                isLoading ? "Starting…" : "Start Fine-tuning"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "jobs", children: jobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No fine-tune jobs yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: jobs.map((j) => /* @__PURE__ */ jsxRuntimeExports.jsx(JobStatusCard, { job: j, onStop: stopJob }, j.job_id)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "checkpoints", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckpointTable, { checkpoints }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "loss", children: activeJob && activeJob.loss_history.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-muted text-xs mb-3", children: [
            "Loss curve for job ",
            activeJob.job_id.slice(0, 8)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(LossCurve, { losses: activeJob.loss_history })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No active job with loss data. Start a fine-tune to see the curve." }) })
      ] })
    ] })
  ] });
}
const useFederationCoreStore = create((set) => ({
  peers: [],
  currentRound: null,
  roundHistory: [],
  isLoading: false,
  error: null,
  setPeers: (peers) => set({ peers }),
  addPeer: (peer) => set((state) => ({ peers: [...state.peers, peer] })),
  removePeer: (id2) => set((state) => ({ peers: state.peers.filter((p2) => p2.peer_id !== id2) })),
  setCurrentRound: (currentRound) => set({ currentRound }),
  setRoundHistory: (roundHistory) => set({ roundHistory }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));
const BASE_URL$2 = "http://localhost:8014";
function useFederationCore() {
  const { setPeers, addPeer, removePeer, setCurrentRound, setRoundHistory, setLoading, setError } = useFederationCoreStore();
  const fetchPeers = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$2}/peers`);
      if (!res.ok) return [];
      const data = await res.json();
      setPeers(data);
      return data;
    } catch {
      return [];
    }
  }, [setPeers]);
  const registerPeer = reactExports.useCallback(
    async (peer) => {
      try {
        const res = await fetch(`${BASE_URL$2}/peers/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(peer)
        });
        if (res.ok) addPeer(peer);
        return res.ok;
      } catch {
        return false;
      }
    },
    [addPeer]
  );
  const unregisterPeer = reactExports.useCallback(
    async (id2) => {
      try {
        const res = await fetch(`${BASE_URL$2}/peers/${id2}`, { method: "DELETE" });
        if (res.ok) removePeer(id2);
        return res.ok;
      } catch {
        return false;
      }
    },
    [removePeer]
  );
  const startRound = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL$2}/rounds/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      if (!res.ok) return null;
      const data = await res.json();
      setCurrentRound(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [setCurrentRound, setLoading, setError]);
  const fetchHistory = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL$2}/rounds/history`);
      if (!res.ok) return [];
      const data = await res.json();
      setRoundHistory(data);
      return data;
    } catch {
      return [];
    }
  }, [setRoundHistory]);
  return { fetchPeers, registerPeer, unregisterPeer, startRound, fetchHistory };
}
function PeerCard({ peer, onRemove }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg px-4 py-3 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Server, { size: 16, "aria-hidden": "true", className: "text-accent-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm font-medium", children: peer.peer_id }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-muted text-xs", children: [
          peer.address,
          " · ",
          peer.data_size,
          " samples"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => onRemove(peer.peer_id),
        className: "p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
        "aria-label": `Remove peer ${peer.peer_id}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13, "aria-hidden": "true" })
      }
    )
  ] });
}
function RoundStatusCard({ round }) {
  const pct = round.participating_peers.length > 0 ? Math.round(
    round.submitted_peers.length / round.participating_peers.length * 100
  ) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      round.status === "complete" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 16, "aria-hidden": "true", className: "text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, "aria-hidden": "true", className: "text-yellow-400 animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-primary text-sm font-medium", children: [
        "Round ",
        round.round_id.slice(0, 8)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted text-xs ml-auto", children: round.status })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 bg-bg-surface-3 rounded-full h-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-accent-500 h-1.5 rounded-full", style: { width: `${pct}%` } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-muted text-xs", children: [
        round.submitted_peers.length,
        "/",
        round.participating_peers.length
      ] })
    ] }),
    round.dp_noise_applied && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-blue-400", children: [
      "DP noise applied (ε=",
      1,
      ")"
    ] }),
    round.aggregated_gradients && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-green-500", children: [
      "Aggregated: ",
      round.aggregated_gradients.length,
      " gradient values"
    ] })
  ] });
}
function FederationCore() {
  const { fetchPeers, registerPeer, unregisterPeer, startRound, fetchHistory } = useFederationCore();
  const { peers, currentRound, roundHistory, isLoading } = useFederationCoreStore();
  const [newPeerId, setNewPeerId] = reactExports.useState("");
  const [newPeerAddr, setNewPeerAddr] = reactExports.useState("");
  reactExports.useEffect(() => {
    fetchPeers();
    fetchHistory();
  }, [fetchPeers, fetchHistory]);
  const handleAddPeer = async () => {
    if (!newPeerId.trim()) return;
    const peer = {
      peer_id: newPeerId,
      address: newPeerAddr || "localhost",
      data_size: 100
    };
    await registerPeer(peer);
    setNewPeerId("");
    setNewPeerAddr("");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Network, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Federated Learning Core" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              fetchPeers();
              fetchHistory();
            },
            className: "p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "Refresh federation data",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, "aria-hidden": "true" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "Federated Averaging with Differential Privacy (DP-SGD)" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "peers", className: "flex flex-col flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "flex gap-1 px-6 pt-4 border-b border-border-subtle", children: ["peers", "rounds", "history"].map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Trigger,
        {
          value: t2,
          className: "text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          children: t2 === "peers" ? `Peers (${peers.length})` : t2 === "rounds" ? "Current Round" : `History (${roundHistory.length})`
        },
        t2
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "peers", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: newPeerId,
                onChange: (e) => setNewPeerId(e.target.value),
                placeholder: "Peer ID",
                "aria-label": "New peer ID",
                className: "flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: newPeerAddr,
                onChange: (e) => setNewPeerAddr(e.target.value),
                placeholder: "Address",
                "aria-label": "New peer address",
                className: "flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: handleAddPeer,
                className: "flex items-center gap-1 bg-accent-500 hover:bg-accent-400 text-text-primary text-sm px-3 py-1.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                "aria-label": "Add peer",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14, "aria-hidden": "true" }),
                  "Add"
                ]
              }
            )
          ] }),
          peers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No peers registered." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: peers.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsx(PeerCard, { peer: p2, onRemove: unregisterPeer }, p2.peer_id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "rounds", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: startRound,
              disabled: isLoading || peers.length === 0,
              className: "flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              children: [
                isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 14, "aria-hidden": "true" }),
                "Start Federated Round"
              ]
            }
          ) }),
          currentRound ? /* @__PURE__ */ jsxRuntimeExports.jsx(RoundStatusCard, { round: currentRound }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No active round. Add peers and start a round." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "history", children: roundHistory.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No completed rounds yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: roundHistory.map((r2) => /* @__PURE__ */ jsxRuntimeExports.jsx(RoundStatusCard, { round: r2 }, r2.round_id)) }) })
      ] })
    ] })
  ] });
}
const useCodeCompletionStore = create((set) => ({
  completions: [],
  activeIndex: 0,
  isLoading: false,
  prefix: "",
  error: null,
  setCompletions: (completions) => set({ completions, activeIndex: 0 }),
  setActiveIndex: (activeIndex) => set({ activeIndex }),
  setLoading: (isLoading) => set({ isLoading }),
  setPrefix: (prefix) => set({ prefix }),
  setError: (error) => set({ error })
}));
const BASE_URL$1 = "http://localhost:8015";
function useCodeCompletion() {
  const { setCompletions, setLoading, setError } = useCodeCompletionStore();
  const getCompletions = reactExports.useCallback(async (req) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL$1}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req)
      });
      if (!res.ok) return [];
      const data = await res.json();
      setCompletions(data.completions);
      return data.completions;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      return [];
    } finally {
      setLoading(false);
    }
  }, [setCompletions, setLoading, setError]);
  const submitFeedback = reactExports.useCallback(async (fb2) => {
    try {
      const res = await fetch(`${BASE_URL$1}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fb2)
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);
  return { getCompletions, submitFeedback };
}
function CompletionItem({ completion, isActive, onAccept }) {
  const pct = Math.round(completion.confidence * 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      onClick: () => onAccept(completion.text),
      className: `w-full flex items-center gap-3 px-3 py-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 text-left ${isActive ? "bg-accent-500/20 text-text-primary" : "text-text-secondary hover:bg-bg-surface-3"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { size: 14, "aria-hidden": "true", className: "text-accent-400 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-mono flex-1", children: completion.text }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-text-muted", children: [
          pct,
          "%"
        ] })
      ]
    }
  );
}
function CompletionDropdown({ onAccept }) {
  const { completions, activeIndex } = useCodeCompletionStore();
  if (completions.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      role: "listbox",
      "aria-label": "Code completions",
      className: "bg-bg-elevated border border-border-default rounded-lg shadow-lg overflow-hidden",
      children: completions.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        CompletionItem,
        {
          completion: c,
          isActive: i === activeIndex,
          onAccept
        },
        c.text
      ))
    }
  );
}
function CodeCompletion() {
  const { getCompletions, submitFeedback } = useCodeCompletion();
  const { completions, isLoading, prefix, setPrefix } = useCodeCompletionStore();
  const [context, setContext] = reactExports.useState("");
  const handleGetCompletions = async () => {
    if (prefix.trim()) {
      await getCompletions({ prefix, context, max_results: 3 });
    }
  };
  const handleAccept = async (text) => {
    await submitFeedback({ completion: text, accepted: true });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Code, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Code Completions" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "N-gram prefix model with feedback learning" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "editor", className: "flex flex-col flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "flex gap-1 px-6 pt-4 border-b border-border-subtle", children: ["editor", "completions", "settings"].map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Trigger,
        {
          value: t2,
          className: "text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          children: t2 === "completions" ? `Completions (${completions.length})` : t2.charAt(0).toUpperCase() + t2.slice(1)
        },
        t2
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "editor", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-text-secondary text-xs mb-1.5", htmlFor: "context-input", children: "Context (optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "context-input",
                value: context,
                onChange: (e) => setContext(e.target.value),
                placeholder: "Paste code context here...",
                rows: 6,
                className: "w-full bg-bg-surface-2 border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted resize-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-text-secondary text-xs mb-1.5", htmlFor: "prefix-input", children: "Prefix / Current Word" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "prefix-input",
                type: "text",
                value: prefix,
                onChange: (e) => setPrefix(e.target.value),
                placeholder: "e.g. def",
                className: "w-full bg-bg-surface-2 border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handleGetCompletions,
              disabled: isLoading || !prefix.trim(),
              className: "flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 14, "aria-hidden": "true" }),
                "Get Completions"
              ]
            }
          ),
          completions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CompletionDropdown, { onAccept: handleAccept }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "completions", children: completions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No completions yet. Enter a prefix in the Editor tab." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CompletionDropdown, { onAccept: handleAccept }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Content, { value: "settings", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings$1, { size: 16, "aria-hidden": "true", className: "text-accent-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary text-sm", children: "Model: N-gram (bigram)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs", children: "Port: 8015 · Max results: 3 · Window: 10 lines" })
        ] }) })
      ] })
    ] })
  ] });
}
const useMemoryStore = create((set) => ({
  memories: [],
  searchResults: [],
  contextSummary: null,
  isLoading: false,
  error: null,
  setMemories: (memories) => set({ memories }),
  addMemory: (memory) => set((state) => ({ memories: [...state.memories, memory] })),
  removeMemory: (id2) => set((state) => ({ memories: state.memories.filter((m2) => m2.id !== id2) })),
  setSearchResults: (searchResults) => set({ searchResults }),
  setContextSummary: (contextSummary) => set({ contextSummary }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));
const BASE_URL = "http://localhost:8016";
function useConversationMemory() {
  const { setMemories, addMemory, removeMemory, setSearchResults, setContextSummary, setLoading, setError } = useMemoryStore();
  const fetchMemories = reactExports.useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/memories`);
      if (!res.ok) return [];
      const data = await res.json();
      setMemories(data.memories);
      return data.memories;
    } catch {
      return [];
    }
  }, [setMemories]);
  const addMemoryItem = reactExports.useCallback(async (text, tags = []) => {
    try {
      const res = await fetch(`${BASE_URL}/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tags })
      });
      if (!res.ok) return null;
      const mem = await res.json();
      addMemory(mem);
      return mem;
    } catch {
      return null;
    }
  }, [addMemory]);
  const searchMemories = reactExports.useCallback(async (query, top_k = 5) => {
    try {
      const res = await fetch(`${BASE_URL}/memories/search?q=${encodeURIComponent(query)}&top_k=${top_k}`);
      if (!res.ok) return [];
      const data = await res.json();
      setSearchResults(data.results);
      return data.results;
    } catch {
      return [];
    }
  }, [setSearchResults]);
  const deleteMemory = reactExports.useCallback(async (id2) => {
    try {
      const res = await fetch(`${BASE_URL}/memories/${id2}`, { method: "DELETE" });
      if (res.ok) removeMemory(id2);
      return res.ok;
    } catch {
      return false;
    }
  }, [removeMemory]);
  const buildContext = reactExports.useCallback(async (query, top_k = 5) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/context/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, top_k })
      });
      if (!res.ok) return null;
      const data = await res.json();
      setContextSummary(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [setContextSummary, setLoading, setError]);
  return { fetchMemories, addMemoryItem, searchMemories, deleteMemory, buildContext };
}
function MemoryCard({ memory, onDelete }) {
  const date = new Date(memory.timestamp).toLocaleDateString();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg px-4 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { size: 14, "aria-hidden": "true", className: "text-accent-400 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-primary text-sm flex-1 line-clamp-3", children: memory.text })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onDelete(memory.id),
          className: "p-1 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          "aria-label": `Delete memory ${memory.id}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 12, "aria-hidden": "true" })
        }
      )
    ] }),
    memory.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { size: 11, "aria-hidden": "true", className: "text-text-muted" }),
      memory.tags.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-muted bg-bg-surface-3 px-1.5 py-0.5 rounded", children: t2 }, t2))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-xs mt-1", children: date })
  ] });
}
function ContextViewer({ summary }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-surface-2 border border-border-default rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, "aria-hidden": "true", className: "text-accent-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-primary text-sm font-medium", children: [
        'Context for: "',
        summary.query,
        '"'
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-text-muted text-xs ml-auto", children: [
        "~",
        summary.token_estimate,
        " tokens"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-text-secondary text-xs bg-bg-surface-3 rounded p-3 overflow-x-auto whitespace-pre-wrap font-mono", children: summary.compressed_context || "(empty)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-text-muted text-xs mt-2", children: [
      summary.relevant_memories.length,
      " relevant memories"
    ] })
  ] });
}
function ConversationMemory() {
  const { fetchMemories, addMemoryItem, searchMemories, deleteMemory, buildContext } = useConversationMemory();
  const { memories, searchResults, contextSummary, isLoading } = useMemoryStore();
  const [newText, setNewText] = reactExports.useState("");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [contextQuery, setContextQuery] = reactExports.useState("");
  reactExports.useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);
  const handleAdd = async () => {
    if (newText.trim()) {
      await addMemoryItem(newText);
      setNewText("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { size: 20, "aria-hidden": "true", className: "text-accent-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-text-primary text-xl font-semibold", children: "Conversation Memory" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: fetchMemories,
            className: "p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "Refresh memories",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, "aria-hidden": "true" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm", children: "TF-IDF relevance ranking · context compression" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root2$1, { defaultValue: "memories", className: "flex flex-col flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "flex gap-1 px-6 pt-4 border-b border-border-subtle", children: ["memories", "search", "context"].map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Trigger,
        {
          value: t2,
          className: "text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          children: t2 === "memories" ? `Memories (${memories.length})` : t2 === "search" ? `Search (${searchResults.length})` : "Context"
        },
        t2
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "memories", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: newText,
                onChange: (e) => setNewText(e.target.value),
                placeholder: "Add a new memory...",
                "aria-label": "New memory text",
                className: "flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: handleAdd,
                className: "flex items-center gap-1 bg-accent-500 hover:bg-accent-400 text-text-primary text-sm px-3 py-1.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                "aria-label": "Add memory",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14, "aria-hidden": "true" }),
                  "Add"
                ]
              }
            )
          ] }),
          memories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "No memories yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: memories.map((m2) => /* @__PURE__ */ jsxRuntimeExports.jsx(MemoryCard, { memory: m2, onDelete: deleteMemory }, m2.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "search", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                placeholder: "Search memories...",
                "aria-label": "Search query",
                className: "flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => searchMemories(searchQuery),
                className: "flex items-center gap-1 border border-border-default text-text-secondary hover:bg-bg-surface-3 text-sm px-3 py-1.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                "aria-label": "Search",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, "aria-hidden": "true" }),
                  "Search"
                ]
              }
            )
          ] }),
          searchResults.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: "Enter a query to search memories." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: searchResults.map((r2) => /* @__PURE__ */ jsxRuntimeExports.jsx(MemoryCard, { memory: r2.memory, onDelete: deleteMemory }, r2.memory.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { value: "context", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: contextQuery,
                onChange: (e) => setContextQuery(e.target.value),
                placeholder: "Build context for query...",
                "aria-label": "Context query",
                className: "flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => buildContext(contextQuery),
                disabled: isLoading,
                className: "flex items-center gap-1 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm px-3 py-1.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                "aria-label": "Build context",
                children: "Build Context"
              }
            )
          ] }),
          contextSummary && /* @__PURE__ */ jsxRuntimeExports.jsx(ContextViewer, { summary: contextSummary })
        ] })
      ] })
    ] })
  ] });
}
const screens = {
  dashboard: Dashboard,
  models: Models,
  chat: Chat,
  training: Training,
  federation: Federation,
  knowledge: Knowledge,
  enterprise: Enterprise,
  decisiongraph: DecisionGraph,
  orchestration: Orchestration,
  orgintelligence: OrgIntelligence,
  personacouncil: PersonaCouncil,
  analytics: Analytics,
  messaging: Messaging,
  semanticsearch: SemanticSearch,
  plugins: Plugins,
  prreview: PRReview,
  finetune: Finetune,
  federationcore: FederationCore,
  codecompletion: CodeCompletion,
  memory: ConversationMemory,
  settings: Settings
};
function MainContent() {
  const active = useNavigationStore((s) => s.active);
  const Screen = screens[active];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 bg-bg-base overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { label: active, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Screen, {}) }) });
}
const Waveform = ({ isRecording, confidence, className = "" }) => {
  const canvasRef = reactExports.useRef(null);
  const animationIdRef = reactExports.useRef(null);
  const dataArrayRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!isRecording) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgb(15, 15, 15)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const draw = () => {
          animationIdRef.current = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArrayRef.current);
          ctx.fillStyle = "rgb(15, 15, 15)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const barWidth = canvas.width / bufferLength * 2.5;
          let x2 = 0;
          ctx.fillStyle = "rgb(139, 92, 246)";
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArrayRef.current[i] / 255 * canvas.height;
            ctx.fillRect(x2, canvas.height - barHeight, barWidth - 1, barHeight);
            x2 += barWidth;
          }
          if (confidence !== void 0 && confidence > 0) {
            ctx.strokeStyle = "rgba(36, 197, 94, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height * (1 - confidence));
            ctx.lineTo(canvas.width, canvas.height * (1 - confidence));
            ctx.stroke();
          }
        };
        draw();
        return () => {
          if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
          }
          stream.getTracks().forEach((track) => track.stop());
          audioContext.close();
        };
      } catch (error) {
        console.error("Failed to setup audio visualization:", error);
      }
    };
    const cleanup = setupAudio();
    return () => {
      cleanup?.then((fn) => fn?.());
    };
  }, [isRecording, confidence]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      width: 300,
      height: 60,
      className: `w-full bg-bg-base rounded border border-border-subtle ${className}`
    }
  );
};
const VoiceInput = ({
  onTranscribe,
  isLoading = false,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const mediaRecorderRef = reactExports.useRef(null);
  const chunksRef = reactExports.useRef([]);
  const [selectedLanguage, setSelectedLanguage] = reactExports.useState("en");
  const startRecording = reactExports.useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        await uploadAndTranscribe(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Microphone access denied");
      setIsRecording(false);
    }
  }, []);
  const stopRecording = reactExports.useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);
  const uploadAndTranscribe = reactExports.useCallback(async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      if (selectedLanguage !== "auto") {
        formData.append("language", selectedLanguage);
      }
      const response = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.text) {
        onTranscribe(data.text, data.language);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    }
  }, [selectedLanguage, onTranscribe]);
  const handleFileUpload = reactExports.useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAndTranscribe(file);
    }
  }, [uploadAndTranscribe]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "select",
      {
        value: selectedLanguage,
        onChange: (e) => setSelectedLanguage(e.target.value),
        disabled: disabled || isRecording,
        className: "px-3 py-2 rounded-md border border-border-default bg-bg-surface-2 text-text-primary text-sm",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "auto", children: "Auto-detect" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "English" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "zh", children: "Chinese" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "es", children: "Spanish" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fr", children: "French" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "de", children: "German" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ja", children: "Japanese" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: isRecording ? stopRecording : startRecording,
          disabled: disabled || isLoading,
          className: `flex items-center gap-2 px-4 py-2 rounded-md font-medium cursor-pointer
            ${isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-accent-500 hover:bg-accent-400 text-text-primary"}
            ${(disabled || isLoading) && "opacity-50 cursor-not-allowed"}
          `,
          "aria-label": isRecording ? "Stop recording" : "Start recording",
          children: [
            isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader, { size: 18, className: "animate-spin", "aria-hidden": "true" }) : isRecording ? /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { size: 18, "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { size: 18, "aria-hidden": "true" }),
            isLoading ? "Processing..." : isRecording ? "Stop" : "Record"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 px-4 py-2 rounded-md border border-border-default hover:bg-bg-surface-3 text-text-secondary cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Upload" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "file",
            accept: "audio/*",
            onChange: handleFileUpload,
            disabled: disabled || isRecording,
            className: "hidden",
            "aria-label": "Upload audio file"
          }
        )
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-400/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16, className: "text-red-400 flex-shrink-0 mt-0.5", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-400", children: error })
    ] }),
    isRecording && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-yellow-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-yellow-400 animate-pulse", "aria-hidden": "true" }),
        "Recording..."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Waveform, { isRecording, className: "mx-auto" })
    ] })
  ] });
};
const VoiceOutput = ({
  text,
  isLoading = false,
  disabled = false,
  onPlay,
  onStop
}) => {
  const [isPlaying, setIsPlaying] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const audioRef = reactExports.useRef(null);
  const [selectedLanguage, setSelectedLanguage] = reactExports.useState("en");
  const synthesizeSpeech = reactExports.useCallback(async () => {
    if (!text.trim()) {
      setError("No text to synthesize");
      return;
    }
    try {
      setError(null);
      onPlay?.();
      const formData = new FormData();
      formData.append("text", text);
      formData.append("language", selectedLanguage);
      const response = await fetch("http://localhost:8000/speak", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error(`TTS failed: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "TTS failed");
      }
      const audioResponse = await fetch(data.path);
      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speech synthesis failed");
      onStop?.();
    }
  }, [text, selectedLanguage, onPlay, onStop]);
  const stopPlayback = reactExports.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    onStop?.();
  }, [onStop]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 p-4 bg-bg-surface-2 rounded-lg border border-border-default", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "select",
      {
        value: selectedLanguage,
        onChange: (e) => setSelectedLanguage(e.target.value),
        disabled: disabled || isPlaying,
        className: "px-3 py-2 rounded-md border border-border-default bg-bg-surface-1 text-text-primary text-sm",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "English" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "zh-CN", children: "Chinese (Simplified)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "zh-TW", children: "Chinese (Traditional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "es", children: "Spanish" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fr", children: "French" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "de", children: "German" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ja", children: "Japanese" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ko", children: "Korean" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: isPlaying ? stopPlayback : synthesizeSpeech,
          disabled: disabled || isLoading || !text.trim(),
          className: `flex items-center gap-2 px-4 py-2 rounded-md font-medium cursor-pointer
            ${isPlaying ? "bg-red-500 hover:bg-red-600 text-white" : "bg-accent-500 hover:bg-accent-400 text-text-primary"}
            ${(disabled || isLoading || !text.trim()) && "opacity-50 cursor-not-allowed"}
          `,
          "aria-label": isPlaying ? "Stop playback" : "Play speech",
          children: [
            isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader, { size: 18, className: "animate-spin", "aria-hidden": "true" }) : isPlaying ? /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { size: 18, "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { size: 18, "aria-hidden": "true" }),
            isLoading ? "Synthesizing..." : isPlaying ? "Stop" : "Speak"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 px-3 py-2 rounded-md bg-bg-surface-1 text-text-secondary text-sm truncate", children: [
        text.substring(0, 50),
        text.length > 50 ? "..." : ""
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-400/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16, className: "text-red-400 flex-shrink-0 mt-0.5", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-400", children: error })
    ] }),
    isPlaying && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-blue-400", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-blue-400 animate-pulse", "aria-hidden": "true" }),
      "Playing..."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "audio",
      {
        ref: audioRef,
        onEnded: () => {
          setIsPlaying(false);
          onStop?.();
        },
        onError: () => {
          setError("Audio playback error");
          setIsPlaying(false);
        },
        "aria-hidden": "true"
      }
    )
  ] });
};
const VoicePanel = ({
  onClose,
  onTranscriptChange,
  onSettingsClick,
  onHistoryClick
}) => {
  const [transcript, setTranscript] = reactExports.useState("");
  const [transcribedText, setTranscribedText] = reactExports.useState("");
  const [serviceHealth, setServiceHealth] = reactExports.useState({
    connected: false,
    asrReady: false,
    ttsReady: false
  });
  const [isCheckingHealth, setIsCheckingHealth] = reactExports.useState(true);
  React$2.useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("http://localhost:8000/health");
        if (response.ok) {
          const data = await response.json();
          setServiceHealth({
            connected: true,
            asrReady: data.asr_loaded,
            ttsReady: data.tts_loaded
          });
        }
      } catch {
        setServiceHealth({ connected: false, asrReady: false, ttsReady: false });
      } finally {
        setIsCheckingHealth(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5e3);
    return () => clearInterval(interval);
  }, []);
  const handleTranscribe = reactExports.useCallback((text, language) => {
    setTranscribedText(text);
    setTranscript(text);
    onTranscriptChange?.(text);
  }, [onTranscriptChange]);
  const handleClearTranscript = reactExports.useCallback(() => {
    setTranscript("");
    setTranscribedText("");
    onTranscriptChange?.("");
  }, [onTranscriptChange]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-bg-surface-1 border-l border-border-subtle", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-text-primary", children: "Voice I/O" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
        onHistoryClick && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onHistoryClick,
            className: "p-1 hover:bg-bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "View history",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 16, className: "text-text-secondary", "aria-hidden": "true" })
          }
        ),
        onSettingsClick && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onSettingsClick,
            className: "p-1 hover:bg-bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "Open settings",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings$1, { size: 16, className: "text-text-secondary", "aria-hidden": "true" })
          }
        ),
        onClose && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClose,
            className: "p-1 hover:bg-bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "Close voice panel",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16, className: "text-text-secondary", "aria-hidden": "true" })
          }
        )
      ] })
    ] }),
    isCheckingHealth ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-sm text-text-muted", children: "Checking service health..." }) : !serviceHealth.connected ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex gap-2 bg-red-500/10 border-b border-red-400/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16, className: "text-red-400 flex-shrink-0 mt-0.5", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-red-400", children: "Voice service unavailable" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-400/70", children: "Make sure the Python voice service is running" })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-2 flex gap-2 text-xs text-text-secondary border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `${serviceHealth.asrReady ? "text-green-400" : "text-red-400"}`, children: [
        "• ASR ",
        serviceHealth.asrReady ? "Ready" : "Offline"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `${serviceHealth.ttsReady ? "text-green-400" : "text-red-400"}`, children: [
        "• TTS ",
        serviceHealth.ttsReady ? "Ready" : "Offline"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border-subtle", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-sm font-medium text-text-secondary", children: "Speech to Text" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VoiceInput,
          {
            onTranscribe: handleTranscribe,
            disabled: !serviceHealth.connected || !serviceHealth.asrReady
          }
        )
      ] }),
      transcribedText && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border-subtle", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-text-secondary", children: "Transcribed Text" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleClearTranscript,
              className: "text-xs px-2 py-1 rounded hover:bg-bg-surface-2 text-text-muted cursor-pointer",
              "aria-label": "Clear transcript",
              children: "Clear"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4 p-3 bg-bg-surface-2 rounded-md border border-border-default text-text-primary text-sm max-h-32 overflow-y-auto", children: transcribedText })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b border-border-subtle", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 text-sm font-medium text-text-secondary", children: "Text to Speech" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VoiceOutput,
          {
            text: transcribedText,
            disabled: !serviceHealth.connected || !serviceHealth.ttsReady
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block mb-2 text-sm font-medium text-text-secondary", children: "Or type to synthesize:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: transcript,
            onChange: (e) => {
              setTranscript(e.target.value);
              onTranscriptChange?.(e.target.value);
            },
            placeholder: "Enter text to speak...",
            className: "w-full px-3 py-2 rounded-md border border-border-default bg-bg-surface-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500",
            rows: 4
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-xs text-text-muted border-t border-border-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Powered by OpenAI Whisper + Google TTS" }) })
  ] });
};
const VoiceSettings = ({ onClose }) => {
  const { settings, updateSettings } = useVoiceStore();
  const handleModelSizeChange = (e) => {
    updateSettings({
      modelSize: e.target.value
    });
  };
  const handleLanguageChange = (e) => {
    updateSettings({
      language: e.target.value
    });
  };
  const handleToggle = (key) => {
    updateSettings({
      [key]: !settings[key]
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-bg-surface-1 border-l border-border-subtle", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border-b border-border-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Settings$1, { size: 16, className: "text-accent-500", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-text-primary", children: "Voice Settings" })
      ] }),
      onClose && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onClose,
          className: "p-1 hover:bg-bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          "aria-label": "Close settings",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16, className: "text-text-secondary", "aria-hidden": "true" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "model-size", className: "block text-sm font-medium text-text-primary mb-2", children: "Model Size" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            id: "model-size",
            value: settings.modelSize,
            onChange: handleModelSizeChange,
            className: "w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "base", children: "Base (330M) - Fast, lower accuracy" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "small", children: "Small (744M) - Balanced" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "Medium (1.5B) - Better accuracy" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "large", children: "Large (3B) - High accuracy, slower" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted mt-1", children: "Larger models are more accurate but require more VRAM" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "language", className: "block text-sm font-medium text-text-primary mb-2", children: "Language" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            id: "language",
            value: settings.language,
            onChange: handleLanguageChange,
            className: "w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "English" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "es", children: "Spanish" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fr", children: "French" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "de", children: "German" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "zh", children: "Chinese (Simplified)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ja", children: "Japanese" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-text-primary", children: "Recording" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: settings.recordAudio,
              onChange: () => handleToggle("recordAudio"),
              className: "w-4 h-4 cursor-pointer"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-primary", children: "Record audio locally" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted ml-7", children: "Store transcriptions for reference" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-text-primary", children: "Behavior" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: settings.autoInsert,
              onChange: () => handleToggle("autoInsert"),
              className: "w-4 h-4 cursor-pointer"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-primary", children: "Auto-insert transcription" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted ml-7", children: "Automatically insert transcribed text into code editor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: settings.playTTS,
              onChange: () => handleToggle("playTTS"),
              className: "w-4 h-4 cursor-pointer"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-primary", children: "Play TTS responses" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted ml-7", children: "Read LLM responses aloud (requires TTS model to be loaded)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border-subtle pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-text-primary mb-2", children: "About" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "Voice processing runs locally on your machine. No audio is transmitted to external services." })
      ] })
    ] })
  ] });
};
const TranscriptionHistory = () => {
  const { transcriptions, deleteTranscription, clearTranscriptions } = useVoiceStore();
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [copiedId, setCopiedId] = reactExports.useState(null);
  const filteredTranscriptions = reactExports.useMemo(() => {
    if (!searchTerm) return transcriptions;
    return transcriptions.filter(
      (t2) => t2.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transcriptions, searchTerm]);
  const handleCopy = (text, id2) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id2);
    setTimeout(() => setCopiedId(null), 2e3);
  };
  const handleExport = () => {
    if (transcriptions.length === 0) return;
    const data = transcriptions.map((t2) => ({
      timestamp: new Date(t2.timestamp).toISOString(),
      text: t2.text,
      language: t2.language,
      confidence: t2.confidence,
      duration: t2.duration
    }));
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcriptions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const formatDate2 = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };
  if (transcriptions.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full bg-bg-surface-2 border border-border-subtle rounded-lg p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 32, className: "text-text-muted mb-3", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-secondary mb-1", children: "No transcriptions yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "Start recording to see your transcription history" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-bg-surface-1 border-l border-border-subtle", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border-b border-border-subtle flex-shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 16, className: "text-accent-500", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-text-primary", children: [
          "Transcription History (",
          transcriptions.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: transcriptions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleExport,
            className: "p-1.5 hover:bg-bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "Export transcriptions",
            title: "Export as JSON",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14, className: "text-text-secondary", "aria-hidden": "true" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => clearTranscriptions(),
            className: "p-1.5 hover:bg-bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            "aria-label": "Clear all transcriptions",
            title: "Clear history",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14, className: "text-red-400", "aria-hidden": "true" })
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 border-b border-border-subtle flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "text",
        placeholder: "Search transcriptions...",
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        className: "w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto", children: filteredTranscriptions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-muted", children: "No results found" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border-subtle", children: filteredTranscriptions.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "p-4 hover:bg-bg-surface-2 transition-colors", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-text-muted mb-1", children: [
            formatDate2(entry.timestamp),
            " ",
            formatTime(entry.timestamp),
            " • ",
            entry.language.toUpperCase()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-primary break-words", children: entry.text })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 flex-shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handleCopy(entry.text, entry.id),
              className: "p-1 hover:bg-bg-surface-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors",
              "aria-label": "Copy transcription",
              title: copiedId === entry.id ? "Copied!" : "Copy",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Copy,
                {
                  size: 14,
                  className: copiedId === entry.id ? "text-green-400" : "text-text-secondary",
                  "aria-hidden": "true"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => deleteTranscription(entry.id),
              className: "p-1 hover:bg-bg-surface-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors",
              "aria-label": "Delete transcription",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14, className: "text-red-400 hover:text-red-300", "aria-hidden": "true" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-1 bg-bg-surface-2 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "h-full bg-accent-500",
            style: { width: `${entry.confidence * 100}%` }
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-text-muted whitespace-nowrap", children: [
          (entry.confidence * 100).toFixed(0),
          "% • ",
          entry.duration,
          "s"
        ] })
      ] })
    ] }, entry.id)) }) })
  ] });
};
const VoicePanelDrawer = () => {
  const { isPanelOpen, setPanelOpen } = useVoiceStore();
  const [currentView, setCurrentView] = reactExports.useState("main");
  if (!isPanelOpen) {
    return null;
  }
  const renderView = () => {
    switch (currentView) {
      case "settings":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceSettings, { onClose: () => setCurrentView("main") });
      case "history":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TranscriptionHistory, {});
      case "main":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          VoicePanel,
          {
            onClose: () => setPanelOpen(false),
            onSettingsClick: () => setCurrentView("settings"),
            onHistoryClick: () => setCurrentView("history")
          }
        );
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[280px] bg-bg-surface-1 border-r border-border-subtle flex flex-col h-full overflow-hidden", children: renderView() });
};
function useOllamaStatus() {
  reactExports.useEffect(() => {
    async function poll() {
      const online = await ollamaClient.isOnline();
      const models = online ? await ollamaClient.getModels() : [];
      useSystemStore.setState({
        ollamaOnline: online,
        activeModel: models.length > 0 ? models[0].name : null
      });
      if (models.length > 0) {
        useModelsStore.getState().setInstalled(models);
      }
    }
    poll();
    const interval = setInterval(poll, 5e3);
    return () => clearInterval(interval);
  }, []);
}
function App() {
  useOllamaStatus();
  useVoiceService();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { label: "Main content", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MainContent, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(VoicePanelDrawer, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CommandPalette, {})
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React$2.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
