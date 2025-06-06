/*!
 * Chart.js v3.1.1
 * https://www.chartjs.org
 * (c) 2021 Chart.js Contributors
 * Released under the MIT License
 */
!(function (t, e) {
  'object' == typeof exports && 'undefined' != typeof module
    ? (module.exports = e())
    : 'function' == typeof define && define.amd
      ? define(e)
      : ((t = 'undefined' != typeof globalThis ? globalThis : t || self).Chart =
          e());
})(this, function () {
  'use strict';
  const t =
    'undefined' == typeof window
      ? function (t) {
          return t();
        }
      : window.requestAnimationFrame;
  function e(e, i, n) {
    const o = n || ((t) => Array.prototype.slice.call(t));
    let s = !1,
      a = [];
    return function (...n) {
      (a = o(n)),
        s ||
          ((s = !0),
          t.call(window, () => {
            (s = !1), e.apply(i, a);
          }));
    };
  }
  function i(t, e) {
    let i;
    return function () {
      return e ? (clearTimeout(i), (i = setTimeout(t, e))) : t(), e;
    };
  }
  const n = (t) => ('start' === t ? 'left' : 'end' === t ? 'right' : 'center'),
    o = (t, e, i) => ('start' === t ? e : 'end' === t ? i : (e + i) / 2),
    s = (t, e, i) => ('right' === t ? i : 'center' === t ? (e + i) / 2 : e);
  var a = new (class {
    constructor() {
      (this._request = null),
        (this._charts = new Map()),
        (this._running = !1),
        (this._lastDate = void 0);
    }
    _notify(t, e, i, n) {
      const o = e.listeners[n],
        s = e.duration;
      o.forEach((n) =>
        n({ chart: t, numSteps: s, currentStep: Math.min(i - e.start, s) })
      );
    }
    _refresh() {
      const e = this;
      e._request ||
        ((e._running = !0),
        (e._request = t.call(window, () => {
          e._update(), (e._request = null), e._running && e._refresh();
        })));
    }
    _update(t = Date.now()) {
      const e = this;
      let i = 0;
      e._charts.forEach((n, o) => {
        if (!n.running || !n.items.length) return;
        const s = n.items;
        let a,
          r = s.length - 1,
          l = !1;
        for (; r >= 0; --r)
          (a = s[r]),
            a._active
              ? (a._total > n.duration && (n.duration = a._total),
                a.tick(t),
                (l = !0))
              : ((s[r] = s[s.length - 1]), s.pop());
        l && (o.draw(), e._notify(o, n, t, 'progress')),
          s.length || ((n.running = !1), e._notify(o, n, t, 'complete')),
          (i += s.length);
      }),
        (e._lastDate = t),
        0 === i && (e._running = !1);
    }
    _getAnims(t) {
      const e = this._charts;
      let i = e.get(t);
      return (
        i ||
          ((i = {
            running: !1,
            items: [],
            listeners: { complete: [], progress: [] }
          }),
          e.set(t, i)),
        i
      );
    }
    listen(t, e, i) {
      this._getAnims(t).listeners[e].push(i);
    }
    add(t, e) {
      e && e.length && this._getAnims(t).items.push(...e);
    }
    has(t) {
      return this._getAnims(t).items.length > 0;
    }
    start(t) {
      const e = this._charts.get(t);
      e &&
        ((e.running = !0),
        (e.start = Date.now()),
        (e.duration = e.items.reduce((t, e) => Math.max(t, e._duration), 0)),
        this._refresh());
    }
    running(t) {
      if (!this._running) return !1;
      const e = this._charts.get(t);
      return !!(e && e.running && e.items.length);
    }
    stop(t) {
      const e = this._charts.get(t);
      if (!e || !e.items.length) return;
      const i = e.items;
      let n = i.length - 1;
      for (; n >= 0; --n) i[n].cancel();
      (e.items = []), this._notify(t, e, Date.now(), 'complete');
    }
    remove(t) {
      return this._charts.delete(t);
    }
  })();
  /*!
   * @kurkle/color v0.1.9
   * https://github.com/kurkle/color#readme
   * (c) 2020 Jukka Kurkela
   * Released under the MIT License
   */ const r = {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
      A: 10,
      B: 11,
      C: 12,
      D: 13,
      E: 14,
      F: 15,
      a: 10,
      b: 11,
      c: 12,
      d: 13,
      e: 14,
      f: 15
    },
    l = '0123456789ABCDEF',
    c = (t) => l[15 & t],
    h = (t) => l[(240 & t) >> 4] + l[15 & t],
    d = (t) => (240 & t) >> 4 == (15 & t);
  function u(t) {
    var e = (function (t) {
      return d(t.r) && d(t.g) && d(t.b) && d(t.a);
    })(t)
      ? c
      : h;
    return t ? '#' + e(t.r) + e(t.g) + e(t.b) + (t.a < 255 ? e(t.a) : '') : t;
  }
  function f(t) {
    return (t + 0.5) | 0;
  }
  const g = (t, e, i) => Math.max(Math.min(t, i), e);
  function p(t) {
    return g(f(2.55 * t), 0, 255);
  }
  function m(t) {
    return g(f(255 * t), 0, 255);
  }
  function x(t) {
    return g(f(t / 2.55) / 100, 0, 1);
  }
  function b(t) {
    return g(f(100 * t), 0, 100);
  }
  const _ =
    /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
  const y =
    /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
  function v(t, e, i) {
    const n = e * Math.min(i, 1 - i),
      o = (e, o = (e + t / 30) % 12) =>
        i - n * Math.max(Math.min(o - 3, 9 - o, 1), -1);
    return [o(0), o(8), o(4)];
  }
  function w(t, e, i) {
    const n = (n, o = (n + t / 60) % 6) =>
      i - i * e * Math.max(Math.min(o, 4 - o, 1), 0);
    return [n(5), n(3), n(1)];
  }
  function M(t, e, i) {
    const n = v(t, 1, 0.5);
    let o;
    for (
      e + i > 1 && ((o = 1 / (e + i)), (e *= o), (i *= o)), o = 0;
      o < 3;
      o++
    )
      (n[o] *= 1 - e - i), (n[o] += e);
    return n;
  }
  function k(t) {
    const e = t.r / 255,
      i = t.g / 255,
      n = t.b / 255,
      o = Math.max(e, i, n),
      s = Math.min(e, i, n),
      a = (o + s) / 2;
    let r, l, c;
    return (
      o !== s &&
        ((c = o - s),
        (l = a > 0.5 ? c / (2 - o - s) : c / (o + s)),
        (r =
          o === e
            ? (i - n) / c + (i < n ? 6 : 0)
            : o === i
              ? (n - e) / c + 2
              : (e - i) / c + 4),
        (r = 60 * r + 0.5)),
      [0 | r, l || 0, a]
    );
  }
  function S(t, e, i, n) {
    return (Array.isArray(e) ? t(e[0], e[1], e[2]) : t(e, i, n)).map(m);
  }
  function P(t, e, i) {
    return S(v, t, e, i);
  }
  function D(t) {
    return ((t % 360) + 360) % 360;
  }
  function C(t) {
    const e = y.exec(t);
    let i,
      n = 255;
    if (!e) return;
    e[5] !== i && (n = e[6] ? p(+e[5]) : m(+e[5]));
    const o = D(+e[2]),
      s = +e[3] / 100,
      a = +e[4] / 100;
    return (
      (i =
        'hwb' === e[1]
          ? (function (t, e, i) {
              return S(M, t, e, i);
            })(o, s, a)
          : 'hsv' === e[1]
            ? (function (t, e, i) {
                return S(w, t, e, i);
              })(o, s, a)
            : P(o, s, a)),
      { r: i[0], g: i[1], b: i[2], a: n }
    );
  }
  const O = {
      x: 'dark',
      Z: 'light',
      Y: 're',
      X: 'blu',
      W: 'gr',
      V: 'medium',
      U: 'slate',
      A: 'ee',
      T: 'ol',
      S: 'or',
      B: 'ra',
      C: 'lateg',
      D: 'ights',
      R: 'in',
      Q: 'turquois',
      E: 'hi',
      P: 'ro',
      O: 'al',
      N: 'le',
      M: 'de',
      L: 'yello',
      F: 'en',
      K: 'ch',
      G: 'arks',
      H: 'ea',
      I: 'ightg',
      J: 'wh'
    },
    A = {
      OiceXe: 'f0f8ff',
      antiquewEte: 'faebd7',
      aqua: 'ffff',
      aquamarRe: '7fffd4',
      azuY: 'f0ffff',
      beige: 'f5f5dc',
      bisque: 'ffe4c4',
      black: '0',
      blanKedOmond: 'ffebcd',
      Xe: 'ff',
      XeviTet: '8a2be2',
      bPwn: 'a52a2a',
      burlywood: 'deb887',
      caMtXe: '5f9ea0',
      KartYuse: '7fff00',
      KocTate: 'd2691e',
      cSO: 'ff7f50',
      cSnflowerXe: '6495ed',
      cSnsilk: 'fff8dc',
      crimson: 'dc143c',
      cyan: 'ffff',
      xXe: '8b',
      xcyan: '8b8b',
      xgTMnPd: 'b8860b',
      xWay: 'a9a9a9',
      xgYF: '6400',
      xgYy: 'a9a9a9',
      xkhaki: 'bdb76b',
      xmagFta: '8b008b',
      xTivegYF: '556b2f',
      xSange: 'ff8c00',
      xScEd: '9932cc',
      xYd: '8b0000',
      xsOmon: 'e9967a',
      xsHgYF: '8fbc8f',
      xUXe: '483d8b',
      xUWay: '2f4f4f',
      xUgYy: '2f4f4f',
      xQe: 'ced1',
      xviTet: '9400d3',
      dAppRk: 'ff1493',
      dApskyXe: 'bfff',
      dimWay: '696969',
      dimgYy: '696969',
      dodgerXe: '1e90ff',
      fiYbrick: 'b22222',
      flSOwEte: 'fffaf0',
      foYstWAn: '228b22',
      fuKsia: 'ff00ff',
      gaRsbSo: 'dcdcdc',
      ghostwEte: 'f8f8ff',
      gTd: 'ffd700',
      gTMnPd: 'daa520',
      Way: '808080',
      gYF: '8000',
      gYFLw: 'adff2f',
      gYy: '808080',
      honeyMw: 'f0fff0',
      hotpRk: 'ff69b4',
      RdianYd: 'cd5c5c',
      Rdigo: '4b0082',
      ivSy: 'fffff0',
      khaki: 'f0e68c',
      lavFMr: 'e6e6fa',
      lavFMrXsh: 'fff0f5',
      lawngYF: '7cfc00',
      NmoncEffon: 'fffacd',
      ZXe: 'add8e6',
      ZcSO: 'f08080',
      Zcyan: 'e0ffff',
      ZgTMnPdLw: 'fafad2',
      ZWay: 'd3d3d3',
      ZgYF: '90ee90',
      ZgYy: 'd3d3d3',
      ZpRk: 'ffb6c1',
      ZsOmon: 'ffa07a',
      ZsHgYF: '20b2aa',
      ZskyXe: '87cefa',
      ZUWay: '778899',
      ZUgYy: '778899',
      ZstAlXe: 'b0c4de',
      ZLw: 'ffffe0',
      lime: 'ff00',
      limegYF: '32cd32',
      lRF: 'faf0e6',
      magFta: 'ff00ff',
      maPon: '800000',
      VaquamarRe: '66cdaa',
      VXe: 'cd',
      VScEd: 'ba55d3',
      VpurpN: '9370db',
      VsHgYF: '3cb371',
      VUXe: '7b68ee',
      VsprRggYF: 'fa9a',
      VQe: '48d1cc',
      VviTetYd: 'c71585',
      midnightXe: '191970',
      mRtcYam: 'f5fffa',
      mistyPse: 'ffe4e1',
      moccasR: 'ffe4b5',
      navajowEte: 'ffdead',
      navy: '80',
      Tdlace: 'fdf5e6',
      Tive: '808000',
      TivedBb: '6b8e23',
      Sange: 'ffa500',
      SangeYd: 'ff4500',
      ScEd: 'da70d6',
      pOegTMnPd: 'eee8aa',
      pOegYF: '98fb98',
      pOeQe: 'afeeee',
      pOeviTetYd: 'db7093',
      papayawEp: 'ffefd5',
      pHKpuff: 'ffdab9',
      peru: 'cd853f',
      pRk: 'ffc0cb',
      plum: 'dda0dd',
      powMrXe: 'b0e0e6',
      purpN: '800080',
      YbeccapurpN: '663399',
      Yd: 'ff0000',
      Psybrown: 'bc8f8f',
      PyOXe: '4169e1',
      saddNbPwn: '8b4513',
      sOmon: 'fa8072',
      sandybPwn: 'f4a460',
      sHgYF: '2e8b57',
      sHshell: 'fff5ee',
      siFna: 'a0522d',
      silver: 'c0c0c0',
      skyXe: '87ceeb',
      UXe: '6a5acd',
      UWay: '708090',
      UgYy: '708090',
      snow: 'fffafa',
      sprRggYF: 'ff7f',
      stAlXe: '4682b4',
      tan: 'd2b48c',
      teO: '8080',
      tEstN: 'd8bfd8',
      tomato: 'ff6347',
      Qe: '40e0d0',
      viTet: 'ee82ee',
      JHt: 'f5deb3',
      wEte: 'ffffff',
      wEtesmoke: 'f5f5f5',
      Lw: 'ffff00',
      LwgYF: '9acd32'
    };
  let T;
  function R(t) {
    T ||
      ((T = (function () {
        const t = {},
          e = Object.keys(A),
          i = Object.keys(O);
        let n, o, s, a, r;
        for (n = 0; n < e.length; n++) {
          for (a = r = e[n], o = 0; o < i.length; o++)
            (s = i[o]), (r = r.replace(s, O[s]));
          (s = parseInt(A[a], 16)),
            (t[r] = [(s >> 16) & 255, (s >> 8) & 255, 255 & s]);
        }
        return t;
      })()),
      (T.transparent = [0, 0, 0, 0]));
    const e = T[t.toLowerCase()];
    return e && { r: e[0], g: e[1], b: e[2], a: 4 === e.length ? e[3] : 255 };
  }
  function L(t, e, i) {
    if (t) {
      let n = k(t);
      (n[e] = Math.max(0, Math.min(n[e] + n[e] * i, 0 === e ? 360 : 1))),
        (n = P(n)),
        (t.r = n[0]),
        (t.g = n[1]),
        (t.b = n[2]);
    }
  }
  function E(t, e) {
    return t ? Object.assign(e || {}, t) : t;
  }
  function I(t) {
    var e = { r: 0, g: 0, b: 0, a: 255 };
    return (
      Array.isArray(t)
        ? t.length >= 3 &&
          ((e = { r: t[0], g: t[1], b: t[2], a: 255 }),
          t.length > 3 && (e.a = m(t[3])))
        : ((e = E(t, { r: 0, g: 0, b: 0, a: 1 })).a = m(e.a)),
      e
    );
  }
  function F(t) {
    return 'r' === t.charAt(0)
      ? (function (t) {
          const e = _.exec(t);
          let i,
            n,
            o,
            s = 255;
          if (e) {
            if (e[7] !== i) {
              const t = +e[7];
              s = 255 & (e[8] ? p(t) : 255 * t);
            }
            return (
              (i = +e[1]),
              (n = +e[3]),
              (o = +e[5]),
              (i = 255 & (e[2] ? p(i) : i)),
              (n = 255 & (e[4] ? p(n) : n)),
              (o = 255 & (e[6] ? p(o) : o)),
              { r: i, g: n, b: o, a: s }
            );
          }
        })(t)
      : C(t);
  }
  class z {
    constructor(t) {
      if (t instanceof z) return t;
      const e = typeof t;
      let i;
      var n, o, s;
      'object' === e
        ? (i = I(t))
        : 'string' === e &&
          ((s = (n = t).length),
          '#' === n[0] &&
            (4 === s || 5 === s
              ? (o = {
                  r: 255 & (17 * r[n[1]]),
                  g: 255 & (17 * r[n[2]]),
                  b: 255 & (17 * r[n[3]]),
                  a: 5 === s ? 17 * r[n[4]] : 255
                })
              : (7 !== s && 9 !== s) ||
                (o = {
                  r: (r[n[1]] << 4) | r[n[2]],
                  g: (r[n[3]] << 4) | r[n[4]],
                  b: (r[n[5]] << 4) | r[n[6]],
                  a: 9 === s ? (r[n[7]] << 4) | r[n[8]] : 255
                })),
          (i = o || R(t) || F(t))),
        (this._rgb = i),
        (this._valid = !!i);
    }
    get valid() {
      return this._valid;
    }
    get rgb() {
      var t = E(this._rgb);
      return t && (t.a = x(t.a)), t;
    }
    set rgb(t) {
      this._rgb = I(t);
    }
    rgbString() {
      return this._valid
        ? (t = this._rgb) &&
            (t.a < 255
              ? `rgba(${t.r}, ${t.g}, ${t.b}, ${x(t.a)})`
              : `rgb(${t.r}, ${t.g}, ${t.b})`)
        : this._rgb;
      var t;
    }
    hexString() {
      return this._valid ? u(this._rgb) : this._rgb;
    }
    hslString() {
      return this._valid
        ? (function (t) {
            if (!t) return;
            const e = k(t),
              i = e[0],
              n = b(e[1]),
              o = b(e[2]);
            return t.a < 255
              ? `hsla(${i}, ${n}%, ${o}%, ${x(t.a)})`
              : `hsl(${i}, ${n}%, ${o}%)`;
          })(this._rgb)
        : this._rgb;
    }
    mix(t, e) {
      const i = this;
      if (t) {
        const n = i.rgb,
          o = t.rgb;
        let s;
        const a = e === s ? 0.5 : e,
          r = 2 * a - 1,
          l = n.a - o.a,
          c = ((r * l == -1 ? r : (r + l) / (1 + r * l)) + 1) / 2;
        (s = 1 - c),
          (n.r = 255 & (c * n.r + s * o.r + 0.5)),
          (n.g = 255 & (c * n.g + s * o.g + 0.5)),
          (n.b = 255 & (c * n.b + s * o.b + 0.5)),
          (n.a = a * n.a + (1 - a) * o.a),
          (i.rgb = n);
      }
      return i;
    }
    clone() {
      return new z(this.rgb);
    }
    alpha(t) {
      return (this._rgb.a = m(t)), this;
    }
    clearer(t) {
      return (this._rgb.a *= 1 - t), this;
    }
    greyscale() {
      const t = this._rgb,
        e = f(0.3 * t.r + 0.59 * t.g + 0.11 * t.b);
      return (t.r = t.g = t.b = e), this;
    }
    opaquer(t) {
      return (this._rgb.a *= 1 + t), this;
    }
    negate() {
      const t = this._rgb;
      return (t.r = 255 - t.r), (t.g = 255 - t.g), (t.b = 255 - t.b), this;
    }
    lighten(t) {
      return L(this._rgb, 2, t), this;
    }
    darken(t) {
      return L(this._rgb, 2, -t), this;
    }
    saturate(t) {
      return L(this._rgb, 1, t), this;
    }
    desaturate(t) {
      return L(this._rgb, 1, -t), this;
    }
    rotate(t) {
      return (
        (function (t, e) {
          var i = k(t);
          (i[0] = D(i[0] + e)),
            (i = P(i)),
            (t.r = i[0]),
            (t.g = i[1]),
            (t.b = i[2]);
        })(this._rgb, t),
        this
      );
    }
  }
  function V(t) {
    return new z(t);
  }
  const B = (t) => t instanceof CanvasGradient || t instanceof CanvasPattern;
  function W(t) {
    return B(t) ? t : V(t);
  }
  function N(t) {
    return B(t) ? t : V(t).saturate(0.5).darken(0.1).hexString();
  }
  function H() {}
  const j = (function () {
    let t = 0;
    return function () {
      return t++;
    };
  })();
  function $(t) {
    return null == t;
  }
  function Y(t) {
    if (Array.isArray && Array.isArray(t)) return !0;
    const e = Object.prototype.toString.call(t);
    return '[object' === e.substr(0, 7) && 'Array]' === e.substr(-6);
  }
  function U(t) {
    return (
      null !== t && '[object Object]' === Object.prototype.toString.call(t)
    );
  }
  const X = (t) =>
    ('number' == typeof t || t instanceof Number) && isFinite(+t);
  function q(t, e) {
    return X(t) ? t : e;
  }
  function K(t, e) {
    return void 0 === t ? e : t;
  }
  const G = (t, e) =>
      'string' == typeof t && t.endsWith('%') ? parseFloat(t) / 100 : t / e,
    Z = (t, e) =>
      'string' == typeof t && t.endsWith('%') ? (parseFloat(t) / 100) * e : +t;
  function Q(t, e, i) {
    if (t && 'function' == typeof t.call) return t.apply(i, e);
  }
  function J(t, e, i, n) {
    let o, s, a;
    if (Y(t))
      if (((s = t.length), n)) for (o = s - 1; o >= 0; o--) e.call(i, t[o], o);
      else for (o = 0; o < s; o++) e.call(i, t[o], o);
    else if (U(t))
      for (a = Object.keys(t), s = a.length, o = 0; o < s; o++)
        e.call(i, t[a[o]], a[o]);
  }
  function tt(t, e) {
    let i, n, o, s;
    if (!t || !e || t.length !== e.length) return !1;
    for (i = 0, n = t.length; i < n; ++i)
      if (
        ((o = t[i]),
        (s = e[i]),
        o.datasetIndex !== s.datasetIndex || o.index !== s.index)
      )
        return !1;
    return !0;
  }
  function et(t) {
    if (Y(t)) return t.map(et);
    if (U(t)) {
      const e = Object.create(null),
        i = Object.keys(t),
        n = i.length;
      let o = 0;
      for (; o < n; ++o) e[i[o]] = et(t[i[o]]);
      return e;
    }
    return t;
  }
  function it(t) {
    return -1 === ['__proto__', 'prototype', 'constructor'].indexOf(t);
  }
  function nt(t, e, i, n) {
    if (!it(t)) return;
    const o = e[t],
      s = i[t];
    U(o) && U(s) ? ot(o, s, n) : (e[t] = et(s));
  }
  function ot(t, e, i) {
    const n = Y(e) ? e : [e],
      o = n.length;
    if (!U(t)) return t;
    const s = (i = i || {}).merger || nt;
    for (let a = 0; a < o; ++a) {
      if (!U((e = n[a]))) continue;
      const o = Object.keys(e);
      for (let n = 0, a = o.length; n < a; ++n) s(o[n], t, e, i);
    }
    return t;
  }
  function st(t, e) {
    return ot(t, e, { merger: at });
  }
  function at(t, e, i) {
    if (!it(t)) return;
    const n = e[t],
      o = i[t];
    U(n) && U(o)
      ? st(n, o)
      : Object.prototype.hasOwnProperty.call(e, t) || (e[t] = et(o));
  }
  function rt(t, e) {
    const i = t.indexOf('.', e);
    return -1 === i ? t.length : i;
  }
  function lt(t, e) {
    if ('' === e) return t;
    let i = 0,
      n = rt(e, i);
    for (; t && n > i; )
      (t = t[e.substr(i, n - i)]), (i = n + 1), (n = rt(e, i));
    return t;
  }
  function ct(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  const ht = (t) => void 0 !== t,
    dt = (t) => 'function' == typeof t,
    ut = Object.create(null),
    ft = Object.create(null);
  function gt(t, e) {
    if (!e) return t;
    const i = e.split('.');
    for (let e = 0, n = i.length; e < n; ++e) {
      const n = i[e];
      t = t[n] || (t[n] = Object.create(null));
    }
    return t;
  }
  function pt(t, e, i) {
    return 'string' == typeof e ? ot(gt(t, e), i) : ot(gt(t, ''), e);
  }
  var mt = new (class {
    constructor(t) {
      (this.animation = void 0),
        (this.backgroundColor = 'rgba(0,0,0,0.1)'),
        (this.borderColor = 'rgba(0,0,0,0.1)'),
        (this.color = '#666'),
        (this.datasets = {}),
        (this.devicePixelRatio = (t) => t.chart.platform.getDevicePixelRatio()),
        (this.elements = {}),
        (this.events = [
          'mousemove',
          'mouseout',
          'click',
          'touchstart',
          'touchmove'
        ]),
        (this.font = {
          family: '\'Helvetica Neue\', \'Helvetica\', \'Arial\', sans-serif',
          size: 12,
          style: 'normal',
          lineHeight: 1.2,
          weight: null
        }),
        (this.hover = {}),
        (this.hoverBackgroundColor = (t, e) => N(e.backgroundColor)),
        (this.hoverBorderColor = (t, e) => N(e.borderColor)),
        (this.hoverColor = (t, e) => N(e.color)),
        (this.indexAxis = 'x'),
        (this.interaction = { mode: 'nearest', intersect: !0 }),
        (this.maintainAspectRatio = !0),
        (this.onHover = null),
        (this.onClick = null),
        (this.parsing = !0),
        (this.plugins = {}),
        (this.responsive = !0),
        (this.scale = void 0),
        (this.scales = {}),
        (this.showLine = !0),
        this.describe(t);
    }
    set(t, e) {
      return pt(this, t, e);
    }
    get(t) {
      return gt(this, t);
    }
    describe(t, e) {
      return pt(ft, t, e);
    }
    override(t, e) {
      return pt(ut, t, e);
    }
    route(t, e, i, n) {
      const o = gt(this, t),
        s = gt(this, i),
        a = '_' + e;
      Object.defineProperties(o, {
        [a]: { value: o[e], writable: !0 },
        [e]: {
          enumerable: !0,
          get() {
            const t = this[a],
              e = s[n];
            return U(t) ? Object.assign({}, e, t) : K(t, e);
          },
          set(t) {
            this[a] = t;
          }
        }
      });
    }
  })({
    _scriptable: (t) => !t.startsWith('on'),
    _indexable: (t) => 'events' !== t,
    hover: { _fallback: 'interaction' },
    interaction: { _scriptable: !1, _indexable: !1 }
  });
  const xt = Math.PI,
    bt = 2 * xt,
    _t = bt + xt,
    yt = Number.POSITIVE_INFINITY,
    vt = xt / 180,
    wt = xt / 2,
    Mt = xt / 4,
    kt = (2 * xt) / 3,
    St = Math.log10,
    Pt = Math.sign;
  function Dt(t) {
    const e = Math.pow(10, Math.floor(St(t))),
      i = t / e;
    return (i <= 1 ? 1 : i <= 2 ? 2 : i <= 5 ? 5 : 10) * e;
  }
  function Ct(t) {
    const e = [],
      i = Math.sqrt(t);
    let n;
    for (n = 1; n < i; n++) t % n == 0 && (e.push(n), e.push(t / n));
    return i === (0 | i) && e.push(i), e.sort((t, e) => t - e).pop(), e;
  }
  function Ot(t) {
    return !isNaN(parseFloat(t)) && isFinite(t);
  }
  function At(t, e, i) {
    return Math.abs(t - e) < i;
  }
  function Tt(t, e) {
    const i = Math.round(t);
    return i - e <= t && i + e >= t;
  }
  function Rt(t, e, i) {
    let n, o, s;
    for (n = 0, o = t.length; n < o; n++)
      (s = t[n][i]),
        isNaN(s) ||
          ((e.min = Math.min(e.min, s)), (e.max = Math.max(e.max, s)));
  }
  function Lt(t) {
    return t * (xt / 180);
  }
  function Et(t) {
    return t * (180 / xt);
  }
  function It(t) {
    if (!X(t)) return;
    let e = 1,
      i = 0;
    for (; Math.round(t * e) / e !== t; ) (e *= 10), i++;
    return i;
  }
  function Ft(t, e) {
    const i = e.x - t.x,
      n = e.y - t.y,
      o = Math.sqrt(i * i + n * n);
    let s = Math.atan2(n, i);
    return s < -0.5 * xt && (s += bt), { angle: s, distance: o };
  }
  function zt(t, e) {
    return Math.sqrt(Math.pow(e.x - t.x, 2) + Math.pow(e.y - t.y, 2));
  }
  function Vt(t, e) {
    return ((t - e + _t) % bt) - xt;
  }
  function Bt(t) {
    return ((t % bt) + bt) % bt;
  }
  function Wt(t, e, i) {
    const n = Bt(t),
      o = Bt(e),
      s = Bt(i),
      a = Bt(o - n),
      r = Bt(s - n),
      l = Bt(n - o),
      c = Bt(n - s);
    return n === o || n === s || (a > r && l < c);
  }
  function Nt(t, e, i) {
    return Math.max(e, Math.min(i, t));
  }
  function Ht(t) {
    return Nt(t, -32768, 32767);
  }
  function jt(t) {
    return !t || $(t.size) || $(t.family)
      ? null
      : (t.style ? t.style + ' ' : '') +
          (t.weight ? t.weight + ' ' : '') +
          t.size +
          'px ' +
          t.family;
  }
  function $t(t, e, i, n, o) {
    let s = e[o];
    return (
      s || ((s = e[o] = t.measureText(o).width), i.push(o)), s > n && (n = s), n
    );
  }
  function Yt(t, e, i, n) {
    let o = ((n = n || {}).data = n.data || {}),
      s = (n.garbageCollect = n.garbageCollect || []);
    n.font !== e &&
      ((o = n.data = {}), (s = n.garbageCollect = []), (n.font = e)),
      t.save(),
      (t.font = e);
    let a = 0;
    const r = i.length;
    let l, c, h, d, u;
    for (l = 0; l < r; l++)
      if (((d = i[l]), null != d && !0 !== Y(d))) a = $t(t, o, s, a, d);
      else if (Y(d))
        for (c = 0, h = d.length; c < h; c++)
          (u = d[c]), null == u || Y(u) || (a = $t(t, o, s, a, u));
    t.restore();
    const f = s.length / 2;
    if (f > i.length) {
      for (l = 0; l < f; l++) delete o[s[l]];
      s.splice(0, f);
    }
    return a;
  }
  function Ut(t, e, i) {
    const n = t.currentDevicePixelRatio,
      o = 0 !== i ? Math.max(i / 2, 0.5) : 0;
    return Math.round((e - o) * n) / n + o;
  }
  function Xt(t, e) {
    (e = e || t.getContext('2d')).save(),
      e.resetTransform(),
      e.clearRect(0, 0, t.width, t.height),
      e.restore();
  }
  function qt(t, e, i, n) {
    let o, s, a, r, l;
    const c = e.pointStyle,
      h = e.rotation,
      d = e.radius;
    let u = (h || 0) * vt;
    if (
      c &&
      'object' == typeof c &&
      ((o = c.toString()),
      '[object HTMLImageElement]' === o || '[object HTMLCanvasElement]' === o)
    )
      return (
        t.save(),
        t.translate(i, n),
        t.rotate(u),
        t.drawImage(c, -c.width / 2, -c.height / 2, c.width, c.height),
        void t.restore()
      );
    if (!(isNaN(d) || d <= 0)) {
      switch ((t.beginPath(), c)) {
        default:
          t.arc(i, n, d, 0, bt), t.closePath();
          break;
        case 'triangle':
          t.moveTo(i + Math.sin(u) * d, n - Math.cos(u) * d),
            (u += kt),
            t.lineTo(i + Math.sin(u) * d, n - Math.cos(u) * d),
            (u += kt),
            t.lineTo(i + Math.sin(u) * d, n - Math.cos(u) * d),
            t.closePath();
          break;
        case 'rectRounded':
          (l = 0.516 * d),
            (r = d - l),
            (s = Math.cos(u + Mt) * r),
            (a = Math.sin(u + Mt) * r),
            t.arc(i - s, n - a, l, u - xt, u - wt),
            t.arc(i + a, n - s, l, u - wt, u),
            t.arc(i + s, n + a, l, u, u + wt),
            t.arc(i - a, n + s, l, u + wt, u + xt),
            t.closePath();
          break;
        case 'rect':
          if (!h) {
            (r = Math.SQRT1_2 * d), t.rect(i - r, n - r, 2 * r, 2 * r);
            break;
          }
          u += Mt;
        case 'rectRot':
          (s = Math.cos(u) * d),
            (a = Math.sin(u) * d),
            t.moveTo(i - s, n - a),
            t.lineTo(i + a, n - s),
            t.lineTo(i + s, n + a),
            t.lineTo(i - a, n + s),
            t.closePath();
          break;
        case 'crossRot':
          u += Mt;
        case 'cross':
          (s = Math.cos(u) * d),
            (a = Math.sin(u) * d),
            t.moveTo(i - s, n - a),
            t.lineTo(i + s, n + a),
            t.moveTo(i + a, n - s),
            t.lineTo(i - a, n + s);
          break;
        case 'star':
          (s = Math.cos(u) * d),
            (a = Math.sin(u) * d),
            t.moveTo(i - s, n - a),
            t.lineTo(i + s, n + a),
            t.moveTo(i + a, n - s),
            t.lineTo(i - a, n + s),
            (u += Mt),
            (s = Math.cos(u) * d),
            (a = Math.sin(u) * d),
            t.moveTo(i - s, n - a),
            t.lineTo(i + s, n + a),
            t.moveTo(i + a, n - s),
            t.lineTo(i - a, n + s);
          break;
        case 'line':
          (s = Math.cos(u) * d),
            (a = Math.sin(u) * d),
            t.moveTo(i - s, n - a),
            t.lineTo(i + s, n + a);
          break;
        case 'dash':
          t.moveTo(i, n), t.lineTo(i + Math.cos(u) * d, n + Math.sin(u) * d);
      }
      t.fill(), e.borderWidth > 0 && t.stroke();
    }
  }
  function Kt(t, e, i) {
    return (
      (i = i || 0.5),
      t &&
        t.x > e.left - i &&
        t.x < e.right + i &&
        t.y > e.top - i &&
        t.y < e.bottom + i
    );
  }
  function Gt(t, e) {
    t.save(),
      t.beginPath(),
      t.rect(e.left, e.top, e.right - e.left, e.bottom - e.top),
      t.clip();
  }
  function Zt(t) {
    t.restore();
  }
  function Qt(t, e, i, n, o) {
    if (!e) return t.lineTo(i.x, i.y);
    if ('middle' === o) {
      const n = (e.x + i.x) / 2;
      t.lineTo(n, e.y), t.lineTo(n, i.y);
    } else ('after' === o) != !!n ? t.lineTo(e.x, i.y) : t.lineTo(i.x, e.y);
    t.lineTo(i.x, i.y);
  }
  function Jt(t, e, i, n) {
    if (!e) return t.lineTo(i.x, i.y);
    t.bezierCurveTo(
      n ? e.cp1x : e.cp2x,
      n ? e.cp1y : e.cp2y,
      n ? i.cp2x : i.cp1x,
      n ? i.cp2y : i.cp1y,
      i.x,
      i.y
    );
  }
  function te(t, e, i, n, o, s = {}) {
    const a = Y(e) ? e : [e],
      r = s.strokeWidth > 0 && '' !== s.strokeColor;
    let l, c;
    for (
      t.save(),
        s.translation && t.translate(s.translation[0], s.translation[1]),
        $(s.rotation) || t.rotate(s.rotation),
        t.font = o.string,
        s.color && (t.fillStyle = s.color),
        s.textAlign && (t.textAlign = s.textAlign),
        s.textBaseline && (t.textBaseline = s.textBaseline),
        l = 0;
      l < a.length;
      ++l
    ) {
      if (
        ((c = a[l]),
        r &&
          (s.strokeColor && (t.strokeStyle = s.strokeColor),
          $(s.strokeWidth) || (t.lineWidth = s.strokeWidth),
          t.strokeText(c, i, n, s.maxWidth)),
        t.fillText(c, i, n, s.maxWidth),
        s.strikethrough || s.underline)
      ) {
        const e = t.measureText(c),
          o = i - e.actualBoundingBoxLeft,
          a = i + e.actualBoundingBoxRight,
          r = n - e.actualBoundingBoxAscent,
          l = n + e.actualBoundingBoxDescent,
          h = s.strikethrough ? (r + l) / 2 : l;
        (t.strokeStyle = t.fillStyle),
          t.beginPath(),
          (t.lineWidth = s.decorationWidth || 2),
          t.moveTo(o, h),
          t.lineTo(a, h),
          t.stroke();
      }
      n += o.lineHeight;
    }
    t.restore();
  }
  function ee(t, e) {
    const { x: i, y: n, w: o, h: s, radius: a } = e;
    t.arc(i + a.topLeft, n + a.topLeft, a.topLeft, -wt, xt, !0),
      t.lineTo(i, n + s - a.bottomLeft),
      t.arc(i + a.bottomLeft, n + s - a.bottomLeft, a.bottomLeft, xt, wt, !0),
      t.lineTo(i + o - a.bottomRight, n + s),
      t.arc(
        i + o - a.bottomRight,
        n + s - a.bottomRight,
        a.bottomRight,
        wt,
        0,
        !0
      ),
      t.lineTo(i + o, n + a.topRight),
      t.arc(i + o - a.topRight, n + a.topRight, a.topRight, 0, -wt, !0),
      t.lineTo(i + a.topLeft, n);
  }
  function ie(t, e, i) {
    i = i || ((i) => t[i] < e);
    let n,
      o = t.length - 1,
      s = 0;
    for (; o - s > 1; ) (n = (s + o) >> 1), i(n) ? (s = n) : (o = n);
    return { lo: s, hi: o };
  }
  const ne = (t, e, i) => ie(t, i, (n) => t[n][e] < i),
    oe = (t, e, i) => ie(t, i, (n) => t[n][e] >= i);
  function se(t, e, i) {
    let n = 0,
      o = t.length;
    for (; n < o && t[n] < e; ) n++;
    for (; o > n && t[o - 1] > i; ) o--;
    return n > 0 || o < t.length ? t.slice(n, o) : t;
  }
  const ae = ['push', 'pop', 'shift', 'splice', 'unshift'];
  function re(t, e) {
    t._chartjs
      ? t._chartjs.listeners.push(e)
      : (Object.defineProperty(t, '_chartjs', {
          configurable: !0,
          enumerable: !1,
          value: { listeners: [e] }
        }),
        ae.forEach((e) => {
          const i = '_onData' + ct(e),
            n = t[e];
          Object.defineProperty(t, e, {
            configurable: !0,
            enumerable: !1,
            value(...e) {
              const o = n.apply(this, e);
              return (
                t._chartjs.listeners.forEach((t) => {
                  'function' == typeof t[i] && t[i](...e);
                }),
                o
              );
            }
          });
        }));
  }
  function le(t, e) {
    const i = t._chartjs;
    if (!i) return;
    const n = i.listeners,
      o = n.indexOf(e);
    -1 !== o && n.splice(o, 1),
      n.length > 0 ||
        (ae.forEach((e) => {
          delete t[e];
        }),
        delete t._chartjs);
  }
  function ce(t) {
    const e = new Set();
    let i, n;
    for (i = 0, n = t.length; i < n; ++i) e.add(t[i]);
    if (e.size === n) return t;
    const o = [];
    return (
      e.forEach((t) => {
        o.push(t);
      }),
      o
    );
  }
  function he(t) {
    let e = t.parentNode;
    return e && '[object ShadowRoot]' === e.toString() && (e = e.host), e;
  }
  function de(t, e, i) {
    let n;
    return (
      'string' == typeof t
        ? ((n = parseInt(t, 10)),
          -1 !== t.indexOf('%') && (n = (n / 100) * e.parentNode[i]))
        : (n = t),
      n
    );
  }
  const ue = (t) => window.getComputedStyle(t, null);
  function fe(t, e) {
    return ue(t).getPropertyValue(e);
  }
  const ge = ['top', 'right', 'bottom', 'left'];
  function pe(t, e, i) {
    const n = {};
    i = i ? '-' + i : '';
    for (let o = 0; o < 4; o++) {
      const s = ge[o];
      n[s] = parseFloat(t[e + '-' + s + i]) || 0;
    }
    return (n.width = n.left + n.right), (n.height = n.top + n.bottom), n;
  }
  function me(t, e) {
    const { canvas: i, currentDevicePixelRatio: n } = e,
      o = ue(i),
      s = 'border-box' === o.boxSizing,
      a = pe(o, 'padding'),
      r = pe(o, 'border', 'width'),
      {
        x: l,
        y: c,
        box: h
      } = (function (t, e) {
        const i = t.native || t,
          n = i.touches,
          o = n && n.length ? n[0] : i,
          { offsetX: s, offsetY: a } = o;
        let r,
          l,
          c = !1;
        if (
          ((t, e, i) => (t > 0 || e > 0) && (!i || !i.shadowRoot))(
            s,
            a,
            i.target
          )
        )
          (r = s), (l = a);
        else {
          const t = e.getBoundingClientRect();
          (r = o.clientX - t.left), (l = o.clientY - t.top), (c = !0);
        }
        return { x: r, y: l, box: c };
      })(t, i),
      d = a.left + (h && r.left),
      u = a.top + (h && r.top);
    let { width: f, height: g } = e;
    return (
      s && ((f -= a.width + r.width), (g -= a.height + r.height)),
      {
        x: Math.round((((l - d) / f) * i.width) / n),
        y: Math.round((((c - u) / g) * i.height) / n)
      }
    );
  }
  const xe = (t) => Math.round(10 * t) / 10;
  function be(t, e, i, n) {
    const o = ue(t),
      s = pe(o, 'margin'),
      a = de(o.maxWidth, t, 'clientWidth') || yt,
      r = de(o.maxHeight, t, 'clientHeight') || yt,
      l = (function (t, e, i) {
        let n, o;
        if (void 0 === e || void 0 === i) {
          const s = he(t);
          if (s) {
            const t = s.getBoundingClientRect(),
              a = ue(s),
              r = pe(a, 'border', 'width'),
              l = pe(a, 'padding');
            (e = t.width - l.width - r.width),
              (i = t.height - l.height - r.height),
              (n = de(a.maxWidth, s, 'clientWidth')),
              (o = de(a.maxHeight, s, 'clientHeight'));
          } else (e = t.clientWidth), (i = t.clientHeight);
        }
        return { width: e, height: i, maxWidth: n || yt, maxHeight: o || yt };
      })(t, e, i);
    let { width: c, height: h } = l;
    if ('content-box' === o.boxSizing) {
      const t = pe(o, 'border', 'width'),
        e = pe(o, 'padding');
      (c -= e.width + t.width), (h -= e.height + t.height);
    }
    return (
      (c = Math.max(0, c - s.width)),
      (h = Math.max(0, n ? Math.floor(c / n) : h - s.height)),
      (c = xe(Math.min(c, a, l.maxWidth))),
      (h = xe(Math.min(h, r, l.maxHeight))),
      c && !h && (h = xe(c / 2)),
      { width: c, height: h }
    );
  }
  function _e(t, e, i) {
    const n = (t.currentDevicePixelRatio = e || 1),
      { canvas: o, width: s, height: a } = t;
    (o.height = a * n),
      (o.width = s * n),
      t.ctx.setTransform(n, 0, 0, n, 0, 0),
      o.style &&
        (i || (!o.style.height && !o.style.width)) &&
        ((o.style.height = a + 'px'), (o.style.width = s + 'px'));
  }
  const ye = (function () {
    let t = !1;
    try {
      const e = {
        get passive() {
          return (t = !0), !1;
        }
      };
      window.addEventListener('test', null, e),
        window.removeEventListener('test', null, e);
    } catch (t) {}
    return t;
  })();
  function ve(t, e) {
    const i = fe(t, e),
      n = i && i.match(/^(\d+)(\.\d+)?px$/);
    return n ? +n[1] : void 0;
  }
  function we(t, e) {
    return 'native' in t ? { x: t.x, y: t.y } : me(t, e);
  }
  function Me(t, e, i, n) {
    const { controller: o, data: s, _sorted: a } = t,
      r = o._cachedMeta.iScale;
    if (r && e === r.axis && a && s.length) {
      const t = r._reversePixels ? oe : ne;
      if (!n) return t(s, e, i);
      if (o._sharedOptions) {
        const n = s[0],
          o = 'function' == typeof n.getRange && n.getRange(e);
        if (o) {
          const n = t(s, e, i - o),
            a = t(s, e, i + o);
          return { lo: n.lo, hi: a.hi };
        }
      }
    }
    return { lo: 0, hi: s.length - 1 };
  }
  function ke(t, e, i, n, o) {
    const s = t.getSortedVisibleDatasetMetas(),
      a = i[e];
    for (let t = 0, i = s.length; t < i; ++t) {
      const { index: i, data: r } = s[t],
        { lo: l, hi: c } = Me(s[t], e, a, o);
      for (let t = l; t <= c; ++t) {
        const e = r[t];
        e.skip || n(e, i, t);
      }
    }
  }
  function Se(t, e, i, n) {
    const o = [];
    if (!Kt(e, t.chartArea, t._minPadding)) return o;
    return (
      ke(
        t,
        i,
        e,
        function (t, i, s) {
          t.inRange(e.x, e.y, n) &&
            o.push({ element: t, datasetIndex: i, index: s });
        },
        !0
      ),
      o
    );
  }
  function Pe(t, e, i, n, o) {
    const s = (function (t) {
      const e = -1 !== t.indexOf('x'),
        i = -1 !== t.indexOf('y');
      return function (t, n) {
        const o = e ? Math.abs(t.x - n.x) : 0,
          s = i ? Math.abs(t.y - n.y) : 0;
        return Math.sqrt(Math.pow(o, 2) + Math.pow(s, 2));
      };
    })(i);
    let a = Number.POSITIVE_INFINITY,
      r = [];
    if (!Kt(e, t.chartArea, t._minPadding)) return r;
    return (
      ke(t, i, e, function (t, i, l) {
        if (n && !t.inRange(e.x, e.y, o)) return;
        const c = t.getCenterPoint(o),
          h = s(e, c);
        h < a
          ? ((r = [{ element: t, datasetIndex: i, index: l }]), (a = h))
          : h === a && r.push({ element: t, datasetIndex: i, index: l });
      }),
      r
    );
  }
  function De(t, e, i, n) {
    const o = we(e, t),
      s = [],
      a = i.axis,
      r = 'x' === a ? 'inXRange' : 'inYRange';
    let l = !1;
    return (
      (function (t, e) {
        const i = t.getSortedVisibleDatasetMetas();
        let n, o, s;
        for (let t = 0, a = i.length; t < a; ++t) {
          ({ index: n, data: o } = i[t]);
          for (let t = 0, i = o.length; t < i; ++t)
            (s = o[t]), s.skip || e(s, n, t);
        }
      })(t, (t, e, i) => {
        t[r](o[a], n) && s.push({ element: t, datasetIndex: e, index: i }),
          t.inRange(o.x, o.y, n) && (l = !0);
      }),
      i.intersect && !l ? [] : s
    );
  }
  var Ce = {
    modes: {
      index(t, e, i, n) {
        const o = we(e, t),
          s = i.axis || 'x',
          a = i.intersect ? Se(t, o, s, n) : Pe(t, o, s, !1, n),
          r = [];
        return a.length
          ? (t.getSortedVisibleDatasetMetas().forEach((t) => {
              const e = a[0].index,
                i = t.data[e];
              i &&
                !i.skip &&
                r.push({ element: i, datasetIndex: t.index, index: e });
            }),
            r)
          : [];
      },
      dataset(t, e, i, n) {
        const o = we(e, t),
          s = i.axis || 'xy';
        let a = i.intersect ? Se(t, o, s, n) : Pe(t, o, s, !1, n);
        if (a.length > 0) {
          const e = a[0].datasetIndex,
            i = t.getDatasetMeta(e).data;
          a = [];
          for (let t = 0; t < i.length; ++t)
            a.push({ element: i[t], datasetIndex: e, index: t });
        }
        return a;
      },
      point: (t, e, i, n) => Se(t, we(e, t), i.axis || 'xy', n),
      nearest: (t, e, i, n) => Pe(t, we(e, t), i.axis || 'xy', i.intersect, n),
      x: (t, e, i, n) => ((i.axis = 'x'), De(t, e, i, n)),
      y: (t, e, i, n) => ((i.axis = 'y'), De(t, e, i, n))
    }
  };
  const Oe = new RegExp(/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/),
    Ae = new RegExp(
      /^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/
    );
  function Te(t, e) {
    const i = ('' + t).match(Oe);
    if (!i || 'normal' === i[1]) return 1.2 * e;
    switch (((t = +i[2]), i[3])) {
      case 'px':
        return t;
      case '%':
        t /= 100;
    }
    return e * t;
  }
  function Re(t, e) {
    const i = {},
      n = U(e),
      o = n ? Object.keys(e) : e,
      s = U(t) ? (n ? (i) => K(t[i], t[e[i]]) : (e) => t[e]) : () => t;
    for (const t of o) i[t] = +s(t) || 0;
    return i;
  }
  function Le(t) {
    return Re(t, { top: 'y', right: 'x', bottom: 'y', left: 'x' });
  }
  function Ee(t) {
    return Re(t, ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']);
  }
  function Ie(t) {
    const e = Le(t);
    return (e.width = e.left + e.right), (e.height = e.top + e.bottom), e;
  }
  function Fe(t, e) {
    (t = t || {}), (e = e || mt.font);
    let i = K(t.size, e.size);
    'string' == typeof i && (i = parseInt(i, 10));
    let n = K(t.style, e.style);
    n &&
      !('' + n).match(Ae) &&
      (console.warn('Invalid font style specified: "' + n + '"'), (n = ''));
    const o = {
      family: K(t.family, e.family),
      lineHeight: Te(K(t.lineHeight, e.lineHeight), i),
      size: i,
      style: n,
      weight: K(t.weight, e.weight),
      string: ''
    };
    return (o.string = jt(o)), o;
  }
  function ze(t, e, i, n) {
    let o,
      s,
      a,
      r = !0;
    for (o = 0, s = t.length; o < s; ++o)
      if (
        ((a = t[o]),
        void 0 !== a &&
          (void 0 !== e && 'function' == typeof a && ((a = a(e)), (r = !1)),
          void 0 !== i && Y(a) && ((a = a[i % a.length]), (r = !1)),
          void 0 !== a))
      )
        return n && !r && (n.cacheable = !1), a;
  }
  function Ve(t, e) {
    const { min: i, max: n } = t;
    return { min: i - Math.abs(Z(e, i)), max: n + Z(e, n) };
  }
  const Be = ['left', 'top', 'right', 'bottom'];
  function We(t, e) {
    return t.filter((t) => t.pos === e);
  }
  function Ne(t, e) {
    return t.filter((t) => -1 === Be.indexOf(t.pos) && t.box.axis === e);
  }
  function He(t, e) {
    return t.sort((t, i) => {
      const n = e ? i : t,
        o = e ? t : i;
      return n.weight === o.weight ? n.index - o.index : n.weight - o.weight;
    });
  }
  function je(t, e, i, n) {
    return Math.max(t[i], e[i]) + Math.max(t[n], e[n]);
  }
  function $e(t, e) {
    (t.top = Math.max(t.top, e.top)),
      (t.left = Math.max(t.left, e.left)),
      (t.bottom = Math.max(t.bottom, e.bottom)),
      (t.right = Math.max(t.right, e.right));
  }
  function Ye(t, e, i) {
    const n = i.box,
      o = t.maxPadding;
    U(i.pos) ||
      (i.size && (t[i.pos] -= i.size),
      (i.size = i.horizontal ? n.height : n.width),
      (t[i.pos] += i.size)),
      n.getPadding && $e(o, n.getPadding());
    const s = Math.max(0, e.outerWidth - je(o, t, 'left', 'right')),
      a = Math.max(0, e.outerHeight - je(o, t, 'top', 'bottom')),
      r = s !== t.w,
      l = a !== t.h;
    return (
      (t.w = s),
      (t.h = a),
      i.horizontal ? { same: r, other: l } : { same: l, other: r }
    );
  }
  function Ue(t, e) {
    const i = e.maxPadding;
    function n(t) {
      const n = { left: 0, top: 0, right: 0, bottom: 0 };
      return (
        t.forEach((t) => {
          n[t] = Math.max(e[t], i[t]);
        }),
        n
      );
    }
    return n(t ? ['left', 'right'] : ['top', 'bottom']);
  }
  function Xe(t, e, i) {
    const n = [];
    let o, s, a, r, l, c;
    for (o = 0, s = t.length, l = 0; o < s; ++o) {
      (a = t[o]),
        (r = a.box),
        r.update(a.width || e.w, a.height || e.h, Ue(a.horizontal, e));
      const { same: s, other: h } = Ye(e, i, a);
      (l |= s && n.length), (c = c || h), r.fullSize || n.push(a);
    }
    return (l && Xe(n, e, i)) || c;
  }
  function qe(t, e, i) {
    const n = i.padding;
    let o,
      s,
      a,
      r,
      l = e.x,
      c = e.y;
    for (o = 0, s = t.length; o < s; ++o)
      (a = t[o]),
        (r = a.box),
        a.horizontal
          ? ((r.left = r.fullSize ? n.left : e.left),
            (r.right = r.fullSize ? i.outerWidth - n.right : e.left + e.w),
            (r.top = c),
            (r.bottom = c + r.height),
            (r.width = r.right - r.left),
            (c = r.bottom))
          : ((r.left = l),
            (r.right = l + r.width),
            (r.top = r.fullSize ? n.top : e.top),
            (r.bottom = r.fullSize ? i.outerHeight - n.right : e.top + e.h),
            (r.height = r.bottom - r.top),
            (l = r.right));
    (e.x = l), (e.y = c);
  }
  mt.set('layout', { padding: { top: 0, right: 0, bottom: 0, left: 0 } });
  var Ke = {
    addBox(t, e) {
      t.boxes || (t.boxes = []),
        (e.fullSize = e.fullSize || !1),
        (e.position = e.position || 'top'),
        (e.weight = e.weight || 0),
        (e._layers =
          e._layers ||
          function () {
            return [
              {
                z: 0,
                draw(t) {
                  e.draw(t);
                }
              }
            ];
          }),
        t.boxes.push(e);
    },
    removeBox(t, e) {
      const i = t.boxes ? t.boxes.indexOf(e) : -1;
      -1 !== i && t.boxes.splice(i, 1);
    },
    configure(t, e, i) {
      (e.fullSize = i.fullSize),
        (e.position = i.position),
        (e.weight = i.weight);
    },
    update(t, e, i, n) {
      if (!t) return;
      const o = Ie(t.options.layout.padding),
        s = e - o.width,
        a = i - o.height,
        r = (function (t) {
          const e = (function (t) {
              const e = [];
              let i, n, o;
              for (i = 0, n = (t || []).length; i < n; ++i)
                (o = t[i]),
                  e.push({
                    index: i,
                    box: o,
                    pos: o.position,
                    horizontal: o.isHorizontal(),
                    weight: o.weight
                  });
              return e;
            })(t),
            i = He(
              e.filter((t) => t.box.fullSize),
              !0
            ),
            n = He(We(e, 'left'), !0),
            o = He(We(e, 'right')),
            s = He(We(e, 'top'), !0),
            a = He(We(e, 'bottom')),
            r = Ne(e, 'x'),
            l = Ne(e, 'y');
          return {
            fullSize: i,
            leftAndTop: n.concat(s),
            rightAndBottom: o.concat(l).concat(a).concat(r),
            chartArea: We(e, 'chartArea'),
            vertical: n.concat(o).concat(l),
            horizontal: s.concat(a).concat(r)
          };
        })(t.boxes),
        l = r.vertical,
        c = r.horizontal;
      J(t.boxes, (t) => {
        'function' == typeof t.beforeLayout && t.beforeLayout();
      });
      const h =
          l.reduce(
            (t, e) =>
              e.box.options && !1 === e.box.options.display ? t : t + 1,
            0
          ) || 1,
        d = Object.freeze({
          outerWidth: e,
          outerHeight: i,
          padding: o,
          availableWidth: s,
          availableHeight: a,
          vBoxMaxWidth: s / 2 / h,
          hBoxMaxHeight: a / 2
        }),
        u = Object.assign({}, o);
      $e(u, Ie(n));
      const f = Object.assign(
        { maxPadding: u, w: s, h: a, x: o.left, y: o.top },
        o
      );
      !(function (t, e) {
        let i, n, o;
        for (i = 0, n = t.length; i < n; ++i)
          (o = t[i]),
            o.horizontal
              ? ((o.width = o.box.fullSize && e.availableWidth),
                (o.height = e.hBoxMaxHeight))
              : ((o.width = e.vBoxMaxWidth),
                (o.height = o.box.fullSize && e.availableHeight));
      })(l.concat(c), d),
        Xe(r.fullSize, f, d),
        Xe(l, f, d),
        Xe(c, f, d) && Xe(l, f, d),
        (function (t) {
          const e = t.maxPadding;
          function i(i) {
            const n = Math.max(e[i] - t[i], 0);
            return (t[i] += n), n;
          }
          (t.y += i('top')), (t.x += i('left')), i('right'), i('bottom');
        })(f),
        qe(r.leftAndTop, f, d),
        (f.x += f.w),
        (f.y += f.h),
        qe(r.rightAndBottom, f, d),
        (t.chartArea = {
          left: f.left,
          top: f.top,
          right: f.left + f.w,
          bottom: f.top + f.h,
          height: f.h,
          width: f.w
        }),
        J(r.chartArea, (e) => {
          const i = e.box;
          Object.assign(i, t.chartArea), i.update(f.w, f.h);
        });
    }
  };
  class Ge {
    acquireContext(t, e) {}
    releaseContext(t) {
      return !1;
    }
    addEventListener(t, e, i) {}
    removeEventListener(t, e, i) {}
    getDevicePixelRatio() {
      return 1;
    }
    getMaximumSize(t, e, i, n) {
      return (
        (e = Math.max(0, e || t.width)),
        (i = i || t.height),
        { width: e, height: Math.max(0, n ? Math.floor(e / n) : i) }
      );
    }
    isAttached(t) {
      return !0;
    }
  }
  class Ze extends Ge {
    acquireContext(t) {
      return (t && t.getContext && t.getContext('2d')) || null;
    }
  }
  const Qe = {
      touchstart: 'mousedown',
      touchmove: 'mousemove',
      touchend: 'mouseup',
      pointerenter: 'mouseenter',
      pointerdown: 'mousedown',
      pointermove: 'mousemove',
      pointerup: 'mouseup',
      pointerleave: 'mouseout',
      pointerout: 'mouseout'
    },
    Je = (t) => null === t || '' === t;
  const ti = !!ye && { passive: !0 };
  function ei(t, e, i) {
    t.canvas.removeEventListener(e, i, ti);
  }
  function ii(t, e, i) {
    const n = t.canvas,
      o = (n && he(n)) || n,
      s = new MutationObserver((t) => {
        const e = he(o);
        t.forEach((t) => {
          for (let n = 0; n < t.addedNodes.length; n++) {
            const s = t.addedNodes[n];
            (s !== o && s !== e) || i(t.target);
          }
        });
      });
    return s.observe(document, { childList: !0, subtree: !0 }), s;
  }
  function ni(t, e, i) {
    const n = t.canvas,
      o = n && he(n);
    if (!o) return;
    const s = new MutationObserver((t) => {
      t.forEach((t) => {
        for (let e = 0; e < t.removedNodes.length; e++)
          if (t.removedNodes[e] === n) {
            i();
            break;
          }
      });
    });
    return s.observe(o, { childList: !0 }), s;
  }
  const oi = new Map();
  let si = 0;
  function ai() {
    const t = window.devicePixelRatio;
    t !== si &&
      ((si = t),
      oi.forEach((e, i) => {
        i.currentDevicePixelRatio !== t && e();
      }));
  }
  function ri(t, i, n) {
    const o = t.canvas,
      s = o && he(o);
    if (!s) return;
    const a = e((t, e) => {
        const i = s.clientWidth;
        n(t, e), i < s.clientWidth && n();
      }, window),
      r = new ResizeObserver((t) => {
        const e = t[0],
          i = e.contentRect.width,
          n = e.contentRect.height;
        (0 === i && 0 === n) || a(i, n);
      });
    return (
      r.observe(s),
      (function (t, e) {
        oi.size || window.addEventListener('resize', ai), oi.set(t, e);
      })(t, a),
      r
    );
  }
  function li(t, e, i) {
    i && i.disconnect(),
      'resize' === e &&
        (function (t) {
          oi.delete(t), oi.size || window.removeEventListener('resize', ai);
        })(t);
  }
  function ci(t, i, n) {
    const o = t.canvas,
      s = e(
        (e) => {
          null !== t.ctx &&
            n(
              (function (t, e) {
                const i = Qe[t.type] || t.type,
                  { x: n, y: o } = me(t, e);
                return {
                  type: i,
                  chart: e,
                  native: t,
                  x: void 0 !== n ? n : null,
                  y: void 0 !== o ? o : null
                };
              })(e, t)
            );
        },
        t,
        (t) => {
          const e = t[0];
          return [e, e.offsetX, e.offsetY];
        }
      );
    return (
      (function (t, e, i) {
        t.addEventListener(e, i, ti);
      })(o, i, s),
      s
    );
  }
  class hi extends Ge {
    acquireContext(t, e) {
      const i = t && t.getContext && t.getContext('2d');
      return i && i.canvas === t
        ? ((function (t, e) {
            const i = t.style,
              n = t.getAttribute('height'),
              o = t.getAttribute('width');
            if (
              ((t.$chartjs = {
                initial: {
                  height: n,
                  width: o,
                  style: {
                    display: i.display,
                    height: i.height,
                    width: i.width
                  }
                }
              }),
              (i.display = i.display || 'block'),
              (i.boxSizing = i.boxSizing || 'border-box'),
              Je(o))
            ) {
              const e = ve(t, 'width');
              void 0 !== e && (t.width = e);
            }
            if (Je(n))
              if ('' === t.style.height) t.height = t.width / (e || 2);
              else {
                const e = ve(t, 'height');
                void 0 !== e && (t.height = e);
              }
          })(t, e),
          i)
        : null;
    }
    releaseContext(t) {
      const e = t.canvas;
      if (!e.$chartjs) return !1;
      const i = e.$chartjs.initial;
      ['height', 'width'].forEach((t) => {
        const n = i[t];
        $(n) ? e.removeAttribute(t) : e.setAttribute(t, n);
      });
      const n = i.style || {};
      return (
        Object.keys(n).forEach((t) => {
          e.style[t] = n[t];
        }),
        (e.width = e.width),
        delete e.$chartjs,
        !0
      );
    }
    addEventListener(t, e, i) {
      this.removeEventListener(t, e);
      const n = t.$proxies || (t.$proxies = {}),
        o = { attach: ii, detach: ni, resize: ri }[e] || ci;
      n[e] = o(t, e, i);
    }
    removeEventListener(t, e) {
      const i = t.$proxies || (t.$proxies = {}),
        n = i[e];
      if (!n) return;
      (({ attach: li, detach: li, resize: li })[e] || ei)(t, e, n),
        (i[e] = void 0);
    }
    getDevicePixelRatio() {
      return window.devicePixelRatio;
    }
    getMaximumSize(t, e, i, n) {
      return be(t, e, i, n);
    }
    isAttached(t) {
      const e = he(t);
      return !(!e || !he(e));
    }
  }
  var di = Object.freeze({
    __proto__: null,
    BasePlatform: Ge,
    BasicPlatform: Ze,
    DomPlatform: hi
  });
  const ui = (t) => 0 === t || 1 === t,
    fi = (t, e, i) =>
      -Math.pow(2, 10 * (t -= 1)) * Math.sin(((t - e) * bt) / i),
    gi = (t, e, i) => Math.pow(2, -10 * t) * Math.sin(((t - e) * bt) / i) + 1,
    pi = {
      linear: (t) => t,
      easeInQuad: (t) => t * t,
      easeOutQuad: (t) => -t * (t - 2),
      easeInOutQuad: (t) =>
        (t /= 0.5) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1),
      easeInCubic: (t) => t * t * t,
      easeOutCubic: (t) => (t -= 1) * t * t + 1,
      easeInOutCubic: (t) =>
        (t /= 0.5) < 1 ? 0.5 * t * t * t : 0.5 * ((t -= 2) * t * t + 2),
      easeInQuart: (t) => t * t * t * t,
      easeOutQuart: (t) => -((t -= 1) * t * t * t - 1),
      easeInOutQuart: (t) =>
        (t /= 0.5) < 1
          ? 0.5 * t * t * t * t
          : -0.5 * ((t -= 2) * t * t * t - 2),
      easeInQuint: (t) => t * t * t * t * t,
      easeOutQuint: (t) => (t -= 1) * t * t * t * t + 1,
      easeInOutQuint: (t) =>
        (t /= 0.5) < 1
          ? 0.5 * t * t * t * t * t
          : 0.5 * ((t -= 2) * t * t * t * t + 2),
      easeInSine: (t) => 1 - Math.cos(t * wt),
      easeOutSine: (t) => Math.sin(t * wt),
      easeInOutSine: (t) => -0.5 * (Math.cos(xt * t) - 1),
      easeInExpo: (t) => (0 === t ? 0 : Math.pow(2, 10 * (t - 1))),
      easeOutExpo: (t) => (1 === t ? 1 : 1 - Math.pow(2, -10 * t)),
      easeInOutExpo: (t) =>
        ui(t)
          ? t
          : t < 0.5
            ? 0.5 * Math.pow(2, 10 * (2 * t - 1))
            : 0.5 * (2 - Math.pow(2, -10 * (2 * t - 1))),
      easeInCirc: (t) => (t >= 1 ? t : -(Math.sqrt(1 - t * t) - 1)),
      easeOutCirc: (t) => Math.sqrt(1 - (t -= 1) * t),
      easeInOutCirc: (t) =>
        (t /= 0.5) < 1
          ? -0.5 * (Math.sqrt(1 - t * t) - 1)
          : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1),
      easeInElastic: (t) => (ui(t) ? t : fi(t, 0.075, 0.3)),
      easeOutElastic: (t) => (ui(t) ? t : gi(t, 0.075, 0.3)),
      easeInOutElastic(t) {
        const e = 0.1125;
        return ui(t)
          ? t
          : t < 0.5
            ? 0.5 * fi(2 * t, e, 0.45)
            : 0.5 + 0.5 * gi(2 * t - 1, e, 0.45);
      },
      easeInBack(t) {
        const e = 1.70158;
        return t * t * ((e + 1) * t - e);
      },
      easeOutBack(t) {
        const e = 1.70158;
        return (t -= 1) * t * ((e + 1) * t + e) + 1;
      },
      easeInOutBack(t) {
        let e = 1.70158;
        return (t /= 0.5) < 1
          ? t * t * ((1 + (e *= 1.525)) * t - e) * 0.5
          : 0.5 * ((t -= 2) * t * ((1 + (e *= 1.525)) * t + e) + 2);
      },
      easeInBounce: (t) => 1 - pi.easeOutBounce(1 - t),
      easeOutBounce(t) {
        const e = 7.5625,
          i = 2.75;
        return t < 1 / i
          ? e * t * t
          : t < 2 / i
            ? e * (t -= 1.5 / i) * t + 0.75
            : t < 2.5 / i
              ? e * (t -= 2.25 / i) * t + 0.9375
              : e * (t -= 2.625 / i) * t + 0.984375;
      },
      easeInOutBounce: (t) =>
        t < 0.5
          ? 0.5 * pi.easeInBounce(2 * t)
          : 0.5 * pi.easeOutBounce(2 * t - 1) + 0.5
    },
    mi = 'transparent',
    xi = {
      boolean: (t, e, i) => (i > 0.5 ? e : t),
      color(t, e, i) {
        const n = W(t || mi),
          o = n.valid && W(e || mi);
        return o && o.valid ? o.mix(n, i).hexString() : e;
      },
      number: (t, e, i) => t + (e - t) * i
    };
  class bi {
    constructor(t, e, i, n) {
      const o = e[i];
      n = ze([t.to, n, o, t.from]);
      const s = ze([t.from, o, n]);
      (this._active = !0),
        (this._fn = t.fn || xi[t.type || typeof s]),
        (this._easing = pi[t.easing] || pi.linear),
        (this._start = Math.floor(Date.now() + (t.delay || 0))),
        (this._duration = this._total = Math.floor(t.duration)),
        (this._loop = !!t.loop),
        (this._target = e),
        (this._prop = i),
        (this._from = s),
        (this._to = n),
        (this._promises = void 0);
    }
    active() {
      return this._active;
    }
    update(t, e, i) {
      const n = this;
      if (n._active) {
        n._notify(!1);
        const o = n._target[n._prop],
          s = i - n._start,
          a = n._duration - s;
        (n._start = i),
          (n._duration = Math.floor(Math.max(a, t.duration))),
          (n._total += s),
          (n._loop = !!t.loop),
          (n._to = ze([t.to, e, o, t.from])),
          (n._from = ze([t.from, o, e]));
      }
    }
    cancel() {
      const t = this;
      t._active && (t.tick(Date.now()), (t._active = !1), t._notify(!1));
    }
    tick(t) {
      const e = this,
        i = t - e._start,
        n = e._duration,
        o = e._prop,
        s = e._from,
        a = e._loop,
        r = e._to;
      let l;
      if (((e._active = s !== r && (a || i < n)), !e._active))
        return (e._target[o] = r), void e._notify(!0);
      i < 0
        ? (e._target[o] = s)
        : ((l = (i / n) % 2),
          (l = a && l > 1 ? 2 - l : l),
          (l = e._easing(Math.min(1, Math.max(0, l)))),
          (e._target[o] = e._fn(s, r, l)));
    }
    wait() {
      const t = this._promises || (this._promises = []);
      return new Promise((e, i) => {
        t.push({ res: e, rej: i });
      });
    }
    _notify(t) {
      const e = t ? 'res' : 'rej',
        i = this._promises || [];
      for (let t = 0; t < i.length; t++) i[t][e]();
    }
  }
  mt.set('animation', {
    delay: void 0,
    duration: 1e3,
    easing: 'easeOutQuart',
    fn: void 0,
    from: void 0,
    loop: void 0,
    to: void 0,
    type: void 0
  });
  const _i = Object.keys(mt.animation);
  mt.describe('animation', {
    _fallback: !1,
    _indexable: !1,
    _scriptable: (t) => 'onProgress' !== t && 'onComplete' !== t && 'fn' !== t
  }),
    mt.set('animations', {
      colors: {
        type: 'color',
        properties: ['color', 'borderColor', 'backgroundColor']
      },
      numbers: {
        type: 'number',
        properties: ['x', 'y', 'borderWidth', 'radius', 'tension']
      }
    }),
    mt.describe('animations', { _fallback: 'animation' }),
    mt.set('transitions', {
      active: { animation: { duration: 400 } },
      resize: { animation: { duration: 0 } },
      show: {
        animations: {
          colors: { from: 'transparent' },
          visible: { type: 'boolean', duration: 0 }
        }
      },
      hide: {
        animations: {
          colors: { to: 'transparent' },
          visible: { type: 'boolean', easing: 'linear', fn: (t) => 0 | t }
        }
      }
    });
  class yi {
    constructor(t, e) {
      (this._chart = t), (this._properties = new Map()), this.configure(e);
    }
    configure(t) {
      if (!U(t)) return;
      const e = this._properties;
      Object.getOwnPropertyNames(t).forEach((i) => {
        const n = t[i];
        if (!U(n)) return;
        const o = {};
        for (const t of _i) o[t] = n[t];
        ((Y(n.properties) && n.properties) || [i]).forEach((t) => {
          (t !== i && e.has(t)) || e.set(t, o);
        });
      });
    }
    _animateOptions(t, e) {
      const i = e.options,
        n = (function (t, e) {
          if (!e) return;
          let i = t.options;
          if (!i) return void (t.options = e);
          i.$shared &&
            (t.options = i =
              Object.assign({}, i, { $shared: !1, $animations: {} }));
          return i;
        })(t, i);
      if (!n) return [];
      const o = this._createAnimations(n, i);
      return (
        i.$shared &&
          (function (t, e) {
            const i = [],
              n = Object.keys(e);
            for (let e = 0; e < n.length; e++) {
              const o = t[n[e]];
              o && o.active() && i.push(o.wait());
            }
            return Promise.all(i);
          })(t.options.$animations, i).then(
            () => {
              t.options = i;
            },
            () => {}
          ),
        o
      );
    }
    _createAnimations(t, e) {
      const i = this._properties,
        n = [],
        o = t.$animations || (t.$animations = {}),
        s = Object.keys(e),
        a = Date.now();
      let r;
      for (r = s.length - 1; r >= 0; --r) {
        const l = s[r];
        if ('$' === l.charAt(0)) continue;
        if ('options' === l) {
          n.push(...this._animateOptions(t, e));
          continue;
        }
        const c = e[l];
        let h = o[l];
        const d = i.get(l);
        if (h) {
          if (d && h.active()) {
            h.update(d, c, a);
            continue;
          }
          h.cancel();
        }
        d && d.duration
          ? ((o[l] = h = new bi(d, t, l, c)), n.push(h))
          : (t[l] = c);
      }
      return n;
    }
    update(t, e) {
      if (0 === this._properties.size) return void Object.assign(t, e);
      const i = this._createAnimations(t, e);
      return i.length ? (a.add(this._chart, i), !0) : void 0;
    }
  }
  function vi(t, e) {
    const i = (t && t.options) || {},
      n = i.reverse,
      o = void 0 === i.min ? e : 0,
      s = void 0 === i.max ? e : 0;
    return { start: n ? s : o, end: n ? o : s };
  }
  function wi(t, e) {
    const i = [],
      n = t._getSortedDatasetMetas(e);
    let o, s;
    for (o = 0, s = n.length; o < s; ++o) i.push(n[o].index);
    return i;
  }
  function Mi(t, e, i, n) {
    const o = t.keys,
      s = 'single' === n.mode;
    let a, r, l, c;
    if (null !== e) {
      for (a = 0, r = o.length; a < r; ++a) {
        if (((l = +o[a]), l === i)) {
          if (n.all) continue;
          break;
        }
        (c = t.values[l]),
          X(c) && (s || 0 === e || Pt(e) === Pt(c)) && (e += c);
      }
      return e;
    }
  }
  function ki(t, e) {
    const i = t && t.options.stacked;
    return i || (void 0 === i && void 0 !== e.stack);
  }
  function Si(t, e, i) {
    const n = t[e] || (t[e] = {});
    return n[i] || (n[i] = {});
  }
  function Pi(t, e) {
    const { chart: i, _cachedMeta: n } = t,
      o = i._stacks || (i._stacks = {}),
      { iScale: s, vScale: a, index: r } = n,
      l = s.axis,
      c = a.axis,
      h = (function (t, e, i) {
        return `${t.id}.${e.id}.${i.stack || i.type}`;
      })(s, a, n),
      d = e.length;
    let u;
    for (let t = 0; t < d; ++t) {
      const i = e[t],
        { [l]: n, [c]: s } = i;
      (u = (i._stacks || (i._stacks = {}))[c] = Si(o, h, n)), (u[r] = s);
    }
  }
  function Di(t, e) {
    const i = t.scales;
    return Object.keys(i)
      .filter((t) => i[t].axis === e)
      .shift();
  }
  function Ci(t, e) {
    e = e || t._parsed;
    for (const i of e) {
      const e = i._stacks;
      if (!e || void 0 === e[t.vScale.id] || void 0 === e[t.vScale.id][t.index])
        return;
      delete e[t.vScale.id][t.index];
    }
  }
  const Oi = (t) => 'reset' === t || 'none' === t,
    Ai = (t, e) => (e ? t : Object.assign({}, t));
  class Ti {
    constructor(t, e) {
      (this.chart = t),
        (this._ctx = t.ctx),
        (this.index = e),
        (this._cachedDataOpts = {}),
        (this._cachedMeta = this.getMeta()),
        (this._type = this._cachedMeta.type),
        (this.options = void 0),
        (this._parsing = !1),
        (this._data = void 0),
        (this._objectData = void 0),
        (this._sharedOptions = void 0),
        (this._drawStart = void 0),
        (this._drawCount = void 0),
        (this.enableOptionSharing = !1),
        (this.$context = void 0),
        this.initialize();
    }
    initialize() {
      const t = this,
        e = t._cachedMeta;
      t.configure(),
        t.linkScales(),
        (e._stacked = ki(e.vScale, e)),
        t.addElements();
    }
    updateIndex(t) {
      this.index = t;
    }
    linkScales() {
      const t = this,
        e = t.chart,
        i = t._cachedMeta,
        n = t.getDataset(),
        o = (t, e, i, n) => ('x' === t ? e : 'r' === t ? n : i),
        s = (i.xAxisID = K(n.xAxisID, Di(e, 'x'))),
        a = (i.yAxisID = K(n.yAxisID, Di(e, 'y'))),
        r = (i.rAxisID = K(n.rAxisID, Di(e, 'r'))),
        l = i.indexAxis,
        c = (i.iAxisID = o(l, s, a, r)),
        h = (i.vAxisID = o(l, a, s, r));
      (i.xScale = t.getScaleForId(s)),
        (i.yScale = t.getScaleForId(a)),
        (i.rScale = t.getScaleForId(r)),
        (i.iScale = t.getScaleForId(c)),
        (i.vScale = t.getScaleForId(h));
    }
    getDataset() {
      return this.chart.data.datasets[this.index];
    }
    getMeta() {
      return this.chart.getDatasetMeta(this.index);
    }
    getScaleForId(t) {
      return this.chart.scales[t];
    }
    _getOtherScale(t) {
      const e = this._cachedMeta;
      return t === e.iScale ? e.vScale : e.iScale;
    }
    reset() {
      this._update('reset');
    }
    _destroy() {
      const t = this._cachedMeta;
      this._data && le(this._data, this), t._stacked && Ci(t);
    }
    _dataCheck() {
      const t = this,
        e = t.getDataset(),
        i = e.data || (e.data = []);
      U(i)
        ? (t._data = (function (t) {
            const e = Object.keys(t),
              i = new Array(e.length);
            let n, o, s;
            for (n = 0, o = e.length; n < o; ++n)
              (s = e[n]), (i[n] = { x: s, y: t[s] });
            return i;
          })(i))
        : t._data !== i &&
          (t._data && (le(t._data, t), Ci(t._cachedMeta)),
          i && Object.isExtensible(i) && re(i, t),
          (t._data = i));
    }
    addElements() {
      const t = this,
        e = t._cachedMeta;
      t._dataCheck(),
        t.datasetElementType && (e.dataset = new t.datasetElementType());
    }
    buildOrUpdateElements(t) {
      const e = this,
        i = e._cachedMeta,
        n = e.getDataset();
      let o = !1;
      e._dataCheck(),
        (i._stacked = ki(i.vScale, i)),
        i.stack !== n.stack && ((o = !0), Ci(i), (i.stack = n.stack)),
        e._resyncElements(t),
        o && Pi(e, i._parsed);
    }
    configure() {
      const t = this,
        e = t.chart.config,
        i = e.datasetScopeKeys(t._type),
        n = e.getOptionScopes(t.getDataset(), i, !0);
      (t.options = e.createResolver(n, t.getContext())),
        (t._parsing = t.options.parsing);
    }
    parse(t, e) {
      const i = this,
        { _cachedMeta: n, _data: o } = i,
        { iScale: s, _stacked: a } = n,
        r = s.axis;
      let l,
        c,
        h,
        d = (0 === t && e === o.length) || n._sorted,
        u = t > 0 && n._parsed[t - 1];
      if (!1 === i._parsing) (n._parsed = o), (n._sorted = !0);
      else {
        h = Y(o[t])
          ? i.parseArrayData(n, o, t, e)
          : U(o[t])
            ? i.parseObjectData(n, o, t, e)
            : i.parsePrimitiveData(n, o, t, e);
        const s = () => null === c[r] || (u && c[r] < u[r]);
        for (l = 0; l < e; ++l)
          (n._parsed[l + t] = c = h[l]), d && (s() && (d = !1), (u = c));
        n._sorted = d;
      }
      a && Pi(i, h);
    }
    parsePrimitiveData(t, e, i, n) {
      const { iScale: o, vScale: s } = t,
        a = o.axis,
        r = s.axis,
        l = o.getLabels(),
        c = o === s,
        h = new Array(n);
      let d, u, f;
      for (d = 0, u = n; d < u; ++d)
        (f = d + i),
          (h[d] = { [a]: c || o.parse(l[f], f), [r]: s.parse(e[f], f) });
      return h;
    }
    parseArrayData(t, e, i, n) {
      const { xScale: o, yScale: s } = t,
        a = new Array(n);
      let r, l, c, h;
      for (r = 0, l = n; r < l; ++r)
        (c = r + i),
          (h = e[c]),
          (a[r] = { x: o.parse(h[0], c), y: s.parse(h[1], c) });
      return a;
    }
    parseObjectData(t, e, i, n) {
      const { xScale: o, yScale: s } = t,
        { xAxisKey: a = 'x', yAxisKey: r = 'y' } = this._parsing,
        l = new Array(n);
      let c, h, d, u;
      for (c = 0, h = n; c < h; ++c)
        (d = c + i),
          (u = e[d]),
          (l[c] = { x: o.parse(lt(u, a), d), y: s.parse(lt(u, r), d) });
      return l;
    }
    getParsed(t) {
      return this._cachedMeta._parsed[t];
    }
    getDataElement(t) {
      return this._cachedMeta.data[t];
    }
    applyStack(t, e, i) {
      const n = this.chart,
        o = this._cachedMeta,
        s = e[t.axis];
      return Mi({ keys: wi(n, !0), values: e._stacks[t.axis] }, s, o.index, {
        mode: i
      });
    }
    updateRangeFromParsed(t, e, i, n) {
      const o = i[e.axis];
      let s = null === o ? NaN : o;
      const a = n && i._stacks[e.axis];
      n &&
        a &&
        ((n.values = a),
        (t.min = Math.min(t.min, s)),
        (t.max = Math.max(t.max, s)),
        (s = Mi(n, o, this._cachedMeta.index, { all: !0 }))),
        (t.min = Math.min(t.min, s)),
        (t.max = Math.max(t.max, s));
    }
    getMinMax(t, e) {
      const i = this,
        n = i._cachedMeta,
        o = n._parsed,
        s = n._sorted && t === n.iScale,
        a = o.length,
        r = i._getOtherScale(t),
        l = e && n._stacked && { keys: wi(i.chart, !0), values: null },
        c = { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
        { min: h, max: d } = (function (t) {
          const {
            min: e,
            max: i,
            minDefined: n,
            maxDefined: o
          } = t.getUserBounds();
          return {
            min: n ? e : Number.NEGATIVE_INFINITY,
            max: o ? i : Number.POSITIVE_INFINITY
          };
        })(r);
      let u, f, g, p;
      function m() {
        return (
          (g = o[u]), (f = g[t.axis]), (p = g[r.axis]), !X(f) || h > p || d < p
        );
      }
      for (
        u = 0;
        u < a && (m() || (i.updateRangeFromParsed(c, t, g, l), !s));
        ++u
      );
      if (s)
        for (u = a - 1; u >= 0; --u)
          if (!m()) {
            i.updateRangeFromParsed(c, t, g, l);
            break;
          }
      return c;
    }
    getAllParsedValues(t) {
      const e = this._cachedMeta._parsed,
        i = [];
      let n, o, s;
      for (n = 0, o = e.length; n < o; ++n)
        (s = e[n][t.axis]), X(s) && i.push(s);
      return i;
    }
    getMaxOverflow() {
      return !1;
    }
    getLabelAndValue(t) {
      const e = this._cachedMeta,
        i = e.iScale,
        n = e.vScale,
        o = this.getParsed(t);
      return {
        label: i ? '' + i.getLabelForValue(o[i.axis]) : '',
        value: n ? '' + n.getLabelForValue(o[n.axis]) : ''
      };
    }
    _update(t) {
      const e = this,
        i = e._cachedMeta;
      e.configure(),
        (e._cachedDataOpts = {}),
        e.update(t || 'default'),
        (i._clip = (function (t) {
          let e, i, n, o;
          return (
            U(t)
              ? ((e = t.top), (i = t.right), (n = t.bottom), (o = t.left))
              : (e = i = n = o = t),
            { top: e, right: i, bottom: n, left: o }
          );
        })(
          K(
            e.options.clip,
            (function (t, e, i) {
              if (!1 === i) return !1;
              const n = vi(t, i),
                o = vi(e, i);
              return {
                top: o.end,
                right: n.end,
                bottom: o.start,
                left: n.start
              };
            })(i.xScale, i.yScale, e.getMaxOverflow())
          )
        ));
    }
    update(t) {}
    draw() {
      const t = this,
        e = t._ctx,
        i = t.chart,
        n = t._cachedMeta,
        o = n.data || [],
        s = i.chartArea,
        a = [],
        r = t._drawStart || 0,
        l = t._drawCount || o.length - r;
      let c;
      for (n.dataset && n.dataset.draw(e, s, r, l), c = r; c < r + l; ++c) {
        const t = o[c];
        t.active ? a.push(t) : t.draw(e, s);
      }
      for (c = 0; c < a.length; ++c) a[c].draw(e, s);
    }
    getStyle(t, e) {
      const i = e ? 'active' : 'default';
      return void 0 === t && this._cachedMeta.dataset
        ? this.resolveDatasetElementOptions(i)
        : this.resolveDataElementOptions(t || 0, i);
    }
    getContext(t, e, i) {
      const n = this,
        o = n.getDataset();
      let s;
      if (t >= 0 && t < n._cachedMeta.data.length) {
        const e = n._cachedMeta.data[t];
        (s =
          e.$context ||
          (e.$context = (function (t, e, i) {
            return Object.assign(Object.create(t), {
              active: !1,
              dataIndex: e,
              parsed: void 0,
              raw: void 0,
              element: i,
              index: e,
              mode: 'default',
              type: 'data'
            });
          })(n.getContext(), t, e))),
          (s.parsed = n.getParsed(t)),
          (s.raw = o.data[t]);
      } else
        (s =
          n.$context ||
          (n.$context = (function (t, e) {
            return Object.assign(Object.create(t), {
              active: !1,
              dataset: void 0,
              datasetIndex: e,
              index: e,
              mode: 'default',
              type: 'dataset'
            });
          })(n.chart.getContext(), n.index))),
          (s.dataset = o);
      return (s.active = !!e), (s.mode = i), s;
    }
    resolveDatasetElementOptions(t) {
      return this._resolveElementOptions(this.datasetElementType.id, t);
    }
    resolveDataElementOptions(t, e) {
      return this._resolveElementOptions(this.dataElementType.id, e, t);
    }
    _resolveElementOptions(t, e = 'default', i) {
      const n = this,
        o = 'active' === e,
        s = n._cachedDataOpts,
        a = t + '-' + e,
        r = s[a],
        l = n.enableOptionSharing && ht(i);
      if (r) return Ai(r, l);
      const c = n.chart.config,
        h = c.datasetElementScopeKeys(n._type, t),
        d = o ? [t + 'Hover', 'hover', t, ''] : [t, ''],
        u = c.getOptionScopes(n.getDataset(), h),
        f = Object.keys(mt.elements[t]),
        g = c.resolveNamedOptions(u, f, () => n.getContext(i, o), d);
      return (
        g.$shared && ((g.$shared = l), (s[a] = Object.freeze(Ai(g, l)))), g
      );
    }
    _resolveAnimations(t, e, i) {
      const n = this,
        o = n.chart,
        s = n._cachedDataOpts,
        a = 'animation-' + e,
        r = s[a];
      if (r) return r;
      let l;
      if (!1 !== o.options.animation) {
        const o = n.chart.config,
          s = o.datasetAnimationScopeKeys(n._type, e),
          a = o.getOptionScopes(n.getDataset(), s);
        l = o.createResolver(a, n.getContext(t, i, e));
      }
      const c = new yi(o, l && l.animations);
      return l && l._cacheable && (s[a] = Object.freeze(c)), c;
    }
    getSharedOptions(t) {
      if (t.$shared)
        return (
          this._sharedOptions || (this._sharedOptions = Object.assign({}, t))
        );
    }
    includeOptions(t, e) {
      return !e || Oi(t) || this.chart._animationsDisabled;
    }
    updateElement(t, e, i, n) {
      Oi(n) ? Object.assign(t, i) : this._resolveAnimations(e, n).update(t, i);
    }
    updateSharedOptions(t, e, i) {
      t && !Oi(e) && this._resolveAnimations(void 0, e).update(t, i);
    }
    _setStyle(t, e, i, n) {
      t.active = n;
      const o = this.getStyle(e, n);
      this._resolveAnimations(e, i, n).update(t, {
        options: (!n && this.getSharedOptions(o)) || o
      });
    }
    removeHoverStyle(t, e, i) {
      this._setStyle(t, i, 'active', !1);
    }
    setHoverStyle(t, e, i) {
      this._setStyle(t, i, 'active', !0);
    }
    _removeDatasetHoverStyle() {
      const t = this._cachedMeta.dataset;
      t && this._setStyle(t, void 0, 'active', !1);
    }
    _setDatasetHoverStyle() {
      const t = this._cachedMeta.dataset;
      t && this._setStyle(t, void 0, 'active', !0);
    }
    _resyncElements(t) {
      const e = this,
        i = e._cachedMeta.data.length,
        n = e._data.length;
      n > i
        ? e._insertElements(i, n - i, t)
        : n < i && e._removeElements(n, i - n);
      const o = Math.min(n, i);
      o && e.parse(0, o);
    }
    _insertElements(t, e, i = !0) {
      const n = this,
        o = n._cachedMeta,
        s = o.data,
        a = t + e;
      let r;
      const l = (t) => {
        for (t.length += e, r = t.length - 1; r >= a; r--) t[r] = t[r - e];
      };
      for (l(s), r = t; r < a; ++r) s[r] = new n.dataElementType();
      n._parsing && l(o._parsed),
        n.parse(t, e),
        i && n.updateElements(s, t, e, 'reset');
    }
    updateElements(t, e, i, n) {}
    _removeElements(t, e) {
      const i = this._cachedMeta;
      if (this._parsing) {
        const n = i._parsed.splice(t, e);
        i._stacked && Ci(i, n);
      }
      i.data.splice(t, e);
    }
    _onDataPush() {
      const t = arguments.length;
      this._insertElements(this.getDataset().data.length - t, t);
    }
    _onDataPop() {
      this._removeElements(this._cachedMeta.data.length - 1, 1);
    }
    _onDataShift() {
      this._removeElements(0, 1);
    }
    _onDataSplice(t, e) {
      this._removeElements(t, e), this._insertElements(t, arguments.length - 2);
    }
    _onDataUnshift() {
      this._insertElements(0, arguments.length);
    }
  }
  (Ti.defaults = {}),
    (Ti.prototype.datasetElementType = null),
    (Ti.prototype.dataElementType = null);
  class Ri {
    constructor() {
      (this.x = void 0),
        (this.y = void 0),
        (this.active = !1),
        (this.options = void 0),
        (this.$animations = void 0);
    }
    tooltipPosition(t) {
      const { x: e, y: i } = this.getProps(['x', 'y'], t);
      return { x: e, y: i };
    }
    hasValue() {
      return Ot(this.x) && Ot(this.y);
    }
    getProps(t, e) {
      const i = this,
        n = this.$animations;
      if (!e || !n) return i;
      const o = {};
      return (
        t.forEach((t) => {
          o[t] = n[t] && n[t].active() ? n[t]._to : i[t];
        }),
        o
      );
    }
  }
  (Ri.defaults = {}), (Ri.defaultRoutes = void 0);
  const Li = new Map();
  function Ei(t, e, i) {
    return (function (t, e) {
      e = e || {};
      const i = t + JSON.stringify(e);
      let n = Li.get(i);
      return n || ((n = new Intl.NumberFormat(t, e)), Li.set(i, n)), n;
    })(e, i).format(t);
  }
  const Ii = {
    values: (t) => (Y(t) ? t : '' + t),
    numeric(t, e, i) {
      if (0 === t) return '0';
      const n = this.chart.options.locale;
      let o,
        s = t;
      if (i.length > 1) {
        const e = Math.max(
          Math.abs(i[0].value),
          Math.abs(i[i.length - 1].value)
        );
        (e < 1e-4 || e > 1e15) && (o = 'scientific'),
          (s = (function (t, e) {
            let i =
              e.length > 3 ? e[2].value - e[1].value : e[1].value - e[0].value;
            Math.abs(i) > 1 && t !== Math.floor(t) && (i = t - Math.floor(t));
            return i;
          })(t, i));
      }
      const a = St(Math.abs(s)),
        r = Math.max(Math.min(-1 * Math.floor(a), 20), 0),
        l = { notation: o, minimumFractionDigits: r, maximumFractionDigits: r };
      return Object.assign(l, this.options.ticks.format), Ei(t, n, l);
    },
    logarithmic(t, e, i) {
      if (0 === t) return '0';
      const n = t / Math.pow(10, Math.floor(St(t)));
      return 1 === n || 2 === n || 5 === n
        ? Ii.numeric.call(this, t, e, i)
        : '';
    }
  };
  var Fi = { formatters: Ii };
  function zi(t, e) {
    const i = t.options.ticks,
      n =
        i.maxTicksLimit ||
        (function (t) {
          const e = t.options.offset,
            i = t._tickSize(),
            n = t._length / i + (e ? 0 : 1),
            o = t._maxLength / i;
          return Math.floor(Math.min(n, o));
        })(t),
      o = i.major.enabled
        ? (function (t) {
            const e = [];
            let i, n;
            for (i = 0, n = t.length; i < n; i++) t[i].major && e.push(i);
            return e;
          })(e)
        : [],
      s = o.length,
      a = o[0],
      r = o[s - 1],
      l = [];
    if (s > n)
      return (
        (function (t, e, i, n) {
          let o,
            s = 0,
            a = i[0];
          for (n = Math.ceil(n), o = 0; o < t.length; o++)
            o === a && (e.push(t[o]), s++, (a = i[s * n]));
        })(e, l, o, s / n),
        l
      );
    const c = (function (t, e, i) {
      const n = (function (t) {
          const e = t.length;
          let i, n;
          if (e < 2) return !1;
          for (n = t[0], i = 1; i < e; ++i)
            if (t[i] - t[i - 1] !== n) return !1;
          return n;
        })(t),
        o = e.length / i;
      if (!n) return Math.max(o, 1);
      const s = Ct(n);
      for (let t = 0, e = s.length - 1; t < e; t++) {
        const e = s[t];
        if (e > o) return e;
      }
      return Math.max(o, 1);
    })(o, e, n);
    if (s > 0) {
      let t, i;
      const n = s > 1 ? Math.round((r - a) / (s - 1)) : null;
      for (Vi(e, l, c, $(n) ? 0 : a - n, a), t = 0, i = s - 1; t < i; t++)
        Vi(e, l, c, o[t], o[t + 1]);
      return Vi(e, l, c, r, $(n) ? e.length : r + n), l;
    }
    return Vi(e, l, c), l;
  }
  function Vi(t, e, i, n, o) {
    const s = K(n, 0),
      a = Math.min(K(o, t.length), t.length);
    let r,
      l,
      c,
      h = 0;
    for (
      i = Math.ceil(i), o && ((r = o - n), (i = r / Math.floor(r / i))), c = s;
      c < 0;

    )
      h++, (c = Math.round(s + h * i));
    for (l = Math.max(s, 0); l < a; l++)
      l === c && (e.push(t[l]), h++, (c = Math.round(s + h * i)));
  }
  mt.set('scale', {
    display: !0,
    offset: !1,
    reverse: !1,
    beginAtZero: !1,
    bounds: 'ticks',
    grace: 0,
    grid: {
      display: !0,
      lineWidth: 1,
      drawBorder: !0,
      drawOnChartArea: !0,
      drawTicks: !0,
      tickLength: 8,
      tickWidth: (t, e) => e.lineWidth,
      tickColor: (t, e) => e.color,
      offset: !1,
      borderDash: [],
      borderDashOffset: 0,
      borderWidth: 1
    },
    title: { display: !1, text: '', padding: { top: 4, bottom: 4 } },
    ticks: {
      minRotation: 0,
      maxRotation: 50,
      mirror: !1,
      textStrokeWidth: 0,
      textStrokeColor: '',
      padding: 3,
      display: !0,
      autoSkip: !0,
      autoSkipPadding: 3,
      labelOffset: 0,
      callback: Fi.formatters.values,
      minor: {},
      major: {},
      align: 'center',
      crossAlign: 'near'
    }
  }),
    mt.route('scale.ticks', 'color', '', 'color'),
    mt.route('scale.grid', 'color', '', 'borderColor'),
    mt.route('scale.grid', 'borderColor', '', 'borderColor'),
    mt.route('scale.title', 'color', '', 'color'),
    mt.describe('scale', {
      _fallback: !1,
      _scriptable: (t) =>
        !t.startsWith('before') &&
        !t.startsWith('after') &&
        'callback' !== t &&
        'parser' !== t,
      _indexable: (t) => 'borderDash' !== t && 'tickBorderDash' !== t
    }),
    mt.describe('scales', { _fallback: 'scale' });
  const Bi = (t, e, i) => ('top' === e || 'left' === e ? t[e] + i : t[e] - i);
  function Wi(t, e) {
    const i = [],
      n = t.length / e,
      o = t.length;
    let s = 0;
    for (; s < o; s += n) i.push(t[Math.floor(s)]);
    return i;
  }
  function Ni(t, e, i) {
    const n = t.ticks.length,
      o = Math.min(e, n - 1),
      s = t._startPixel,
      a = t._endPixel,
      r = 1e-6;
    let l,
      c = t.getPixelForTick(o);
    if (
      !(
        i &&
        ((l =
          1 === n
            ? Math.max(c - s, a - c)
            : 0 === e
              ? (t.getPixelForTick(1) - c) / 2
              : (c - t.getPixelForTick(o - 1)) / 2),
        (c += o < e ? l : -l),
        c < s - r || c > a + r)
      )
    )
      return c;
  }
  function Hi(t) {
    return t.drawTicks ? t.tickLength : 0;
  }
  function ji(t, e) {
    if (!t.display) return 0;
    const i = Fe(t.font, e),
      n = Ie(t.padding);
    return (Y(t.text) ? t.text.length : 1) * i.lineHeight + n.height;
  }
  function $i(t, e, i) {
    let o = n(t);
    return (
      ((i && 'right' !== e) || (!i && 'right' === e)) &&
        (o = ((t) => ('left' === t ? 'right' : 'right' === t ? 'left' : t))(o)),
      o
    );
  }
  class Yi extends Ri {
    constructor(t) {
      super(),
        (this.id = t.id),
        (this.type = t.type),
        (this.options = void 0),
        (this.ctx = t.ctx),
        (this.chart = t.chart),
        (this.top = void 0),
        (this.bottom = void 0),
        (this.left = void 0),
        (this.right = void 0),
        (this.width = void 0),
        (this.height = void 0),
        (this._margins = { left: 0, right: 0, top: 0, bottom: 0 }),
        (this.maxWidth = void 0),
        (this.maxHeight = void 0),
        (this.paddingTop = void 0),
        (this.paddingBottom = void 0),
        (this.paddingLeft = void 0),
        (this.paddingRight = void 0),
        (this.axis = void 0),
        (this.labelRotation = void 0),
        (this.min = void 0),
        (this.max = void 0),
        (this._range = void 0),
        (this.ticks = []),
        (this._gridLineItems = null),
        (this._labelItems = null),
        (this._labelSizes = null),
        (this._length = 0),
        (this._maxLength = 0),
        (this._longestTextCache = {}),
        (this._startPixel = void 0),
        (this._endPixel = void 0),
        (this._reversePixels = !1),
        (this._userMax = void 0),
        (this._userMin = void 0),
        (this._suggestedMax = void 0),
        (this._suggestedMin = void 0),
        (this._ticksLength = 0),
        (this._borderValue = 0),
        (this._cache = {}),
        (this._dataLimitsCached = !1),
        (this.$context = void 0);
    }
    init(t) {
      const e = this;
      (e.options = t.setContext(e.getContext())),
        (e.axis = t.axis),
        (e._userMin = e.parse(t.min)),
        (e._userMax = e.parse(t.max)),
        (e._suggestedMin = e.parse(t.suggestedMin)),
        (e._suggestedMax = e.parse(t.suggestedMax));
    }
    parse(t, e) {
      return t;
    }
    getUserBounds() {
      let {
        _userMin: t,
        _userMax: e,
        _suggestedMin: i,
        _suggestedMax: n
      } = this;
      return (
        (t = q(t, Number.POSITIVE_INFINITY)),
        (e = q(e, Number.NEGATIVE_INFINITY)),
        (i = q(i, Number.POSITIVE_INFINITY)),
        (n = q(n, Number.NEGATIVE_INFINITY)),
        { min: q(t, i), max: q(e, n), minDefined: X(t), maxDefined: X(e) }
      );
    }
    getMinMax(t) {
      const e = this;
      let i,
        { min: n, max: o, minDefined: s, maxDefined: a } = e.getUserBounds();
      if (s && a) return { min: n, max: o };
      const r = e.getMatchingVisibleMetas();
      for (let l = 0, c = r.length; l < c; ++l)
        (i = r[l].controller.getMinMax(e, t)),
          s || (n = Math.min(n, i.min)),
          a || (o = Math.max(o, i.max));
      return { min: q(n, q(o, n)), max: q(o, q(n, o)) };
    }
    getPadding() {
      const t = this;
      return {
        left: t.paddingLeft || 0,
        top: t.paddingTop || 0,
        right: t.paddingRight || 0,
        bottom: t.paddingBottom || 0
      };
    }
    getTicks() {
      return this.ticks;
    }
    getLabels() {
      const t = this.chart.data;
      return (
        this.options.labels ||
        (this.isHorizontal() ? t.xLabels : t.yLabels) ||
        t.labels ||
        []
      );
    }
    beforeLayout() {
      (this._cache = {}), (this._dataLimitsCached = !1);
    }
    beforeUpdate() {
      Q(this.options.beforeUpdate, [this]);
    }
    update(t, e, i) {
      const n = this,
        o = n.options.ticks,
        s = o.sampleSize;
      n.beforeUpdate(),
        (n.maxWidth = t),
        (n.maxHeight = e),
        (n._margins = i =
          Object.assign({ left: 0, right: 0, top: 0, bottom: 0 }, i)),
        (n.ticks = null),
        (n._labelSizes = null),
        (n._gridLineItems = null),
        (n._labelItems = null),
        n.beforeSetDimensions(),
        n.setDimensions(),
        n.afterSetDimensions(),
        (n._maxLength = n.isHorizontal()
          ? n.width + i.left + i.right
          : n.height + i.top + i.bottom),
        n._dataLimitsCached ||
          (n.beforeDataLimits(),
          n.determineDataLimits(),
          n.afterDataLimits(),
          (n._range = Ve(n, n.options.grace)),
          (n._dataLimitsCached = !0)),
        n.beforeBuildTicks(),
        (n.ticks = n.buildTicks() || []),
        n.afterBuildTicks();
      const a = s < n.ticks.length;
      n._convertTicksToLabels(a ? Wi(n.ticks, s) : n.ticks),
        n.configure(),
        n.beforeCalculateLabelRotation(),
        n.calculateLabelRotation(),
        n.afterCalculateLabelRotation(),
        o.display &&
          (o.autoSkip || 'auto' === o.source) &&
          ((n.ticks = zi(n, n.ticks)), (n._labelSizes = null)),
        a && n._convertTicksToLabels(n.ticks),
        n.beforeFit(),
        n.fit(),
        n.afterFit(),
        n.afterUpdate();
    }
    configure() {
      const t = this;
      let e,
        i,
        n = t.options.reverse;
      t.isHorizontal()
        ? ((e = t.left), (i = t.right))
        : ((e = t.top), (i = t.bottom), (n = !n)),
        (t._startPixel = e),
        (t._endPixel = i),
        (t._reversePixels = n),
        (t._length = i - e),
        (t._alignToPixels = t.options.alignToPixels);
    }
    afterUpdate() {
      Q(this.options.afterUpdate, [this]);
    }
    beforeSetDimensions() {
      Q(this.options.beforeSetDimensions, [this]);
    }
    setDimensions() {
      const t = this;
      t.isHorizontal()
        ? ((t.width = t.maxWidth), (t.left = 0), (t.right = t.width))
        : ((t.height = t.maxHeight), (t.top = 0), (t.bottom = t.height)),
        (t.paddingLeft = 0),
        (t.paddingTop = 0),
        (t.paddingRight = 0),
        (t.paddingBottom = 0);
    }
    afterSetDimensions() {
      Q(this.options.afterSetDimensions, [this]);
    }
    _callHooks(t) {
      const e = this;
      e.chart.notifyPlugins(t, e.getContext()), Q(e.options[t], [e]);
    }
    beforeDataLimits() {
      this._callHooks('beforeDataLimits');
    }
    determineDataLimits() {}
    afterDataLimits() {
      this._callHooks('afterDataLimits');
    }
    beforeBuildTicks() {
      this._callHooks('beforeBuildTicks');
    }
    buildTicks() {
      return [];
    }
    afterBuildTicks() {
      this._callHooks('afterBuildTicks');
    }
    beforeTickToLabelConversion() {
      Q(this.options.beforeTickToLabelConversion, [this]);
    }
    generateTickLabels(t) {
      const e = this,
        i = e.options.ticks;
      let n, o, s;
      for (n = 0, o = t.length; n < o; n++)
        (s = t[n]), (s.label = Q(i.callback, [s.value, n, t], e));
      for (n = 0; n < o; n++) $(t[n].label) && (t.splice(n, 1), o--, n--);
    }
    afterTickToLabelConversion() {
      Q(this.options.afterTickToLabelConversion, [this]);
    }
    beforeCalculateLabelRotation() {
      Q(this.options.beforeCalculateLabelRotation, [this]);
    }
    calculateLabelRotation() {
      const t = this,
        e = t.options,
        i = e.ticks,
        n = t.ticks.length,
        o = i.minRotation || 0,
        s = i.maxRotation;
      let a,
        r,
        l,
        c = o;
      if (
        !t._isVisible() ||
        !i.display ||
        o >= s ||
        n <= 1 ||
        !t.isHorizontal()
      )
        return void (t.labelRotation = o);
      const h = t._getLabelSizes(),
        d = h.widest.width,
        u = h.highest.height,
        f = Nt(t.chart.width - d, 0, t.maxWidth);
      (a = e.offset ? t.maxWidth / n : f / (n - 1)),
        d + 6 > a &&
          ((a = f / (n - (e.offset ? 0.5 : 1))),
          (r =
            t.maxHeight -
            Hi(e.grid) -
            i.padding -
            ji(e.title, t.chart.options.font)),
          (l = Math.sqrt(d * d + u * u)),
          (c = Et(
            Math.min(
              Math.asin(Math.min((h.highest.height + 6) / a, 1)),
              Math.asin(Math.min(r / l, 1)) - Math.asin(u / l)
            )
          )),
          (c = Math.max(o, Math.min(s, c)))),
        (t.labelRotation = c);
    }
    afterCalculateLabelRotation() {
      Q(this.options.afterCalculateLabelRotation, [this]);
    }
    beforeFit() {
      Q(this.options.beforeFit, [this]);
    }
    fit() {
      const t = this,
        e = { width: 0, height: 0 },
        {
          chart: i,
          options: { ticks: n, title: o, grid: s }
        } = t,
        a = t._isVisible(),
        r = t.isHorizontal();
      if (a) {
        const a = ji(o, i.options.font);
        if (
          (r
            ? ((e.width = t.maxWidth), (e.height = Hi(s) + a))
            : ((e.height = t.maxHeight), (e.width = Hi(s) + a)),
          n.display && t.ticks.length)
        ) {
          const {
              first: i,
              last: o,
              widest: s,
              highest: a
            } = t._getLabelSizes(),
            l = 2 * n.padding,
            c = Lt(t.labelRotation),
            h = Math.cos(c),
            d = Math.sin(c);
          if (r) {
            const i = n.mirror ? 0 : d * s.width + h * a.height;
            e.height = Math.min(t.maxHeight, e.height + i + l);
          } else {
            const i = n.mirror ? 0 : h * s.width + d * a.height;
            e.width = Math.min(t.maxWidth, e.width + i + l);
          }
          t._calculatePadding(i, o, d, h);
        }
      }
      t._handleMargins(),
        r
          ? ((t.width = t._length =
              i.width - t._margins.left - t._margins.right),
            (t.height = e.height))
          : ((t.width = e.width),
            (t.height = t._length =
              i.height - t._margins.top - t._margins.bottom));
    }
    _calculatePadding(t, e, i, n) {
      const o = this,
        {
          ticks: { align: s, padding: a },
          position: r
        } = o.options,
        l = 0 !== o.labelRotation,
        c = 'top' !== r && 'x' === o.axis;
      if (o.isHorizontal()) {
        const r = o.getPixelForTick(0) - o.left,
          h = o.right - o.getPixelForTick(o.ticks.length - 1);
        let d = 0,
          u = 0;
        l
          ? c
            ? ((d = n * t.width), (u = i * e.height))
            : ((d = i * t.height), (u = n * e.width))
          : 'start' === s
            ? (u = e.width)
            : 'end' === s
              ? (d = t.width)
              : ((d = t.width / 2), (u = e.width / 2)),
          (o.paddingLeft = Math.max(
            ((d - r + a) * o.width) / (o.width - r),
            0
          )),
          (o.paddingRight = Math.max(
            ((u - h + a) * o.width) / (o.width - h),
            0
          ));
      } else {
        let i = e.height / 2,
          n = t.height / 2;
        'start' === s
          ? ((i = 0), (n = t.height))
          : 'end' === s && ((i = e.height), (n = 0)),
          (o.paddingTop = i + a),
          (o.paddingBottom = n + a);
      }
    }
    _handleMargins() {
      const t = this;
      t._margins &&
        ((t._margins.left = Math.max(t.paddingLeft, t._margins.left)),
        (t._margins.top = Math.max(t.paddingTop, t._margins.top)),
        (t._margins.right = Math.max(t.paddingRight, t._margins.right)),
        (t._margins.bottom = Math.max(t.paddingBottom, t._margins.bottom)));
    }
    afterFit() {
      Q(this.options.afterFit, [this]);
    }
    isHorizontal() {
      const { axis: t, position: e } = this.options;
      return 'top' === e || 'bottom' === e || 'x' === t;
    }
    isFullSize() {
      return this.options.fullSize;
    }
    _convertTicksToLabels(t) {
      const e = this;
      e.beforeTickToLabelConversion(),
        e.generateTickLabels(t),
        e.afterTickToLabelConversion();
    }
    _getLabelSizes() {
      const t = this;
      let e = t._labelSizes;
      if (!e) {
        const i = t.options.ticks.sampleSize;
        let n = t.ticks;
        i < n.length && (n = Wi(n, i)),
          (t._labelSizes = e = t._computeLabelSizes(n, n.length));
      }
      return e;
    }
    _computeLabelSizes(t, e) {
      const { ctx: i, _longestTextCache: n } = this,
        o = [],
        s = [];
      let a,
        r,
        l,
        c,
        h,
        d,
        u,
        f,
        g,
        p,
        m,
        x = 0,
        b = 0;
      for (a = 0; a < e; ++a) {
        if (
          ((c = t[a].label),
          (h = this._resolveTickFontOptions(a)),
          (i.font = d = h.string),
          (u = n[d] = n[d] || { data: {}, gc: [] }),
          (f = h.lineHeight),
          (g = p = 0),
          $(c) || Y(c))
        ) {
          if (Y(c))
            for (r = 0, l = c.length; r < l; ++r)
              (m = c[r]),
                $(m) || Y(m) || ((g = $t(i, u.data, u.gc, g, m)), (p += f));
        } else (g = $t(i, u.data, u.gc, g, c)), (p = f);
        o.push(g), s.push(p), (x = Math.max(g, x)), (b = Math.max(p, b));
      }
      !(function (t, e) {
        J(t, (t) => {
          const i = t.gc,
            n = i.length / 2;
          let o;
          if (n > e) {
            for (o = 0; o < n; ++o) delete t.data[i[o]];
            i.splice(0, n);
          }
        });
      })(n, e);
      const _ = o.indexOf(x),
        y = s.indexOf(b),
        v = (t) => ({ width: o[t] || 0, height: s[t] || 0 });
      return { first: v(0), last: v(e - 1), widest: v(_), highest: v(y) };
    }
    getLabelForValue(t) {
      return t;
    }
    getPixelForValue(t, e) {
      return NaN;
    }
    getValueForPixel(t) {}
    getPixelForTick(t) {
      const e = this.ticks;
      return t < 0 || t > e.length - 1
        ? null
        : this.getPixelForValue(e[t].value);
    }
    getPixelForDecimal(t) {
      const e = this;
      e._reversePixels && (t = 1 - t);
      const i = e._startPixel + t * e._length;
      return Ht(e._alignToPixels ? Ut(e.chart, i, 0) : i);
    }
    getDecimalForPixel(t) {
      const e = (t - this._startPixel) / this._length;
      return this._reversePixels ? 1 - e : e;
    }
    getBasePixel() {
      return this.getPixelForValue(this.getBaseValue());
    }
    getBaseValue() {
      const { min: t, max: e } = this;
      return t < 0 && e < 0 ? e : t > 0 && e > 0 ? t : 0;
    }
    getContext(t) {
      const e = this,
        i = e.ticks || [];
      if (t >= 0 && t < i.length) {
        const n = i[t];
        return (
          n.$context ||
          (n.$context = (function (t, e, i) {
            return Object.assign(Object.create(t), {
              tick: i,
              index: e,
              type: 'tick'
            });
          })(e.getContext(), t, n))
        );
      }
      return (
        e.$context ||
        (e.$context =
          ((n = e.chart.getContext()),
          (o = e),
          Object.assign(Object.create(n), { scale: o, type: 'scale' })))
      );
      var n, o;
    }
    _tickSize() {
      const t = this,
        e = t.options.ticks,
        i = Lt(t.labelRotation),
        n = Math.abs(Math.cos(i)),
        o = Math.abs(Math.sin(i)),
        s = t._getLabelSizes(),
        a = e.autoSkipPadding || 0,
        r = s ? s.widest.width + a : 0,
        l = s ? s.highest.height + a : 0;
      return t.isHorizontal()
        ? l * n > r * o
          ? r / n
          : l / o
        : l * o < r * n
          ? l / n
          : r / o;
    }
    _isVisible() {
      const t = this.options.display;
      return 'auto' !== t ? !!t : this.getMatchingVisibleMetas().length > 0;
    }
    _computeGridLineItems(t) {
      const e = this,
        i = e.axis,
        n = e.chart,
        o = e.options,
        { grid: s, position: a } = o,
        r = s.offset,
        l = e.isHorizontal(),
        c = e.ticks.length + (r ? 1 : 0),
        h = Hi(s),
        d = [],
        u = s.setContext(e.getContext(0)),
        f = u.drawBorder ? u.borderWidth : 0,
        g = f / 2,
        p = function (t) {
          return Ut(n, t, f);
        };
      let m, x, b, _, y, v, w, M, k, S, P, D;
      if ('top' === a)
        (m = p(e.bottom)),
          (v = e.bottom - h),
          (M = m - g),
          (S = p(t.top) + g),
          (D = t.bottom);
      else if ('bottom' === a)
        (m = p(e.top)),
          (S = t.top),
          (D = p(t.bottom) - g),
          (v = m + g),
          (M = e.top + h);
      else if ('left' === a)
        (m = p(e.right)),
          (y = e.right - h),
          (w = m - g),
          (k = p(t.left) + g),
          (P = t.right);
      else if ('right' === a)
        (m = p(e.left)),
          (k = t.left),
          (P = p(t.right) - g),
          (y = m + g),
          (w = e.left + h);
      else if ('x' === i) {
        if ('center' === a) m = p((t.top + t.bottom) / 2 + 0.5);
        else if (U(a)) {
          const t = Object.keys(a)[0],
            i = a[t];
          m = p(e.chart.scales[t].getPixelForValue(i));
        }
        (S = t.top), (D = t.bottom), (v = m + g), (M = v + h);
      } else if ('y' === i) {
        if ('center' === a) m = p((t.left + t.right) / 2);
        else if (U(a)) {
          const t = Object.keys(a)[0],
            i = a[t];
          m = p(e.chart.scales[t].getPixelForValue(i));
        }
        (y = m - g), (w = y - h), (k = t.left), (P = t.right);
      }
      for (x = 0; x < c; ++x) {
        const t = s.setContext(e.getContext(x)),
          i = t.lineWidth,
          o = t.color,
          a = s.borderDash || [],
          c = t.borderDashOffset,
          h = t.tickWidth,
          u = t.tickColor,
          f = t.tickBorderDash || [],
          g = t.tickBorderDashOffset;
        (b = Ni(e, x, r)),
          void 0 !== b &&
            ((_ = Ut(n, b, i)),
            l ? (y = w = k = P = _) : (v = M = S = D = _),
            d.push({
              tx1: y,
              ty1: v,
              tx2: w,
              ty2: M,
              x1: k,
              y1: S,
              x2: P,
              y2: D,
              width: i,
              color: o,
              borderDash: a,
              borderDashOffset: c,
              tickWidth: h,
              tickColor: u,
              tickBorderDash: f,
              tickBorderDashOffset: g
            }));
      }
      return (e._ticksLength = c), (e._borderValue = m), d;
    }
    _computeLabelItems(t) {
      const e = this,
        i = e.axis,
        n = e.options,
        { position: o, ticks: s } = n,
        a = e.isHorizontal(),
        r = e.ticks,
        { align: l, crossAlign: c, padding: h, mirror: d } = s,
        u = Hi(n.grid),
        f = u + h,
        g = d ? -h : f,
        p = -Lt(e.labelRotation),
        m = [];
      let x,
        b,
        _,
        y,
        v,
        w,
        M,
        k,
        S,
        P,
        D,
        C,
        O = 'middle';
      if ('top' === o) (w = e.bottom - g), (M = e._getXAxisLabelAlignment());
      else if ('bottom' === o)
        (w = e.top + g), (M = e._getXAxisLabelAlignment());
      else if ('left' === o) {
        const t = e._getYAxisLabelAlignment(u);
        (M = t.textAlign), (v = t.x);
      } else if ('right' === o) {
        const t = e._getYAxisLabelAlignment(u);
        (M = t.textAlign), (v = t.x);
      } else if ('x' === i) {
        if ('center' === o) w = (t.top + t.bottom) / 2 + f;
        else if (U(o)) {
          const t = Object.keys(o)[0],
            i = o[t];
          w = e.chart.scales[t].getPixelForValue(i) + f;
        }
        M = e._getXAxisLabelAlignment();
      } else if ('y' === i) {
        if ('center' === o) v = (t.left + t.right) / 2 - f;
        else if (U(o)) {
          const t = Object.keys(o)[0],
            i = o[t];
          v = e.chart.scales[t].getPixelForValue(i);
        }
        M = e._getYAxisLabelAlignment(u).textAlign;
      }
      'y' === i &&
        ('start' === l ? (O = 'top') : 'end' === l && (O = 'bottom'));
      const A = e._getLabelSizes();
      for (x = 0, b = r.length; x < b; ++x) {
        (_ = r[x]), (y = _.label);
        const t = s.setContext(e.getContext(x));
        (k = e.getPixelForTick(x) + s.labelOffset),
          (S = e._resolveTickFontOptions(x)),
          (P = S.lineHeight),
          (D = Y(y) ? y.length : 1);
        const i = D / 2,
          n = t.color,
          l = t.textStrokeColor,
          h = t.textStrokeWidth;
        a
          ? ((v = k),
            (C =
              'top' === o
                ? 'near' === c || 0 !== p
                  ? -D * P + P / 2
                  : 'center' === c
                    ? -A.highest.height / 2 - i * P + P
                    : -A.highest.height + P / 2
                : 'near' === c || 0 !== p
                  ? P / 2
                  : 'center' === c
                    ? A.highest.height / 2 - i * P
                    : A.highest.height - D * P),
            d && (C *= -1))
          : ((w = k), (C = ((1 - D) * P) / 2)),
          m.push({
            rotation: p,
            label: y,
            font: S,
            color: n,
            strokeColor: l,
            strokeWidth: h,
            textOffset: C,
            textAlign: M,
            textBaseline: O,
            translation: [v, w]
          });
      }
      return m;
    }
    _getXAxisLabelAlignment() {
      const { position: t, ticks: e } = this.options;
      if (-Lt(this.labelRotation)) return 'top' === t ? 'left' : 'right';
      let i = 'center';
      return (
        'start' === e.align ? (i = 'left') : 'end' === e.align && (i = 'right'),
        i
      );
    }
    _getYAxisLabelAlignment(t) {
      const e = this,
        {
          position: i,
          ticks: { crossAlign: n, mirror: o, padding: s }
        } = e.options,
        a = t + s,
        r = e._getLabelSizes().widest.width;
      let l, c;
      return (
        'left' === i
          ? o
            ? ((l = 'left'), (c = e.right + s))
            : ((c = e.right - a),
              'near' === n
                ? (l = 'right')
                : 'center' === n
                  ? ((l = 'center'), (c -= r / 2))
                  : ((l = 'left'), (c = e.left)))
          : 'right' === i
            ? o
              ? ((l = 'right'), (c = e.left + s))
              : ((c = e.left + a),
                'near' === n
                  ? (l = 'left')
                  : 'center' === n
                    ? ((l = 'center'), (c += r / 2))
                    : ((l = 'right'), (c = e.right)))
            : (l = 'right'),
        { textAlign: l, x: c }
      );
    }
    _computeLabelArea() {
      const t = this;
      if (t.options.ticks.mirror) return;
      const e = t.chart,
        i = t.options.position;
      return 'left' === i || 'right' === i
        ? { top: 0, left: t.left, bottom: e.height, right: t.right }
        : 'top' === i || 'bottom' === i
          ? { top: t.top, left: 0, bottom: t.bottom, right: e.width }
          : void 0;
    }
    drawBackground() {
      const {
        ctx: t,
        options: { backgroundColor: e },
        left: i,
        top: n,
        width: o,
        height: s
      } = this;
      e && (t.save(), (t.fillStyle = e), t.fillRect(i, n, o, s), t.restore());
    }
    getLineWidthForValue(t) {
      const e = this,
        i = e.options.grid;
      if (!e._isVisible() || !i.display) return 0;
      const n = e.ticks.findIndex((e) => e.value === t);
      if (n >= 0) {
        return i.setContext(e.getContext(n)).lineWidth;
      }
      return 0;
    }
    drawGrid(t) {
      const e = this,
        i = e.options.grid,
        n = e.ctx,
        o = e.chart,
        s = i.setContext(e.getContext()),
        a = i.drawBorder ? s.borderWidth : 0,
        r = e._gridLineItems || (e._gridLineItems = e._computeGridLineItems(t));
      let l, c;
      const h = (t, e, i) => {
        i.width &&
          i.color &&
          (n.save(),
          (n.lineWidth = i.width),
          (n.strokeStyle = i.color),
          n.setLineDash(i.borderDash || []),
          (n.lineDashOffset = i.borderDashOffset),
          n.beginPath(),
          n.moveTo(t.x, t.y),
          n.lineTo(e.x, e.y),
          n.stroke(),
          n.restore());
      };
      if (i.display)
        for (l = 0, c = r.length; l < c; ++l) {
          const t = r[l];
          i.drawOnChartArea && h({ x: t.x1, y: t.y1 }, { x: t.x2, y: t.y2 }, t),
            i.drawTicks &&
              h(
                { x: t.tx1, y: t.ty1 },
                { x: t.tx2, y: t.ty2 },
                {
                  color: t.tickColor,
                  width: t.tickWidth,
                  borderDash: t.tickBorderDash,
                  borderDashOffset: t.tickBorderDashOffset
                }
              );
        }
      if (a) {
        const t = s.lineWidth,
          i = e._borderValue;
        let n, r, l, c;
        e.isHorizontal()
          ? ((n = Ut(o, e.left, a) - a / 2),
            (r = Ut(o, e.right, t) + t / 2),
            (l = c = i))
          : ((l = Ut(o, e.top, a) - a / 2),
            (c = Ut(o, e.bottom, t) + t / 2),
            (n = r = i)),
          h({ x: n, y: l }, { x: r, y: c }, { width: a, color: s.borderColor });
      }
    }
    drawLabels(t) {
      const e = this;
      if (!e.options.ticks.display) return;
      const i = e.ctx,
        n = e._computeLabelArea();
      n && Gt(i, n);
      const o = e._labelItems || (e._labelItems = e._computeLabelItems(t));
      let s, a;
      for (s = 0, a = o.length; s < a; ++s) {
        const t = o[s],
          e = t.font;
        te(i, t.label, 0, t.textOffset, e, t);
      }
      n && Zt(i);
    }
    drawTitle() {
      const {
        ctx: t,
        options: { position: e, title: i, reverse: n }
      } = this;
      if (!i.display) return;
      const s = Fe(i.font),
        a = Ie(i.padding),
        r = i.align;
      let l = s.lineHeight / 2;
      'bottom' === e
        ? ((l += a.bottom),
          Y(i.text) && (l += s.lineHeight * (i.text.length - 1)))
        : (l += a.top);
      const {
        titleX: c,
        titleY: h,
        maxWidth: d,
        rotation: u
      } = (function (t, e, i, n) {
        const { top: s, left: a, bottom: r, right: l } = t;
        let c,
          h,
          d,
          u = 0;
        return (
          t.isHorizontal()
            ? ((h = o(n, a, l)), (d = Bi(t, i, e)), (c = l - a))
            : ((h = Bi(t, i, e)),
              (d = o(n, r, s)),
              (u = 'left' === i ? -wt : wt)),
          { titleX: h, titleY: d, maxWidth: c, rotation: u }
        );
      })(this, l, e, r);
      te(t, i.text, 0, 0, s, {
        color: i.color,
        maxWidth: d,
        rotation: u,
        textAlign: $i(r, e, n),
        textBaseline: 'middle',
        translation: [c, h]
      });
    }
    draw(t) {
      const e = this;
      e._isVisible() &&
        (e.drawBackground(), e.drawGrid(t), e.drawTitle(), e.drawLabels(t));
    }
    _layers() {
      const t = this,
        e = t.options,
        i = (e.ticks && e.ticks.z) || 0,
        n = (e.grid && e.grid.z) || 0;
      return t._isVisible() && i !== n && t.draw === Yi.prototype.draw
        ? [
            {
              z: n,
              draw(e) {
                t.drawBackground(), t.drawGrid(e), t.drawTitle();
              }
            },
            {
              z: i,
              draw(e) {
                t.drawLabels(e);
              }
            }
          ]
        : [
            {
              z: i,
              draw(e) {
                t.draw(e);
              }
            }
          ];
    }
    getMatchingVisibleMetas(t) {
      const e = this,
        i = e.chart.getSortedVisibleDatasetMetas(),
        n = e.axis + 'AxisID',
        o = [];
      let s, a;
      for (s = 0, a = i.length; s < a; ++s) {
        const a = i[s];
        a[n] !== e.id || (t && a.type !== t) || o.push(a);
      }
      return o;
    }
    _resolveTickFontOptions(t) {
      return Fe(this.options.ticks.setContext(this.getContext(t)).font);
    }
  }
  function Ui(t, e = [''], i = t, n, o = () => t[0]) {
    ht(n) || (n = on('_fallback', t));
    const s = {
      [Symbol.toStringTag]: 'Object',
      _cacheable: !0,
      _scopes: t,
      _rootScopes: i,
      _fallback: n,
      _getTarget: o,
      override: (o) => Ui([o, ...t], e, i, n)
    };
    return new Proxy(s, {
      deleteProperty: (e, i) => (
        delete e[i], delete e._keys, delete t[0][i], !0
      ),
      get: (i, n) =>
        Zi(i, n, () =>
          (function (t, e, i, n) {
            let o;
            for (const s of e)
              if (((o = on(Ki(s, t), i)), ht(o)))
                return Gi(t, o) ? en(i, n, t, o) : o;
          })(n, e, t, i)
        ),
      getOwnPropertyDescriptor: (t, e) =>
        Reflect.getOwnPropertyDescriptor(t._scopes[0], e),
      getPrototypeOf: () => Reflect.getPrototypeOf(t[0]),
      has: (t, e) => sn(t).includes(e),
      ownKeys: (t) => sn(t),
      set: (t, e, i) => (
        ((t._storage || (t._storage = o()))[e] = i),
        delete t[e],
        delete t._keys,
        !0
      )
    });
  }
  function Xi(t, e, i, n) {
    const o = {
      _cacheable: !1,
      _proxy: t,
      _context: e,
      _subProxy: i,
      _stack: new Set(),
      _descriptors: qi(t, n),
      setContext: (e) => Xi(t, e, i, n),
      override: (o) => Xi(t.override(o), e, i, n)
    };
    return new Proxy(o, {
      deleteProperty: (e, i) => (delete e[i], delete t[i], !0),
      get: (t, e, i) =>
        Zi(t, e, () =>
          (function (t, e, i) {
            const { _proxy: n, _context: o, _subProxy: s, _descriptors: a } = t;
            let r = n[e];
            dt(r) &&
              a.isScriptable(e) &&
              (r = (function (t, e, i, n) {
                const { _proxy: o, _context: s, _subProxy: a, _stack: r } = i;
                if (r.has(t))
                  throw new Error(
                    'Recursion detected: ' + [...r].join('->') + '->' + t
                  );
                r.add(t),
                  (e = e(s, a || n)),
                  r.delete(t),
                  U(e) && (e = en(o._scopes, o, t, e));
                return e;
              })(e, r, t, i));
            Y(r) &&
              r.length &&
              (r = (function (t, e, i, n) {
                const {
                  _proxy: o,
                  _context: s,
                  _subProxy: a,
                  _descriptors: r
                } = i;
                if (ht(s.index) && n(t)) e = e[s.index % e.length];
                else if (U(e[0])) {
                  const i = e,
                    n = o._scopes.filter((t) => t !== i);
                  e = [];
                  for (const l of i) {
                    const i = en(n, o, t, l);
                    e.push(Xi(i, s, a && a[t], r));
                  }
                }
                return e;
              })(e, r, t, a.isIndexable));
            Gi(e, r) && (r = Xi(r, o, s && s[e], a));
            return r;
          })(t, e, i)
        ),
      getOwnPropertyDescriptor: (e, i) =>
        e._descriptors.allKeys
          ? Reflect.has(t, i)
            ? { enumerable: !0, configurable: !0 }
            : void 0
          : Reflect.getOwnPropertyDescriptor(t, i),
      getPrototypeOf: () => Reflect.getPrototypeOf(t),
      has: (e, i) => Reflect.has(t, i),
      ownKeys: () => Reflect.ownKeys(t),
      set: (e, i, n) => ((t[i] = n), delete e[i], !0)
    });
  }
  function qi(t, e = { scriptable: !0, indexable: !0 }) {
    const {
      _scriptable: i = e.scriptable,
      _indexable: n = e.indexable,
      _allKeys: o = e.allKeys
    } = t;
    return {
      allKeys: o,
      scriptable: i,
      indexable: n,
      isScriptable: dt(i) ? i : () => i,
      isIndexable: dt(n) ? n : () => n
    };
  }
  const Ki = (t, e) => (t ? t + ct(e) : e),
    Gi = (t, e) => U(e) && 'adapters' !== t;
  function Zi(t, e, i) {
    let n = t[e];
    return ht(n) || ((n = i()), ht(n) && (t[e] = n)), n;
  }
  function Qi(t, e, i) {
    return dt(t) ? t(e, i) : t;
  }
  const Ji = (t, e) =>
    !0 === t ? e : 'string' == typeof t ? lt(e, t) : void 0;
  function tn(t, e, i, n) {
    for (const o of e) {
      const e = Ji(i, o);
      if (e) {
        t.add(e);
        const o = Qi(e._fallback, i, e);
        if (ht(o) && o !== i && o !== n) return o;
      } else if (!1 === e && ht(n) && i !== n) return null;
    }
    return !1;
  }
  function en(t, e, i, n) {
    const o = e._rootScopes,
      s = Qi(e._fallback, i, n),
      a = [...t, ...o],
      r = new Set();
    r.add(n);
    let l = nn(r, a, i, s || i);
    return (
      null !== l &&
      (!ht(s) || s === i || ((l = nn(r, a, s, l)), null !== l)) &&
      Ui([...r], [''], o, s, () => {
        const t = e._getTarget();
        return i in t || (t[i] = {}), t[i];
      })
    );
  }
  function nn(t, e, i, n) {
    for (; i; ) i = tn(t, e, i, n);
    return i;
  }
  function on(t, e) {
    for (const i of e) {
      if (!i) continue;
      const e = i[t];
      if (ht(e)) return e;
    }
  }
  function sn(t) {
    let e = t._keys;
    return (
      e ||
        (e = t._keys =
          (function (t) {
            const e = new Set();
            for (const i of t)
              for (const t of Object.keys(i).filter((t) => !t.startsWith('_')))
                e.add(t);
            return [...e];
          })(t._scopes)),
      e
    );
  }
  const an = Number.EPSILON || 1e-14,
    rn = (t, e) => e < t.length && !t[e].skip && t[e];
  function ln(t, e, i, n) {
    const o = t.skip ? e : t,
      s = e,
      a = i.skip ? e : i,
      r = zt(s, o),
      l = zt(a, s);
    let c = r / (r + l),
      h = l / (r + l);
    (c = isNaN(c) ? 0 : c), (h = isNaN(h) ? 0 : h);
    const d = n * c,
      u = n * h;
    return {
      previous: { x: s.x - d * (a.x - o.x), y: s.y - d * (a.y - o.y) },
      next: { x: s.x + u * (a.x - o.x), y: s.y + u * (a.y - o.y) }
    };
  }
  function cn(t) {
    const e = t.length,
      i = Array(e).fill(0),
      n = Array(e);
    let o,
      s,
      a,
      r = rn(t, 0);
    for (o = 0; o < e; ++o)
      if (((s = a), (a = r), (r = rn(t, o + 1)), a)) {
        if (r) {
          const t = r.x - a.x;
          i[o] = 0 !== t ? (r.y - a.y) / t : 0;
        }
        n[o] = s
          ? r
            ? Pt(i[o - 1]) !== Pt(i[o])
              ? 0
              : (i[o - 1] + i[o]) / 2
            : i[o - 1]
          : i[o];
      }
    !(function (t, e, i) {
      const n = t.length;
      let o,
        s,
        a,
        r,
        l,
        c = rn(t, 0);
      for (let h = 0; h < n - 1; ++h)
        (l = c),
          (c = rn(t, h + 1)),
          l &&
            c &&
            (At(e[h], 0, an)
              ? (i[h] = i[h + 1] = 0)
              : ((o = i[h] / e[h]),
                (s = i[h + 1] / e[h]),
                (r = Math.pow(o, 2) + Math.pow(s, 2)),
                r <= 9 ||
                  ((a = 3 / Math.sqrt(r)),
                  (i[h] = o * a * e[h]),
                  (i[h + 1] = s * a * e[h]))));
    })(t, i, n),
      (function (t, e) {
        const i = t.length;
        let n,
          o,
          s,
          a = rn(t, 0);
        for (let r = 0; r < i; ++r) {
          if (((o = s), (s = a), (a = rn(t, r + 1)), !s)) continue;
          const { x: i, y: l } = s;
          o && ((n = (i - o.x) / 3), (s.cp1x = i - n), (s.cp1y = l - n * e[r])),
            a &&
              ((n = (a.x - i) / 3), (s.cp2x = i + n), (s.cp2y = l + n * e[r]));
        }
      })(t, n);
  }
  function hn(t, e, i) {
    return Math.max(Math.min(t, i), e);
  }
  function dn(t, e, i, n) {
    let o, s, a, r;
    if (
      (e.spanGaps && (t = t.filter((t) => !t.skip)),
      'monotone' === e.cubicInterpolationMode)
    )
      cn(t);
    else {
      let i = n ? t[t.length - 1] : t[0];
      for (o = 0, s = t.length; o < s; ++o)
        (a = t[o]),
          (r = ln(i, a, t[Math.min(o + 1, s - (n ? 0 : 1)) % s], e.tension)),
          (a.cp1x = r.previous.x),
          (a.cp1y = r.previous.y),
          (a.cp2x = r.next.x),
          (a.cp2y = r.next.y),
          (i = a);
    }
    e.capBezierPoints &&
      (function (t, e) {
        let i,
          n,
          o,
          s,
          a,
          r = Kt(t[0], e);
        for (i = 0, n = t.length; i < n; ++i)
          (a = s),
            (s = r),
            (r = i < n - 1 && Kt(t[i + 1], e)),
            s &&
              ((o = t[i]),
              a &&
                ((o.cp1x = hn(o.cp1x, e.left, e.right)),
                (o.cp1y = hn(o.cp1y, e.top, e.bottom))),
              r &&
                ((o.cp2x = hn(o.cp2x, e.left, e.right)),
                (o.cp2y = hn(o.cp2y, e.top, e.bottom))));
      })(t, i);
  }
  function un(t, e, i, n) {
    return { x: t.x + i * (e.x - t.x), y: t.y + i * (e.y - t.y) };
  }
  function fn(t, e, i, n) {
    return {
      x: t.x + i * (e.x - t.x),
      y:
        'middle' === n
          ? i < 0.5
            ? t.y
            : e.y
          : 'after' === n
            ? i < 1
              ? t.y
              : e.y
            : i > 0
              ? e.y
              : t.y
    };
  }
  function gn(t, e, i, n) {
    const o = { x: t.cp2x, y: t.cp2y },
      s = { x: e.cp1x, y: e.cp1y },
      a = un(t, o, i),
      r = un(o, s, i),
      l = un(s, e, i),
      c = un(a, r, i),
      h = un(r, l, i);
    return un(c, h, i);
  }
  function pn(t, e, i) {
    return t
      ? (function (t, e) {
          return {
            x: (i) => t + t + e - i,
            setWidth(t) {
              e = t;
            },
            textAlign: (t) =>
              'center' === t ? t : 'right' === t ? 'left' : 'right',
            xPlus: (t, e) => t - e,
            leftForLtr: (t, e) => t - e
          };
        })(e, i)
      : {
          x: (t) => t,
          setWidth(t) {},
          textAlign: (t) => t,
          xPlus: (t, e) => t + e,
          leftForLtr: (t, e) => t
        };
  }
  function mn(t, e) {
    let i, n;
    ('ltr' !== e && 'rtl' !== e) ||
      ((i = t.canvas.style),
      (n = [
        i.getPropertyValue('direction'),
        i.getPropertyPriority('direction')
      ]),
      i.setProperty('direction', e, 'important'),
      (t.prevTextDirection = n));
  }
  function xn(t, e) {
    void 0 !== e &&
      (delete t.prevTextDirection,
      t.canvas.style.setProperty('direction', e[0], e[1]));
  }
  function bn(t) {
    return 'angle' === t
      ? { between: Wt, compare: Vt, normalize: Bt }
      : {
          between: (t, e, i) => t >= Math.min(e, i) && t <= Math.max(i, e),
          compare: (t, e) => t - e,
          normalize: (t) => t
        };
  }
  function _n({ start: t, end: e, count: i, loop: n, style: o }) {
    return {
      start: t % i,
      end: e % i,
      loop: n && (e - t + 1) % i == 0,
      style: o
    };
  }
  function yn(t, e, i) {
    if (!i) return [t];
    const { property: n, start: o, end: s } = i,
      a = e.length,
      { compare: r, between: l, normalize: c } = bn(n),
      {
        start: h,
        end: d,
        loop: u,
        style: f
      } = (function (t, e, i) {
        const { property: n, start: o, end: s } = i,
          { between: a, normalize: r } = bn(n),
          l = e.length;
        let c,
          h,
          { start: d, end: u, loop: f } = t;
        if (f) {
          for (
            d += l, u += l, c = 0, h = l;
            c < h && a(r(e[d % l][n]), o, s);
            ++c
          )
            d--, u--;
          (d %= l), (u %= l);
        }
        return u < d && (u += l), { start: d, end: u, loop: f, style: t.style };
      })(t, e, i),
      g = [];
    let p,
      m,
      x,
      b = !1,
      _ = null;
    const y = () => b || (l(o, x, p) && 0 !== r(o, x)),
      v = () => !b || 0 === r(s, p) || l(s, x, p);
    for (let t = h, i = h; t <= d; ++t)
      (m = e[t % a]),
        m.skip ||
          ((p = c(m[n])),
          (b = l(p, o, s)),
          null === _ && y() && (_ = 0 === r(p, o) ? t : i),
          null !== _ &&
            v() &&
            (g.push(_n({ start: _, end: t, loop: u, count: a, style: f })),
            (_ = null)),
          (i = t),
          (x = p));
    return (
      null !== _ &&
        g.push(_n({ start: _, end: d, loop: u, count: a, style: f })),
      g
    );
  }
  function vn(t, e) {
    const i = [],
      n = t.segments;
    for (let o = 0; o < n.length; o++) {
      const s = yn(n[o], t.points, e);
      s.length && i.push(...s);
    }
    return i;
  }
  function wn(t, e) {
    const i = t.points,
      n = t.options.spanGaps,
      o = i.length;
    if (!o) return [];
    const s = !!t._loop,
      { start: a, end: r } = (function (t, e, i, n) {
        let o = 0,
          s = e - 1;
        if (i && !n) for (; o < e && !t[o].skip; ) o++;
        for (; o < e && t[o].skip; ) o++;
        for (o %= e, i && (s += o); s > o && t[s % e].skip; ) s--;
        return (s %= e), { start: o, end: s };
      })(i, o, s, n);
    if (!0 === n) return Mn([{ start: a, end: r, loop: s }], i, e);
    return Mn(
      (function (t, e, i, n) {
        const o = t.length,
          s = [];
        let a,
          r = e,
          l = t[e];
        for (a = e + 1; a <= i; ++a) {
          const i = t[a % o];
          i.skip || i.stop
            ? l.skip ||
              ((n = !1),
              s.push({ start: e % o, end: (a - 1) % o, loop: n }),
              (e = r = i.stop ? a : null))
            : ((r = a), l.skip && (e = a)),
            (l = i);
        }
        return null !== r && s.push({ start: e % o, end: r % o, loop: n }), s;
      })(i, a, r < a ? r + o : r, !!t._fullLoop && 0 === a && r === o - 1),
      i,
      e
    );
  }
  function Mn(t, e, i) {
    return i && i.setContext && e
      ? (function (t, e, i) {
          const n = e.length,
            o = [];
          let s = t[0].start,
            a = s;
          for (const r of t) {
            let t,
              l,
              c = e[s % n];
            for (a = s + 1; a <= r.end; a++) {
              const h = e[a % n];
              (l = kn(i.setContext({ type: 'segment', p0: c, p1: h }))),
                Sn(l, t) &&
                  (o.push({ start: s, end: a - 1, loop: r.loop, style: t }),
                  (t = l),
                  (s = a - 1)),
                (c = h),
                (t = l);
            }
            s < a - 1 &&
              (o.push({ start: s, end: a - 1, loop: r.loop, style: l }),
              (s = a - 1));
          }
          return o;
        })(t, e, i)
      : t;
  }
  function kn(t) {
    return {
      backgroundColor: t.backgroundColor,
      borderCapStyle: t.borderCapStyle,
      borderDash: t.borderDash,
      borderDashOffset: t.borderDashOffset,
      borderJoinStyle: t.borderJoinStyle,
      borderWidth: t.borderWidth,
      borderColor: t.borderColor
    };
  }
  function Sn(t, e) {
    return e && JSON.stringify(t) !== JSON.stringify(e);
  }
  var Pn = Object.freeze({
    __proto__: null,
    easingEffects: pi,
    color: W,
    getHoverColor: N,
    noop: H,
    uid: j,
    isNullOrUndef: $,
    isArray: Y,
    isObject: U,
    isFinite: X,
    finiteOrDefault: q,
    valueOrDefault: K,
    toPercentage: G,
    toDimension: Z,
    callback: Q,
    each: J,
    _elementsEqual: tt,
    clone: et,
    _merger: nt,
    merge: ot,
    mergeIf: st,
    _mergerIf: at,
    _deprecated: function (t, e, i, n) {
      void 0 !== e &&
        console.warn(
          t + ': "' + i + '" is deprecated. Please use "' + n + '" instead'
        );
    },
    resolveObjectKey: lt,
    _capitalize: ct,
    defined: ht,
    isFunction: dt,
    toFontString: jt,
    _measureText: $t,
    _longestText: Yt,
    _alignPixel: Ut,
    clearCanvas: Xt,
    drawPoint: qt,
    _isPointInArea: Kt,
    clipArea: Gt,
    unclipArea: Zt,
    _steppedLineTo: Qt,
    _bezierCurveTo: Jt,
    renderText: te,
    addRoundedRectPath: ee,
    _lookup: ie,
    _lookupByKey: ne,
    _rlookupByKey: oe,
    _filterBetween: se,
    listenArrayEvents: re,
    unlistenArrayEvents: le,
    _arrayUnique: ce,
    _createResolver: Ui,
    _attachContext: Xi,
    _descriptors: qi,
    splineCurve: ln,
    splineCurveMonotone: cn,
    _updateBezierControlPoints: dn,
    _getParentNode: he,
    getStyle: fe,
    getRelativePosition: me,
    getMaximumSize: be,
    retinaScale: _e,
    supportsEventListenerOptions: ye,
    readUsedSize: ve,
    fontString: function (t, e, i) {
      return e + ' ' + t + 'px ' + i;
    },
    requestAnimFrame: t,
    throttled: e,
    debounce: i,
    _toLeftRightCenter: n,
    _alignStartEnd: o,
    _textX: s,
    _pointInLine: un,
    _steppedInterpolation: fn,
    _bezierInterpolation: gn,
    formatNumber: Ei,
    toLineHeight: Te,
    _readValueToProps: Re,
    toTRBL: Le,
    toTRBLCorners: Ee,
    toPadding: Ie,
    toFont: Fe,
    resolve: ze,
    _addGrace: Ve,
    PI: xt,
    TAU: bt,
    PITAU: _t,
    INFINITY: yt,
    RAD_PER_DEG: vt,
    HALF_PI: wt,
    QUARTER_PI: Mt,
    TWO_THIRDS_PI: kt,
    log10: St,
    sign: Pt,
    niceNum: Dt,
    _factorize: Ct,
    isNumber: Ot,
    almostEquals: At,
    almostWhole: Tt,
    _setMinAndMaxByKey: Rt,
    toRadians: Lt,
    toDegrees: Et,
    _decimalPlaces: It,
    getAngleFromPoint: Ft,
    distanceBetweenPoints: zt,
    _angleDiff: Vt,
    _normalizeAngle: Bt,
    _angleBetween: Wt,
    _limitValue: Nt,
    _int16Range: Ht,
    getRtlAdapter: pn,
    overrideTextDirection: mn,
    restoreTextDirection: xn,
    _boundSegment: yn,
    _boundSegments: vn,
    _computeSegments: wn
  });
  class Dn {
    constructor(t, e, i) {
      (this.type = t),
        (this.scope = e),
        (this.override = i),
        (this.items = Object.create(null));
    }
    isForType(t) {
      return Object.prototype.isPrototypeOf.call(
        this.type.prototype,
        t.prototype
      );
    }
    register(t) {
      const e = this,
        i = Object.getPrototypeOf(t);
      let n;
      (function (t) {
        return 'id' in t && 'defaults' in t;
      })(i) && (n = e.register(i));
      const o = e.items,
        s = t.id,
        a = e.scope + '.' + s;
      if (!s) throw new Error('class does not have id: ' + t);
      return (
        s in o ||
          ((o[s] = t),
          (function (t, e, i) {
            const n = ot(Object.create(null), [
              i ? mt.get(i) : {},
              mt.get(e),
              t.defaults
            ]);
            mt.set(e, n),
              t.defaultRoutes &&
                (function (t, e) {
                  Object.keys(e).forEach((i) => {
                    const n = i.split('.'),
                      o = n.pop(),
                      s = [t].concat(n).join('.'),
                      a = e[i].split('.'),
                      r = a.pop(),
                      l = a.join('.');
                    mt.route(s, o, l, r);
                  });
                })(e, t.defaultRoutes);
            t.descriptors && mt.describe(e, t.descriptors);
          })(t, a, n),
          e.override && mt.override(t.id, t.overrides)),
        a
      );
    }
    get(t) {
      return this.items[t];
    }
    unregister(t) {
      const e = this.items,
        i = t.id,
        n = this.scope;
      i in e && delete e[i],
        n && i in mt[n] && (delete mt[n][i], this.override && delete ut[i]);
    }
  }
  var Cn = new (class {
    constructor() {
      (this.controllers = new Dn(Ti, 'datasets', !0)),
        (this.elements = new Dn(Ri, 'elements')),
        (this.plugins = new Dn(Object, 'plugins')),
        (this.scales = new Dn(Yi, 'scales')),
        (this._typedRegistries = [
          this.controllers,
          this.scales,
          this.elements
        ]);
    }
    add(...t) {
      this._each('register', t);
    }
    remove(...t) {
      this._each('unregister', t);
    }
    addControllers(...t) {
      this._each('register', t, this.controllers);
    }
    addElements(...t) {
      this._each('register', t, this.elements);
    }
    addPlugins(...t) {
      this._each('register', t, this.plugins);
    }
    addScales(...t) {
      this._each('register', t, this.scales);
    }
    getController(t) {
      return this._get(t, this.controllers, 'controller');
    }
    getElement(t) {
      return this._get(t, this.elements, 'element');
    }
    getPlugin(t) {
      return this._get(t, this.plugins, 'plugin');
    }
    getScale(t) {
      return this._get(t, this.scales, 'scale');
    }
    removeControllers(...t) {
      this._each('unregister', t, this.controllers);
    }
    removeElements(...t) {
      this._each('unregister', t, this.elements);
    }
    removePlugins(...t) {
      this._each('unregister', t, this.plugins);
    }
    removeScales(...t) {
      this._each('unregister', t, this.scales);
    }
    _each(t, e, i) {
      const n = this;
      [...e].forEach((e) => {
        const o = i || n._getRegistryForType(e);
        i || o.isForType(e) || (o === n.plugins && e.id)
          ? n._exec(t, o, e)
          : J(e, (e) => {
              const o = i || n._getRegistryForType(e);
              n._exec(t, o, e);
            });
      });
    }
    _exec(t, e, i) {
      const n = ct(t);
      Q(i['before' + n], [], i), e[t](i), Q(i['after' + n], [], i);
    }
    _getRegistryForType(t) {
      for (let e = 0; e < this._typedRegistries.length; e++) {
        const i = this._typedRegistries[e];
        if (i.isForType(t)) return i;
      }
      return this.plugins;
    }
    _get(t, e, i) {
      const n = e.get(t);
      if (void 0 === n)
        throw new Error('"' + t + '" is not a registered ' + i + '.');
      return n;
    }
  })();
  class On {
    constructor() {
      this._init = [];
    }
    notify(t, e, i, n) {
      const o = this;
      'beforeInit' === e &&
        ((o._init = o._createDescriptors(t, !0)),
        o._notify(o._init, t, 'install'));
      const s = n ? o._descriptors(t).filter(n) : o._descriptors(t),
        a = o._notify(s, t, e, i);
      return (
        'destroy' === e &&
          (o._notify(s, t, 'stop'), o._notify(o._init, t, 'uninstall')),
        a
      );
    }
    _notify(t, e, i, n) {
      n = n || {};
      for (const o of t) {
        const t = o.plugin;
        if (!1 === Q(t[i], [e, n, o.options], t) && n.cancelable) return !1;
      }
      return !0;
    }
    invalidate() {
      $(this._cache) ||
        ((this._oldCache = this._cache), (this._cache = void 0));
    }
    _descriptors(t) {
      if (this._cache) return this._cache;
      const e = (this._cache = this._createDescriptors(t));
      return this._notifyStateChanges(t), e;
    }
    _createDescriptors(t, e) {
      const i = t && t.config,
        n = K(i.options && i.options.plugins, {}),
        o = (function (t) {
          const e = [],
            i = Object.keys(Cn.plugins.items);
          for (let t = 0; t < i.length; t++) e.push(Cn.getPlugin(i[t]));
          const n = t.plugins || [];
          for (let t = 0; t < n.length; t++) {
            const i = n[t];
            -1 === e.indexOf(i) && e.push(i);
          }
          return e;
        })(i);
      return !1 !== n || e
        ? (function (t, e, i, n) {
            const o = [],
              s = t.getContext();
            for (let a = 0; a < e.length; a++) {
              const r = e[a],
                l = An(i[r.id], n);
              null !== l &&
                o.push({ plugin: r, options: Tn(t.config, r, l, s) });
            }
            return o;
          })(t, o, n, e)
        : [];
    }
    _notifyStateChanges(t) {
      const e = this._oldCache || [],
        i = this._cache,
        n = (t, e) =>
          t.filter((t) => !e.some((e) => t.plugin.id === e.plugin.id));
      this._notify(n(e, i), t, 'stop'), this._notify(n(i, e), t, 'start');
    }
  }
  function An(t, e) {
    return e || !1 !== t ? (!0 === t ? {} : t) : null;
  }
  function Tn(t, e, i, n) {
    const o = t.pluginScopeKeys(e),
      s = t.getOptionScopes(i, o);
    return t.createResolver(s, n, [''], {
      scriptable: !1,
      indexable: !1,
      allKeys: !0
    });
  }
  function Rn(t, e) {
    const i = mt.datasets[t] || {};
    return (
      ((e.datasets || {})[t] || {}).indexAxis ||
      e.indexAxis ||
      i.indexAxis ||
      'x'
    );
  }
  function Ln(t, e) {
    return 'x' === t || 'y' === t
      ? t
      : e.axis ||
          ('top' === (i = e.position) || 'bottom' === i
            ? 'x'
            : 'left' === i || 'right' === i
              ? 'y'
              : void 0) ||
          t.charAt(0).toLowerCase();
    var i;
  }
  function En(t) {
    const e = t.options || (t.options = {});
    (e.plugins = K(e.plugins, {})),
      (e.scales = (function (t, e) {
        const i = ut[t.type] || { scales: {} },
          n = e.scales || {},
          o = Rn(t.type, e),
          s = Object.create(null),
          a = Object.create(null);
        return (
          Object.keys(n).forEach((t) => {
            const e = n[t],
              r = Ln(t, e),
              l = (function (t, e) {
                return t === e ? '_index_' : '_value_';
              })(r, o),
              c = i.scales || {};
            (s[r] = s[r] || t),
              (a[t] = st(Object.create(null), [{ axis: r }, e, c[r], c[l]]));
          }),
          t.data.datasets.forEach((i) => {
            const o = i.type || t.type,
              r = i.indexAxis || Rn(o, e),
              l = (ut[o] || {}).scales || {};
            Object.keys(l).forEach((t) => {
              const e = (function (t, e) {
                  let i = t;
                  return (
                    '_index_' === t
                      ? (i = e)
                      : '_value_' === t && (i = 'x' === e ? 'y' : 'x'),
                    i
                  );
                })(t, r),
                o = i[e + 'AxisID'] || s[e] || e;
              (a[o] = a[o] || Object.create(null)),
                st(a[o], [{ axis: e }, n[o], l[t]]);
            });
          }),
          Object.keys(a).forEach((t) => {
            const e = a[t];
            st(e, [mt.scales[e.type], mt.scale]);
          }),
          a
        );
      })(t, e));
  }
  function In(t) {
    return (
      ((t = t || {}).datasets = t.datasets || []),
      (t.labels = t.labels || []),
      t
    );
  }
  const Fn = new Map(),
    zn = new Set();
  function Vn(t, e) {
    let i = Fn.get(t);
    return i || ((i = e()), Fn.set(t, i), zn.add(i)), i;
  }
  const Bn = (t, e, i) => {
    const n = lt(e, i);
    void 0 !== n && t.add(n);
  };
  class Wn {
    constructor(t) {
      (this._config = (function (t) {
        return ((t = t || {}).data = In(t.data)), En(t), t;
      })(t)),
        (this._scopeCache = new Map()),
        (this._resolverCache = new Map());
    }
    get type() {
      return this._config.type;
    }
    set type(t) {
      this._config.type = t;
    }
    get data() {
      return this._config.data;
    }
    set data(t) {
      this._config.data = In(t);
    }
    get options() {
      return this._config.options;
    }
    set options(t) {
      this._config.options = t;
    }
    get plugins() {
      return this._config.plugins;
    }
    update() {
      const t = this._config;
      this.clearCache(), En(t);
    }
    clearCache() {
      this._scopeCache.clear(), this._resolverCache.clear();
    }
    datasetScopeKeys(t) {
      return Vn(t, () => [['datasets.' + t, '']]);
    }
    datasetAnimationScopeKeys(t, e) {
      return Vn(`${t}.transition.${e}`, () => [
        [`datasets.${t}.transitions.${e}`, 'transitions.' + e],
        ['datasets.' + t, '']
      ]);
    }
    datasetElementScopeKeys(t, e) {
      return Vn(`${t}-${e}`, () => [
        [`datasets.${t}.elements.${e}`, 'datasets.' + t, 'elements.' + e, '']
      ]);
    }
    pluginScopeKeys(t) {
      const e = t.id;
      return Vn(`${this.type}-plugin-${e}`, () => [
        ['plugins.' + e, ...(t.additionalOptionScopes || [])]
      ]);
    }
    _cachedScopes(t, e) {
      const i = this._scopeCache;
      let n = i.get(t);
      return (n && !e) || ((n = new Map()), i.set(t, n)), n;
    }
    getOptionScopes(t, e, i) {
      const { options: n, type: o } = this,
        s = this._cachedScopes(t, i),
        a = s.get(e);
      if (a) return a;
      const r = new Set();
      e.forEach((e) => {
        t && (r.add(t), e.forEach((e) => Bn(r, t, e))),
          e.forEach((t) => Bn(r, n, t)),
          e.forEach((t) => Bn(r, ut[o] || {}, t)),
          e.forEach((t) => Bn(r, mt, t)),
          e.forEach((t) => Bn(r, ft, t));
      });
      const l = [...r];
      return zn.has(e) && s.set(e, l), l;
    }
    chartOptionScopes() {
      const { options: t, type: e } = this;
      return [t, ut[e] || {}, mt.datasets[e] || {}, { type: e }, mt, ft];
    }
    resolveNamedOptions(t, e, i, n = ['']) {
      const o = { $shared: !0 },
        { resolver: s, subPrefixes: a } = Nn(this._resolverCache, t, n);
      let r = s;
      if (
        (function (t, e) {
          const { isScriptable: i, isIndexable: n } = qi(t);
          for (const o of e)
            if ((i(o) && dt(t[o])) || (n(o) && Y(t[o]))) return !0;
          return !1;
        })(s, e)
      ) {
        o.$shared = !1;
        r = Xi(s, (i = dt(i) ? i() : i), this.createResolver(t, i, a));
      }
      for (const t of e) o[t] = r[t];
      return o;
    }
    createResolver(t, e, i = [''], n) {
      const { resolver: o } = Nn(this._resolverCache, t, i);
      return U(e) ? Xi(o, e, void 0, n) : o;
    }
  }
  function Nn(t, e, i) {
    let n = t.get(e);
    n || ((n = new Map()), t.set(e, n));
    const o = i.join();
    let s = n.get(o);
    if (!s) {
      (s = {
        resolver: Ui(e, i),
        subPrefixes: i.filter((t) => !t.toLowerCase().includes('hover'))
      }),
        n.set(o, s);
    }
    return s;
  }
  const Hn = ['top', 'bottom', 'left', 'right', 'chartArea'];
  function jn(t, e) {
    return 'top' === t || 'bottom' === t || (-1 === Hn.indexOf(t) && 'x' === e);
  }
  function $n(t, e) {
    return function (i, n) {
      return i[t] === n[t] ? i[e] - n[e] : i[t] - n[t];
    };
  }
  function Yn(t) {
    const e = t.chart,
      i = e.options.animation;
    e.notifyPlugins('afterRender'), Q(i && i.onComplete, [t], e);
  }
  function Un(t) {
    const e = t.chart,
      i = e.options.animation;
    Q(i && i.onProgress, [t], e);
  }
  function Xn() {
    return 'undefined' != typeof window && 'undefined' != typeof document;
  }
  function qn(t) {
    return (
      Xn() && 'string' == typeof t
        ? (t = document.getElementById(t))
        : t && t.length && (t = t[0]),
      t && t.canvas && (t = t.canvas),
      t
    );
  }
  const Kn = {},
    Gn = (t) => {
      const e = qn(t);
      return Object.values(Kn)
        .filter((t) => t.canvas === e)
        .pop();
    };
  class Zn {
    constructor(t, e) {
      const n = this;
      this.config = e = new Wn(e);
      const o = qn(t),
        s = Gn(o);
      if (s)
        throw new Error(
          'Canvas is already in use. Chart with ID \'' +
            s.id +
            '\' must be destroyed before the canvas can be reused.'
        );
      const r = e.createResolver(e.chartOptionScopes(), n.getContext());
      this.platform = n._initializePlatform(o, e);
      const l = n.platform.acquireContext(o, r.aspectRatio),
        c = l && l.canvas,
        h = c && c.height,
        d = c && c.width;
      (this.id = j()),
        (this.ctx = l),
        (this.canvas = c),
        (this.width = d),
        (this.height = h),
        (this._options = r),
        (this._aspectRatio = this.aspectRatio),
        (this._layers = []),
        (this._metasets = []),
        (this._stacks = void 0),
        (this.boxes = []),
        (this.currentDevicePixelRatio = void 0),
        (this.chartArea = void 0),
        (this._active = []),
        (this._lastEvent = void 0),
        (this._listeners = {}),
        (this._sortedMetasets = []),
        (this.scales = {}),
        (this.scale = void 0),
        (this._plugins = new On()),
        (this.$proxies = {}),
        (this._hiddenIndices = {}),
        (this.attached = !1),
        (this._animationsDisabled = void 0),
        (this.$context = void 0),
        (this._doResize = i(() => this.update('resize'), r.resizeDelay || 0)),
        (Kn[n.id] = n),
        l && c
          ? (a.listen(n, 'complete', Yn),
            a.listen(n, 'progress', Un),
            n._initialize(),
            n.attached && n.update())
          : console.error(
              'Failed to create chart: can\'t acquire context from the given item'
            );
    }
    get aspectRatio() {
      const {
        options: { aspectRatio: t, maintainAspectRatio: e },
        width: i,
        height: n,
        _aspectRatio: o
      } = this;
      return $(t) ? (e && o ? o : n ? i / n : null) : t;
    }
    get data() {
      return this.config.data;
    }
    set data(t) {
      this.config.data = t;
    }
    get options() {
      return this._options;
    }
    set options(t) {
      this.config.options = t;
    }
    _initialize() {
      const t = this;
      return (
        t.notifyPlugins('beforeInit'),
        t.options.responsive ? t.resize() : _e(t, t.options.devicePixelRatio),
        t.bindEvents(),
        t.notifyPlugins('afterInit'),
        t
      );
    }
    _initializePlatform(t, e) {
      return e.platform
        ? new e.platform()
        : !Xn() ||
            ('undefined' != typeof OffscreenCanvas &&
              t instanceof OffscreenCanvas)
          ? new Ze()
          : new hi();
    }
    clear() {
      return Xt(this.canvas, this.ctx), this;
    }
    stop() {
      return a.stop(this), this;
    }
    resize(t, e) {
      a.running(this)
        ? (this._resizeBeforeDraw = { width: t, height: e })
        : this._resize(t, e);
    }
    _resize(t, e) {
      const i = this,
        n = i.options,
        o = i.canvas,
        s = n.maintainAspectRatio && i.aspectRatio,
        a = i.platform.getMaximumSize(o, t, e, s),
        r = i.currentDevicePixelRatio,
        l = n.devicePixelRatio || i.platform.getDevicePixelRatio();
      (i.width === a.width && i.height === a.height && r === l) ||
        ((i.width = a.width),
        (i.height = a.height),
        (i._aspectRatio = i.aspectRatio),
        _e(i, l, !0),
        i.notifyPlugins('resize', { size: a }),
        Q(n.onResize, [i, a], i),
        i.attached && i._doResize() && i.render());
    }
    ensureScalesHaveIDs() {
      J(this.options.scales || {}, (t, e) => {
        t.id = e;
      });
    }
    buildOrUpdateScales() {
      const t = this,
        e = t.options,
        i = e.scales,
        n = t.scales,
        o = Object.keys(n).reduce((t, e) => ((t[e] = !1), t), {});
      let s = [];
      i &&
        (s = s.concat(
          Object.keys(i).map((t) => {
            const e = i[t],
              n = Ln(t, e),
              o = 'r' === n,
              s = 'x' === n;
            return {
              options: e,
              dposition: o ? 'chartArea' : s ? 'bottom' : 'left',
              dtype: o ? 'radialLinear' : s ? 'category' : 'linear'
            };
          })
        )),
        J(s, (i) => {
          const s = i.options,
            a = s.id,
            r = Ln(a, s),
            l = K(s.type, i.dtype);
          (void 0 !== s.position && jn(s.position, r) === jn(i.dposition)) ||
            (s.position = i.dposition),
            (o[a] = !0);
          let c = null;
          if (a in n && n[a].type === l) c = n[a];
          else {
            (c = new (Cn.getScale(l))({
              id: a,
              type: l,
              ctx: t.ctx,
              chart: t
            })),
              (n[c.id] = c);
          }
          c.init(s, e);
        }),
        J(o, (t, e) => {
          t || delete n[e];
        }),
        J(n, (e) => {
          Ke.configure(t, e, e.options), Ke.addBox(t, e);
        });
    }
    _updateMetasetIndex(t, e) {
      const i = this._metasets,
        n = t.index;
      n !== e && ((i[n] = i[e]), (i[e] = t), (t.index = e));
    }
    _updateMetasets() {
      const t = this,
        e = t._metasets,
        i = t.data.datasets.length,
        n = e.length;
      if (n > i) {
        for (let e = i; e < n; ++e) t._destroyDatasetMeta(e);
        e.splice(i, n - i);
      }
      t._sortedMetasets = e.slice(0).sort($n('order', 'index'));
    }
    _removeUnreferencedMetasets() {
      const t = this,
        {
          _metasets: e,
          data: { datasets: i }
        } = t;
      e.length > i.length && delete t._stacks,
        e.forEach((e, n) => {
          0 === i.filter((t) => t === e._dataset).length &&
            t._destroyDatasetMeta(n);
        });
    }
    buildOrUpdateControllers() {
      const t = this,
        e = [],
        i = t.data.datasets;
      let n, o;
      for (t._removeUnreferencedMetasets(), n = 0, o = i.length; n < o; n++) {
        const o = i[n];
        let s = t.getDatasetMeta(n);
        const a = o.type || t.config.type;
        if (
          (s.type &&
            s.type !== a &&
            (t._destroyDatasetMeta(n), (s = t.getDatasetMeta(n))),
          (s.type = a),
          (s.indexAxis = o.indexAxis || Rn(a, t.options)),
          (s.order = o.order || 0),
          t._updateMetasetIndex(s, n),
          (s.label = '' + o.label),
          (s.visible = t.isDatasetVisible(n)),
          s.controller)
        )
          s.controller.updateIndex(n), s.controller.linkScales();
        else {
          const i = Cn.getController(a),
            { datasetElementType: o, dataElementType: r } = mt.datasets[a];
          Object.assign(i.prototype, {
            dataElementType: Cn.getElement(r),
            datasetElementType: o && Cn.getElement(o)
          }),
            (s.controller = new i(t, n)),
            e.push(s.controller);
        }
      }
      return t._updateMetasets(), e;
    }
    _resetElements() {
      const t = this;
      J(
        t.data.datasets,
        (e, i) => {
          t.getDatasetMeta(i).controller.reset();
        },
        t
      );
    }
    reset() {
      this._resetElements(), this.notifyPlugins('reset');
    }
    update(t) {
      const e = this,
        i = e.config;
      i.update(),
        (e._options = i.createResolver(i.chartOptionScopes(), e.getContext())),
        J(e.scales, (t) => {
          Ke.removeBox(e, t);
        });
      const n = (e._animationsDisabled = !e.options.animation);
      if (
        (e.ensureScalesHaveIDs(),
        e.buildOrUpdateScales(),
        e._plugins.invalidate(),
        !1 === e.notifyPlugins('beforeUpdate', { mode: t, cancelable: !0 }))
      )
        return;
      const o = e.buildOrUpdateControllers();
      e.notifyPlugins('beforeElementsUpdate');
      let s = 0;
      for (let t = 0, i = e.data.datasets.length; t < i; t++) {
        const { controller: i } = e.getDatasetMeta(t),
          a = !n && -1 === o.indexOf(i);
        i.buildOrUpdateElements(a), (s = Math.max(+i.getMaxOverflow(), s));
      }
      (e._minPadding = s),
        e._updateLayout(s),
        n ||
          J(o, (t) => {
            t.reset();
          }),
        e._updateDatasets(t),
        e.notifyPlugins('afterUpdate', { mode: t }),
        e._layers.sort($n('z', '_idx')),
        e._lastEvent && e._eventHandler(e._lastEvent, !0),
        e.render();
    }
    _updateLayout(t) {
      const e = this;
      if (!1 === e.notifyPlugins('beforeLayout', { cancelable: !0 })) return;
      Ke.update(e, e.width, e.height, t);
      const i = e.chartArea,
        n = i.width <= 0 || i.height <= 0;
      (e._layers = []),
        J(
          e.boxes,
          (t) => {
            (n && 'chartArea' === t.position) ||
              (t.configure && t.configure(), e._layers.push(...t._layers()));
          },
          e
        ),
        e._layers.forEach((t, e) => {
          t._idx = e;
        }),
        e.notifyPlugins('afterLayout');
    }
    _updateDatasets(t) {
      const e = this,
        i = 'function' == typeof t;
      if (
        !1 !==
        e.notifyPlugins('beforeDatasetsUpdate', { mode: t, cancelable: !0 })
      ) {
        for (let n = 0, o = e.data.datasets.length; n < o; ++n)
          e._updateDataset(n, i ? t({ datasetIndex: n }) : t);
        e.notifyPlugins('afterDatasetsUpdate', { mode: t });
      }
    }
    _updateDataset(t, e) {
      const i = this,
        n = i.getDatasetMeta(t),
        o = { meta: n, index: t, mode: e, cancelable: !0 };
      !1 !== i.notifyPlugins('beforeDatasetUpdate', o) &&
        (n.controller._update(e),
        (o.cancelable = !1),
        i.notifyPlugins('afterDatasetUpdate', o));
    }
    render() {
      const t = this;
      !1 !== t.notifyPlugins('beforeRender', { cancelable: !0 }) &&
        (a.has(t)
          ? t.attached && !a.running(t) && a.start(t)
          : (t.draw(), Yn({ chart: t })));
    }
    draw() {
      const t = this;
      let e;
      if (t._resizeBeforeDraw) {
        const { width: e, height: i } = t._resizeBeforeDraw;
        t._resize(e, i), (t._resizeBeforeDraw = null);
      }
      if ((t.clear(), t.width <= 0 || t.height <= 0)) return;
      if (!1 === t.notifyPlugins('beforeDraw', { cancelable: !0 })) return;
      const i = t._layers;
      for (e = 0; e < i.length && i[e].z <= 0; ++e) i[e].draw(t.chartArea);
      for (t._drawDatasets(); e < i.length; ++e) i[e].draw(t.chartArea);
      t.notifyPlugins('afterDraw');
    }
    _getSortedDatasetMetas(t) {
      const e = this._sortedMetasets,
        i = [];
      let n, o;
      for (n = 0, o = e.length; n < o; ++n) {
        const o = e[n];
        (t && !o.visible) || i.push(o);
      }
      return i;
    }
    getSortedVisibleDatasetMetas() {
      return this._getSortedDatasetMetas(!0);
    }
    _drawDatasets() {
      const t = this;
      if (!1 === t.notifyPlugins('beforeDatasetsDraw', { cancelable: !0 }))
        return;
      const e = t.getSortedVisibleDatasetMetas();
      for (let i = e.length - 1; i >= 0; --i) t._drawDataset(e[i]);
      t.notifyPlugins('afterDatasetsDraw');
    }
    _drawDataset(t) {
      const e = this,
        i = e.ctx,
        n = t._clip,
        o = e.chartArea,
        s = { meta: t, index: t.index, cancelable: !0 };
      !1 !== e.notifyPlugins('beforeDatasetDraw', s) &&
        (Gt(i, {
          left: !1 === n.left ? 0 : o.left - n.left,
          right: !1 === n.right ? e.width : o.right + n.right,
          top: !1 === n.top ? 0 : o.top - n.top,
          bottom: !1 === n.bottom ? e.height : o.bottom + n.bottom
        }),
        t.controller.draw(),
        Zt(i),
        (s.cancelable = !1),
        e.notifyPlugins('afterDatasetDraw', s));
    }
    getElementsAtEventForMode(t, e, i, n) {
      const o = Ce.modes[e];
      return 'function' == typeof o ? o(this, t, i, n) : [];
    }
    getDatasetMeta(t) {
      const e = this.data.datasets[t],
        i = this._metasets;
      let n = i.filter((t) => t && t._dataset === e).pop();
      return (
        n ||
          (n = i[t] =
            {
              type: null,
              data: [],
              dataset: null,
              controller: null,
              hidden: null,
              xAxisID: null,
              yAxisID: null,
              order: (e && e.order) || 0,
              index: t,
              _dataset: e,
              _parsed: [],
              _sorted: !1
            }),
        n
      );
    }
    getContext() {
      return this.$context || (this.$context = { chart: this, type: 'chart' });
    }
    getVisibleDatasetCount() {
      return this.getSortedVisibleDatasetMetas().length;
    }
    isDatasetVisible(t) {
      const e = this.data.datasets[t];
      if (!e) return !1;
      const i = this.getDatasetMeta(t);
      return 'boolean' == typeof i.hidden ? !i.hidden : !e.hidden;
    }
    setDatasetVisibility(t, e) {
      this.getDatasetMeta(t).hidden = !e;
    }
    toggleDataVisibility(t) {
      this._hiddenIndices[t] = !this._hiddenIndices[t];
    }
    getDataVisibility(t) {
      return !this._hiddenIndices[t];
    }
    _updateDatasetVisibility(t, e) {
      const i = this,
        n = e ? 'show' : 'hide',
        o = i.getDatasetMeta(t),
        s = o.controller._resolveAnimations(void 0, n);
      i.setDatasetVisibility(t, e),
        s.update(o, { visible: e }),
        i.update((e) => (e.datasetIndex === t ? n : void 0));
    }
    hide(t) {
      this._updateDatasetVisibility(t, !1);
    }
    show(t) {
      this._updateDatasetVisibility(t, !0);
    }
    _destroyDatasetMeta(t) {
      const e = this,
        i = e._metasets && e._metasets[t];
      i && i.controller && (i.controller._destroy(), delete e._metasets[t]);
    }
    destroy() {
      const t = this,
        { canvas: e, ctx: i } = t;
      let n, o;
      for (t.stop(), a.remove(t), n = 0, o = t.data.datasets.length; n < o; ++n)
        t._destroyDatasetMeta(n);
      t.config.clearCache(),
        e &&
          (t.unbindEvents(),
          Xt(e, i),
          t.platform.releaseContext(i),
          (t.canvas = null),
          (t.ctx = null)),
        t.notifyPlugins('destroy'),
        delete Kn[t.id];
    }
    toBase64Image(...t) {
      return this.canvas.toDataURL(...t);
    }
    bindEvents() {
      const t = this,
        e = t._listeners,
        i = t.platform,
        n = (n, o) => {
          i.addEventListener(t, n, o), (e[n] = o);
        },
        o = (n, o) => {
          e[n] && (i.removeEventListener(t, n, o), delete e[n]);
        };
      let s = function (e, i, n) {
        (e.offsetX = i), (e.offsetY = n), t._eventHandler(e);
      };
      if ((J(t.options.events, (t) => n(t, s)), t.options.responsive)) {
        let e;
        s = (e, i) => {
          t.canvas && t.resize(e, i);
        };
        const a = () => {
          o('attach', a),
            (t.attached = !0),
            t.resize(),
            n('resize', s),
            n('detach', e);
        };
        (e = () => {
          (t.attached = !1), o('resize', s), n('attach', a);
        }),
          i.isAttached(t.canvas) ? a() : e();
      } else t.attached = !0;
    }
    unbindEvents() {
      const t = this,
        e = t._listeners;
      e &&
        (delete t._listeners,
        J(e, (e, i) => {
          t.platform.removeEventListener(t, i, e);
        }));
    }
    updateHoverStyle(t, e, i) {
      const n = i ? 'set' : 'remove';
      let o, s, a, r;
      for (
        'dataset' === e &&
          ((o = this.getDatasetMeta(t[0].datasetIndex)),
          o.controller['_' + n + 'DatasetHoverStyle']()),
          a = 0,
          r = t.length;
        a < r;
        ++a
      ) {
        s = t[a];
        const e = s && this.getDatasetMeta(s.datasetIndex).controller;
        e && e[n + 'HoverStyle'](s.element, s.datasetIndex, s.index);
      }
    }
    getActiveElements() {
      return this._active || [];
    }
    setActiveElements(t) {
      const e = this,
        i = e._active || [],
        n = t.map(({ datasetIndex: t, index: i }) => {
          const n = e.getDatasetMeta(t);
          if (!n) throw new Error('No dataset found at index ' + t);
          return { datasetIndex: t, element: n.data[i], index: i };
        });
      !tt(n, i) && ((e._active = n), e._updateHoverStyles(n, i));
    }
    notifyPlugins(t, e, i) {
      return this._plugins.notify(this, t, e, i);
    }
    _updateHoverStyles(t, e, i) {
      const n = this,
        o = n.options.hover,
        s = (t, e) =>
          t.filter(
            (t) =>
              !e.some(
                (e) => t.datasetIndex === e.datasetIndex && t.index === e.index
              )
          ),
        a = s(e, t),
        r = i ? t : s(t, e);
      a.length && n.updateHoverStyle(a, o.mode, !1),
        r.length && o.mode && n.updateHoverStyle(r, o.mode, !0);
    }
    _eventHandler(t, e) {
      const i = this,
        n = { event: t, replay: e, cancelable: !0 },
        o = (e) => (e.options.events || this.options.events).includes(t.type);
      if (!1 === i.notifyPlugins('beforeEvent', n, o)) return;
      const s = i._handleEvent(t, e);
      return (
        (n.cancelable = !1),
        i.notifyPlugins('afterEvent', n, o),
        (s || n.changed) && i.render(),
        i
      );
    }
    _handleEvent(t, e) {
      const i = this,
        { _active: n = [], options: o } = i,
        s = o.hover,
        a = e;
      let r = [],
        l = !1,
        c = null;
      return (
        'mouseout' !== t.type &&
          ((r = i.getElementsAtEventForMode(t, s.mode, s, a)),
          (c = 'click' === t.type ? i._lastEvent : t)),
        (i._lastEvent = null),
        Kt(t, i.chartArea, i._minPadding) &&
          (Q(o.onHover, [t, r, i], i),
          ('mouseup' !== t.type &&
            'click' !== t.type &&
            'contextmenu' !== t.type) ||
            Q(o.onClick, [t, r, i], i)),
        (l = !tt(r, n)),
        (l || e) && ((i._active = r), i._updateHoverStyles(r, n, e)),
        (i._lastEvent = c),
        l
      );
    }
  }
  const Qn = () => J(Zn.instances, (t) => t._plugins.invalidate()),
    Jn = !0;
  function to() {
    throw new Error(
      'This method is not implemented: either no adapter can be found or an incomplete integration was provided.'
    );
  }
  Object.defineProperties(Zn, {
    defaults: { enumerable: Jn, value: mt },
    instances: { enumerable: Jn, value: Kn },
    overrides: { enumerable: Jn, value: ut },
    registry: { enumerable: Jn, value: Cn },
    version: { enumerable: Jn, value: '3.1.1' },
    getChart: { enumerable: Jn, value: Gn },
    register: {
      enumerable: Jn,
      value: (...t) => {
        Cn.add(...t), Qn();
      }
    },
    unregister: {
      enumerable: Jn,
      value: (...t) => {
        Cn.remove(...t), Qn();
      }
    }
  });
  class eo {
    constructor(t) {
      this.options = t || {};
    }
    formats() {
      return to();
    }
    parse(t, e) {
      return to();
    }
    format(t, e) {
      return to();
    }
    add(t, e, i) {
      return to();
    }
    diff(t, e, i) {
      return to();
    }
    startOf(t, e, i) {
      return to();
    }
    endOf(t, e) {
      return to();
    }
  }
  eo.override = function (t) {
    Object.assign(eo.prototype, t);
  };
  var io = { _date: eo };
  function no(t) {
    const e = (function (t) {
      if (!t._cache.$bar) {
        const e = t.getMatchingVisibleMetas('bar');
        let i = [];
        for (let n = 0, o = e.length; n < o; n++)
          i = i.concat(e[n].controller.getAllParsedValues(t));
        t._cache.$bar = ce(i.sort((t, e) => t - e));
      }
      return t._cache.$bar;
    })(t);
    let i,
      n,
      o,
      s,
      a = t._length;
    const r = () => {
      (a = Math.min(a, (i && Math.abs(o - s)) || a)), (s = o);
    };
    for (i = 0, n = e.length; i < n; ++i) (o = t.getPixelForValue(e[i])), r();
    for (i = 0, n = t.ticks.length; i < n; ++i) (o = t.getPixelForTick(i)), r();
    return a;
  }
  function oo(t, e, i, n) {
    return (
      Y(t)
        ? (function (t, e, i, n) {
            const o = i.parse(t[0], n),
              s = i.parse(t[1], n),
              a = Math.min(o, s),
              r = Math.max(o, s);
            let l = a,
              c = r;
            Math.abs(a) > Math.abs(r) && ((l = r), (c = a)),
              (e[i.axis] = c),
              (e._custom = {
                barStart: l,
                barEnd: c,
                start: o,
                end: s,
                min: a,
                max: r
              });
          })(t, e, i, n)
        : (e[i.axis] = i.parse(t, n)),
      e
    );
  }
  function so(t, e, i, n) {
    const o = t.iScale,
      s = t.vScale,
      a = o.getLabels(),
      r = o === s,
      l = [];
    let c, h, d, u;
    for (c = i, h = i + n; c < h; ++c)
      (u = e[c]),
        (d = {}),
        (d[o.axis] = r || o.parse(a[c], c)),
        l.push(oo(u, d, s, c));
    return l;
  }
  function ao(t) {
    return t && void 0 !== t.barStart && void 0 !== t.barEnd;
  }
  class ro extends Ti {
    parsePrimitiveData(t, e, i, n) {
      return so(t, e, i, n);
    }
    parseArrayData(t, e, i, n) {
      return so(t, e, i, n);
    }
    parseObjectData(t, e, i, n) {
      const { iScale: o, vScale: s } = t,
        { xAxisKey: a = 'x', yAxisKey: r = 'y' } = this._parsing,
        l = 'x' === o.axis ? a : r,
        c = 'x' === s.axis ? a : r,
        h = [];
      let d, u, f, g;
      for (d = i, u = i + n; d < u; ++d)
        (g = e[d]),
          (f = {}),
          (f[o.axis] = o.parse(lt(g, l), d)),
          h.push(oo(lt(g, c), f, s, d));
      return h;
    }
    updateRangeFromParsed(t, e, i, n) {
      super.updateRangeFromParsed(t, e, i, n);
      const o = i._custom;
      o &&
        e === this._cachedMeta.vScale &&
        ((t.min = Math.min(t.min, o.min)), (t.max = Math.max(t.max, o.max)));
    }
    getLabelAndValue(t) {
      const e = this._cachedMeta,
        { iScale: i, vScale: n } = e,
        o = this.getParsed(t),
        s = o._custom,
        a = ao(s)
          ? '[' + s.start + ', ' + s.end + ']'
          : '' + n.getLabelForValue(o[n.axis]);
      return { label: '' + i.getLabelForValue(o[i.axis]), value: a };
    }
    initialize() {
      const t = this;
      (t.enableOptionSharing = !0), super.initialize();
      t._cachedMeta.stack = t.getDataset().stack;
    }
    update(t) {
      const e = this._cachedMeta;
      this.updateElements(e.data, 0, e.data.length, t);
    }
    updateElements(t, e, i, n) {
      const o = this,
        s = 'reset' === n,
        a = o._cachedMeta.vScale,
        r = a.getBasePixel(),
        l = a.isHorizontal(),
        c = o._getRuler(),
        h = o.resolveDataElementOptions(e, n),
        d = o.getSharedOptions(h),
        u = o.includeOptions(n, d);
      o.updateSharedOptions(d, n, h);
      for (let h = e; h < e + i; h++) {
        const e = o.getParsed(h),
          i =
            s || $(e[a.axis])
              ? { base: r, head: r }
              : o._calculateBarValuePixels(h),
          f = o._calculateBarIndexPixels(h, c),
          g = {
            horizontal: l,
            base: i.base,
            x: l ? i.head : f.center,
            y: l ? f.center : i.head,
            height: l ? f.size : void 0,
            width: l ? void 0 : f.size
          };
        u && (g.options = d || o.resolveDataElementOptions(h, n)),
          o.updateElement(t[h], h, g, n);
      }
    }
    _getStacks(t, e) {
      const i = this._cachedMeta.iScale,
        n = i.getMatchingVisibleMetas(this._type),
        o = i.options.stacked,
        s = n.length,
        a = [];
      let r, l;
      for (r = 0; r < s; ++r) {
        if (((l = n[r]), void 0 !== e)) {
          const t =
            l.controller.getParsed(e)[l.controller._cachedMeta.vScale.axis];
          if ($(t) || isNaN(t)) continue;
        }
        if (
          ((!1 === o ||
            -1 === a.indexOf(l.stack) ||
            (void 0 === o && void 0 === l.stack)) &&
            a.push(l.stack),
          l.index === t)
        )
          break;
      }
      return a.length || a.push(void 0), a;
    }
    _getStackCount(t) {
      return this._getStacks(void 0, t).length;
    }
    _getStackIndex(t, e) {
      const i = this._getStacks(t),
        n = void 0 !== e ? i.indexOf(e) : -1;
      return -1 === n ? i.length - 1 : n;
    }
    _getRuler() {
      const t = this,
        e = t.options,
        i = t._cachedMeta,
        n = i.iScale,
        o = [];
      let s, a;
      for (s = 0, a = i.data.length; s < a; ++s)
        o.push(n.getPixelForValue(t.getParsed(s)[n.axis], s));
      const r = e.barThickness;
      return {
        min: r || no(n),
        pixels: o,
        start: n._startPixel,
        end: n._endPixel,
        stackCount: t._getStackCount(),
        scale: n,
        grouped: e.grouped,
        ratio: r ? 1 : e.categoryPercentage * e.barPercentage
      };
    }
    _calculateBarValuePixels(t) {
      const e = this,
        { vScale: i, _stacked: n } = e._cachedMeta,
        { base: o, minBarLength: s } = e.options,
        a = e.getParsed(t),
        r = a._custom,
        l = ao(r);
      let c,
        h,
        d = a[i.axis],
        u = 0,
        f = n ? e.applyStack(i, a, n) : d;
      f !== d && ((u = f - d), (f = d)),
        l &&
          ((d = r.barStart),
          (f = r.barEnd - r.barStart),
          0 !== d && Pt(d) !== Pt(r.barEnd) && (u = 0),
          (u += d));
      const g = $(o) || l ? u : o;
      let p = i.getPixelForValue(g);
      (c = this.chart.getDataVisibility(t) ? i.getPixelForValue(u + f) : p),
        (h = c - p),
        void 0 !== s &&
          Math.abs(h) < s &&
          ((h = h < 0 ? -s : s), 0 === d && (p -= h / 2), (c = p + h));
      const m = o || 0;
      if (p === i.getPixelForValue(m)) {
        const t = i.getLineWidthForValue(m) / 2;
        h > 0 ? ((p += t), (h -= t)) : h < 0 && ((p -= t), (h += t));
      }
      return { size: h, base: p, head: c, center: c + h / 2 };
    }
    _calculateBarIndexPixels(t, e) {
      const i = this,
        n = e.scale,
        o = i.options,
        s = K(o.maxBarThickness, 1 / 0);
      let a, r;
      if (e.grouped) {
        const n = o.skipNull ? i._getStackCount(t) : e.stackCount,
          l =
            'flex' === o.barThickness
              ? (function (t, e, i, n) {
                  const o = e.pixels,
                    s = o[t];
                  let a = t > 0 ? o[t - 1] : null,
                    r = t < o.length - 1 ? o[t + 1] : null;
                  const l = i.categoryPercentage;
                  null === a &&
                    (a = s - (null === r ? e.end - e.start : r - s)),
                    null === r && (r = s + s - a);
                  const c = s - ((s - Math.min(a, r)) / 2) * l;
                  return {
                    chunk: ((Math.abs(r - a) / 2) * l) / n,
                    ratio: i.barPercentage,
                    start: c
                  };
                })(t, e, o, n)
              : (function (t, e, i, n) {
                  const o = i.barThickness;
                  let s, a;
                  return (
                    $(o)
                      ? ((s = e.min * i.categoryPercentage),
                        (a = i.barPercentage))
                      : ((s = o * n), (a = 1)),
                    { chunk: s / n, ratio: a, start: e.pixels[t] - s / 2 }
                  );
                })(t, e, o, n),
          c = i._getStackIndex(i.index, i._cachedMeta.stack);
        (a = l.start + l.chunk * c + l.chunk / 2),
          (r = Math.min(s, l.chunk * l.ratio));
      } else
        (a = n.getPixelForValue(i.getParsed(t)[n.axis], t)),
          (r = Math.min(s, e.min * e.ratio));
      return { base: a - r / 2, head: a + r / 2, center: a, size: r };
    }
    draw() {
      const t = this,
        e = t.chart,
        i = t._cachedMeta,
        n = i.vScale,
        o = i.data,
        s = o.length;
      let a = 0;
      for (Gt(e.ctx, e.chartArea); a < s; ++a)
        null !== t.getParsed(a)[n.axis] && o[a].draw(t._ctx);
      Zt(e.ctx);
    }
  }
  (ro.id = 'bar'),
    (ro.defaults = {
      datasetElementType: !1,
      dataElementType: 'bar',
      categoryPercentage: 0.8,
      barPercentage: 0.9,
      grouped: !0,
      animations: {
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'base', 'width', 'height']
        }
      }
    }),
    (ro.overrides = {
      interaction: { mode: 'index' },
      scales: {
        _index_: { type: 'category', offset: !0, grid: { offset: !0 } },
        _value_: { type: 'linear', beginAtZero: !0 }
      }
    });
  class lo extends Ti {
    initialize() {
      (this.enableOptionSharing = !0), super.initialize();
    }
    parseObjectData(t, e, i, n) {
      const { xScale: o, yScale: s } = t,
        { xAxisKey: a = 'x', yAxisKey: r = 'y' } = this._parsing,
        l = [];
      let c, h, d;
      for (c = i, h = i + n; c < h; ++c)
        (d = e[c]),
          l.push({
            x: o.parse(lt(d, a), c),
            y: s.parse(lt(d, r), c),
            _custom: d && d.r && +d.r
          });
      return l;
    }
    getMaxOverflow() {
      const { data: t, _parsed: e } = this._cachedMeta;
      let i = 0;
      for (let n = t.length - 1; n >= 0; --n)
        i = Math.max(i, t[n].size() / 2, e[n]._custom);
      return i > 0 && i;
    }
    getLabelAndValue(t) {
      const e = this._cachedMeta,
        { xScale: i, yScale: n } = e,
        o = this.getParsed(t),
        s = i.getLabelForValue(o.x),
        a = n.getLabelForValue(o.y),
        r = o._custom;
      return {
        label: e.label,
        value: '(' + s + ', ' + a + (r ? ', ' + r : '') + ')'
      };
    }
    update(t) {
      const e = this._cachedMeta.data;
      this.updateElements(e, 0, e.length, t);
    }
    updateElements(t, e, i, n) {
      const o = this,
        s = 'reset' === n,
        { xScale: a, yScale: r } = o._cachedMeta,
        l = o.resolveDataElementOptions(e, n),
        c = o.getSharedOptions(l),
        h = o.includeOptions(n, c);
      for (let l = e; l < e + i; l++) {
        const e = t[l],
          i = !s && o.getParsed(l),
          c = s ? a.getPixelForDecimal(0.5) : a.getPixelForValue(i.x),
          d = s ? r.getBasePixel() : r.getPixelForValue(i.y),
          u = { x: c, y: d, skip: isNaN(c) || isNaN(d) };
        h &&
          ((u.options = o.resolveDataElementOptions(l, n)),
          s && (u.options.radius = 0)),
          o.updateElement(e, l, u, n);
      }
      o.updateSharedOptions(c, n, l);
    }
    resolveDataElementOptions(t, e) {
      const i = this.getParsed(t);
      let n = super.resolveDataElementOptions(t, e);
      n.$shared && (n = Object.assign({}, n, { $shared: !1 }));
      const o = n.radius;
      return (
        'active' !== e && (n.radius = 0), (n.radius += K(i && i._custom, o)), n
      );
    }
  }
  (lo.id = 'bubble'),
    (lo.defaults = {
      datasetElementType: !1,
      dataElementType: 'point',
      animations: {
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'borderWidth', 'radius']
        }
      }
    }),
    (lo.overrides = {
      scales: { x: { type: 'linear' }, y: { type: 'linear' } },
      plugins: { tooltip: { callbacks: { title: () => '' } } }
    });
  class co extends Ti {
    constructor(t, e) {
      super(t, e),
        (this.enableOptionSharing = !0),
        (this.innerRadius = void 0),
        (this.outerRadius = void 0),
        (this.offsetX = void 0),
        (this.offsetY = void 0);
    }
    linkScales() {}
    parse(t, e) {
      const i = this.getDataset().data,
        n = this._cachedMeta;
      let o, s;
      for (o = t, s = t + e; o < s; ++o) n._parsed[o] = +i[o];
    }
    _getRotation() {
      return Lt(this.options.rotation - 90);
    }
    _getCircumference() {
      return Lt(this.options.circumference);
    }
    _getRotationExtents() {
      let t = bt,
        e = -bt;
      const i = this;
      for (let n = 0; n < i.chart.data.datasets.length; ++n)
        if (i.chart.isDatasetVisible(n)) {
          const o = i.chart.getDatasetMeta(n).controller,
            s = o._getRotation(),
            a = o._getCircumference();
          (t = Math.min(t, s)), (e = Math.max(e, s + a));
        }
      return { rotation: t, circumference: e - t };
    }
    update(t) {
      const e = this,
        i = e.chart,
        { chartArea: n } = i,
        o = e._cachedMeta,
        s = o.data,
        a = e.getMaxBorderWidth() + e.getMaxOffset(s),
        r = Math.max((Math.min(n.width, n.height) - a) / 2, 0),
        l = Math.min(G(e.options.cutout, r), 1),
        c = e._getRingWeight(e.index),
        { circumference: h, rotation: d } = e._getRotationExtents(),
        {
          ratioX: u,
          ratioY: f,
          offsetX: g,
          offsetY: p
        } = (function (t, e, i) {
          let n = 1,
            o = 1,
            s = 0,
            a = 0;
          if (e < bt) {
            const r = t,
              l = r + e,
              c = Math.cos(r),
              h = Math.sin(r),
              d = Math.cos(l),
              u = Math.sin(l),
              f = (t, e, n) => (Wt(t, r, l) ? 1 : Math.max(e, e * i, n, n * i)),
              g = (t, e, n) =>
                Wt(t, r, l) ? -1 : Math.min(e, e * i, n, n * i),
              p = f(0, c, d),
              m = f(wt, h, u),
              x = g(xt, c, d),
              b = g(xt + wt, h, u);
            (n = (p - x) / 2),
              (o = (m - b) / 2),
              (s = -(p + x) / 2),
              (a = -(m + b) / 2);
          }
          return { ratioX: n, ratioY: o, offsetX: s, offsetY: a };
        })(d, h, l),
        m = (n.width - a) / u,
        x = (n.height - a) / f,
        b = Math.max(Math.min(m, x) / 2, 0),
        _ = Z(e.options.radius, b),
        y = (_ - Math.max(_ * l, 0)) / e._getVisibleDatasetWeightTotal();
      (e.offsetX = g * _),
        (e.offsetY = p * _),
        (o.total = e.calculateTotal()),
        (e.outerRadius = _ - y * e._getRingWeightOffset(e.index)),
        (e.innerRadius = Math.max(e.outerRadius - y * c, 0)),
        e.updateElements(s, 0, s.length, t);
    }
    _circumference(t, e) {
      const i = this,
        n = i.options,
        o = i._cachedMeta,
        s = i._getCircumference();
      return (e && n.animation.animateRotate) ||
        !this.chart.getDataVisibility(t) ||
        null === o._parsed[t]
        ? 0
        : i.calculateCircumference((o._parsed[t] * s) / bt);
    }
    updateElements(t, e, i, n) {
      const o = this,
        s = 'reset' === n,
        a = o.chart,
        r = a.chartArea,
        l = a.options.animation,
        c = (r.left + r.right) / 2,
        h = (r.top + r.bottom) / 2,
        d = s && l.animateScale,
        u = d ? 0 : o.innerRadius,
        f = d ? 0 : o.outerRadius,
        g = o.resolveDataElementOptions(e, n),
        p = o.getSharedOptions(g),
        m = o.includeOptions(n, p);
      let x,
        b = o._getRotation();
      for (x = 0; x < e; ++x) b += o._circumference(x, s);
      for (x = e; x < e + i; ++x) {
        const e = o._circumference(x, s),
          i = t[x],
          a = {
            x: c + o.offsetX,
            y: h + o.offsetY,
            startAngle: b,
            endAngle: b + e,
            circumference: e,
            outerRadius: f,
            innerRadius: u
          };
        m && (a.options = p || o.resolveDataElementOptions(x, n)),
          (b += e),
          o.updateElement(i, x, a, n);
      }
      o.updateSharedOptions(p, n, g);
    }
    calculateTotal() {
      const t = this._cachedMeta,
        e = t.data;
      let i,
        n = 0;
      for (i = 0; i < e.length; i++) {
        const e = t._parsed[i];
        null !== e &&
          !isNaN(e) &&
          this.chart.getDataVisibility(i) &&
          (n += Math.abs(e));
      }
      return n;
    }
    calculateCircumference(t) {
      const e = this._cachedMeta.total;
      return e > 0 && !isNaN(t) ? bt * (Math.abs(t) / e) : 0;
    }
    getLabelAndValue(t) {
      const e = this._cachedMeta,
        i = this.chart,
        n = i.data.labels || [],
        o = Ei(e._parsed[t], i.options.locale);
      return { label: n[t] || '', value: o };
    }
    getMaxBorderWidth(t) {
      const e = this;
      let i = 0;
      const n = e.chart;
      let o, s, a, r, l;
      if (!t)
        for (o = 0, s = n.data.datasets.length; o < s; ++o)
          if (n.isDatasetVisible(o)) {
            (a = n.getDatasetMeta(o)),
              (t = a.data),
              (r = a.controller),
              r !== e && r.configure();
            break;
          }
      if (!t) return 0;
      for (o = 0, s = t.length; o < s; ++o)
        (l = r.resolveDataElementOptions(o)),
          'inner' !== l.borderAlign &&
            (i = Math.max(i, l.borderWidth || 0, l.hoverBorderWidth || 0));
      return i;
    }
    getMaxOffset(t) {
      let e = 0;
      for (let i = 0, n = t.length; i < n; ++i) {
        const t = this.resolveDataElementOptions(i);
        e = Math.max(e, t.offset || 0, t.hoverOffset || 0);
      }
      return e;
    }
    _getRingWeightOffset(t) {
      let e = 0;
      for (let i = 0; i < t; ++i)
        this.chart.isDatasetVisible(i) && (e += this._getRingWeight(i));
      return e;
    }
    _getRingWeight(t) {
      return Math.max(K(this.chart.data.datasets[t].weight, 1), 0);
    }
    _getVisibleDatasetWeightTotal() {
      return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
    }
  }
  (co.id = 'doughnut'),
    (co.defaults = {
      datasetElementType: !1,
      dataElementType: 'arc',
      animation: { animateRotate: !0, animateScale: !1 },
      animations: {
        numbers: {
          type: 'number',
          properties: [
            'circumference',
            'endAngle',
            'innerRadius',
            'outerRadius',
            'startAngle',
            'x',
            'y',
            'offset',
            'borderWidth'
          ]
        }
      },
      cutout: '50%',
      rotation: 0,
      circumference: 360,
      radius: '100%',
      indexAxis: 'r'
    }),
    (co.overrides = {
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            generateLabels(t) {
              const e = t.data;
              return e.labels.length && e.datasets.length
                ? e.labels.map((e, i) => {
                    const n = t.getDatasetMeta(0).controller.getStyle(i);
                    return {
                      text: e,
                      fillStyle: n.backgroundColor,
                      strokeStyle: n.borderColor,
                      lineWidth: n.borderWidth,
                      hidden: !t.getDataVisibility(i),
                      index: i
                    };
                  })
                : [];
            }
          },
          onClick(t, e, i) {
            i.chart.toggleDataVisibility(e.index), i.chart.update();
          }
        },
        tooltip: {
          callbacks: {
            title: () => '',
            label(t) {
              let e = t.label;
              const i = ': ' + t.formattedValue;
              return Y(e) ? ((e = e.slice()), (e[0] += i)) : (e += i), e;
            }
          }
        }
      }
    });
  class ho extends Ti {
    initialize() {
      (this.enableOptionSharing = !0), super.initialize();
    }
    update(t) {
      const e = this,
        i = e._cachedMeta,
        { dataset: n, data: o = [], _dataset: s } = i,
        a = e.chart._animationsDisabled;
      let { start: r, count: l } = (function (t, e, i) {
        const n = e.length;
        let o = 0,
          s = n;
        if (t._sorted) {
          const { iScale: a, _parsed: r } = t,
            l = a.axis,
            {
              min: c,
              max: h,
              minDefined: d,
              maxDefined: u
            } = a.getUserBounds();
          d &&
            (o = Nt(
              Math.min(
                ne(r, a.axis, c).lo,
                i ? n : ne(e, l, a.getPixelForValue(c)).lo
              ),
              0,
              n - 1
            )),
            (s = u
              ? Nt(
                  Math.max(
                    ne(r, a.axis, h).hi + 1,
                    i ? 0 : ne(e, l, a.getPixelForValue(h)).hi + 1
                  ),
                  o,
                  n
                ) - o
              : n - o);
        }
        return { start: o, count: s };
      })(i, o, a);
      (e._drawStart = r),
        (e._drawCount = l),
        (function (t) {
          const { xScale: e, yScale: i, _scaleRanges: n } = t,
            o = { xmin: e.min, xmax: e.max, ymin: i.min, ymax: i.max };
          if (!n) return (t._scaleRanges = o), !0;
          const s =
            n.xmin !== e.min ||
            n.xmax !== e.max ||
            n.ymin !== i.min ||
            n.ymax !== i.max;
          return Object.assign(n, o), s;
        })(i) && ((r = 0), (l = o.length)),
        (n._decimated = !!s._decimated),
        (n.points = o);
      const c = e.resolveDatasetElementOptions(t);
      e.options.showLine || (c.borderWidth = 0),
        (c.segment = e.options.segment),
        e.updateElement(n, void 0, { animated: !a, options: c }, t),
        e.updateElements(o, r, l, t);
    }
    updateElements(t, e, i, n) {
      const o = this,
        s = 'reset' === n,
        { xScale: a, yScale: r, _stacked: l } = o._cachedMeta,
        c = o.resolveDataElementOptions(e, n),
        h = o.getSharedOptions(c),
        d = o.includeOptions(n, h),
        u = o.options.spanGaps,
        f = Ot(u) ? u : Number.POSITIVE_INFINITY,
        g = o.chart._animationsDisabled || s || 'none' === n;
      let p = e > 0 && o.getParsed(e - 1);
      for (let c = e; c < e + i; ++c) {
        const e = t[c],
          i = o.getParsed(c),
          u = g ? e : {},
          m = $(i.y),
          x = (u.x = a.getPixelForValue(i.x, c)),
          b = (u.y =
            s || m
              ? r.getBasePixel()
              : r.getPixelForValue(l ? o.applyStack(r, i, l) : i.y, c));
        (u.skip = isNaN(x) || isNaN(b) || m),
          (u.stop = c > 0 && i.x - p.x > f),
          (u.parsed = i),
          d && (u.options = h || o.resolveDataElementOptions(c, n)),
          g || o.updateElement(e, c, u, n),
          (p = i);
      }
      o.updateSharedOptions(h, n, c);
    }
    getMaxOverflow() {
      const t = this,
        e = t._cachedMeta,
        i = e.dataset,
        n = (i.options && i.options.borderWidth) || 0,
        o = e.data || [];
      if (!o.length) return n;
      const s = o[0].size(t.resolveDataElementOptions(0)),
        a = o[o.length - 1].size(t.resolveDataElementOptions(o.length - 1));
      return Math.max(n, s, a) / 2;
    }
    draw() {
      this._cachedMeta.dataset.updateControlPoints(this.chart.chartArea),
        super.draw();
    }
  }
  (ho.id = 'line'),
    (ho.defaults = {
      datasetElementType: 'line',
      dataElementType: 'point',
      showLine: !0,
      spanGaps: !1
    }),
    (ho.overrides = {
      scales: { _index_: { type: 'category' }, _value_: { type: 'linear' } }
    });
  class uo extends Ti {
    constructor(t, e) {
      super(t, e), (this.innerRadius = void 0), (this.outerRadius = void 0);
    }
    update(t) {
      const e = this._cachedMeta.data;
      this._updateRadius(), this.updateElements(e, 0, e.length, t);
    }
    _updateRadius() {
      const t = this,
        e = t.chart,
        i = e.chartArea,
        n = e.options,
        o = Math.min(i.right - i.left, i.bottom - i.top),
        s = Math.max(o / 2, 0),
        a =
          (s -
            Math.max(
              n.cutoutPercentage ? (s / 100) * n.cutoutPercentage : 1,
              0
            )) /
          e.getVisibleDatasetCount();
      (t.outerRadius = s - a * t.index), (t.innerRadius = t.outerRadius - a);
    }
    updateElements(t, e, i, n) {
      const o = this,
        s = 'reset' === n,
        a = o.chart,
        r = o.getDataset(),
        l = a.options.animation,
        c = o._cachedMeta.rScale,
        h = c.xCenter,
        d = c.yCenter,
        u = c.getIndexAngle(0) - 0.5 * xt;
      let f,
        g = u;
      const p = 360 / o.countVisibleElements();
      for (f = 0; f < e; ++f) g += o._computeAngle(f, n, p);
      for (f = e; f < e + i; f++) {
        const e = t[f];
        let i = g,
          m = g + o._computeAngle(f, n, p),
          x = a.getDataVisibility(f)
            ? c.getDistanceFromCenterForValue(r.data[f])
            : 0;
        (g = m),
          s && (l.animateScale && (x = 0), l.animateRotate && (i = m = u));
        const b = {
          x: h,
          y: d,
          innerRadius: 0,
          outerRadius: x,
          startAngle: i,
          endAngle: m,
          options: o.resolveDataElementOptions(f, n)
        };
        o.updateElement(e, f, b, n);
      }
    }
    countVisibleElements() {
      const t = this.getDataset(),
        e = this._cachedMeta;
      let i = 0;
      return (
        e.data.forEach((e, n) => {
          !isNaN(t.data[n]) && this.chart.getDataVisibility(n) && i++;
        }),
        i
      );
    }
    _computeAngle(t, e, i) {
      return this.chart.getDataVisibility(t)
        ? Lt(this.resolveDataElementOptions(t, e).angle || i)
        : 0;
    }
  }
  (uo.id = 'polarArea'),
    (uo.defaults = {
      dataElementType: 'arc',
      animation: { animateRotate: !0, animateScale: !0 },
      animations: {
        numbers: {
          type: 'number',
          properties: [
            'x',
            'y',
            'startAngle',
            'endAngle',
            'innerRadius',
            'outerRadius'
          ]
        }
      },
      indexAxis: 'r',
      startAngle: 0
    }),
    (uo.overrides = {
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            generateLabels(t) {
              const e = t.data;
              return e.labels.length && e.datasets.length
                ? e.labels.map((e, i) => {
                    const n = t.getDatasetMeta(0).controller.getStyle(i);
                    return {
                      text: e,
                      fillStyle: n.backgroundColor,
                      strokeStyle: n.borderColor,
                      lineWidth: n.borderWidth,
                      hidden: !t.getDataVisibility(i),
                      index: i
                    };
                  })
                : [];
            }
          },
          onClick(t, e, i) {
            i.chart.toggleDataVisibility(e.index), i.chart.update();
          }
        },
        tooltip: {
          callbacks: {
            title: () => '',
            label: (t) =>
              t.chart.data.labels[t.dataIndex] + ': ' + t.formattedValue
          }
        }
      },
      scales: {
        r: {
          type: 'radialLinear',
          angleLines: { display: !1 },
          beginAtZero: !0,
          grid: { circular: !0 },
          pointLabels: { display: !1 },
          startAngle: 0
        }
      }
    });
  class fo extends co {}
  (fo.id = 'pie'),
    (fo.defaults = {
      cutout: 0,
      rotation: 0,
      circumference: 360,
      radius: '100%'
    });
  class go extends Ti {
    getLabelAndValue(t) {
      const e = this._cachedMeta.vScale,
        i = this.getParsed(t);
      return {
        label: e.getLabels()[t],
        value: '' + e.getLabelForValue(i[e.axis])
      };
    }
    update(t) {
      const e = this,
        i = e._cachedMeta,
        n = i.dataset,
        o = i.data || [],
        s = i.iScale.getLabels();
      if (((n.points = o), 'resize' !== t)) {
        const i = e.resolveDatasetElementOptions(t);
        e.options.showLine || (i.borderWidth = 0);
        const a = { _loop: !0, _fullLoop: s.length === o.length, options: i };
        e.updateElement(n, void 0, a, t);
      }
      e.updateElements(o, 0, o.length, t);
    }
    updateElements(t, e, i, n) {
      const o = this,
        s = o.getDataset(),
        a = o._cachedMeta.rScale,
        r = 'reset' === n;
      for (let l = e; l < e + i; l++) {
        const e = t[l],
          i = o.resolveDataElementOptions(l, n),
          c = a.getPointPositionForValue(l, s.data[l]),
          h = r ? a.xCenter : c.x,
          d = r ? a.yCenter : c.y,
          u = {
            x: h,
            y: d,
            angle: c.angle,
            skip: isNaN(h) || isNaN(d),
            options: i
          };
        o.updateElement(e, l, u, n);
      }
    }
  }
  (go.id = 'radar'),
    (go.defaults = {
      datasetElementType: 'line',
      dataElementType: 'point',
      indexAxis: 'r',
      showLine: !0,
      elements: { line: { fill: 'start' } }
    }),
    (go.overrides = {
      aspectRatio: 1,
      scales: { r: { type: 'radialLinear' } }
    });
  class po extends ho {}
  (po.id = 'scatter'),
    (po.defaults = { showLine: !1, fill: !1 }),
    (po.overrides = {
      interaction: { mode: 'point' },
      plugins: {
        tooltip: {
          callbacks: {
            title: () => '',
            label: (t) => '(' + t.label + ', ' + t.formattedValue + ')'
          }
        }
      },
      scales: { x: { type: 'linear' }, y: { type: 'linear' } }
    });
  var mo = Object.freeze({
    __proto__: null,
    BarController: ro,
    BubbleController: lo,
    DoughnutController: co,
    LineController: ho,
    PolarAreaController: uo,
    PieController: fo,
    RadarController: go,
    ScatterController: po
  });
  function xo(t, e) {
    const {
      startAngle: i,
      endAngle: n,
      pixelMargin: o,
      x: s,
      y: a,
      outerRadius: r,
      innerRadius: l
    } = e;
    let c = o / r;
    t.beginPath(),
      t.arc(s, a, r, i - c, n + c),
      l > o
        ? ((c = o / l), t.arc(s, a, l, n + c, i - c, !0))
        : t.arc(s, a, o, n + wt, i - wt),
      t.closePath(),
      t.clip();
  }
  function bo(t, e, i, n) {
    const o = Re(t.options.borderRadius, [
      'outerStart',
      'outerEnd',
      'innerStart',
      'innerEnd'
    ]);
    const s = (i - e) / 2,
      a = Math.min(s, (n * e) / 2),
      r = (t) => {
        const e = ((i - Math.min(s, t)) * n) / 2;
        return Nt(t, 0, Math.min(s, e));
      };
    return {
      outerStart: r(o.outerStart),
      outerEnd: r(o.outerEnd),
      innerStart: Nt(o.innerStart, 0, a),
      innerEnd: Nt(o.innerEnd, 0, a)
    };
  }
  function _o(t, e, i, n) {
    return { x: i + t * Math.cos(e), y: n + t * Math.sin(e) };
  }
  function yo(t, e) {
    const { x: i, y: n, startAngle: o, endAngle: s, pixelMargin: a } = e,
      r = Math.max(e.outerRadius - a, 0),
      l = e.innerRadius + a,
      {
        outerStart: c,
        outerEnd: h,
        innerStart: d,
        innerEnd: u
      } = bo(e, l, r, s - o),
      f = r - c,
      g = r - h,
      p = o + c / f,
      m = s - h / g,
      x = l + d,
      b = l + u,
      _ = o + d / x,
      y = s - u / b;
    if ((t.beginPath(), t.arc(i, n, r, p, m), h > 0)) {
      const e = _o(g, m, i, n);
      t.arc(e.x, e.y, h, m, s + wt);
    }
    const v = _o(b, s, i, n);
    if ((t.lineTo(v.x, v.y), u > 0)) {
      const e = _o(b, y, i, n);
      t.arc(e.x, e.y, u, s + wt, y + Math.PI);
    }
    if ((t.arc(i, n, l, s - u / l, o + d / l, !0), d > 0)) {
      const e = _o(x, _, i, n);
      t.arc(e.x, e.y, d, _ + Math.PI, o - wt);
    }
    const w = _o(f, o, i, n);
    if ((t.lineTo(w.x, w.y), c > 0)) {
      const e = _o(f, p, i, n);
      t.arc(e.x, e.y, c, o - wt, p);
    }
    t.closePath();
  }
  function vo(t, e) {
    const { options: i } = e,
      n = 'inner' === i.borderAlign;
    i.borderWidth &&
      (n
        ? ((t.lineWidth = 2 * i.borderWidth), (t.lineJoin = 'round'))
        : ((t.lineWidth = i.borderWidth), (t.lineJoin = 'bevel')),
      e.fullCircles &&
        (function (t, e, i) {
          const { x: n, y: o, startAngle: s, endAngle: a, pixelMargin: r } = e,
            l = Math.max(e.outerRadius - r, 0),
            c = e.innerRadius + r;
          let h;
          for (
            i &&
              ((e.endAngle = e.startAngle + bt),
              xo(t, e),
              (e.endAngle = a),
              e.endAngle === e.startAngle &&
                ((e.endAngle += bt), e.fullCircles--)),
              t.beginPath(),
              t.arc(n, o, c, s + bt, s, !0),
              h = 0;
            h < e.fullCircles;
            ++h
          )
            t.stroke();
          for (
            t.beginPath(), t.arc(n, o, l, s, s + bt), h = 0;
            h < e.fullCircles;
            ++h
          )
            t.stroke();
        })(t, e, n),
      n && xo(t, e),
      yo(t, e),
      t.stroke());
  }
  class wo extends Ri {
    constructor(t) {
      super(),
        (this.options = void 0),
        (this.circumference = void 0),
        (this.startAngle = void 0),
        (this.endAngle = void 0),
        (this.innerRadius = void 0),
        (this.outerRadius = void 0),
        (this.pixelMargin = 0),
        (this.fullCircles = 0),
        t && Object.assign(this, t);
    }
    inRange(t, e, i) {
      const n = this.getProps(['x', 'y'], i),
        { angle: o, distance: s } = Ft(n, { x: t, y: e }),
        {
          startAngle: a,
          endAngle: r,
          innerRadius: l,
          outerRadius: c,
          circumference: h
        } = this.getProps(
          [
            'startAngle',
            'endAngle',
            'innerRadius',
            'outerRadius',
            'circumference'
          ],
          i
        );
      return (h >= bt || Wt(o, a, r)) && s >= l && s <= c;
    }
    getCenterPoint(t) {
      const {
          x: e,
          y: i,
          startAngle: n,
          endAngle: o,
          innerRadius: s,
          outerRadius: a
        } = this.getProps(
          ['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'],
          t
        ),
        r = (n + o) / 2,
        l = (s + a) / 2;
      return { x: e + Math.cos(r) * l, y: i + Math.sin(r) * l };
    }
    tooltipPosition(t) {
      return this.getCenterPoint(t);
    }
    draw(t) {
      const e = this,
        i = e.options,
        n = i.offset || 0;
      if (
        ((e.pixelMargin = 'inner' === i.borderAlign ? 0.33 : 0),
        (e.fullCircles = Math.floor(e.circumference / bt)),
        !(0 === e.circumference || e.innerRadius < 0 || e.outerRadius < 0))
      ) {
        if ((t.save(), n && e.circumference < bt)) {
          const i = (e.startAngle + e.endAngle) / 2;
          t.translate(Math.cos(i) * n, Math.sin(i) * n);
        }
        (t.fillStyle = i.backgroundColor),
          (t.strokeStyle = i.borderColor),
          (function (t, e) {
            if (e.fullCircles) {
              (e.endAngle = e.startAngle + bt), yo(t, e);
              for (let i = 0; i < e.fullCircles; ++i) t.fill();
            }
            isNaN(e.circumference) ||
              (e.endAngle = e.startAngle + (e.circumference % bt)),
              yo(t, e),
              t.fill();
          })(t, e),
          vo(t, e),
          t.restore();
      }
    }
  }
  function Mo(t, e, i = e) {
    (t.lineCap = K(i.borderCapStyle, e.borderCapStyle)),
      t.setLineDash(K(i.borderDash, e.borderDash)),
      (t.lineDashOffset = K(i.borderDashOffset, e.borderDashOffset)),
      (t.lineJoin = K(i.borderJoinStyle, e.borderJoinStyle)),
      (t.lineWidth = K(i.borderWidth, e.borderWidth)),
      (t.strokeStyle = K(i.borderColor, e.borderColor));
  }
  function ko(t, e, i) {
    t.lineTo(i.x, i.y);
  }
  function So(t, e, i = {}) {
    const n = t.length,
      { start: o = 0, end: s = n - 1 } = i,
      { start: a, end: r } = e,
      l = Math.max(o, a),
      c = Math.min(s, r),
      h = (o < a && s < a) || (o > r && s > r);
    return {
      count: n,
      start: l,
      loop: e.loop,
      ilen: c < l && !h ? n + c - l : c - l
    };
  }
  function Po(t, e, i, n) {
    const { points: o, options: s } = e,
      { count: a, start: r, loop: l, ilen: c } = So(o, i, n),
      h = (function (t) {
        return t.stepped ? Qt : t.tension ? Jt : ko;
      })(s);
    let d,
      u,
      f,
      { move: g = !0, reverse: p } = n || {};
    for (d = 0; d <= c; ++d)
      (u = o[(r + (p ? c - d : d)) % a]),
        u.skip ||
          (g ? (t.moveTo(u.x, u.y), (g = !1)) : h(t, f, u, p, s.stepped),
          (f = u));
    return l && ((u = o[(r + (p ? c : 0)) % a]), h(t, f, u, p, s.stepped)), !!l;
  }
  function Do(t, e, i, n) {
    const o = e.points,
      { count: s, start: a, ilen: r } = So(o, i, n),
      { move: l = !0, reverse: c } = n || {};
    let h,
      d,
      u,
      f,
      g,
      p,
      m = 0,
      x = 0;
    const b = (t) => (a + (c ? r - t : t)) % s,
      _ = () => {
        f !== g && (t.lineTo(m, g), t.lineTo(m, f), t.lineTo(m, p));
      };
    for (l && ((d = o[b(0)]), t.moveTo(d.x, d.y)), h = 0; h <= r; ++h) {
      if (((d = o[b(h)]), d.skip)) continue;
      const e = d.x,
        i = d.y,
        n = 0 | e;
      n === u
        ? (i < f ? (f = i) : i > g && (g = i), (m = (x * m + e) / ++x))
        : (_(), t.lineTo(e, i), (u = n), (x = 0), (f = g = i)),
        (p = i);
    }
    _();
  }
  function Co(t) {
    const e = t.options,
      i = e.borderDash && e.borderDash.length;
    return !(t._decimated || t._loop || e.tension || e.stepped || i) ? Do : Po;
  }
  (wo.id = 'arc'),
    (wo.defaults = {
      borderAlign: 'center',
      borderColor: '#fff',
      borderRadius: 0,
      borderWidth: 2,
      offset: 0,
      angle: void 0
    }),
    (wo.defaultRoutes = { backgroundColor: 'backgroundColor' });
  const Oo = 'function' == typeof Path2D;
  function Ao(t, e, i, n) {
    Oo && 1 === e.segments.length
      ? (function (t, e, i, n) {
          let o = e._path;
          o || ((o = e._path = new Path2D()), e.path(o, i, n) && o.closePath()),
            Mo(t, e.options),
            t.stroke(o);
        })(t, e, i, n)
      : (function (t, e, i, n) {
          const { segments: o, options: s } = e,
            a = Co(e);
          for (const r of o)
            Mo(t, s, r.style),
              t.beginPath(),
              a(t, e, r, { start: i, end: i + n - 1 }) && t.closePath(),
              t.stroke();
        })(t, e, i, n);
  }
  class To extends Ri {
    constructor(t) {
      super(),
        (this.animated = !0),
        (this.options = void 0),
        (this._loop = void 0),
        (this._fullLoop = void 0),
        (this._path = void 0),
        (this._points = void 0),
        (this._segments = void 0),
        (this._decimated = !1),
        (this._pointsUpdated = !1),
        t && Object.assign(this, t);
    }
    updateControlPoints(t) {
      const e = this,
        i = e.options;
      if (i.tension && !i.stepped && !e._pointsUpdated) {
        const n = i.spanGaps ? e._loop : e._fullLoop;
        dn(e._points, i, t, n), (e._pointsUpdated = !0);
      }
    }
    set points(t) {
      const e = this;
      (e._points = t),
        delete e._segments,
        delete e._path,
        (e._pointsUpdated = !1);
    }
    get points() {
      return this._points;
    }
    get segments() {
      return (
        this._segments || (this._segments = wn(this, this.options.segment))
      );
    }
    first() {
      const t = this.segments,
        e = this.points;
      return t.length && e[t[0].start];
    }
    last() {
      const t = this.segments,
        e = this.points,
        i = t.length;
      return i && e[t[i - 1].end];
    }
    interpolate(t, e) {
      const i = this,
        n = i.options,
        o = t[e],
        s = i.points,
        a = vn(i, { property: e, start: o, end: o });
      if (!a.length) return;
      const r = [],
        l = (function (t) {
          return t.stepped ? fn : t.tension ? gn : un;
        })(n);
      let c, h;
      for (c = 0, h = a.length; c < h; ++c) {
        const { start: i, end: h } = a[c],
          d = s[i],
          u = s[h];
        if (d === u) {
          r.push(d);
          continue;
        }
        const f = l(d, u, Math.abs((o - d[e]) / (u[e] - d[e])), n.stepped);
        (f[e] = t[e]), r.push(f);
      }
      return 1 === r.length ? r[0] : r;
    }
    pathSegment(t, e, i) {
      return Co(this)(t, this, e, i);
    }
    path(t, e, i) {
      const n = this,
        o = n.segments,
        s = Co(n);
      let a = n._loop;
      (e = e || 0), (i = i || n.points.length - e);
      for (const r of o) a &= s(t, n, r, { start: e, end: e + i - 1 });
      return !!a;
    }
    draw(t, e, i, n) {
      const o = this,
        s = o.options || {};
      (o.points || []).length &&
        s.borderWidth &&
        (t.save(),
        Ao(t, o, i, n),
        t.restore(),
        o.animated && ((o._pointsUpdated = !1), (o._path = void 0)));
    }
  }
  function Ro(t, e, i, n) {
    const o = t.options,
      { [i]: s } = t.getProps([i], n);
    return Math.abs(e - s) < o.radius + o.hitRadius;
  }
  (To.id = 'line'),
    (To.defaults = {
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 0,
      borderJoinStyle: 'miter',
      borderWidth: 3,
      capBezierPoints: !0,
      cubicInterpolationMode: 'default',
      fill: !1,
      spanGaps: !1,
      stepped: !1,
      tension: 0
    }),
    (To.defaultRoutes = {
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor'
    }),
    (To.descriptors = {
      _scriptable: !0,
      _indexable: (t) => 'borderDash' !== t && 'fill' !== t
    });
  class Lo extends Ri {
    constructor(t) {
      super(),
        (this.options = void 0),
        (this.parsed = void 0),
        (this.skip = void 0),
        (this.stop = void 0),
        t && Object.assign(this, t);
    }
    inRange(t, e, i) {
      const n = this.options,
        { x: o, y: s } = this.getProps(['x', 'y'], i);
      return (
        Math.pow(t - o, 2) + Math.pow(e - s, 2) <
        Math.pow(n.hitRadius + n.radius, 2)
      );
    }
    inXRange(t, e) {
      return Ro(this, t, 'x', e);
    }
    inYRange(t, e) {
      return Ro(this, t, 'y', e);
    }
    getCenterPoint(t) {
      const { x: e, y: i } = this.getProps(['x', 'y'], t);
      return { x: e, y: i };
    }
    size(t) {
      let e = (t = t || this.options || {}).radius || 0;
      e = Math.max(e, (e && t.hoverRadius) || 0);
      return 2 * (e + ((e && t.borderWidth) || 0));
    }
    draw(t) {
      const e = this,
        i = e.options;
      e.skip ||
        i.radius < 0.1 ||
        ((t.strokeStyle = i.borderColor),
        (t.lineWidth = i.borderWidth),
        (t.fillStyle = i.backgroundColor),
        qt(t, i, e.x, e.y));
    }
    getRange() {
      const t = this.options || {};
      return t.radius + t.hitRadius;
    }
  }
  function Eo(t, e) {
    const {
      x: i,
      y: n,
      base: o,
      width: s,
      height: a
    } = t.getProps(['x', 'y', 'base', 'width', 'height'], e);
    let r, l, c, h, d;
    return (
      t.horizontal
        ? ((d = a / 2),
          (r = Math.min(i, o)),
          (l = Math.max(i, o)),
          (c = n - d),
          (h = n + d))
        : ((d = s / 2),
          (r = i - d),
          (l = i + d),
          (c = Math.min(n, o)),
          (h = Math.max(n, o))),
      { left: r, top: c, right: l, bottom: h }
    );
  }
  function Io(t) {
    let e = t.options.borderSkipped;
    const i = {};
    return e
      ? ((e = t.horizontal
          ? Fo(e, 'left', 'right', t.base > t.x)
          : Fo(e, 'bottom', 'top', t.base < t.y)),
        (i[e] = !0),
        i)
      : i;
  }
  function Fo(t, e, i, n) {
    var o, s, a;
    return (
      n
        ? ((a = i),
          (t = zo((t = (o = t) === (s = e) ? a : o === a ? s : o), i, e)))
        : (t = zo(t, e, i)),
      t
    );
  }
  function zo(t, e, i) {
    return 'start' === t ? e : 'end' === t ? i : t;
  }
  function Vo(t, e, i, n) {
    return t ? 0 : Math.max(Math.min(e, n), i);
  }
  function Bo(t) {
    const e = Eo(t),
      i = e.right - e.left,
      n = e.bottom - e.top,
      o = (function (t, e, i) {
        const n = t.options.borderWidth,
          o = Io(t),
          s = Le(n);
        return {
          t: Vo(o.top, s.top, 0, i),
          r: Vo(o.right, s.right, 0, e),
          b: Vo(o.bottom, s.bottom, 0, i),
          l: Vo(o.left, s.left, 0, e)
        };
      })(t, i / 2, n / 2),
      s = (function (t, e, i) {
        const n = Ee(t.options.borderRadius),
          o = Math.min(e, i),
          s = Io(t);
        return {
          topLeft: Vo(s.top || s.left, n.topLeft, 0, o),
          topRight: Vo(s.top || s.right, n.topRight, 0, o),
          bottomLeft: Vo(s.bottom || s.left, n.bottomLeft, 0, o),
          bottomRight: Vo(s.bottom || s.right, n.bottomRight, 0, o)
        };
      })(t, i / 2, n / 2);
    return {
      outer: { x: e.left, y: e.top, w: i, h: n, radius: s },
      inner: {
        x: e.left + o.l,
        y: e.top + o.t,
        w: i - o.l - o.r,
        h: n - o.t - o.b,
        radius: {
          topLeft: Math.max(0, s.topLeft - Math.max(o.t, o.l)),
          topRight: Math.max(0, s.topRight - Math.max(o.t, o.r)),
          bottomLeft: Math.max(0, s.bottomLeft - Math.max(o.b, o.l)),
          bottomRight: Math.max(0, s.bottomRight - Math.max(o.b, o.r))
        }
      }
    };
  }
  function Wo(t, e, i, n) {
    const o = null === e,
      s = null === i,
      a = t && !(o && s) && Eo(t, n);
    return (
      a &&
      (o || (e >= a.left && e <= a.right)) &&
      (s || (i >= a.top && i <= a.bottom))
    );
  }
  function No(t, e) {
    t.rect(e.x, e.y, e.w, e.h);
  }
  (Lo.id = 'point'),
    (Lo.defaults = {
      borderWidth: 1,
      hitRadius: 1,
      hoverBorderWidth: 1,
      hoverRadius: 4,
      pointStyle: 'circle',
      radius: 3,
      rotation: 0
    }),
    (Lo.defaultRoutes = {
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor'
    });
  class Ho extends Ri {
    constructor(t) {
      super(),
        (this.options = void 0),
        (this.horizontal = void 0),
        (this.base = void 0),
        (this.width = void 0),
        (this.height = void 0),
        t && Object.assign(this, t);
    }
    draw(t) {
      const e = this.options,
        { inner: i, outer: n } = Bo(this),
        o =
          (s = n.radius).topLeft || s.topRight || s.bottomLeft || s.bottomRight
            ? ee
            : No;
      var s;
      t.save(),
        (n.w === i.w && n.h === i.h) ||
          (t.beginPath(),
          o(t, n),
          t.clip(),
          o(t, i),
          (t.fillStyle = e.borderColor),
          t.fill('evenodd')),
        t.beginPath(),
        o(t, i),
        (t.fillStyle = e.backgroundColor),
        t.fill(),
        t.restore();
    }
    inRange(t, e, i) {
      return Wo(this, t, e, i);
    }
    inXRange(t, e) {
      return Wo(this, t, null, e);
    }
    inYRange(t, e) {
      return Wo(this, null, t, e);
    }
    getCenterPoint(t) {
      const {
        x: e,
        y: i,
        base: n,
        horizontal: o
      } = this.getProps(['x', 'y', 'base', 'horizontal'], t);
      return { x: o ? (e + n) / 2 : e, y: o ? i : (i + n) / 2 };
    }
    getRange(t) {
      return 'x' === t ? this.width / 2 : this.height / 2;
    }
  }
  (Ho.id = 'bar'),
    (Ho.defaults = {
      borderSkipped: 'start',
      borderWidth: 0,
      borderRadius: 0,
      pointStyle: void 0
    }),
    (Ho.defaultRoutes = {
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor'
    });
  var jo = Object.freeze({
    __proto__: null,
    ArcElement: wo,
    LineElement: To,
    PointElement: Lo,
    BarElement: Ho
  });
  function $o(t) {
    if (t._decimated) {
      const e = t._data;
      delete t._decimated,
        delete t._data,
        Object.defineProperty(t, 'data', { value: e });
    }
  }
  function Yo(t) {
    t.data.datasets.forEach((t) => {
      $o(t);
    });
  }
  var Uo = {
    id: 'decimation',
    defaults: { algorithm: 'min-max', enabled: !1 },
    beforeElementsUpdate: (t, e, i) => {
      if (!i.enabled) return void Yo(t);
      const n = t.width;
      t.data.datasets.forEach((e, o) => {
        const { _data: s, indexAxis: a } = e,
          r = t.getDatasetMeta(o),
          l = s || e.data;
        if ('y' === ze([a, t.options.indexAxis])) return;
        if ('line' !== r.type) return;
        const c = t.scales[r.xAxisID];
        if ('linear' !== c.type && 'time' !== c.type) return;
        if (t.options.parsing) return;
        let h,
          { start: d, count: u } = (function (t, e) {
            const i = e.length;
            let n,
              o = 0;
            const { iScale: s } = t,
              {
                min: a,
                max: r,
                minDefined: l,
                maxDefined: c
              } = s.getUserBounds();
            return (
              l && (o = Nt(ne(e, s.axis, a).lo, 0, i - 1)),
              (n = c ? Nt(ne(e, s.axis, r).hi + 1, o, i) - o : i - o),
              { start: o, count: n }
            );
          })(r, l);
        if (u <= 4 * n) $o(e);
        else {
          switch (
            ($(s) &&
              ((e._data = l),
              delete e.data,
              Object.defineProperty(e, 'data', {
                configurable: !0,
                enumerable: !0,
                get: function () {
                  return this._decimated;
                },
                set: function (t) {
                  this._data = t;
                }
              })),
            i.algorithm)
          ) {
            case 'lttb':
              h = (function (t, e, i, n, o) {
                const s = o.samples || n;
                if (s >= i) return t.slice(e, e + i);
                const a = [],
                  r = (i - 2) / (s - 2);
                let l = 0;
                const c = e + i - 1;
                let h,
                  d,
                  u,
                  f,
                  g,
                  p = e;
                for (a[l++] = t[p], h = 0; h < s - 2; h++) {
                  let n,
                    o = 0,
                    s = 0;
                  const c = Math.floor((h + 1) * r) + 1 + e,
                    m = Math.min(Math.floor((h + 2) * r) + 1, i) + e,
                    x = m - c;
                  for (n = c; n < m; n++) (o += t[n].x), (s += t[n].y);
                  (o /= x), (s /= x);
                  const b = Math.floor(h * r) + 1 + e,
                    _ = Math.floor((h + 1) * r) + 1 + e,
                    { x: y, y: v } = t[p];
                  for (u = f = -1, n = b; n < _; n++)
                    (f =
                      0.5 *
                      Math.abs(
                        (y - o) * (t[n].y - v) - (y - t[n].x) * (s - v)
                      )),
                      f > u && ((u = f), (d = t[n]), (g = n));
                  (a[l++] = d), (p = g);
                }
                return (a[l++] = t[c]), a;
              })(l, d, u, n, i);
              break;
            case 'min-max':
              h = (function (t, e, i, n) {
                let o,
                  s,
                  a,
                  r,
                  l,
                  c,
                  h,
                  d,
                  u,
                  f,
                  g = 0,
                  p = 0;
                const m = [],
                  x = e + i - 1,
                  b = t[e].x,
                  _ = t[x].x - b;
                for (o = e; o < e + i; ++o) {
                  (s = t[o]), (a = ((s.x - b) / _) * n), (r = s.y);
                  const e = 0 | a;
                  if (e === l)
                    r < u ? ((u = r), (c = o)) : r > f && ((f = r), (h = o)),
                      (g = (p * g + s.x) / ++p);
                  else {
                    const i = o - 1;
                    if (!$(c) && !$(h)) {
                      const e = Math.min(c, h),
                        n = Math.max(c, h);
                      e !== d && e !== i && m.push({ ...t[e], x: g }),
                        n !== d && n !== i && m.push({ ...t[n], x: g });
                    }
                    o > 0 && i !== d && m.push(t[i]),
                      m.push(s),
                      (l = e),
                      (p = 0),
                      (u = f = r),
                      (c = h = d = o);
                  }
                }
                return m;
              })(l, d, u, n);
              break;
            default:
              throw new Error(
                `Unsupported decimation algorithm '${i.algorithm}'`
              );
          }
          e._decimated = h;
        }
      });
    },
    destroy(t) {
      Yo(t);
    }
  };
  function Xo(t, e, i) {
    const n = (function (t) {
      const e = t.options,
        i = e.fill;
      let n = K(i && i.target, i);
      return (
        void 0 === n && (n = !!e.backgroundColor),
        !1 !== n && null !== n && (!0 === n ? 'origin' : n)
      );
    })(t);
    if (U(n)) return !isNaN(n.value) && n;
    let o = parseFloat(n);
    return X(o) && Math.floor(o) === o
      ? (('-' !== n[0] && '+' !== n[0]) || (o = e + o),
        !(o === e || o < 0 || o >= i) && o)
      : ['origin', 'start', 'end', 'stack'].indexOf(n) >= 0 && n;
  }
  class qo {
    constructor(t) {
      (this.x = t.x), (this.y = t.y), (this.radius = t.radius);
    }
    pathSegment(t, e, i) {
      const { x: n, y: o, radius: s } = this;
      return (
        (e = e || { start: 0, end: bt }),
        t.arc(n, o, s, e.end, e.start, !0),
        !i.bounds
      );
    }
    interpolate(t) {
      const { x: e, y: i, radius: n } = this,
        o = t.angle;
      return { x: e + Math.cos(o) * n, y: i + Math.sin(o) * n, angle: o };
    }
  }
  function Ko(t) {
    return (t.scale || {}).getPointPositionForValue
      ? (function (t) {
          const { scale: e, fill: i } = t,
            n = e.options,
            o = e.getLabels().length,
            s = [],
            a = n.reverse ? e.max : e.min,
            r = n.reverse ? e.min : e.max;
          let l, c, h;
          if (
            ((h =
              'start' === i
                ? a
                : 'end' === i
                  ? r
                  : U(i)
                    ? i.value
                    : e.getBaseValue()),
            n.grid.circular)
          )
            return (
              (c = e.getPointPositionForValue(0, a)),
              new qo({
                x: c.x,
                y: c.y,
                radius: e.getDistanceFromCenterForValue(h)
              })
            );
          for (l = 0; l < o; ++l) s.push(e.getPointPositionForValue(l, h));
          return s;
        })(t)
      : (function (t) {
          const { scale: e = {}, fill: i } = t;
          let n,
            o = null;
          return (
            'start' === i
              ? (o = e.bottom)
              : 'end' === i
                ? (o = e.top)
                : U(i)
                  ? (o = e.getPixelForValue(i.value))
                  : e.getBasePixel && (o = e.getBasePixel()),
            X(o)
              ? ((n = e.isHorizontal()), { x: n ? o : null, y: n ? null : o })
              : null
          );
        })(t);
  }
  function Go(t) {
    const { chart: e, scale: i, index: n, line: o } = t,
      s = [],
      a = o.segments,
      r = o.points,
      l = (function (t, e) {
        const i = [],
          n = t.getSortedVisibleDatasetMetas();
        for (let t = 0; t < n.length; t++) {
          const o = n[t];
          if (o.index === e) break;
          Zo(o) && i.unshift(o.dataset);
        }
        return i;
      })(e, n);
    l.push(ts({ x: null, y: i.bottom }, o));
    for (let t = 0; t < a.length; t++) {
      const e = a[t];
      for (let t = e.start; t <= e.end; t++) Qo(s, r[t], l);
    }
    return new To({ points: s, options: {} });
  }
  const Zo = (t) => 'line' === t.type && !t.hidden;
  function Qo(t, e, i) {
    const n = [];
    for (let o = 0; o < i.length; o++) {
      const s = i[o],
        { first: a, last: r, point: l } = Jo(s, e, 'x');
      if (!(!l || (a && r)))
        if (a) n.unshift(l);
        else if ((t.push(l), !r)) break;
    }
    t.push(...n);
  }
  function Jo(t, e, i) {
    const n = t.interpolate(e, i);
    if (!n) return {};
    const o = n[i],
      s = t.segments,
      a = t.points;
    let r = !1,
      l = !1;
    for (let t = 0; t < s.length; t++) {
      const e = s[t],
        n = a[e.start][i],
        c = a[e.end][i];
      if (o >= n && o <= c) {
        (r = o === n), (l = o === c);
        break;
      }
    }
    return { first: r, last: l, point: n };
  }
  function ts(t, e) {
    let i = [],
      n = !1;
    return (
      Y(t)
        ? ((n = !0), (i = t))
        : (i = (function (t, e) {
            const { x: i = null, y: n = null } = t || {},
              o = e.points,
              s = [];
            return (
              e.segments.forEach((t) => {
                const e = o[t.start],
                  a = o[t.end];
                null !== n
                  ? (s.push({ x: e.x, y: n }), s.push({ x: a.x, y: n }))
                  : null !== i &&
                    (s.push({ x: i, y: e.y }), s.push({ x: i, y: a.y }));
              }),
              s
            );
          })(t, e)),
      i.length
        ? new To({ points: i, options: { tension: 0 }, _loop: n, _fullLoop: n })
        : null
    );
  }
  function es(t, e, i) {
    let n = t[e].fill;
    const o = [e];
    let s;
    if (!i) return n;
    for (; !1 !== n && -1 === o.indexOf(n); ) {
      if (!X(n)) return n;
      if (((s = t[n]), !s)) return !1;
      if (s.visible) return n;
      o.push(n), (n = s.fill);
    }
    return !1;
  }
  function is(t, e, i) {
    t.beginPath(),
      e.path(t),
      t.lineTo(e.last().x, i),
      t.lineTo(e.first().x, i),
      t.closePath(),
      t.clip();
  }
  function ns(t, e, i, n) {
    if (n) return;
    let o = e[t],
      s = i[t];
    return (
      'angle' === t && ((o = Bt(o)), (s = Bt(s))),
      { property: t, start: o, end: s }
    );
  }
  function os(t, e, i, n) {
    return t && e ? n(t[i], e[i]) : t ? t[i] : e ? e[i] : 0;
  }
  function ss(t, e, i) {
    const { top: n, bottom: o } = e.chart.chartArea,
      { property: s, start: a, end: r } = i || {};
    'x' === s && (t.beginPath(), t.rect(a, n, r - a, o - n), t.clip());
  }
  function as(t, e, i, n) {
    const o = e.interpolate(i, n);
    o && t.lineTo(o.x, o.y);
  }
  function rs(t, e) {
    const { line: i, target: n, property: o, color: s, scale: a } = e,
      r = (function (t, e, i) {
        const n = t.segments,
          o = t.points,
          s = e.points,
          a = [];
        for (const t of n) {
          const n = ns(i, o[t.start], o[t.end], t.loop);
          if (!e.segments) {
            a.push({ source: t, target: n, start: o[t.start], end: o[t.end] });
            continue;
          }
          const r = vn(e, n);
          for (const e of r) {
            const r = ns(i, s[e.start], s[e.end], e.loop),
              l = yn(t, o, r);
            for (const t of l)
              a.push({
                source: t,
                target: e,
                start: { [i]: os(n, r, 'start', Math.max) },
                end: { [i]: os(n, r, 'end', Math.min) }
              });
          }
        }
        return a;
      })(i, n, o);
    for (const { source: e, target: l, start: c, end: h } of r) {
      const { style: { backgroundColor: r = s } = {} } = e;
      t.save(), (t.fillStyle = r), ss(t, a, ns(o, c, h)), t.beginPath();
      const d = !!i.pathSegment(t, e);
      d ? t.closePath() : as(t, n, h, o);
      const u = !!n.pathSegment(t, l, { move: d, reverse: !0 }),
        f = d && u;
      f || as(t, n, c, o),
        t.closePath(),
        t.fill(f ? 'evenodd' : 'nonzero'),
        t.restore();
    }
  }
  function ls(t, e, i) {
    const n = (function (t) {
        const { chart: e, fill: i, line: n } = t;
        if (X(i))
          return (function (t, e) {
            const i = t.getDatasetMeta(e);
            return i && t.isDatasetVisible(e) ? i.dataset : null;
          })(e, i);
        if ('stack' === i) return Go(t);
        const o = Ko(t);
        return o instanceof qo ? o : ts(o, n);
      })(e),
      { line: o, scale: s, axis: a } = e,
      r = o.options,
      l = r.fill,
      c = r.backgroundColor,
      { above: h = c, below: d = c } = l || {};
    n &&
      o.points.length &&
      (Gt(t, i),
      (function (t, e) {
        const { line: i, target: n, above: o, below: s, area: a, scale: r } = e,
          l = i._loop ? 'angle' : e.axis;
        t.save(),
          'x' === l &&
            s !== o &&
            (is(t, n, a.top),
            rs(t, { line: i, target: n, color: o, scale: r, property: l }),
            t.restore(),
            t.save(),
            is(t, n, a.bottom)),
          rs(t, { line: i, target: n, color: s, scale: r, property: l }),
          t.restore();
      })(t, {
        line: o,
        target: n,
        above: h,
        below: d,
        area: i,
        scale: s,
        axis: a
      }),
      Zt(t));
  }
  var cs = {
    id: 'filler',
    afterDatasetsUpdate(t, e, i) {
      const n = (t.data.datasets || []).length,
        o = [];
      let s, a, r, l;
      for (a = 0; a < n; ++a)
        (s = t.getDatasetMeta(a)),
          (r = s.dataset),
          (l = null),
          r &&
            r.options &&
            r instanceof To &&
            (l = {
              visible: t.isDatasetVisible(a),
              index: a,
              fill: Xo(r, a, n),
              chart: t,
              axis: s.controller.options.indexAxis,
              scale: s.vScale,
              line: r
            }),
          (s.$filler = l),
          o.push(l);
      for (a = 0; a < n; ++a)
        (l = o[a]), l && !1 !== l.fill && (l.fill = es(o, a, i.propagate));
    },
    beforeDatasetsDraw(t, e, i) {
      const n = t.getSortedVisibleDatasetMetas(),
        o = t.chartArea;
      for (let e = n.length - 1; e >= 0; --e) {
        const s = n[e].$filler;
        s &&
          (s.line.updateControlPoints(o),
          'beforeDatasetsDraw' === i.drawTime && ls(t.ctx, s, o));
      }
    },
    beforeDatasetDraw(t, e, i) {
      const n = e.meta.$filler;
      n &&
        !1 !== n.fill &&
        'beforeDatasetDraw' === i.drawTime &&
        ls(t.ctx, n, t.chartArea);
    },
    defaults: { propagate: !0, drawTime: 'beforeDatasetDraw' }
  };
  const hs = (t, e) => {
    let { boxHeight: i = e, boxWidth: n = e } = t;
    return (
      t.usePointStyle && ((i = Math.min(i, e)), (n = Math.min(n, e))),
      { boxWidth: n, boxHeight: i, itemHeight: Math.max(e, i) }
    );
  };
  class ds extends Ri {
    constructor(t) {
      super(),
        (this._added = !1),
        (this.legendHitBoxes = []),
        (this._hoveredItem = null),
        (this.doughnutMode = !1),
        (this.chart = t.chart),
        (this.options = t.options),
        (this.ctx = t.ctx),
        (this.legendItems = void 0),
        (this.columnSizes = void 0),
        (this.lineWidths = void 0),
        (this.maxHeight = void 0),
        (this.maxWidth = void 0),
        (this.top = void 0),
        (this.bottom = void 0),
        (this.left = void 0),
        (this.right = void 0),
        (this.height = void 0),
        (this.width = void 0),
        (this._margins = void 0),
        (this.position = void 0),
        (this.weight = void 0),
        (this.fullSize = void 0);
    }
    update(t, e, i) {
      const n = this;
      (n.maxWidth = t),
        (n.maxHeight = e),
        (n._margins = i),
        n.setDimensions(),
        n.buildLabels(),
        n.fit();
    }
    setDimensions() {
      const t = this;
      t.isHorizontal()
        ? ((t.width = t.maxWidth), (t.left = 0), (t.right = t.width))
        : ((t.height = t.maxHeight), (t.top = 0), (t.bottom = t.height));
    }
    buildLabels() {
      const t = this,
        e = t.options.labels || {};
      let i = Q(e.generateLabels, [t.chart], t) || [];
      e.filter && (i = i.filter((i) => e.filter(i, t.chart.data))),
        e.sort && (i = i.sort((i, n) => e.sort(i, n, t.chart.data))),
        t.options.reverse && i.reverse(),
        (t.legendItems = i);
    }
    fit() {
      const t = this,
        { options: e, ctx: i } = t;
      if (!e.display) return void (t.width = t.height = 0);
      const n = e.labels,
        o = Fe(n.font),
        s = o.size,
        a = t._computeTitleHeight(),
        { boxWidth: r, itemHeight: l } = hs(n, s);
      let c, h;
      (i.font = o.string),
        t.isHorizontal()
          ? ((c = t.maxWidth), (h = t._fitRows(a, s, r, l) + 10))
          : ((h = t.maxHeight), (c = t._fitCols(a, s, r, l) + 10)),
        (t.width = Math.min(c, e.maxWidth || t.maxWidth)),
        (t.height = Math.min(h, e.maxHeight || t.maxHeight));
    }
    _fitRows(t, e, i, n) {
      const o = this,
        {
          ctx: s,
          maxWidth: a,
          options: {
            labels: { padding: r }
          }
        } = o,
        l = (o.legendHitBoxes = []),
        c = (o.lineWidths = [0]),
        h = n + r;
      let d = t;
      (s.textAlign = 'left'), (s.textBaseline = 'middle');
      let u = -1,
        f = -h;
      return (
        o.legendItems.forEach((t, o) => {
          const g = i + e / 2 + s.measureText(t.text).width;
          (0 === o || c[c.length - 1] + g + 2 * r > a) &&
            ((d += h), (c[c.length - (o > 0 ? 0 : 1)] = 0), (f += h), u++),
            (l[o] = { left: 0, top: f, row: u, width: g, height: n }),
            (c[c.length - 1] += g + r);
        }),
        d
      );
    }
    _fitCols(t, e, i, n) {
      const o = this,
        {
          ctx: s,
          maxHeight: a,
          options: {
            labels: { padding: r }
          }
        } = o,
        l = (o.legendHitBoxes = []),
        c = (o.columnSizes = []),
        h = a - t;
      let d = r,
        u = 0,
        f = 0,
        g = 0,
        p = 0,
        m = 0;
      return (
        o.legendItems.forEach((t, o) => {
          const a = i + e / 2 + s.measureText(t.text).width;
          o > 0 &&
            f + e + 2 * r > h &&
            ((d += u + r),
            c.push({ width: u, height: f }),
            (g += u + r),
            m++,
            (p = 0),
            (u = f = 0)),
            (u = Math.max(u, a)),
            (f += e + r),
            (l[o] = { left: g, top: p, col: m, width: a, height: n }),
            (p += n + r);
        }),
        (d += u),
        c.push({ width: u, height: f }),
        d
      );
    }
    adjustHitBoxes() {
      const t = this;
      if (!t.options.display) return;
      const e = t._computeTitleHeight(),
        {
          legendHitBoxes: i,
          options: {
            align: n,
            labels: { padding: s }
          }
        } = t;
      if (this.isHorizontal()) {
        let a = 0,
          r = o(n, t.left + s, t.right - t.lineWidths[a]);
        for (const l of i)
          a !== l.row &&
            ((a = l.row), (r = o(n, t.left + s, t.right - t.lineWidths[a]))),
            (l.top += t.top + e + s),
            (l.left = r),
            (r += l.width + s);
      } else {
        let a = 0,
          r = o(n, t.top + e + s, t.bottom - t.columnSizes[a].height);
        for (const l of i)
          l.col !== a &&
            ((a = l.col),
            (r = o(n, t.top + e + s, t.bottom - t.columnSizes[a].height))),
            (l.top = r),
            (l.left += t.left + s),
            (r += l.height + s);
      }
    }
    isHorizontal() {
      return (
        'top' === this.options.position || 'bottom' === this.options.position
      );
    }
    draw() {
      const t = this;
      if (t.options.display) {
        const e = t.ctx;
        Gt(e, t), t._draw(), Zt(e);
      }
    }
    _draw() {
      const t = this,
        { options: e, columnSizes: i, lineWidths: n, ctx: a } = t,
        { align: r, labels: l } = e,
        c = mt.color,
        h = pn(e.rtl, t.left, t.width),
        d = Fe(l.font),
        { color: u, padding: f } = l,
        g = d.size,
        p = g / 2;
      let m;
      t.drawTitle(),
        (a.textAlign = h.textAlign('left')),
        (a.textBaseline = 'middle'),
        (a.lineWidth = 0.5),
        (a.font = d.string);
      const { boxWidth: x, boxHeight: b, itemHeight: _ } = hs(l, g),
        y = t.isHorizontal(),
        v = this._computeTitleHeight();
      (m = y
        ? { x: o(r, t.left + f, t.right - n[0]), y: t.top + f + v, line: 0 }
        : {
            x: t.left + f,
            y: o(r, t.top + v + f, t.bottom - i[0].height),
            line: 0
          }),
        mn(t.ctx, e.textDirection);
      const w = _ + f;
      t.legendItems.forEach((e, M) => {
        (a.strokeStyle = e.fontColor || u), (a.fillStyle = e.fontColor || u);
        const k = a.measureText(e.text).width,
          S = h.textAlign(e.textAlign || (e.textAlign = l.textAlign)),
          P = x + g / 2 + k;
        let D = m.x,
          C = m.y;
        h.setWidth(t.width),
          y
            ? M > 0 &&
              D + P + f > t.right &&
              ((C = m.y += w),
              m.line++,
              (D = m.x = o(r, t.left + f, t.right - n[m.line])))
            : M > 0 &&
              C + w > t.bottom &&
              ((D = m.x = D + i[m.line].width + f),
              m.line++,
              (C = m.y = o(r, t.top + v + f, t.bottom - i[m.line].height)));
        !(function (t, e, i) {
          if (isNaN(x) || x <= 0 || isNaN(b) || b < 0) return;
          a.save();
          const n = K(i.lineWidth, 1);
          if (
            ((a.fillStyle = K(i.fillStyle, c)),
            (a.lineCap = K(i.lineCap, 'butt')),
            (a.lineDashOffset = K(i.lineDashOffset, 0)),
            (a.lineJoin = K(i.lineJoin, 'miter')),
            (a.lineWidth = n),
            (a.strokeStyle = K(i.strokeStyle, c)),
            a.setLineDash(K(i.lineDash, [])),
            l.usePointStyle)
          ) {
            const o = {
                radius: (x * Math.SQRT2) / 2,
                pointStyle: i.pointStyle,
                rotation: i.rotation,
                borderWidth: n
              },
              s = h.xPlus(t, x / 2);
            qt(a, o, s, e + p);
          } else {
            const o = e + Math.max((g - b) / 2, 0),
              s = h.leftForLtr(t, x),
              r = Ee(i.borderRadius);
            a.beginPath(),
              Object.values(r).some((t) => 0 !== t)
                ? ee(a, { x: s, y: o, w: x, h: b, radius: r })
                : a.rect(s, o, x, b),
              a.fill(),
              0 !== n && a.stroke();
          }
          a.restore();
        })(h.x(D), C, e),
          (D = s(S, D + x + p, t.right)),
          (function (t, e, i) {
            te(a, i.text, t, e + _ / 2, d, {
              strikethrough: i.hidden,
              textAlign: i.textAlign
            });
          })(h.x(D), C, e),
          y ? (m.x += P + f) : (m.y += w);
      }),
        xn(t.ctx, e.textDirection);
    }
    drawTitle() {
      const t = this,
        e = t.options,
        i = e.title,
        s = Fe(i.font),
        a = Ie(i.padding);
      if (!i.display) return;
      const r = pn(e.rtl, t.left, t.width),
        l = t.ctx,
        c = i.position,
        h = s.size / 2,
        d = a.top + h;
      let u,
        f = t.left,
        g = t.width;
      if (this.isHorizontal())
        (g = Math.max(...t.lineWidths)),
          (u = t.top + d),
          (f = o(e.align, f, t.right - g));
      else {
        const i = t.columnSizes.reduce((t, e) => Math.max(t, e.height), 0);
        u =
          d +
          o(
            e.align,
            t.top,
            t.bottom - i - e.labels.padding - t._computeTitleHeight()
          );
      }
      const p = o(c, f, f + g);
      (l.textAlign = r.textAlign(n(c))),
        (l.textBaseline = 'middle'),
        (l.strokeStyle = i.color),
        (l.fillStyle = i.color),
        (l.font = s.string),
        te(l, i.text, p, u, s);
    }
    _computeTitleHeight() {
      const t = this.options.title,
        e = Fe(t.font),
        i = Ie(t.padding);
      return t.display ? e.lineHeight + i.height : 0;
    }
    _getLegendItemAt(t, e) {
      const i = this;
      let n, o, s;
      if (t >= i.left && t <= i.right && e >= i.top && e <= i.bottom)
        for (s = i.legendHitBoxes, n = 0; n < s.length; ++n)
          if (
            ((o = s[n]),
            t >= o.left &&
              t <= o.left + o.width &&
              e >= o.top &&
              e <= o.top + o.height)
          )
            return i.legendItems[n];
      return null;
    }
    handleEvent(t) {
      const e = this,
        i = e.options;
      if (
        !(function (t, e) {
          if ('mousemove' === t && (e.onHover || e.onLeave)) return !0;
          if (e.onClick && ('click' === t || 'mouseup' === t)) return !0;
          return !1;
        })(t.type, i)
      )
        return;
      const n = e._getLegendItemAt(t.x, t.y);
      if ('mousemove' === t.type) {
        const a = e._hoveredItem,
          r =
            ((s = n),
            null !== (o = a) &&
              null !== s &&
              o.datasetIndex === s.datasetIndex &&
              o.index === s.index);
        a && !r && Q(i.onLeave, [t, a, e], e),
          (e._hoveredItem = n),
          n && !r && Q(i.onHover, [t, n, e], e);
      } else n && Q(i.onClick, [t, n, e], e);
      var o, s;
    }
  }
  var us = {
    id: 'legend',
    _element: ds,
    start(t, e, i) {
      const n = (t.legend = new ds({ ctx: t.ctx, options: i, chart: t }));
      Ke.configure(t, n, i), Ke.addBox(t, n);
    },
    stop(t) {
      Ke.removeBox(t, t.legend), delete t.legend;
    },
    beforeUpdate(t, e, i) {
      const n = t.legend;
      Ke.configure(t, n, i), (n.options = i);
    },
    afterUpdate(t) {
      const e = t.legend;
      e.buildLabels(), e.adjustHitBoxes();
    },
    afterEvent(t, e) {
      e.replay || t.legend.handleEvent(e.event);
    },
    defaults: {
      display: !0,
      position: 'top',
      align: 'center',
      fullSize: !0,
      reverse: !1,
      weight: 1e3,
      onClick(t, e, i) {
        const n = e.datasetIndex,
          o = i.chart;
        o.isDatasetVisible(n)
          ? (o.hide(n), (e.hidden = !0))
          : (o.show(n), (e.hidden = !1));
      },
      onHover: null,
      onLeave: null,
      labels: {
        color: (t) => t.chart.options.color,
        boxWidth: 40,
        padding: 10,
        generateLabels(t) {
          const e = t.data.datasets,
            {
              labels: {
                usePointStyle: i,
                pointStyle: n,
                textAlign: o,
                color: s
              }
            } = t.legend.options;
          return t._getSortedDatasetMetas().map((t) => {
            const a = t.controller.getStyle(i ? 0 : void 0),
              r = Ie(a.borderWidth);
            return {
              text: e[t.index].label,
              fillStyle: a.backgroundColor,
              fontColor: s,
              hidden: !t.visible,
              lineCap: a.borderCapStyle,
              lineDash: a.borderDash,
              lineDashOffset: a.borderDashOffset,
              lineJoin: a.borderJoinStyle,
              lineWidth: (r.width + r.height) / 4,
              strokeStyle: a.borderColor,
              pointStyle: n || a.pointStyle,
              rotation: a.rotation,
              textAlign: o || a.textAlign,
              borderRadius: 0,
              datasetIndex: t.index
            };
          }, this);
        }
      },
      title: {
        color: (t) => t.chart.options.color,
        display: !1,
        position: 'center',
        text: ''
      }
    },
    descriptors: {
      _scriptable: (t) => !t.startsWith('on'),
      labels: {
        _scriptable: (t) => !['generateLabels', 'filter', 'sort'].includes(t)
      }
    }
  };
  class fs extends Ri {
    constructor(t) {
      super(),
        (this.chart = t.chart),
        (this.options = t.options),
        (this.ctx = t.ctx),
        (this._padding = void 0),
        (this.top = void 0),
        (this.bottom = void 0),
        (this.left = void 0),
        (this.right = void 0),
        (this.width = void 0),
        (this.height = void 0),
        (this.position = void 0),
        (this.weight = void 0),
        (this.fullSize = void 0);
    }
    update(t, e) {
      const i = this,
        n = i.options;
      if (((i.left = 0), (i.top = 0), !n.display))
        return void (i.width = i.height = i.right = i.bottom = 0);
      (i.width = i.right = t), (i.height = i.bottom = e);
      const o = Y(n.text) ? n.text.length : 1;
      i._padding = Ie(n.padding);
      const s = o * Fe(n.font).lineHeight + i._padding.height;
      i.isHorizontal() ? (i.height = s) : (i.width = s);
    }
    isHorizontal() {
      const t = this.options.position;
      return 'top' === t || 'bottom' === t;
    }
    _drawArgs(t) {
      const { top: e, left: i, bottom: n, right: s, options: a } = this,
        r = a.align;
      let l,
        c,
        h,
        d = 0;
      return (
        this.isHorizontal()
          ? ((c = o(r, i, s)), (h = e + t), (l = s - i))
          : ('left' === a.position
              ? ((c = i + t), (h = o(r, n, e)), (d = -0.5 * xt))
              : ((c = s - t), (h = o(r, e, n)), (d = 0.5 * xt)),
            (l = n - e)),
        { titleX: c, titleY: h, maxWidth: l, rotation: d }
      );
    }
    draw() {
      const t = this,
        e = t.ctx,
        i = t.options;
      if (!i.display) return;
      const o = Fe(i.font),
        s = o.lineHeight / 2 + t._padding.top,
        { titleX: a, titleY: r, maxWidth: l, rotation: c } = t._drawArgs(s);
      te(e, i.text, 0, 0, o, {
        color: i.color,
        maxWidth: l,
        rotation: c,
        textAlign: n(i.align),
        textBaseline: 'middle',
        translation: [a, r]
      });
    }
  }
  var gs = {
    id: 'title',
    _element: fs,
    start(t, e, i) {
      !(function (t, e) {
        const i = new fs({ ctx: t.ctx, options: e, chart: t });
        Ke.configure(t, i, e), Ke.addBox(t, i), (t.titleBlock = i);
      })(t, i);
    },
    stop(t) {
      const e = t.titleBlock;
      Ke.removeBox(t, e), delete t.titleBlock;
    },
    beforeUpdate(t, e, i) {
      const n = t.titleBlock;
      Ke.configure(t, n, i), (n.options = i);
    },
    defaults: {
      align: 'center',
      display: !1,
      font: { weight: 'bold' },
      fullSize: !0,
      padding: 10,
      position: 'top',
      text: '',
      weight: 2e3
    },
    defaultRoutes: { color: 'color' },
    descriptors: { _scriptable: !0, _indexable: !1 }
  };
  const ps = {
    average(t) {
      if (!t.length) return !1;
      let e,
        i,
        n = 0,
        o = 0,
        s = 0;
      for (e = 0, i = t.length; e < i; ++e) {
        const i = t[e].element;
        if (i && i.hasValue()) {
          const t = i.tooltipPosition();
          (n += t.x), (o += t.y), ++s;
        }
      }
      return { x: n / s, y: o / s };
    },
    nearest(t, e) {
      if (!t.length) return !1;
      let i,
        n,
        o,
        s = e.x,
        a = e.y,
        r = Number.POSITIVE_INFINITY;
      for (i = 0, n = t.length; i < n; ++i) {
        const n = t[i].element;
        if (n && n.hasValue()) {
          const t = zt(e, n.getCenterPoint());
          t < r && ((r = t), (o = n));
        }
      }
      if (o) {
        const t = o.tooltipPosition();
        (s = t.x), (a = t.y);
      }
      return { x: s, y: a };
    }
  };
  function ms(t, e) {
    return e && (Y(e) ? Array.prototype.push.apply(t, e) : t.push(e)), t;
  }
  function xs(t) {
    return ('string' == typeof t || t instanceof String) && t.indexOf('\n') > -1
      ? t.split('\n')
      : t;
  }
  function bs(t, e) {
    const { element: i, datasetIndex: n, index: o } = e,
      s = t.getDatasetMeta(n).controller,
      { label: a, value: r } = s.getLabelAndValue(o);
    return {
      chart: t,
      label: a,
      parsed: s.getParsed(o),
      raw: t.data.datasets[n].data[o],
      formattedValue: r,
      dataset: s.getDataset(),
      dataIndex: o,
      datasetIndex: n,
      element: i
    };
  }
  function _s(t, e) {
    const i = t._chart.ctx,
      { body: n, footer: o, title: s } = t,
      { boxWidth: a, boxHeight: r } = e,
      l = Fe(e.bodyFont),
      c = Fe(e.titleFont),
      h = Fe(e.footerFont),
      d = s.length,
      u = o.length,
      f = n.length,
      g = Ie(e.padding);
    let p = g.height,
      m = 0,
      x = n.reduce(
        (t, e) => t + e.before.length + e.lines.length + e.after.length,
        0
      );
    if (
      ((x += t.beforeBody.length + t.afterBody.length),
      d &&
        (p +=
          d * c.lineHeight + (d - 1) * e.titleSpacing + e.titleMarginBottom),
      x)
    ) {
      p +=
        f * (e.displayColors ? Math.max(r, l.lineHeight) : l.lineHeight) +
        (x - f) * l.lineHeight +
        (x - 1) * e.bodySpacing;
    }
    u &&
      (p += e.footerMarginTop + u * h.lineHeight + (u - 1) * e.footerSpacing);
    let b = 0;
    const _ = function (t) {
      m = Math.max(m, i.measureText(t).width + b);
    };
    return (
      i.save(),
      (i.font = c.string),
      J(t.title, _),
      (i.font = l.string),
      J(t.beforeBody.concat(t.afterBody), _),
      (b = e.displayColors ? a + 2 : 0),
      J(n, (t) => {
        J(t.before, _), J(t.lines, _), J(t.after, _);
      }),
      (b = 0),
      (i.font = h.string),
      J(t.footer, _),
      i.restore(),
      (m += g.width),
      { width: m, height: p }
    );
  }
  function ys(t, e, i, n) {
    const { x: o, width: s } = i,
      {
        width: a,
        chartArea: { left: r, right: l }
      } = t;
    let c = 'center';
    return (
      'center' === n
        ? (c = o <= (r + l) / 2 ? 'left' : 'right')
        : o <= s / 2
          ? (c = 'left')
          : o >= a - s / 2 && (c = 'right'),
      (function (t, e, i, n) {
        const { x: o, width: s } = n,
          a = i.caretSize + i.caretPadding;
        return (
          ('left' === t && o + s + a > e.width) ||
          ('right' === t && o - s - a < 0) ||
          void 0
        );
      })(c, t, e, i) && (c = 'center'),
      c
    );
  }
  function vs(t, e, i) {
    const n =
      e.yAlign ||
      (function (t, e) {
        const { y: i, height: n } = e;
        return i < n / 2 ? 'top' : i > t.height - n / 2 ? 'bottom' : 'center';
      })(t, i);
    return { xAlign: e.xAlign || ys(t, e, i, n), yAlign: n };
  }
  function ws(t, e, i, n) {
    const { caretSize: o, caretPadding: s, cornerRadius: a } = t,
      { xAlign: r, yAlign: l } = i,
      c = o + s,
      h = a + s;
    let d = (function (t, e) {
      let { x: i, width: n } = t;
      return 'right' === e ? (i -= n) : 'center' === e && (i -= n / 2), i;
    })(e, r);
    const u = (function (t, e, i) {
      let { y: n, height: o } = t;
      return 'top' === e ? (n += i) : (n -= 'bottom' === e ? o + i : o / 2), n;
    })(e, l, c);
    return (
      'center' === l
        ? 'left' === r
          ? (d += c)
          : 'right' === r && (d -= c)
        : 'left' === r
          ? (d -= h)
          : 'right' === r && (d += h),
      { x: Nt(d, 0, n.width - e.width), y: Nt(u, 0, n.height - e.height) }
    );
  }
  function Ms(t, e, i) {
    const n = Ie(i.padding);
    return 'center' === e
      ? t.x + t.width / 2
      : 'right' === e
        ? t.x + t.width - n.right
        : t.x + n.left;
  }
  function ks(t) {
    return ms([], xs(t));
  }
  function Ss(t, e) {
    const i =
      e && e.dataset && e.dataset.tooltip && e.dataset.tooltip.callbacks;
    return i ? t.override(i) : t;
  }
  class Ps extends Ri {
    constructor(t) {
      super(),
        (this.opacity = 0),
        (this._active = []),
        (this._chart = t._chart),
        (this._eventPosition = void 0),
        (this._size = void 0),
        (this._cachedAnimations = void 0),
        (this._tooltipItems = []),
        (this.$animations = void 0),
        (this.$context = void 0),
        (this.options = t.options),
        (this.dataPoints = void 0),
        (this.title = void 0),
        (this.beforeBody = void 0),
        (this.body = void 0),
        (this.afterBody = void 0),
        (this.footer = void 0),
        (this.xAlign = void 0),
        (this.yAlign = void 0),
        (this.x = void 0),
        (this.y = void 0),
        (this.height = void 0),
        (this.width = void 0),
        (this.caretX = void 0),
        (this.caretY = void 0),
        (this.labelColors = void 0),
        (this.labelPointStyles = void 0),
        (this.labelTextColors = void 0);
    }
    initialize(t) {
      (this.options = t),
        (this._cachedAnimations = void 0),
        (this.$context = void 0);
    }
    _resolveAnimations() {
      const t = this,
        e = t._cachedAnimations;
      if (e) return e;
      const i = t._chart,
        n = t.options.setContext(t.getContext()),
        o = n.enabled && i.options.animation && n.animations,
        s = new yi(t._chart, o);
      return o._cacheable && (t._cachedAnimations = Object.freeze(s)), s;
    }
    getContext() {
      const t = this;
      return (
        t.$context ||
        (t.$context =
          ((e = t._chart.getContext()),
          (i = t),
          (n = t._tooltipItems),
          Object.assign(Object.create(e), {
            tooltip: i,
            tooltipItems: n,
            type: 'tooltip'
          })))
      );
      var e, i, n;
    }
    getTitle(t, e) {
      const i = this,
        { callbacks: n } = e,
        o = n.beforeTitle.apply(i, [t]),
        s = n.title.apply(i, [t]),
        a = n.afterTitle.apply(i, [t]);
      let r = [];
      return (r = ms(r, xs(o))), (r = ms(r, xs(s))), (r = ms(r, xs(a))), r;
    }
    getBeforeBody(t, e) {
      return ks(e.callbacks.beforeBody.apply(this, [t]));
    }
    getBody(t, e) {
      const i = this,
        { callbacks: n } = e,
        o = [];
      return (
        J(t, (t) => {
          const e = { before: [], lines: [], after: [] },
            s = Ss(n, t);
          ms(e.before, xs(s.beforeLabel.call(i, t))),
            ms(e.lines, s.label.call(i, t)),
            ms(e.after, xs(s.afterLabel.call(i, t))),
            o.push(e);
        }),
        o
      );
    }
    getAfterBody(t, e) {
      return ks(e.callbacks.afterBody.apply(this, [t]));
    }
    getFooter(t, e) {
      const i = this,
        { callbacks: n } = e,
        o = n.beforeFooter.apply(i, [t]),
        s = n.footer.apply(i, [t]),
        a = n.afterFooter.apply(i, [t]);
      let r = [];
      return (r = ms(r, xs(o))), (r = ms(r, xs(s))), (r = ms(r, xs(a))), r;
    }
    _createItems(t) {
      const e = this,
        i = e._active,
        n = e._chart.data,
        o = [],
        s = [],
        a = [];
      let r,
        l,
        c = [];
      for (r = 0, l = i.length; r < l; ++r) c.push(bs(e._chart, i[r]));
      return (
        t.filter && (c = c.filter((e, i, o) => t.filter(e, i, o, n))),
        t.itemSort && (c = c.sort((e, i) => t.itemSort(e, i, n))),
        J(c, (i) => {
          const n = Ss(t.callbacks, i);
          o.push(n.labelColor.call(e, i)),
            s.push(n.labelPointStyle.call(e, i)),
            a.push(n.labelTextColor.call(e, i));
        }),
        (e.labelColors = o),
        (e.labelPointStyles = s),
        (e.labelTextColors = a),
        (e.dataPoints = c),
        c
      );
    }
    update(t, e) {
      const i = this,
        n = i.options.setContext(i.getContext()),
        o = i._active;
      let s,
        a = [];
      if (o.length) {
        const t = ps[n.position].call(i, o, i._eventPosition);
        (a = i._createItems(n)),
          (i.title = i.getTitle(a, n)),
          (i.beforeBody = i.getBeforeBody(a, n)),
          (i.body = i.getBody(a, n)),
          (i.afterBody = i.getAfterBody(a, n)),
          (i.footer = i.getFooter(a, n));
        const e = (i._size = _s(i, n)),
          r = Object.assign({}, t, e),
          l = vs(i._chart, n, r),
          c = ws(n, r, l, i._chart);
        (i.xAlign = l.xAlign),
          (i.yAlign = l.yAlign),
          (s = {
            opacity: 1,
            x: c.x,
            y: c.y,
            width: e.width,
            height: e.height,
            caretX: t.x,
            caretY: t.y
          });
      } else 0 !== i.opacity && (s = { opacity: 0 });
      (i._tooltipItems = a),
        (i.$context = void 0),
        s && i._resolveAnimations().update(i, s),
        t &&
          n.external &&
          n.external.call(i, { chart: i._chart, tooltip: i, replay: e });
    }
    drawCaret(t, e, i, n) {
      const o = this.getCaretPosition(t, i, n);
      e.lineTo(o.x1, o.y1), e.lineTo(o.x2, o.y2), e.lineTo(o.x3, o.y3);
    }
    getCaretPosition(t, e, i) {
      const { xAlign: n, yAlign: o } = this,
        { cornerRadius: s, caretSize: a } = i,
        { x: r, y: l } = t,
        { width: c, height: h } = e;
      let d, u, f, g, p, m;
      return (
        'center' === o
          ? ((p = l + h / 2),
            'left' === n
              ? ((d = r), (u = d - a), (g = p + a), (m = p - a))
              : ((d = r + c), (u = d + a), (g = p - a), (m = p + a)),
            (f = d))
          : ((u =
              'left' === n
                ? r + s + a
                : 'right' === n
                  ? r + c - s - a
                  : this.caretX),
            'top' === o
              ? ((g = l), (p = g - a), (d = u - a), (f = u + a))
              : ((g = l + h), (p = g + a), (d = u + a), (f = u - a)),
            (m = g)),
        { x1: d, x2: u, x3: f, y1: g, y2: p, y3: m }
      );
    }
    drawTitle(t, e, i) {
      const n = this,
        o = n.title,
        s = o.length;
      let a, r, l;
      if (s) {
        const c = pn(i.rtl, n.x, n.width);
        for (
          t.x = Ms(n, i.titleAlign, i),
            e.textAlign = c.textAlign(i.titleAlign),
            e.textBaseline = 'middle',
            a = Fe(i.titleFont),
            r = i.titleSpacing,
            e.fillStyle = i.titleColor,
            e.font = a.string,
            l = 0;
          l < s;
          ++l
        )
          e.fillText(o[l], c.x(t.x), t.y + a.lineHeight / 2),
            (t.y += a.lineHeight + r),
            l + 1 === s && (t.y += i.titleMarginBottom - r);
      }
    }
    _drawColorBox(t, e, i, n, o) {
      const s = this,
        a = s.labelColors[i],
        r = s.labelPointStyles[i],
        { boxHeight: l, boxWidth: c } = o,
        h = Fe(o.bodyFont),
        d = Ms(s, 'left', o),
        u = n.x(d),
        f = l < h.lineHeight ? (h.lineHeight - l) / 2 : 0,
        g = e.y + f;
      if (o.usePointStyle) {
        const e = {
            radius: Math.min(c, l) / 2,
            pointStyle: r.pointStyle,
            rotation: r.rotation,
            borderWidth: 1
          },
          i = n.leftForLtr(u, c) + c / 2,
          s = g + l / 2;
        (t.strokeStyle = o.multiKeyBackground),
          (t.fillStyle = o.multiKeyBackground),
          qt(t, e, i, s),
          (t.strokeStyle = a.borderColor),
          (t.fillStyle = a.backgroundColor),
          qt(t, e, i, s);
      } else {
        (t.lineWidth = a.borderWidth || 1),
          (t.strokeStyle = a.borderColor),
          t.setLineDash(a.borderDash || []),
          (t.lineDashOffset = a.borderDashOffset || 0);
        const e = n.leftForLtr(u, c),
          i = n.leftForLtr(n.xPlus(u, 1), c - 2),
          s = Ee(a.borderRadius);
        Object.values(s).some((t) => 0 !== t)
          ? (t.beginPath(),
            (t.fillStyle = o.multiKeyBackground),
            ee(t, { x: e, y: g, w: c, h: l, radius: s }),
            t.fill(),
            t.stroke(),
            (t.fillStyle = a.backgroundColor),
            t.beginPath(),
            ee(t, { x: i, y: g + 1, w: c - 2, h: l - 2, radius: s }),
            t.fill())
          : ((t.fillStyle = o.multiKeyBackground),
            t.fillRect(e, g, c, l),
            t.strokeRect(e, g, c, l),
            (t.fillStyle = a.backgroundColor),
            t.fillRect(i, g + 1, c - 2, l - 2));
      }
      t.fillStyle = s.labelTextColors[i];
    }
    drawBody(t, e, i) {
      const n = this,
        { body: o } = n,
        {
          bodySpacing: s,
          bodyAlign: a,
          displayColors: r,
          boxHeight: l,
          boxWidth: c
        } = i,
        h = Fe(i.bodyFont);
      let d = h.lineHeight,
        u = 0;
      const f = pn(i.rtl, n.x, n.width),
        g = function (i) {
          e.fillText(i, f.x(t.x + u), t.y + d / 2), (t.y += d + s);
        },
        p = f.textAlign(a);
      let m, x, b, _, y, v, w;
      for (
        e.textAlign = a,
          e.textBaseline = 'middle',
          e.font = h.string,
          t.x = Ms(n, p, i),
          e.fillStyle = i.bodyColor,
          J(n.beforeBody, g),
          u = r && 'right' !== p ? ('center' === a ? c / 2 + 1 : c + 2) : 0,
          _ = 0,
          v = o.length;
        _ < v;
        ++_
      ) {
        for (
          m = o[_],
            x = n.labelTextColors[_],
            e.fillStyle = x,
            J(m.before, g),
            b = m.lines,
            r &&
              b.length &&
              (n._drawColorBox(e, t, _, f, i), (d = Math.max(h.lineHeight, l))),
            y = 0,
            w = b.length;
          y < w;
          ++y
        )
          g(b[y]), (d = h.lineHeight);
        J(m.after, g);
      }
      (u = 0), (d = h.lineHeight), J(n.afterBody, g), (t.y -= s);
    }
    drawFooter(t, e, i) {
      const n = this,
        o = n.footer,
        s = o.length;
      let a, r;
      if (s) {
        const l = pn(i.rtl, n.x, n.width);
        for (
          t.x = Ms(n, i.footerAlign, i),
            t.y += i.footerMarginTop,
            e.textAlign = l.textAlign(i.footerAlign),
            e.textBaseline = 'middle',
            a = Fe(i.footerFont),
            e.fillStyle = i.footerColor,
            e.font = a.string,
            r = 0;
          r < s;
          ++r
        )
          e.fillText(o[r], l.x(t.x), t.y + a.lineHeight / 2),
            (t.y += a.lineHeight + i.footerSpacing);
      }
    }
    drawBackground(t, e, i, n) {
      const { xAlign: o, yAlign: s } = this,
        { x: a, y: r } = t,
        { width: l, height: c } = i,
        h = n.cornerRadius;
      (e.fillStyle = n.backgroundColor),
        (e.strokeStyle = n.borderColor),
        (e.lineWidth = n.borderWidth),
        e.beginPath(),
        e.moveTo(a + h, r),
        'top' === s && this.drawCaret(t, e, i, n),
        e.lineTo(a + l - h, r),
        e.quadraticCurveTo(a + l, r, a + l, r + h),
        'center' === s && 'right' === o && this.drawCaret(t, e, i, n),
        e.lineTo(a + l, r + c - h),
        e.quadraticCurveTo(a + l, r + c, a + l - h, r + c),
        'bottom' === s && this.drawCaret(t, e, i, n),
        e.lineTo(a + h, r + c),
        e.quadraticCurveTo(a, r + c, a, r + c - h),
        'center' === s && 'left' === o && this.drawCaret(t, e, i, n),
        e.lineTo(a, r + h),
        e.quadraticCurveTo(a, r, a + h, r),
        e.closePath(),
        e.fill(),
        n.borderWidth > 0 && e.stroke();
    }
    _updateAnimationTarget(t) {
      const e = this,
        i = e._chart,
        n = e.$animations,
        o = n && n.x,
        s = n && n.y;
      if (o || s) {
        const n = ps[t.position].call(e, e._active, e._eventPosition);
        if (!n) return;
        const a = (e._size = _s(e, t)),
          r = Object.assign({}, n, e._size),
          l = vs(i, t, r),
          c = ws(t, r, l, i);
        (o._to === c.x && s._to === c.y) ||
          ((e.xAlign = l.xAlign),
          (e.yAlign = l.yAlign),
          (e.width = a.width),
          (e.height = a.height),
          (e.caretX = n.x),
          (e.caretY = n.y),
          e._resolveAnimations().update(e, c));
      }
    }
    draw(t) {
      const e = this,
        i = e.options.setContext(e.getContext());
      let n = e.opacity;
      if (!n) return;
      e._updateAnimationTarget(i);
      const o = { width: e.width, height: e.height },
        s = { x: e.x, y: e.y };
      n = Math.abs(n) < 0.001 ? 0 : n;
      const a = Ie(i.padding),
        r =
          e.title.length ||
          e.beforeBody.length ||
          e.body.length ||
          e.afterBody.length ||
          e.footer.length;
      i.enabled &&
        r &&
        (t.save(),
        (t.globalAlpha = n),
        e.drawBackground(s, t, o, i),
        mn(t, i.textDirection),
        (s.y += a.top),
        e.drawTitle(s, t, i),
        e.drawBody(s, t, i),
        e.drawFooter(s, t, i),
        xn(t, i.textDirection),
        t.restore());
    }
    getActiveElements() {
      return this._active || [];
    }
    setActiveElements(t, e) {
      const i = this,
        n = i._active,
        o = t.map(({ datasetIndex: t, index: e }) => {
          const n = i._chart.getDatasetMeta(t);
          if (!n) throw new Error('Cannot find a dataset at index ' + t);
          return { datasetIndex: t, element: n.data[e], index: e };
        }),
        s = !tt(n, o),
        a = i._positionChanged(o, e);
      (s || a) && ((i._active = o), (i._eventPosition = e), i.update(!0));
    }
    handleEvent(t, e) {
      const i = this,
        n = i.options,
        o = i._active || [];
      let s = !1,
        a = [];
      'mouseout' !== t.type &&
        ((a = i._chart.getElementsAtEventForMode(t, n.mode, n, e)),
        n.reverse && a.reverse());
      const r = i._positionChanged(a, t);
      return (
        (s = e || !tt(a, o) || r),
        s &&
          ((i._active = a),
          (n.enabled || n.external) &&
            ((i._eventPosition = { x: t.x, y: t.y }), i.update(!0, e))),
        s
      );
    }
    _positionChanged(t, e) {
      const { caretX: i, caretY: n, options: o } = this,
        s = ps[o.position].call(this, t, e);
      return !1 !== s && (i !== s.x || n !== s.y);
    }
  }
  Ps.positioners = ps;
  var Ds = {
      id: 'tooltip',
      _element: Ps,
      positioners: ps,
      afterInit(t, e, i) {
        i && (t.tooltip = new Ps({ _chart: t, options: i }));
      },
      beforeUpdate(t, e, i) {
        t.tooltip && t.tooltip.initialize(i);
      },
      reset(t, e, i) {
        t.tooltip && t.tooltip.initialize(i);
      },
      afterDraw(t) {
        const e = t.tooltip,
          i = { tooltip: e };
        !1 !== t.notifyPlugins('beforeTooltipDraw', i) &&
          (e && e.draw(t.ctx), t.notifyPlugins('afterTooltipDraw', i));
      },
      afterEvent(t, e) {
        if (t.tooltip) {
          const i = e.replay;
          t.tooltip.handleEvent(e.event, i) && (e.changed = !0);
        }
      },
      defaults: {
        enabled: !0,
        external: null,
        position: 'average',
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        titleFont: { weight: 'bold' },
        titleSpacing: 2,
        titleMarginBottom: 6,
        titleAlign: 'left',
        bodyColor: '#fff',
        bodySpacing: 2,
        bodyFont: {},
        bodyAlign: 'left',
        footerColor: '#fff',
        footerSpacing: 2,
        footerMarginTop: 6,
        footerFont: { weight: 'bold' },
        footerAlign: 'left',
        padding: 6,
        caretPadding: 2,
        caretSize: 5,
        cornerRadius: 6,
        boxHeight: (t, e) => e.bodyFont.size,
        boxWidth: (t, e) => e.bodyFont.size,
        multiKeyBackground: '#fff',
        displayColors: !0,
        borderColor: 'rgba(0,0,0,0)',
        borderWidth: 0,
        animation: { duration: 400, easing: 'easeOutQuart' },
        animations: {
          numbers: {
            type: 'number',
            properties: ['x', 'y', 'width', 'height', 'caretX', 'caretY']
          },
          opacity: { easing: 'linear', duration: 200 }
        },
        callbacks: {
          beforeTitle: H,
          title(t) {
            if (t.length > 0) {
              const e = t[0],
                i = e.chart.data.labels,
                n = i ? i.length : 0;
              if (this && this.options && 'dataset' === this.options.mode)
                return e.dataset.label || '';
              if (e.label) return e.label;
              if (n > 0 && e.dataIndex < n) return i[e.dataIndex];
            }
            return '';
          },
          afterTitle: H,
          beforeBody: H,
          beforeLabel: H,
          label(t) {
            if (this && this.options && 'dataset' === this.options.mode)
              return t.label + ': ' + t.formattedValue || t.formattedValue;
            let e = t.dataset.label || '';
            e && (e += ': ');
            const i = t.formattedValue;
            return $(i) || (e += i), e;
          },
          labelColor(t) {
            const e = t.chart
              .getDatasetMeta(t.datasetIndex)
              .controller.getStyle(t.dataIndex);
            return {
              borderColor: e.borderColor,
              backgroundColor: e.backgroundColor,
              borderWidth: e.borderWidth,
              borderDash: e.borderDash,
              borderDashOffset: e.borderDashOffset,
              borderRadius: 0
            };
          },
          labelTextColor() {
            return this.options.bodyColor;
          },
          labelPointStyle(t) {
            const e = t.chart
              .getDatasetMeta(t.datasetIndex)
              .controller.getStyle(t.dataIndex);
            return { pointStyle: e.pointStyle, rotation: e.rotation };
          },
          afterLabel: H,
          afterBody: H,
          beforeFooter: H,
          footer: H,
          afterFooter: H
        }
      },
      defaultRoutes: {
        bodyFont: 'font',
        footerFont: 'font',
        titleFont: 'font'
      },
      descriptors: {
        _scriptable: (t) =>
          'filter' !== t && 'itemSort' !== t && 'external' !== t,
        _indexable: !1,
        callbacks: { _scriptable: !1, _indexable: !1 },
        animation: { _fallback: !1 },
        animations: { _fallback: 'animation' }
      },
      additionalOptionScopes: ['interaction']
    },
    Cs = Object.freeze({
      __proto__: null,
      Decimation: Uo,
      Filler: cs,
      Legend: us,
      Title: gs,
      Tooltip: Ds
    });
  function Os(t, e, i) {
    const n = t.indexOf(e);
    if (-1 === n)
      return ((t, e, i) =>
        'string' == typeof e ? t.push(e) - 1 : isNaN(e) ? null : i)(t, e, i);
    return n !== t.lastIndexOf(e) ? i : n;
  }
  class As extends Yi {
    constructor(t) {
      super(t), (this._startValue = void 0), (this._valueRange = 0);
    }
    parse(t, e) {
      if ($(t)) return null;
      const i = this.getLabels();
      return ((t, e) => (null === t ? null : Nt(Math.round(t), 0, e)))(
        (e = isFinite(e) && i[e] === t ? e : Os(i, t, K(e, t))),
        i.length - 1
      );
    }
    determineDataLimits() {
      const t = this,
        { minDefined: e, maxDefined: i } = t.getUserBounds();
      let { min: n, max: o } = t.getMinMax(!0);
      'ticks' === t.options.bounds &&
        (e || (n = 0), i || (o = t.getLabels().length - 1)),
        (t.min = n),
        (t.max = o);
    }
    buildTicks() {
      const t = this,
        e = t.min,
        i = t.max,
        n = t.options.offset,
        o = [];
      let s = t.getLabels();
      (s = 0 === e && i === s.length - 1 ? s : s.slice(e, i + 1)),
        (t._valueRange = Math.max(s.length - (n ? 0 : 1), 1)),
        (t._startValue = t.min - (n ? 0.5 : 0));
      for (let t = e; t <= i; t++) o.push({ value: t });
      return o;
    }
    getLabelForValue(t) {
      const e = this.getLabels();
      return t >= 0 && t < e.length ? e[t] : t;
    }
    configure() {
      const t = this;
      super.configure(),
        t.isHorizontal() || (t._reversePixels = !t._reversePixels);
    }
    getPixelForValue(t) {
      const e = this;
      return (
        'number' != typeof t && (t = e.parse(t)),
        null === t
          ? NaN
          : e.getPixelForDecimal((t - e._startValue) / e._valueRange)
      );
    }
    getPixelForTick(t) {
      const e = this.ticks;
      return t < 0 || t > e.length - 1
        ? null
        : this.getPixelForValue(e[t].value);
    }
    getValueForPixel(t) {
      const e = this;
      return Math.round(
        e._startValue + e.getDecimalForPixel(t) * e._valueRange
      );
    }
    getBasePixel() {
      return this.bottom;
    }
  }
  (As.id = 'category'),
    (As.defaults = { ticks: { callback: As.prototype.getLabelForValue } });
  class Ts extends Yi {
    constructor(t) {
      super(t),
        (this.start = void 0),
        (this.end = void 0),
        (this._startValue = void 0),
        (this._endValue = void 0),
        (this._valueRange = 0);
    }
    parse(t, e) {
      return $(t) ||
        (('number' == typeof t || t instanceof Number) && !isFinite(+t))
        ? null
        : +t;
    }
    handleTickRangeOptions() {
      const t = this,
        { beginAtZero: e, stacked: i } = t.options,
        { minDefined: n, maxDefined: o } = t.getUserBounds();
      let { min: s, max: a } = t;
      const r = (t) => (s = n ? s : t),
        l = (t) => (a = o ? a : t);
      if (e || i) {
        const t = Pt(s),
          e = Pt(a);
        t < 0 && e < 0 ? l(0) : t > 0 && e > 0 && r(0);
      }
      s === a && (l(a + 1), e || r(s - 1)), (t.min = s), (t.max = a);
    }
    getTickLimit() {
      const t = this,
        e = t.options.ticks;
      let i,
        { maxTicksLimit: n, stepSize: o } = e;
      return (
        o
          ? (i = Math.ceil(t.max / o) - Math.floor(t.min / o) + 1)
          : ((i = t.computeTickLimit()), (n = n || 11)),
        n && (i = Math.min(n, i)),
        i
      );
    }
    computeTickLimit() {
      return Number.POSITIVE_INFINITY;
    }
    buildTicks() {
      const t = this,
        e = t.options,
        i = e.ticks;
      let n = t.getTickLimit();
      n = Math.max(2, n);
      const o = (function (t, e) {
        const i = [],
          { step: n, min: o, max: s, precision: a, count: r, maxTicks: l } = t,
          c = n || 1,
          h = l - 1,
          { min: d, max: u } = e,
          f = !$(o),
          g = !$(s),
          p = !$(r);
        let m,
          x,
          b,
          _,
          y = Dt((u - d) / h / c) * c;
        if (y < 1e-14 && !f && !g) return [{ value: d }, { value: u }];
        (_ = Math.ceil(u / y) - Math.floor(d / y)),
          _ > h && (y = Dt((_ * y) / h / c) * c),
          $(a) || ((m = Math.pow(10, a)), (y = Math.ceil(y * m) / m)),
          (x = Math.floor(d / y) * y),
          (b = Math.ceil(u / y) * y),
          f && g && n && Tt((s - o) / n, y / 1e3)
            ? ((_ = Math.min((s - o) / y, l)),
              (y = (s - o) / _),
              (x = o),
              (b = s))
            : p
              ? ((x = f ? o : x),
                (b = g ? s : b),
                (_ = r - 1),
                (y = (b - x) / _))
              : ((_ = (b - x) / y),
                (_ = At(_, Math.round(_), y / 1e3)
                  ? Math.round(_)
                  : Math.ceil(_))),
          (m = Math.pow(10, $(a) ? It(y) : a)),
          (x = Math.round(x * m) / m),
          (b = Math.round(b * m) / m);
        let v = 0;
        for (
          f &&
          (i.push({ value: o }),
          x <= o && v++,
          At(Math.round((x + v * y) * m) / m, o, y / 10) && v++);
          v < _;
          ++v
        )
          i.push({ value: Math.round((x + v * y) * m) / m });
        return (
          g
            ? At(i[i.length - 1].value, s, y / 10)
              ? (i[i.length - 1].value = s)
              : i.push({ value: s })
            : i.push({ value: b }),
          i
        );
      })(
        {
          maxTicks: n,
          min: e.min,
          max: e.max,
          precision: i.precision,
          step: i.stepSize,
          count: i.count
        },
        t._range || t
      );
      return (
        'ticks' === e.bounds && Rt(o, t, 'value'),
        e.reverse
          ? (o.reverse(), (t.start = t.max), (t.end = t.min))
          : ((t.start = t.min), (t.end = t.max)),
        o
      );
    }
    configure() {
      const t = this,
        e = t.ticks;
      let i = t.min,
        n = t.max;
      if ((super.configure(), t.options.offset && e.length)) {
        const t = (n - i) / Math.max(e.length - 1, 1) / 2;
        (i -= t), (n += t);
      }
      (t._startValue = i), (t._endValue = n), (t._valueRange = n - i);
    }
    getLabelForValue(t) {
      return Ei(t, this.chart.options.locale);
    }
  }
  class Rs extends Ts {
    determineDataLimits() {
      const t = this,
        { min: e, max: i } = t.getMinMax(!0);
      (t.min = X(e) ? e : 0),
        (t.max = X(i) ? i : 1),
        t.handleTickRangeOptions();
    }
    computeTickLimit() {
      const t = this;
      if (t.isHorizontal()) return Math.ceil(t.width / 40);
      const e = t._resolveTickFontOptions(0);
      return Math.ceil(t.height / e.lineHeight);
    }
    getPixelForValue(t) {
      return null === t
        ? NaN
        : this.getPixelForDecimal((t - this._startValue) / this._valueRange);
    }
    getValueForPixel(t) {
      return this._startValue + this.getDecimalForPixel(t) * this._valueRange;
    }
  }
  function Ls(t) {
    return 1 === t / Math.pow(10, Math.floor(St(t)));
  }
  (Rs.id = 'linear'),
    (Rs.defaults = { ticks: { callback: Fi.formatters.numeric } });
  class Es extends Yi {
    constructor(t) {
      super(t),
        (this.start = void 0),
        (this.end = void 0),
        (this._startValue = void 0),
        (this._valueRange = 0);
    }
    parse(t, e) {
      const i = Ts.prototype.parse.apply(this, [t, e]);
      if (0 !== i) return X(i) && i > 0 ? i : null;
      this._zero = !0;
    }
    determineDataLimits() {
      const t = this,
        { min: e, max: i } = t.getMinMax(!0);
      (t.min = X(e) ? Math.max(0, e) : null),
        (t.max = X(i) ? Math.max(0, i) : null),
        t.options.beginAtZero && (t._zero = !0),
        t.handleTickRangeOptions();
    }
    handleTickRangeOptions() {
      const t = this,
        { minDefined: e, maxDefined: i } = t.getUserBounds();
      let n = t.min,
        o = t.max;
      const s = (t) => (n = e ? n : t),
        a = (t) => (o = i ? o : t),
        r = (t, e) => Math.pow(10, Math.floor(St(t)) + e);
      n === o && (n <= 0 ? (s(1), a(10)) : (s(r(n, -1)), a(r(o, 1)))),
        n <= 0 && s(r(o, -1)),
        o <= 0 && a(r(n, 1)),
        t._zero &&
          t.min !== t._suggestedMin &&
          n === r(t.min, 0) &&
          s(r(n, -1)),
        (t.min = n),
        (t.max = o);
    }
    buildTicks() {
      const t = this,
        e = t.options,
        i = (function (t, e) {
          const i = Math.floor(St(e.max)),
            n = Math.ceil(e.max / Math.pow(10, i)),
            o = [];
          let s = q(t.min, Math.pow(10, Math.floor(St(e.min)))),
            a = Math.floor(St(s)),
            r = Math.floor(s / Math.pow(10, a)),
            l = a < 0 ? Math.pow(10, Math.abs(a)) : 1;
          do {
            o.push({ value: s, major: Ls(s) }),
              ++r,
              10 === r && ((r = 1), ++a, (l = a >= 0 ? 1 : l)),
              (s = Math.round(r * Math.pow(10, a) * l) / l);
          } while (a < i || (a === i && r < n));
          const c = q(t.max, s);
          return o.push({ value: c, major: Ls(s) }), o;
        })({ min: t._userMin, max: t._userMax }, t);
      return (
        'ticks' === e.bounds && Rt(i, t, 'value'),
        e.reverse
          ? (i.reverse(), (t.start = t.max), (t.end = t.min))
          : ((t.start = t.min), (t.end = t.max)),
        i
      );
    }
    getLabelForValue(t) {
      return void 0 === t ? '0' : Ei(t, this.chart.options.locale);
    }
    configure() {
      const t = this,
        e = t.min;
      super.configure(),
        (t._startValue = St(e)),
        (t._valueRange = St(t.max) - St(e));
    }
    getPixelForValue(t) {
      const e = this;
      return (
        (void 0 !== t && 0 !== t) || (t = e.min),
        null === t || isNaN(t)
          ? NaN
          : e.getPixelForDecimal(
              t === e.min ? 0 : (St(t) - e._startValue) / e._valueRange
            )
      );
    }
    getValueForPixel(t) {
      const e = this,
        i = e.getDecimalForPixel(t);
      return Math.pow(10, e._startValue + i * e._valueRange);
    }
  }
  function Is(t) {
    const e = t.ticks;
    if (e.display && t.display) {
      const t = Ie(e.backdropPadding);
      return K(e.font && e.font.size, mt.font.size) + t.height;
    }
    return 0;
  }
  function Fs(t, e, i, n, o) {
    return t === n || t === o
      ? { start: e - i / 2, end: e + i / 2 }
      : t < n || t > o
        ? { start: e - i, end: e }
        : { start: e, end: e + i };
  }
  function zs(t) {
    return 0 === t || 180 === t ? 'center' : t < 180 ? 'left' : 'right';
  }
  function Vs(t, e, i) {
    90 === t || 270 === t
      ? (i.y -= e.h / 2)
      : (t > 270 || t < 90) && (i.y -= e.h);
  }
  function Bs(t, e, i, n) {
    const { ctx: o } = t;
    if (i) o.arc(t.xCenter, t.yCenter, e, 0, bt);
    else {
      let i = t.getPointPosition(0, e);
      o.moveTo(i.x, i.y);
      for (let s = 1; s < n; s++)
        (i = t.getPointPosition(s, e)), o.lineTo(i.x, i.y);
    }
  }
  function Ws(t) {
    return Ot(t) ? t : 0;
  }
  (Es.id = 'logarithmic'),
    (Es.defaults = {
      ticks: { callback: Fi.formatters.logarithmic, major: { enabled: !0 } }
    });
  class Ns extends Ts {
    constructor(t) {
      super(t),
        (this.xCenter = void 0),
        (this.yCenter = void 0),
        (this.drawingArea = void 0),
        (this._pointLabels = []),
        (this._pointLabelItems = []);
    }
    setDimensions() {
      const t = this;
      (t.width = t.maxWidth),
        (t.height = t.maxHeight),
        (t.paddingTop = Is(t.options) / 2),
        (t.xCenter = Math.floor(t.width / 2)),
        (t.yCenter = Math.floor((t.height - t.paddingTop) / 2)),
        (t.drawingArea = Math.min(t.height - t.paddingTop, t.width) / 2);
    }
    determineDataLimits() {
      const t = this,
        { min: e, max: i } = t.getMinMax(!1);
      (t.min = X(e) && !isNaN(e) ? e : 0),
        (t.max = X(i) && !isNaN(i) ? i : 0),
        t.handleTickRangeOptions();
    }
    computeTickLimit() {
      return Math.ceil(this.drawingArea / Is(this.options));
    }
    generateTickLabels(t) {
      const e = this;
      Ts.prototype.generateTickLabels.call(e, t),
        (e._pointLabels = e.getLabels().map((t, i) => {
          const n = Q(e.options.pointLabels.callback, [t, i], e);
          return n || 0 === n ? n : '';
        }));
    }
    fit() {
      const t = this,
        e = t.options;
      e.display && e.pointLabels.display
        ? (function (t) {
            const e = { l: 0, r: t.width, t: 0, b: t.height - t.paddingTop },
              i = {};
            let n, o, s;
            const a = [],
              r = [],
              l = t.getLabels().length;
            for (n = 0; n < l; n++) {
              const l = t.options.pointLabels.setContext(t.getContext(n));
              (r[n] = l.padding),
                (s = t.getPointPosition(n, t.drawingArea + r[n]));
              const u = Fe(l.font);
              (t.ctx.font = u.string),
                (c = t.ctx),
                (h = u.lineHeight),
                (o = Y((d = t._pointLabels[n]))
                  ? { w: Yt(c, c.font, d), h: d.length * h }
                  : { w: c.measureText(d).width, h: h }),
                (a[n] = o);
              const f = t.getIndexAngle(n),
                g = Et(f),
                p = Fs(g, s.x, o.w, 0, 180),
                m = Fs(g, s.y, o.h, 90, 270);
              p.start < e.l && ((e.l = p.start), (i.l = f)),
                p.end > e.r && ((e.r = p.end), (i.r = f)),
                m.start < e.t && ((e.t = m.start), (i.t = f)),
                m.end > e.b && ((e.b = m.end), (i.b = f));
            }
            var c, h, d;
            t._setReductions(t.drawingArea, e, i), (t._pointLabelItems = []);
            const u = t.options,
              f = Is(u),
              g = t.getDistanceFromCenterForValue(
                u.ticks.reverse ? t.min : t.max
              );
            for (n = 0; n < l; n++) {
              const e = 0 === n ? f / 2 : 0,
                i = t.getPointPosition(n, g + e + r[n]),
                o = Et(t.getIndexAngle(n)),
                s = a[n];
              Vs(o, s, i);
              const l = zs(o);
              let c;
              c =
                'left' === l ? i.x : 'center' === l ? i.x - s.w / 2 : i.x - s.w;
              const h = c + s.w;
              t._pointLabelItems[n] = {
                x: i.x,
                y: i.y,
                textAlign: l,
                left: c,
                top: i.y,
                right: h,
                bottom: i.y + s.h
              };
            }
          })(t)
        : t.setCenterPoint(0, 0, 0, 0);
    }
    _setReductions(t, e, i) {
      const n = this;
      let o = e.l / Math.sin(i.l),
        s = Math.max(e.r - n.width, 0) / Math.sin(i.r),
        a = -e.t / Math.cos(i.t),
        r = -Math.max(e.b - (n.height - n.paddingTop), 0) / Math.cos(i.b);
      (o = Ws(o)),
        (s = Ws(s)),
        (a = Ws(a)),
        (r = Ws(r)),
        (n.drawingArea = Math.max(
          t / 2,
          Math.min(Math.floor(t - (o + s) / 2), Math.floor(t - (a + r) / 2))
        )),
        n.setCenterPoint(o, s, a, r);
    }
    setCenterPoint(t, e, i, n) {
      const o = this,
        s = o.width - e - o.drawingArea,
        a = t + o.drawingArea,
        r = i + o.drawingArea,
        l = o.height - o.paddingTop - n - o.drawingArea;
      (o.xCenter = Math.floor((a + s) / 2 + o.left)),
        (o.yCenter = Math.floor((r + l) / 2 + o.top + o.paddingTop));
    }
    getIndexAngle(t) {
      return Bt(
        t * (bt / this.getLabels().length) + Lt(this.options.startAngle || 0)
      );
    }
    getDistanceFromCenterForValue(t) {
      const e = this;
      if ($(t)) return NaN;
      const i = e.drawingArea / (e.max - e.min);
      return e.options.reverse ? (e.max - t) * i : (t - e.min) * i;
    }
    getValueForDistanceFromCenter(t) {
      if ($(t)) return NaN;
      const e = this,
        i = t / (e.drawingArea / (e.max - e.min));
      return e.options.reverse ? e.max - i : e.min + i;
    }
    getPointPosition(t, e) {
      const i = this,
        n = i.getIndexAngle(t) - wt;
      return {
        x: Math.cos(n) * e + i.xCenter,
        y: Math.sin(n) * e + i.yCenter,
        angle: n
      };
    }
    getPointPositionForValue(t, e) {
      return this.getPointPosition(t, this.getDistanceFromCenterForValue(e));
    }
    getBasePosition(t) {
      return this.getPointPositionForValue(t || 0, this.getBaseValue());
    }
    getPointLabelPosition(t) {
      const { left: e, top: i, right: n, bottom: o } = this._pointLabelItems[t];
      return { left: e, top: i, right: n, bottom: o };
    }
    drawBackground() {
      const t = this,
        {
          backgroundColor: e,
          grid: { circular: i }
        } = t.options;
      if (e) {
        const n = t.ctx;
        n.save(),
          n.beginPath(),
          Bs(
            t,
            t.getDistanceFromCenterForValue(t._endValue),
            i,
            t.getLabels().length
          ),
          n.closePath(),
          (n.fillStyle = e),
          n.fill(),
          n.restore();
      }
    }
    drawGrid() {
      const t = this,
        e = t.ctx,
        i = t.options,
        { angleLines: n, grid: o } = i,
        s = t.getLabels().length;
      let a, r, l;
      if (
        (i.pointLabels.display &&
          (function (t, e) {
            const {
              ctx: i,
              options: { pointLabels: n }
            } = t;
            for (let o = e - 1; o >= 0; o--) {
              const e = n.setContext(t.getContext(o)),
                s = Fe(e.font),
                {
                  x: a,
                  y: r,
                  textAlign: l,
                  left: c,
                  top: h,
                  right: d,
                  bottom: u
                } = t._pointLabelItems[o],
                { backdropColor: f } = e;
              if (!$(f)) {
                const t = Ie(e.backdropPadding);
                (i.fillStyle = f),
                  i.fillRect(
                    c - t.left,
                    h - t.top,
                    d - c + t.width,
                    u - h + t.height
                  );
              }
              te(i, t._pointLabels[o], a, r + s.lineHeight / 2, s, {
                color: e.color,
                textAlign: l,
                textBaseline: 'middle'
              });
            }
          })(t, s),
        o.display &&
          t.ticks.forEach((e, i) => {
            if (0 !== i) {
              r = t.getDistanceFromCenterForValue(e.value);
              const n = o.setContext(t.getContext(i - 1));
              !(function (t, e, i, n) {
                const o = t.ctx,
                  s = e.circular,
                  { color: a, lineWidth: r } = e;
                (!s && !n) ||
                  !a ||
                  !r ||
                  i < 0 ||
                  (o.save(),
                  (o.strokeStyle = a),
                  (o.lineWidth = r),
                  o.setLineDash(e.borderDash),
                  (o.lineDashOffset = e.borderDashOffset),
                  o.beginPath(),
                  Bs(t, i, s, n),
                  o.closePath(),
                  o.stroke(),
                  o.restore());
              })(t, n, r, s);
            }
          }),
        n.display)
      ) {
        for (e.save(), a = t.getLabels().length - 1; a >= 0; a--) {
          const o = n.setContext(t.getContext(a)),
            { color: s, lineWidth: c } = o;
          c &&
            s &&
            ((e.lineWidth = c),
            (e.strokeStyle = s),
            e.setLineDash(o.borderDash),
            (e.lineDashOffset = o.borderDashOffset),
            (r = t.getDistanceFromCenterForValue(
              i.ticks.reverse ? t.min : t.max
            )),
            (l = t.getPointPosition(a, r)),
            e.beginPath(),
            e.moveTo(t.xCenter, t.yCenter),
            e.lineTo(l.x, l.y),
            e.stroke());
        }
        e.restore();
      }
    }
    drawLabels() {
      const t = this,
        e = t.ctx,
        i = t.options,
        n = i.ticks;
      if (!n.display) return;
      const o = t.getIndexAngle(0);
      let s, a;
      e.save(),
        e.translate(t.xCenter, t.yCenter),
        e.rotate(o),
        (e.textAlign = 'center'),
        (e.textBaseline = 'middle'),
        t.ticks.forEach((o, r) => {
          if (0 === r && !i.reverse) return;
          const l = n.setContext(t.getContext(r)),
            c = Fe(l.font);
          if (
            ((s = t.getDistanceFromCenterForValue(t.ticks[r].value)),
            l.showLabelBackdrop)
          ) {
            (a = e.measureText(o.label).width), (e.fillStyle = l.backdropColor);
            const t = Ie(l.backdropPadding);
            e.fillRect(
              -a / 2 - t.left,
              -s - c.size / 2 - t.top,
              a + t.width,
              c.size + t.height
            );
          }
          te(e, o.label, 0, -s, c, { color: l.color });
        }),
        e.restore();
    }
    drawTitle() {}
  }
  (Ns.id = 'radialLinear'),
    (Ns.defaults = {
      display: !0,
      animate: !0,
      position: 'chartArea',
      angleLines: {
        display: !0,
        lineWidth: 1,
        borderDash: [],
        borderDashOffset: 0
      },
      grid: { circular: !1 },
      startAngle: 0,
      ticks: {
        showLabelBackdrop: !0,
        backdropColor: 'rgba(255,255,255,0.75)',
        backdropPadding: 2,
        callback: Fi.formatters.numeric
      },
      pointLabels: {
        backdropColor: void 0,
        backdropPadding: 2,
        display: !0,
        font: { size: 10 },
        callback: (t) => t,
        padding: 5
      }
    }),
    (Ns.defaultRoutes = {
      'angleLines.color': 'borderColor',
      'pointLabels.color': 'color',
      'ticks.color': 'color'
    }),
    (Ns.descriptors = { angleLines: { _fallback: 'grid' } });
  const Hs = {
      millisecond: { common: !0, size: 1, steps: 1e3 },
      second: { common: !0, size: 1e3, steps: 60 },
      minute: { common: !0, size: 6e4, steps: 60 },
      hour: { common: !0, size: 36e5, steps: 24 },
      day: { common: !0, size: 864e5, steps: 30 },
      week: { common: !1, size: 6048e5, steps: 4 },
      month: { common: !0, size: 2628e6, steps: 12 },
      quarter: { common: !1, size: 7884e6, steps: 4 },
      year: { common: !0, size: 3154e7 }
    },
    js = Object.keys(Hs);
  function $s(t, e) {
    return t - e;
  }
  function Ys(t, e) {
    if ($(e)) return null;
    const i = t._adapter,
      n = t.options.time,
      { parser: o, round: s, isoWeekday: a } = n;
    let r = e;
    return (
      'function' == typeof o && (r = o(r)),
      X(r) || (r = 'string' == typeof o ? i.parse(r, o) : i.parse(r)),
      null === r
        ? null
        : (s &&
            (r =
              'week' !== s || (!Ot(a) && !0 !== a)
                ? i.startOf(r, s)
                : i.startOf(r, 'isoWeek', a)),
          +r)
    );
  }
  function Us(t, e, i, n) {
    const o = js.length;
    for (let s = js.indexOf(t); s < o - 1; ++s) {
      const t = Hs[js[s]],
        o = t.steps ? t.steps : Number.MAX_SAFE_INTEGER;
      if (t.common && Math.ceil((i - e) / (o * t.size)) <= n) return js[s];
    }
    return js[o - 1];
  }
  function Xs(t, e, i) {
    if (i) {
      if (i.length) {
        const { lo: n, hi: o } = ie(i, e);
        t[i[n] >= e ? i[n] : i[o]] = !0;
      }
    } else t[e] = !0;
  }
  function qs(t, e, i) {
    const n = [],
      o = {},
      s = e.length;
    let a, r;
    for (a = 0; a < s; ++a)
      (r = e[a]), (o[r] = a), n.push({ value: r, major: !1 });
    return 0 !== s && i
      ? (function (t, e, i, n) {
          const o = t._adapter,
            s = +o.startOf(e[0].value, n),
            a = e[e.length - 1].value;
          let r, l;
          for (r = s; r <= a; r = +o.add(r, 1, n))
            (l = i[r]), l >= 0 && (e[l].major = !0);
          return e;
        })(t, n, o, i)
      : n;
  }
  class Ks extends Yi {
    constructor(t) {
      super(t),
        (this._cache = { data: [], labels: [], all: [] }),
        (this._unit = 'day'),
        (this._majorUnit = void 0),
        (this._offsets = {}),
        (this._normalized = !1);
    }
    init(t, e) {
      const i = t.time || (t.time = {}),
        n = (this._adapter = new io._date(t.adapters.date));
      st(i.displayFormats, n.formats()),
        super.init(t),
        (this._normalized = e.normalized);
    }
    parse(t, e) {
      return void 0 === t ? null : Ys(this, t);
    }
    beforeLayout() {
      super.beforeLayout(), (this._cache = { data: [], labels: [], all: [] });
    }
    determineDataLimits() {
      const t = this,
        e = t.options,
        i = t._adapter,
        n = e.time.unit || 'day';
      let { min: o, max: s, minDefined: a, maxDefined: r } = t.getUserBounds();
      function l(t) {
        a || isNaN(t.min) || (o = Math.min(o, t.min)),
          r || isNaN(t.max) || (s = Math.max(s, t.max));
      }
      (a && r) ||
        (l(t._getLabelBounds()),
        ('ticks' === e.bounds && 'labels' === e.ticks.source) ||
          l(t.getMinMax(!1))),
        (o = X(o) && !isNaN(o) ? o : +i.startOf(Date.now(), n)),
        (s = X(s) && !isNaN(s) ? s : +i.endOf(Date.now(), n) + 1),
        (t.min = Math.min(o, s - 1)),
        (t.max = Math.max(o + 1, s));
    }
    _getLabelBounds() {
      const t = this.getLabelTimestamps();
      let e = Number.POSITIVE_INFINITY,
        i = Number.NEGATIVE_INFINITY;
      return (
        t.length && ((e = t[0]), (i = t[t.length - 1])), { min: e, max: i }
      );
    }
    buildTicks() {
      const t = this,
        e = t.options,
        i = e.time,
        n = e.ticks,
        o = 'labels' === n.source ? t.getLabelTimestamps() : t._generate();
      'ticks' === e.bounds &&
        o.length &&
        ((t.min = t._userMin || o[0]), (t.max = t._userMax || o[o.length - 1]));
      const s = t.min,
        a = se(o, s, t.max);
      return (
        (t._unit =
          i.unit ||
          (n.autoSkip
            ? Us(i.minUnit, t.min, t.max, t._getLabelCapacity(s))
            : (function (t, e, i, n, o) {
                for (let s = js.length - 1; s >= js.indexOf(i); s--) {
                  const i = js[s];
                  if (Hs[i].common && t._adapter.diff(o, n, i) >= e - 1)
                    return i;
                }
                return js[i ? js.indexOf(i) : 0];
              })(t, a.length, i.minUnit, t.min, t.max))),
        (t._majorUnit =
          n.major.enabled && 'year' !== t._unit
            ? (function (t) {
                for (let e = js.indexOf(t) + 1, i = js.length; e < i; ++e)
                  if (Hs[js[e]].common) return js[e];
              })(t._unit)
            : void 0),
        t.initOffsets(o),
        e.reverse && a.reverse(),
        qs(t, a, t._majorUnit)
      );
    }
    initOffsets(t) {
      const e = this;
      let i,
        n,
        o = 0,
        s = 0;
      e.options.offset &&
        t.length &&
        ((i = e.getDecimalForValue(t[0])),
        (o = 1 === t.length ? 1 - i : (e.getDecimalForValue(t[1]) - i) / 2),
        (n = e.getDecimalForValue(t[t.length - 1])),
        (s =
          1 === t.length
            ? n
            : (n - e.getDecimalForValue(t[t.length - 2])) / 2));
      const a = t.length < 3 ? 0.5 : 0.25;
      (o = Nt(o, 0, a)),
        (s = Nt(s, 0, a)),
        (e._offsets = { start: o, end: s, factor: 1 / (o + 1 + s) });
    }
    _generate() {
      const t = this,
        e = t._adapter,
        i = t.min,
        n = t.max,
        o = t.options,
        s = o.time,
        a = s.unit || Us(s.minUnit, i, n, t._getLabelCapacity(i)),
        r = K(s.stepSize, 1),
        l = 'week' === a && s.isoWeekday,
        c = Ot(l) || !0 === l,
        h = {};
      let d,
        u,
        f = i;
      if (
        (c && (f = +e.startOf(f, 'isoWeek', l)),
        (f = +e.startOf(f, c ? 'day' : a)),
        e.diff(n, i, a) > 1e5 * r)
      )
        throw new Error(
          i + ' and ' + n + ' are too far apart with stepSize of ' + r + ' ' + a
        );
      const g = 'data' === o.ticks.source && t.getDataTimestamps();
      for (d = f, u = 0; d < n; d = +e.add(d, r, a), u++) Xs(h, d, g);
      return (
        (d !== n && 'ticks' !== o.bounds && 1 !== u) || Xs(h, d, g),
        Object.keys(h)
          .sort((t, e) => t - e)
          .map((t) => +t)
      );
    }
    getLabelForValue(t) {
      const e = this._adapter,
        i = this.options.time;
      return i.tooltipFormat
        ? e.format(t, i.tooltipFormat)
        : e.format(t, i.displayFormats.datetime);
    }
    _tickFormatFunction(t, e, i, n) {
      const o = this,
        s = o.options,
        a = s.time.displayFormats,
        r = o._unit,
        l = o._majorUnit,
        c = r && a[r],
        h = l && a[l],
        d = i[e],
        u = l && h && d && d.major,
        f = o._adapter.format(t, n || (u ? h : c)),
        g = s.ticks.callback;
      return g ? Q(g, [f, e, i], o) : f;
    }
    generateTickLabels(t) {
      let e, i, n;
      for (e = 0, i = t.length; e < i; ++e)
        (n = t[e]), (n.label = this._tickFormatFunction(n.value, e, t));
    }
    getDecimalForValue(t) {
      const e = this;
      return null === t ? NaN : (t - e.min) / (e.max - e.min);
    }
    getPixelForValue(t) {
      const e = this,
        i = e._offsets,
        n = e.getDecimalForValue(t);
      return e.getPixelForDecimal((i.start + n) * i.factor);
    }
    getValueForPixel(t) {
      const e = this,
        i = e._offsets,
        n = e.getDecimalForPixel(t) / i.factor - i.end;
      return e.min + n * (e.max - e.min);
    }
    _getLabelSize(t) {
      const e = this,
        i = e.options.ticks,
        n = e.ctx.measureText(t).width,
        o = Lt(e.isHorizontal() ? i.maxRotation : i.minRotation),
        s = Math.cos(o),
        a = Math.sin(o),
        r = e._resolveTickFontOptions(0).size;
      return { w: n * s + r * a, h: n * a + r * s };
    }
    _getLabelCapacity(t) {
      const e = this,
        i = e.options.time,
        n = i.displayFormats,
        o = n[i.unit] || n.millisecond,
        s = e._tickFormatFunction(t, 0, qs(e, [t], e._majorUnit), o),
        a = e._getLabelSize(s),
        r = Math.floor(e.isHorizontal() ? e.width / a.w : e.height / a.h) - 1;
      return r > 0 ? r : 1;
    }
    getDataTimestamps() {
      const t = this;
      let e,
        i,
        n = t._cache.data || [];
      if (n.length) return n;
      const o = t.getMatchingVisibleMetas();
      if (t._normalized && o.length)
        return (t._cache.data = o[0].controller.getAllParsedValues(t));
      for (e = 0, i = o.length; e < i; ++e)
        n = n.concat(o[e].controller.getAllParsedValues(t));
      return (t._cache.data = t.normalize(n));
    }
    getLabelTimestamps() {
      const t = this,
        e = t._cache.labels || [];
      let i, n;
      if (e.length) return e;
      const o = t.getLabels();
      for (i = 0, n = o.length; i < n; ++i) e.push(Ys(t, o[i]));
      return (t._cache.labels = t._normalized ? e : t.normalize(e));
    }
    normalize(t) {
      return ce(t.sort($s));
    }
  }
  function Gs(t, e, i) {
    let n, o, s, a;
    if (i) (n = Math.floor(e)), (o = Math.ceil(e)), (s = t[n]), (a = t[o]);
    else {
      const i = ie(t, e);
      (s = i.lo), (a = i.hi), (n = t[s]), (o = t[a]);
    }
    const r = o - n;
    return r ? s + ((a - s) * (e - n)) / r : s;
  }
  (Ks.id = 'time'),
    (Ks.defaults = {
      bounds: 'data',
      adapters: {},
      time: {
        parser: !1,
        unit: !1,
        round: !1,
        isoWeekday: !1,
        minUnit: 'millisecond',
        displayFormats: {}
      },
      ticks: { source: 'auto', major: { enabled: !1 } }
    });
  class Zs extends Ks {
    constructor(t) {
      super(t), (this._table = []), (this._maxIndex = void 0);
    }
    initOffsets() {
      const t = this,
        e = t._getTimestampsForTable();
      (t._table = t.buildLookupTable(e)),
        (t._maxIndex = t._table.length - 1),
        super.initOffsets(e);
    }
    buildLookupTable(t) {
      const { min: e, max: i } = this;
      if (!t.length)
        return [
          { time: e, pos: 0 },
          { time: i, pos: 1 }
        ];
      const n = [e];
      let o, s, a;
      for (o = 0, s = t.length; o < s; ++o)
        (a = t[o]), a > e && a < i && n.push(a);
      return n.push(i), n;
    }
    _getTimestampsForTable() {
      const t = this;
      let e = t._cache.all || [];
      if (e.length) return e;
      const i = t.getDataTimestamps(),
        n = t.getLabelTimestamps();
      return (
        (e =
          i.length && n.length ? t.normalize(i.concat(n)) : i.length ? i : n),
        (e = t._cache.all = e),
        e
      );
    }
    getPixelForValue(t, e) {
      const i = this,
        n = i._offsets,
        o =
          i._normalized && i._maxIndex > 0 && !$(e)
            ? e / i._maxIndex
            : i.getDecimalForValue(t);
      return i.getPixelForDecimal((n.start + o) * n.factor);
    }
    getDecimalForValue(t) {
      return Gs(this._table, t) / this._maxIndex;
    }
    getValueForPixel(t) {
      const e = this,
        i = e._offsets,
        n = e.getDecimalForPixel(t) / i.factor - i.end;
      return Gs(e._table, n * this._maxIndex, !0);
    }
  }
  (Zs.id = 'timeseries'), (Zs.defaults = Ks.defaults);
  var Qs = Object.freeze({
    __proto__: null,
    CategoryScale: As,
    LinearScale: Rs,
    LogarithmicScale: Es,
    RadialLinearScale: Ns,
    TimeScale: Ks,
    TimeSeriesScale: Zs
  });
  return (
    Zn.register(mo, Qs, jo, Cs),
    (Zn.helpers = { ...Pn }),
    (Zn._adapters = io),
    (Zn.Animation = bi),
    (Zn.Animations = yi),
    (Zn.animator = a),
    (Zn.controllers = Cn.controllers.items),
    (Zn.DatasetController = Ti),
    (Zn.Element = Ri),
    (Zn.elements = jo),
    (Zn.Interaction = Ce),
    (Zn.layouts = Ke),
    (Zn.platforms = di),
    (Zn.Scale = Yi),
    (Zn.Ticks = Fi),
    Object.assign(Zn, mo, Qs, jo, Cs, di),
    (Zn.Chart = Zn),
    'undefined' != typeof window && (window.Chart = Zn),
    Zn
  );
});
