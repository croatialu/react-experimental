// We are modularizing this manually because the current modularize setting in Emscripten has some issues:
// https://github.com/kripken/emscripten/issues/5820
// In addition, When you use emcc's modularization, it still expects to export a global object called `Module`,
// which is able to be used/called before the WASM is loaded.
// The modularization below exports a promise that loads and resolves to the actual sql.js module.
// That way, this module can't be used before the WASM is finished loading.

// We are going to define a function that a user will call to start loading initializing our Sql.js library
// However, that function might be called multiple times, and on subsequent calls, we don't actually want it to instantiate a new instance of the Module
// Instead, we want to return the previously loaded module

// TODO: Make this not declare a global if used in the browser
let initSqlJsPromise

const initSqlJs = function (moduleConfig) {
  if (initSqlJsPromise)
    return initSqlJsPromise

  // If we're here, we've never called this function before
  initSqlJsPromise = new Promise((resolveModule, reject) => {
    // We are modularizing this manually because the current modularize setting in Emscripten has some issues:
    // https://github.com/kripken/emscripten/issues/5820

    // The way to affect the loading of emcc compiled modules is to create a variable called `Module` and add
    // properties to it, like `preRun`, `postRun`, etc
    // We are using that to get notified when the WASM has finished loading.
    // Only then will we return our promise

    // If they passed in a moduleConfig object, use that
    // Otherwise, initialize Module to the empty object
    const Module = typeof moduleConfig !== 'undefined' ? moduleConfig : {}

    // EMCC only allows for a single onAbort function (not an array of functions)
    // So if the user defined their own onAbort function, we remember it and call it
    const originalOnAbortFunction = Module.onAbort
    Module.onAbort = function (errorThatCausedAbort) {
      reject(new Error(errorThatCausedAbort))
      if (originalOnAbortFunction)
        originalOnAbortFunction(errorThatCausedAbort)
    }

    Module.postRun = Module.postRun || []
    Module.postRun.push(() => {
      // When Emscripted calls postRun, this promise resolves with the built Module
      resolveModule(Module)
    })

    // There is a section of code in the emcc-generated code below that looks like this:
    // (Note that this is lowercase `module`)
    // if (typeof module !== 'undefined') {
    //     module['exports'] = Module;
    // }
    // When that runs, it's going to overwrite our own modularization export efforts in shell-post.js!
    // The only way to tell emcc not to emit it is to pass the MODULARIZE=1 or MODULARIZE_INSTANCE=1 flags,
    // but that carries with it additional unnecessary baggage/bugs we don't want either.
    // So, we have three options:
    // 1) We undefine `module`
    // 2) We remember what `module['exports']` was at the beginning of this function and we restore it later
    // 3) We write a script to remove those lines of code as part of the Make process.
    //
    // Since those are the only lines of code that care about module, we will undefine it. It's the most straightforward
    // of the options, and has the side effect of reducing emcc's efforts to modify the module if its output were to change in the future.
    // That's a nice side effect since we're handling the modularization efforts ourselves
    module = undefined

    // The emcc-generated code and shell-post.js code goes below,
    // meaning that all of it runs inside of this promise. If anything throws an exception, our promise will abort
    let f; f ||= typeof Module !== 'undefined' ? Module : {}; 'use strict'
    f.onRuntimeInitialized = function () {
      function a(g, l) {
        switch (typeof l) {
          case 'boolean':mc(g, l ? 1 : 0); break; case 'number':nc(g, l); break; case 'string':oc(g, l, -1, -1); break; case 'object':if (l === null) { lb(g) }
          else if (l.length != null) { const n = aa(l, ba); pc(g, n, l.length, -1); ca(n) }
          else { Aa(g, `Wrong API use : tried to return a value of an unknown type (${l}).`, -1) } break; default:lb(g)
        }
      } function b(g, l) {
        for (var n = [], t = 0; t < g; t += 1) {
          let w = m(l + 4 * t, 'i32'); let z = qc(w); if (z === 1 || z === 2) { w = rc(w) }
          else if (z === 3) { w = sc(w) }
          else if (z === 4) {
            z = w
            w = tc(z); z = uc(z); for (var N = new Uint8Array(w), L = 0; L < w; L += 1)N[L] = p[z + L]; w = N
          }
          else { w = null }n.push(w)
        } return n
      } function c(g, l) { this.La = g; this.db = l; this.Ja = 1; this.fb = [] } function d(g, l) {
        this.db = l; l = da(g) + 1; this.Ya = ea(l); if (this.Ya === null)
          throw new Error('Unable to allocate memory for the SQL string'); fa(g, q, this.Ya, l); this.eb = this.Ya; this.Ua = this.ib = null
      } function e(g) {
        this.filename = `dbfile_${4294967295 * Math.random() >>> 0}`; if (g != null) {
          let l = this.filename; let n = '/'; let t = l; n && (n = typeof n == 'string' ? n : ha(n), t = l
            ? u(`${n}/${l}`)
            : n); l = ia(!0, !0); t = ja(t, (void 0 !== l ? l : 438) & 4095 | 32768, 0); if (g) { if (typeof g == 'string') { n = Array(g.length); for (let w = 0, z = g.length; w < z; ++w)n[w] = g.charCodeAt(w); g = n }ka(t, l | 146); n = la(t, 577); ma(n, g, 0, g.length, 0); na(n); ka(t, l) }
        } this.handleError(r(this.filename, h)); this.db = m(h, 'i32'); ob(this.db); this.Za = {}; this.Na = {}
      } var h = x(4); const k = f.cwrap; var r = k('sqlite3_open', 'number', ['string', 'number']); const y = k('sqlite3_close_v2', 'number', ['number']); const v = k('sqlite3_exec', 'number', ['number', 'string', 'number', 'number', 'number']); const F = k('sqlite3_changes', 'number', ['number']); const H = k('sqlite3_prepare_v2', 'number', ['number', 'string', 'number', 'number', 'number']); const pb = k('sqlite3_sql', 'string', ['number']); const vc = k('sqlite3_normalized_sql', 'string', ['number']); const qb = k('sqlite3_prepare_v2', 'number', ['number', 'number', 'number', 'number', 'number']); const wc = k('sqlite3_bind_text', 'number', ['number', 'number', 'number', 'number', 'number']); const rb = k('sqlite3_bind_blob', 'number', ['number', 'number', 'number', 'number', 'number']); const xc = k('sqlite3_bind_double', 'number', ['number', 'number', 'number'])
      const yc = k('sqlite3_bind_int', 'number', ['number', 'number', 'number']); const zc = k('sqlite3_bind_parameter_index', 'number', ['number', 'string']); const Ac = k('sqlite3_step', 'number', ['number']); const Bc = k('sqlite3_errmsg', 'string', ['number']); const Cc = k('sqlite3_column_count', 'number', ['number']); const Dc = k('sqlite3_data_count', 'number', ['number']); const Ec = k('sqlite3_column_double', 'number', ['number', 'number']); const sb = k('sqlite3_column_text', 'string', ['number', 'number']); const Fc = k('sqlite3_column_blob', 'number', ['number', 'number']); const Gc = k('sqlite3_column_bytes', 'number', ['number', 'number']); const Hc = k('sqlite3_column_type', 'number', ['number', 'number']); const Ic = k('sqlite3_column_name', 'string', ['number', 'number']); const Jc = k('sqlite3_reset', 'number', ['number']); const Kc = k('sqlite3_clear_bindings', 'number', ['number']); const Lc = k('sqlite3_finalize', 'number', ['number']); const tb = k('sqlite3_create_function_v2', 'number', 'number string number number number number number number number'.split(' ')); var qc = k('sqlite3_value_type', 'number', ['number']); var tc = k('sqlite3_value_bytes', 'number', ['number']); var sc = k('sqlite3_value_text', 'string', ['number']); var uc = k('sqlite3_value_blob', 'number', ['number']); var rc = k('sqlite3_value_double', 'number', ['number']); var nc = k('sqlite3_result_double', '', ['number', 'number']); var lb = k('sqlite3_result_null', '', ['number']); var oc = k('sqlite3_result_text', '', ['number', 'string', 'number', 'number']); var pc = k('sqlite3_result_blob', '', ['number', 'number', 'number', 'number']); var mc = k('sqlite3_result_int', '', ['number', 'number']); var Aa = k('sqlite3_result_error', '', ['number', 'string', 'number']); const ub = k('sqlite3_aggregate_context', 'number', ['number', 'number']); var ob = k('RegisterExtensionFunctions', 'number', ['number']); c.prototype.bind = function (g) {
        if (!this.La)
          throw 'Statement closed'; this.reset(); return Array.isArray(g) ? this.wb(g) : g != null && typeof g === 'object' ? this.xb(g) : !0
      }; c.prototype.step = function () {
        if (!this.La)
          throw 'Statement closed'; this.Ja = 1; const g = Ac(this.La); switch (g) { case 100:return !0; case 101:return !1; default:throw this.db.handleError(g) }
      }; c.prototype.rb = function (g) { g == null && (g = this.Ja, this.Ja += 1); return Ec(this.La, g) }; c.prototype.Ab
= function (g) {
          g == null && (g = this.Ja, this.Ja += 1); g = sb(this.La, g); if (typeof BigInt !== 'function')
            throw new Error('BigInt is not supported'); return BigInt(g)
        }; c.prototype.Bb = function (g) { g == null && (g = this.Ja, this.Ja += 1); return sb(this.La, g) }; c.prototype.getBlob = function (g) { g == null && (g = this.Ja, this.Ja += 1); const l = Gc(this.La, g); g = Fc(this.La, g); for (var n = new Uint8Array(l), t = 0; t < l; t += 1)n[t] = p[g + t]; return n }; c.prototype.get = function (g, l) {
        l = l || {}; g != null && this.bind(g) && this.step(); g = []; for (let n = Dc(this.La), t = 0; t < n; t
+= 1) switch (Hc(this.La, t)) { case 1:var w = l.useBigInt ? this.Ab(t) : this.rb(t); g.push(w); break; case 2:g.push(this.rb(t)); break; case 3:g.push(this.Bb(t)); break; case 4:g.push(this.getBlob(t)); break; default:g.push(null) } return g
      }; c.prototype.getColumnNames = function () { for (var g = [], l = Cc(this.La), n = 0; n < l; n += 1)g.push(Ic(this.La, n)); return g }; c.prototype.getAsObject = function (g, l) { g = this.get(g, l); l = this.getColumnNames(); for (var n = {}, t = 0; t < l.length; t += 1)n[l[t]] = g[t]; return n }; c.prototype.getSQL = function () { return pb(this.La) }
      c.prototype.getNormalizedSQL = function () { return vc(this.La) }; c.prototype.run = function (g) { g != null && this.bind(g); this.step(); return this.reset() }; c.prototype.nb = function (g, l) { l == null && (l = this.Ja, this.Ja += 1); g = oa(g); const n = aa(g, ba); this.fb.push(n); this.db.handleError(wc(this.La, l, n, g.length - 1, 0)) }; c.prototype.vb = function (g, l) { l == null && (l = this.Ja, this.Ja += 1); const n = aa(g, ba); this.fb.push(n); this.db.handleError(rb(this.La, l, n, g.length, 0)) }; c.prototype.mb = function (g, l) {
        l == null && (l = this.Ja, this.Ja += 1); this.db.handleError((g
        === (g | 0)
          ? yc
          : xc)(this.La, l, g))
      }; c.prototype.yb = function (g) { g == null && (g = this.Ja, this.Ja += 1); rb(this.La, g, 0, 0, 0) }; c.prototype.ob = function (g, l) { l == null && (l = this.Ja, this.Ja += 1); switch (typeof g) { case 'string':this.nb(g, l); return; case 'number':this.mb(g, l); return; case 'bigint':this.nb(g.toString(), l); return; case 'boolean':this.mb(g + 0, l); return; case 'object':if (g === null) { this.yb(l); return } if (g.length != null) { this.vb(g, l); return } } throw `Wrong API use : tried to bind a value of an unknown type (${g}).` }; c.prototype.xb
= function (g) { const l = this; Object.keys(g).forEach((n) => { const t = zc(l.La, n); t !== 0 && l.ob(g[n], t) }); return !0 }; c.prototype.wb = function (g) { for (let l = 0; l < g.length; l += 1) this.ob(g[l], l + 1); return !0 }; c.prototype.reset = function () { this.freemem(); return Kc(this.La) === 0 && Jc(this.La) === 0 }; c.prototype.freemem = function () { for (var g; void 0 !== (g = this.fb.pop());)ca(g) }; c.prototype.free = function () { this.freemem(); const g = Lc(this.La) === 0; delete this.db.Za[this.La]; this.La = 0; return g }; d.prototype.next = function () {
        if (this.Ya
          === null)
          return { done: !0 }; this.Ua !== null && (this.Ua.free(), this.Ua = null); if (!this.db.db)
          throw this.gb(), Error('Database closed'); const g = pa(); const l = x(4); qa(h); qa(l); try {
          this.db.handleError(qb(this.db.db, this.eb, -1, h, l)); this.eb = m(l, 'i32'); const n = m(h, 'i32'); if (n === 0)
            return this.gb(), { done: !0 }; this.Ua = new c(n, this.db); this.db.Za[n] = this.Ua; return { value: this.Ua, done: !1 }
        }
        catch (t) { throw this.ib = ra(this.eb), this.gb(), t }
        finally { sa(g) }
      }; d.prototype.gb = function () { ca(this.Ya); this.Ya = null }; d.prototype.getRemainingSQL
= function () { return this.ib !== null ? this.ib : ra(this.eb) }; typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' && (d.prototype[Symbol.iterator] = function () { return this }); e.prototype.run = function (g, l) {
        if (!this.db)
          throw 'Database closed'; if (l) {
          g = this.prepare(g, l); try { g.step() }
          finally { g.free() }
        }
        else { this.handleError(v(this.db, g, 0, 0, h)) } return this
      }; e.prototype.exec = function (g, l, n) {
        if (!this.db)
          throw 'Database closed'; const t = pa(); let w = null; try { let z = ta(g); const N = x(4); for (g = []; m(z, 'i8') !== 0;) { qa(h); qa(N); this.handleError(qb(this.db, z, -1, h, N)); const L = m(h, 'i32'); z = m(N, 'i32'); if (L !== 0) { let K = null; w = new c(L, this); for (l != null && w.bind(l); w.step();)K === null && (K = { columns: w.getColumnNames(), values: [] }, g.push(K)), K.values.push(w.get(null, n)); w.free() } } return g }
        catch (O) { throw w && w.free(), O }
        finally { sa(t) }
      }; e.prototype.each = function (g, l, n, t, w) {
        typeof l === 'function' && (t = n, n = l, l = void 0); g = this.prepare(g, l); try { for (;g.step();)n(g.getAsObject(null, w)) }
        finally { g.free() } if (typeof t === 'function')
          return t()
      }; e.prototype.prepare = function (g, l) {
        qa(h)
        this.handleError(H(this.db, g, -1, h, 0)); g = m(h, 'i32'); if (g === 0)
          throw 'Nothing to prepare'; const n = new c(g, this); l != null && n.bind(l); return this.Za[g] = n
      }; e.prototype.iterateStatements = function (g) { return new d(g, this) }; e.prototype.export = function () { Object.values(this.Za).forEach((l) => { l.free() }); Object.values(this.Na).forEach(ua); this.Na = {}; this.handleError(y(this.db)); const g = va(this.filename); this.handleError(r(this.filename, h)); this.db = m(h, 'i32'); ob(this.db); return g }; e.prototype.close = function () {
        this.db
        !== null && (Object.values(this.Za).forEach((g) => { g.free() }), Object.values(this.Na).forEach(ua), this.Na = {}, this.handleError(y(this.db)), wa(`/${this.filename}`), this.db = null)
      }; e.prototype.handleError = function (g) {
        if (g === 0)
          return null; g = Bc(this.db); throw new Error(g)
      }; e.prototype.getRowsModified = function () { return F(this.db) }; e.prototype.create_function = function (g, l) {
        Object.prototype.hasOwnProperty.call(this.Na, g) && (ua(this.Na[g]), delete this.Na[g]); const n = xa((t, w, z) => {
          w = b(w, z); try { var N = l.apply(null, w) }
          catch (L) { Aa(t, L, -1); return }a(t, N)
        }, 'viii'); this.Na[g] = n; this.handleError(tb(this.db, g, l.length, 1, 0, n, 0, 0, 0)); return this
      }; e.prototype.create_aggregate = function (g, l) {
        const n = l.init || function () { return null }; const t = l.finalize || function (K) { return K }; const w = l.step; if (!w)
          throw `An aggregate function must have a step function in ${g}`; const z = {}; Object.hasOwnProperty.call(this.Na, g) && (ua(this.Na[g]), delete this.Na[g]); l = `${g}__finalize`; Object.hasOwnProperty.call(this.Na, l) && (ua(this.Na[l]), delete this.Na[l]); const N = xa((K, O, Ua) => {
          const X = ub(K, 1); Object.hasOwnProperty.call(z, X) || (z[X] = n()); O = b(O, Ua); O = [z[X]].concat(O); try { z[X] = w.apply(null, O) }
          catch (Nc) { delete z[X], Aa(K, Nc, -1) }
        }, 'viii'); const L = xa((K) => {
          const O = ub(K, 1); try { var Ua = t(z[O]) }
          catch (X) { delete z[O]; Aa(K, X, -1); return }a(K, Ua); delete z[O]
        }, 'vi'); this.Na[g] = N; this.Na[l] = L; this.handleError(tb(this.db, g, w.length - 1, 1, 0, 0, N, L, 0)); return this
      }; f.Database = e
    }
    let ya = Object.assign({}, f); let za = './this.program'; const Ba = typeof window == 'object'; const Ca = typeof importScripts == 'function'; const Da = typeof process == 'object' && typeof process.versions == 'object' && typeof process.versions.node == 'string'; let A = ''; let Ea; let Fa; let Ga
    if (Da) {
      var fs = require('node:fs'); const Ha = require('node:path'); A = Ca ? `${Ha.dirname(A)}/` : `${__dirname}/`; Ea = (a, b) => { a = Ia(a) ? new URL(a) : Ha.normalize(a); return fs.readFileSync(a, b ? void 0 : 'utf8') }; Ga = (a) => { a = Ea(a, !0); a.buffer || (a = new Uint8Array(a)); return a }; Fa = (a, b, c, d = !0) => { a = Ia(a) ? new URL(a) : Ha.normalize(a); fs.readFile(a, d ? void 0 : 'utf8', (e, h) => { e ? c(e) : b(d ? h.buffer : h) }) }; !f.thisProgram && process.argv.length > 1 && (za = process.argv[1].replace(/\\/g, '/')); process.argv.slice(2); typeof module != 'undefined' && (module.exports = f); f.inspect
= () => '[Emscripten Module object]'
    }
    else if (Ba || Ca) {
      Ca ? A = self.location.href : typeof document != 'undefined' && document.currentScript && (A = document.currentScript.src), A = A.indexOf('blob:') !== 0 ? A.substr(0, A.replace(/[?#].*/, '').lastIndexOf('/') + 1) : '', Ea = (a) => { const b = new XMLHttpRequest(); b.open('GET', a, !1); b.send(null); return b.responseText }, Ca && (Ga = (a) => { const b = new XMLHttpRequest(); b.open('GET', a, !1); b.responseType = 'arraybuffer'; b.send(null); return new Uint8Array(b.response) }), Fa = (a, b, c) => {
        const d = new XMLHttpRequest(); d.open('GET', a, !0); d.responseType = 'arraybuffer'; d.onload = () => { d.status == 200 || d.status == 0 && d.response ? b(d.response) : c() }; d.onerror = c; d.send(null)
      }
    } const Ja = f.print || console.log.bind(console); const B = f.printErr || console.error.bind(console); Object.assign(f, ya); ya = null; f.thisProgram && (za = f.thisProgram); let Ka; f.wasmBinary && (Ka = f.wasmBinary); typeof WebAssembly != 'object' && C('no native wasm support detected'); let La; let Ma = !1; let p; let q; let Na; let D; let E; let Oa; let Pa
    function Qa() { const a = La.buffer; f.HEAP8 = p = new Int8Array(a); f.HEAP16 = Na = new Int16Array(a); f.HEAPU8 = q = new Uint8Array(a); f.HEAPU16 = new Uint16Array(a); f.HEAP32 = D = new Int32Array(a); f.HEAPU32 = E = new Uint32Array(a); f.HEAPF32 = Oa = new Float32Array(a); f.HEAPF64 = Pa = new Float64Array(a) } const Ra = []; const Sa = []; const Ta = []; function Va() { const a = f.preRun.shift(); Ra.unshift(a) } let G = 0; let Wa = null; let Xa = null
    function C(a) { f.onAbort?.(a); a = `Aborted(${a})`; B(a); Ma = !0; throw new WebAssembly.RuntimeError(`${a}. Build with -sASSERTIONS for more info.`) } const Ya = a => a.startsWith('data:application/octet-stream;base64,'); var Ia = a => a.startsWith('file://'); let Za; Za = 'sql-wasm.wasm'; if (!Ya(Za)) { const $a = Za; Za = f.locateFile ? f.locateFile($a, A) : A + $a } function ab(a) {
      if (a == Za && Ka)
        return new Uint8Array(Ka); if (Ga)
        return Ga(a); throw 'both async and sync fetching of the wasm failed'
    }
    function bb(a) {
      if (!Ka && (Ba || Ca)) {
        if (typeof fetch == 'function' && !Ia(a)) {
          return fetch(a, { credentials: 'same-origin' }).then((b) => {
            if (!b.ok)
              throw `failed to load wasm binary file at '${a}'`; return b.arrayBuffer()
          }).catch(() => ab(a))
        } if (Fa)
          return new Promise((b, c) => { Fa(a, d => b(new Uint8Array(d)), c) })
      } return Promise.resolve().then(() => ab(a))
    } function cb(a, b, c) { return bb(a).then(d => WebAssembly.instantiate(d, b)).then(d => d).then(c, (d) => { B(`failed to asynchronously prepare wasm: ${d}`); C(d) }) }
    function db(a, b) { const c = Za; Ka || typeof WebAssembly.instantiateStreaming != 'function' || Ya(c) || Ia(c) || Da || typeof fetch != 'function' ? cb(c, a, b) : fetch(c, { credentials: 'same-origin' }).then(d => WebAssembly.instantiateStreaming(d, a).then(b, (e) => { B(`wasm streaming compile failed: ${e}`); B('falling back to ArrayBuffer instantiation'); return cb(c, a, b) })) } let I; let J; const eb = (a) => { for (;a.length > 0;)a.shift()(f) }
    function m(a, b = 'i8') { b.endsWith('*') && (b = '*'); switch (b) { case 'i1':return p[a >> 0]; case 'i8':return p[a >> 0]; case 'i16':return Na[a >> 1]; case 'i32':return D[a >> 2]; case 'i64':C('to do getValue(i64) use WASM_BIGINT'); case 'float':return Oa[a >> 2]; case 'double':return Pa[a >> 3]; case '*':return E[a >> 2]; default:C(`invalid type for getValue: ${b}`) } }
    function qa(a) { let b = 'i32'; b.endsWith('*') && (b = '*'); switch (b) { case 'i1':p[a >> 0] = 0; break; case 'i8':p[a >> 0] = 0; break; case 'i16':Na[a >> 1] = 0; break; case 'i32':D[a >> 2] = 0; break; case 'i64':C('to do setValue(i64) use WASM_BIGINT'); case 'float':Oa[a >> 2] = 0; break; case 'double':Pa[a >> 3] = 0; break; case '*':E[a >> 2] = 0; break; default:C(`invalid type for setValue: ${b}`) } }
    const fb = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : void 0; const M = (a, b, c) => {
      let d = b + c; for (c = b; a[c] && !(c >= d);)++c; if (c - b > 16 && a.buffer && fb)
        return fb.decode(a.subarray(b, c)); for (d = ''; b < c;) {
        let e = a[b++]; if (e & 128) {
          const h = a[b++] & 63; if ((e & 224) == 192) { d += String.fromCharCode((e & 31) << 6 | h) }
          else { const k = a[b++] & 63; e = (e & 240) == 224 ? (e & 15) << 12 | h << 6 | k : (e & 7) << 18 | h << 12 | k << 6 | a[b++] & 63; e < 65536 ? d += String.fromCharCode(e) : (e -= 65536, d += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023)) }
        }
        else { d += String.fromCharCode(e) }
      } return d
    }
    var ra = (a, b) => a ? M(q, a, b) : ''; const gb = (a, b) => {
      for (var c = 0, d = a.length - 1; d >= 0; d--) { const e = a[d]; e === '.' ? a.splice(d, 1) : e === '..' ? (a.splice(d, 1), c++) : c && (a.splice(d, 1), c--) } if (b)
        for (;c; c--)a.unshift('..'); return a
    }; var u = (a) => { const b = a.charAt(0) === '/'; const c = a.substr(-1) === '/'; (a = gb(a.split('/').filter(d => !!d), !b).join('/')) || b || (a = '.'); a && c && (a += '/'); return (b ? '/' : '') + a }; const hb = (a) => {
      let b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1); a = b[0]; b = b[1]; if (!a && !b)
        return '.'; b &&= b.substr(0, b.length - 1); return a
          + b
    }; const ib = (a) => {
      if (a === '/')
        return '/'; a = u(a); a = a.replace(/\/$/, ''); const b = a.lastIndexOf('/'); return b === -1 ? a : a.substr(b + 1)
    }; const jb = () => {
      if (typeof crypto == 'object' && typeof crypto.getRandomValues == 'function')
        return c => crypto.getRandomValues(c); if (Da) {
        try {
          const a = require('node:crypto'); if (a.randomFillSync)
            return c => a.randomFillSync(c); const b = a.randomBytes; return c => (c.set(b(c.byteLength)), c)
        }
        catch (c) {}
      }C('initRandomDevice')
    }; let kb = a => (kb = jb())(a)
    function mb() {
      for (var a = '', b = !1, c = arguments.length - 1; c >= -1 && !b; c--) {
        b = c >= 0 ? arguments[c] : '/'; if (typeof b != 'string')
          throw new TypeError('Arguments to path.resolve must be strings'); if (!b)
          return ''; a = `${b}/${a}`; b = b.charAt(0) === '/'
      }a = gb(a.split('/').filter(d => !!d), !b).join('/'); return (b ? '/' : '') + a || '.'
    }
    let nb = []; var da = (a) => { for (var b = 0, c = 0; c < a.length; ++c) { const d = a.charCodeAt(c); d <= 127 ? b++ : d <= 2047 ? b += 2 : d >= 55296 && d <= 57343 ? (b += 4, ++c) : b += 3 } return b }; var fa = (a, b, c, d) => {
      if (!(d > 0))
        return 0; const e = c; d = c + d - 1; for (let h = 0; h < a.length; ++h) {
        let k = a.charCodeAt(h); if (k >= 55296 && k <= 57343) { const r = a.charCodeAt(++h); k = 65536 + ((k & 1023) << 10) | r & 1023 } if (k <= 127) {
          if (c >= d)
            break; b[c++] = k
        }
        else {
          if (k <= 2047) {
            if (c + 1 >= d)
              break; b[c++] = 192 | k >> 6
          }
          else {
            if (k <= 65535) {
              if (c + 2 >= d)
                break; b[c++] = 224 | k >> 12
            }
            else {
              if (c + 3 >= d)
                break; b[c++] = 240 | k >> 18; b[c++] = 128 | k
                  >> 12 & 63
            }b[c++] = 128 | k >> 6 & 63
          }b[c++] = 128 | k & 63
        }
      }b[c] = 0; return c - e
    }; function oa(a, b) { const c = Array(da(a) + 1); a = fa(a, c, 0, c.length); b && (c.length = a); return c } const vb = []; function wb(a, b) { vb[a] = { input: [], output: [], Xa: b }; xb(a, yb) }
    var yb = { open(a) {
      const b = vb[a.node.rdev]; if (!b)
        throw new P(43); a.tty = b; a.seekable = !1
    }, close(a) { a.tty.Xa.fsync(a.tty) }, fsync(a) { a.tty.Xa.fsync(a.tty) }, read(a, b, c, d) {
      if (!a.tty || !a.tty.Xa.sb)
        throw new P(60); for (var e = 0, h = 0; h < d; h++) {
        try { var k = a.tty.Xa.sb(a.tty) }
        catch (r) { throw new P(29) } if (void 0 === k && e === 0)
          throw new P(6); if (k === null || void 0 === k)
          break; e++; b[c + h] = k
      }e && (a.node.timestamp = Date.now()); return e
    }, write(a, b, c, d) {
      if (!a.tty || !a.tty.Xa.jb)
        throw new P(60); try {
        for (var e = 0; e < d; e++) {
          a.tty.Xa.jb(a.tty, b[c
          + e])
        }
      }
      catch (h) { throw new P(29) }d && (a.node.timestamp = Date.now()); return e
    } }; const zb = { sb() {
      a: {
        if (!nb.length) {
          var a = null; if (Da) {
            const b = Buffer.alloc(256); let c = 0; const d = process.stdin.fd; try { c = fs.readSync(d, b) }
            catch (e) {
              if (e.toString().includes('EOF'))
                c = 0; else throw e
            }c > 0 ? a = b.slice(0, c).toString('utf-8') : a = null
          }
          else { typeof window != 'undefined' && typeof window.prompt == 'function' ? (a = window.prompt('Input: '), a !== null && (a += '\n')) : typeof readline == 'function' && (a = readline(), a !== null && (a += '\n')) } if (!a) { a = null; break a }nb = oa(a, !0)
        }a
= nb.shift()
      } return a
    }, jb(a, b) { b === null || b === 10 ? (Ja(M(a.output, 0)), a.output = []) : b != 0 && a.output.push(b) }, fsync(a) { a.output && a.output.length > 0 && (Ja(M(a.output, 0)), a.output = []) }, Mb() { return { Ib: 25856, Kb: 5, Hb: 191, Jb: 35387, Gb: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] } }, Nb() { return 0 }, Ob() { return [24, 80] } }; const Ab = { jb(a, b) { b === null || b === 10 ? (B(M(a.output, 0)), a.output = []) : b != 0 && a.output.push(b) }, fsync(a) { a.output && a.output.length > 0 && (B(M(a.output, 0)), a.output = []) } }
    function Bb(a, b) { let c = a.Ia ? a.Ia.length : 0; c >= b || (b = Math.max(b, c * (c < 1048576 ? 2 : 1.125) >>> 0), c != 0 && (b = Math.max(b, 256)), c = a.Ia, a.Ia = new Uint8Array(b), a.Ma > 0 && a.Ia.set(c.subarray(0, a.Ma), 0)) }
    var Q = { Qa: null, Ra() { return Q.createNode(null, '/', 16895, 0) }, createNode(a, b, c, d) {
      if ((c & 61440) === 24576 || (c & 61440) === 4096)
        throw new P(63); Q.Qa || (Q.Qa = { dir: { node: { Pa: Q.Ga.Pa, Oa: Q.Ga.Oa, lookup: Q.Ga.lookup, ab: Q.Ga.ab, rename: Q.Ga.rename, unlink: Q.Ga.unlink, rmdir: Q.Ga.rmdir, readdir: Q.Ga.readdir, symlink: Q.Ga.symlink }, stream: { Ta: Q.Ha.Ta } }, file: { node: { Pa: Q.Ga.Pa, Oa: Q.Ga.Oa }, stream: { Ta: Q.Ha.Ta, read: Q.Ha.read, write: Q.Ha.write, lb: Q.Ha.lb, bb: Q.Ha.bb, cb: Q.Ha.cb } }, link: { node: { Pa: Q.Ga.Pa, Oa: Q.Ga.Oa, readlink: Q.Ga.readlink }, stream: {} }, pb: { node: { Pa: Q.Ga.Pa, Oa: Q.Ga.Oa }, stream: Cb } }); c = Db(a, b, c, d); R(c.mode) ? (c.Ga = Q.Qa.dir.node, c.Ha = Q.Qa.dir.stream, c.Ia = {}) : (c.mode & 61440) === 32768 ? (c.Ga = Q.Qa.file.node, c.Ha = Q.Qa.file.stream, c.Ma = 0, c.Ia = null) : (c.mode & 61440) === 40960 ? (c.Ga = Q.Qa.link.node, c.Ha = Q.Qa.link.stream) : (c.mode & 61440) === 8192 && (c.Ga = Q.Qa.pb.node, c.Ha = Q.Qa.pb.stream); c.timestamp = Date.now(); a && (a.Ia[b] = c, a.timestamp = c.timestamp); return c
    }, Lb(a) { return a.Ia ? a.Ia.subarray ? a.Ia.subarray(0, a.Ma) : new Uint8Array(a.Ia) : new Uint8Array(0) }, Ga: { Pa(a) { const b = {}; b.dev = (a.mode & 61440) === 8192 ? a.id : 1; b.ino = a.id; b.mode = a.mode; b.nlink = 1; b.uid = 0; b.gid = 0; b.rdev = a.rdev; R(a.mode) ? b.size = 4096 : (a.mode & 61440) === 32768 ? b.size = a.Ma : (a.mode & 61440) === 40960 ? b.size = a.link.length : b.size = 0; b.atime = new Date(a.timestamp); b.mtime = new Date(a.timestamp); b.ctime = new Date(a.timestamp); b.zb = 4096; b.blocks = Math.ceil(b.size / b.zb); return b }, Oa(a, b) {
      void 0 !== b.mode && (a.mode = b.mode); void 0 !== b.timestamp && (a.timestamp = b.timestamp); if (void 0 !== b.size && (b = b.size, a.Ma != b)) {
        if (b
          == 0) { a.Ia = null, a.Ma = 0 }
        else { const c = a.Ia; a.Ia = new Uint8Array(b); c && a.Ia.set(c.subarray(0, Math.min(b, a.Ma))); a.Ma = b }
      }
    }, lookup() { throw Eb[44] }, ab(a, b, c, d) { return Q.createNode(a, b, c, d) }, rename(a, b, c) {
      if (R(a.mode)) {
        try { var d = Fb(b, c) }
        catch (h) {} if (d)
          for (const e in d.Ia) throw new P(55)
      } delete a.parent.Ia[a.name]; a.parent.timestamp = Date.now(); a.name = c; b.Ia[c] = a; b.timestamp = a.parent.timestamp; a.parent = b
    }, unlink(a, b) { delete a.Ia[b]; a.timestamp = Date.now() }, rmdir(a, b) {
      const c = Fb(a, b); let d; for (d in c.Ia) throw new P(55); delete a.Ia[b]
      a.timestamp = Date.now()
    }, readdir(a) { const b = ['.', '..']; let c; for (c of Object.keys(a.Ia))b.push(c); return b }, symlink(a, b, c) { a = Q.createNode(a, b, 41471, 0); a.link = c; return a }, readlink(a) {
      if ((a.mode & 61440) !== 40960)
        throw new P(28); return a.link
    } }, Ha: { read(a, b, c, d, e) {
      const h = a.node.Ia; if (e >= a.node.Ma)
        return 0; a = Math.min(a.node.Ma - e, d); if (a > 8 && h.subarray)
        b.set(h.subarray(e, e + a), c); else for (d = 0; d < a; d++)b[c + d] = h[e + d]; return a
    }, write(a, b, c, d, e, h) {
      b.buffer === p.buffer && (h = !1); if (!d)
        return 0; a = a.node; a.timestamp = Date.now()
      if (b.subarray && (!a.Ia || a.Ia.subarray)) {
        if (h)
          return a.Ia = b.subarray(c, c + d), a.Ma = d; if (a.Ma === 0 && e === 0)
          return a.Ia = b.slice(c, c + d), a.Ma = d; if (e + d <= a.Ma)
          return a.Ia.set(b.subarray(c, c + d), e), d
      }Bb(a, e + d); if (a.Ia.subarray && b.subarray)
        a.Ia.set(b.subarray(c, c + d), e); else for (h = 0; h < d; h++)a.Ia[e + h] = b[c + h]; a.Ma = Math.max(a.Ma, e + d); return d
    }, Ta(a, b, c) {
      c === 1 ? b += a.position : c === 2 && (a.node.mode & 61440) === 32768 && (b += a.node.Ma); if (b < 0)
        throw new P(28); return b
    }, lb(a, b, c) { Bb(a.node, b + c); a.node.Ma = Math.max(a.node.Ma, b + c) }, bb(a, b, c, d, e) {
      if ((a.node.mode & 61440) !== 32768)
        throw new P(43); a = a.node.Ia; if (e & 2 || a.buffer !== p.buffer) {
        if (c > 0 || c + b < a.length)
          a.subarray ? a = a.subarray(c, c + b) : a = Array.prototype.slice.call(a, c, c + b); c = !0; b = 65536 * Math.ceil(b / 65536); (e = Gb(65536, b)) ? (q.fill(0, e, e + b), b = e) : b = 0; if (!b)
          throw new P(48); p.set(a, b)
      }
      else { c = !1, b = a.byteOffset } return { Db: b, ub: c }
    }, cb(a, b, c, d) { Q.Ha.write(a, b, 0, d, c, !1); return 0 } } }; var ia = (a, b) => { let c = 0; a && (c |= 365); b && (c |= 146); return c }; let Hb = null; const Ib = {}; const Jb = []; let Kb = 1; let S = null; let Lb = !0; var P = null; var Eb = {}
    function T(a, b = {}) {
      a = mb(a); if (!a)
        return { path: '', node: null }; b = Object.assign({ qb: !0, kb: 0 }, b); if (b.kb > 8)
        throw new P(32); a = a.split('/').filter(k => !!k); for (var c = Hb, d = '/', e = 0; e < a.length; e++) {
        let h = e === a.length - 1; if (h && b.parent)
          break; c = Fb(c, a[e]); d = u(`${d}/${a[e]}`); c.Va && (!h || h && b.qb) && (c = c.Va.root); if (!h || b.Sa) {
          for (h = 0; (c.mode & 61440) === 40960;) {
            if (c = Mb(d), d = mb(hb(d), c), c = T(d, { kb: b.kb + 1 }).node, h++ > 40)
              throw new P(32)
          }
        }
      } return { path: d, node: c }
    }
    function ha(a) {
      for (var b; ;) {
        if (a === a.parent)
          return a = a.Ra.tb, b ? a[a.length - 1] !== '/' ? `${a}/${b}` : a + b : a; b = b ? `${a.name}/${b}` : a.name; a = a.parent
      }
    } function Nb(a, b) { for (var c = 0, d = 0; d < b.length; d++)c = (c << 5) - c + b.charCodeAt(d) | 0; return (a + c >>> 0) % S.length } function Ob(a) {
      let b = Nb(a.parent.id, a.name); if (S[b] === a)
        S[b] = a.Wa; else for (b = S[b]; b;) { if (b.Wa === a) { b.Wa = a.Wa; break }b = b.Wa }
    }
    function Fb(a, b) {
      let c; if (c = (c = Pb(a, 'x')) ? c : a.Ga.lookup ? 0 : 2)
        throw new P(c, a); for (c = S[Nb(a.id, b)]; c; c = c.Wa) {
        const d = c.name; if (c.parent.id === a.id && d === b)
          return c
      } return a.Ga.lookup(a, b)
    } function Db(a, b, c, d) { a = new Qb(a, b, c, d); b = Nb(a.parent.id, a.name); a.Wa = S[b]; return S[b] = a } function R(a) { return (a & 61440) === 16384 } function Rb(a) { let b = ['r', 'w', 'rw'][a & 3]; a & 512 && (b += 'w'); return b }
    function Pb(a, b) {
      if (Lb)
        return 0; if (!b.includes('r') || a.mode & 292) {
        if (b.includes('w') && !(a.mode & 146) || b.includes('x') && !(a.mode & 73))
          return 2
      }
      else { return 2 } return 0
    } function Sb(a, b) {
      try { return Fb(a, b), 20 }
      catch (c) {} return Pb(a, 'wx')
    } function Tb(a, b, c) {
      try { var d = Fb(a, b) }
      catch (e) { return e.Ka } if (a = Pb(a, 'wx'))
        return a; if (c) {
        if (!R(d.mode))
          return 54; if (d === d.parent || ha(d) === '/')
          return 10
      }
      else if (R(d.mode)) { return 31 } return 0
    } function Ub() {
      for (let a = 0; a <= 4096; a++) {
        if (!Jb[a])
          return a
      } throw new P(33)
    }
    function U(a) {
      a = Jb[a]; if (!a)
        throw new P(8); return a
    } function Vb(a, b = -1) { Wb || (Wb = function () { this.$a = {} }, Wb.prototype = {}, Object.defineProperties(Wb.prototype, { object: { get() { return this.node }, set(c) { this.node = c } }, flags: { get() { return this.$a.flags }, set(c) { this.$a.flags = c } }, position: { get() { return this.$a.position }, set(c) { this.$a.position = c } } })); a = Object.assign(new Wb(), a); b == -1 && (b = Ub()); a.fd = b; return Jb[b] = a } var Cb = { open(a) { a.Ha = Ib[a.node.rdev].Ha; a.Ha.open?.(a) }, Ta() { throw new P(70) } }
    function xb(a, b) { Ib[a] = { Ha: b } } function Xb(a, b) {
      const c = b === '/'; const d = !b; if (c && Hb)
        throw new P(10); if (!c && !d) {
        var e = T(b, { qb: !1 }); b = e.path; e = e.node; if (e.Va)
          throw new P(10); if (!R(e.mode))
          throw new P(54)
      }b = { type: a, Pb: {}, tb: b, Cb: [] }; a = a.Ra(b); a.Ra = b; b.root = a; c ? Hb = a : e && (e.Va = b, e.Ra && e.Ra.Cb.push(b))
    } function ja(a, b, c) {
      const d = T(a, { parent: !0 }).node; a = ib(a); if (!a || a === '.' || a === '..')
        throw new P(28); const e = Sb(d, a); if (e)
        throw new P(e); if (!d.Ga.ab)
        throw new P(63); return d.Ga.ab(d, a, b, c)
    }
    function V(a, b) { return ja(a, (void 0 !== b ? b : 511) & 1023 | 16384, 0) } function Yb(a, b, c) { typeof c == 'undefined' && (c = b, b = 438); ja(a, b | 8192, c) } function Zb(a, b) {
      if (!mb(a))
        throw new P(44); const c = T(b, { parent: !0 }).node; if (!c)
        throw new P(44); b = ib(b); const d = Sb(c, b); if (d)
        throw new P(d); if (!c.Ga.symlink)
        throw new P(63); c.Ga.symlink(c, b, a)
    } function $b(a) {
      const b = T(a, { parent: !0 }).node; a = ib(a); const c = Fb(b, a); const d = Tb(b, a, !0); if (d)
        throw new P(d); if (!b.Ga.rmdir)
        throw new P(63); if (c.Va)
        throw new P(10); b.Ga.rmdir(b, a); Ob(c)
    }
    function wa(a) {
      const b = T(a, { parent: !0 }).node; if (!b)
        throw new P(44); a = ib(a); const c = Fb(b, a); const d = Tb(b, a, !1); if (d)
        throw new P(d); if (!b.Ga.unlink)
        throw new P(63); if (c.Va)
        throw new P(10); b.Ga.unlink(b, a); Ob(c)
    } function Mb(a) {
      a = T(a).node; if (!a)
        throw new P(44); if (!a.Ga.readlink)
        throw new P(28); return mb(ha(a.parent), a.Ga.readlink(a))
    } function ac(a, b) {
      a = T(a, { Sa: !b }).node; if (!a)
        throw new P(44); if (!a.Ga.Pa)
        throw new P(63); return a.Ga.Pa(a)
    } function bc(a) { return ac(a, !0) }
    function ka(a, b) {
      a = typeof a == 'string' ? T(a, { Sa: !0 }).node : a; if (!a.Ga.Oa)
        throw new P(63); a.Ga.Oa(a, { mode: b & 4095 | a.mode & -4096, timestamp: Date.now() })
    } function cc(a, b) {
      if (b < 0)
        throw new P(28); a = typeof a == 'string' ? T(a, { Sa: !0 }).node : a; if (!a.Ga.Oa)
        throw new P(63); if (R(a.mode))
        throw new P(31); if ((a.mode & 61440) !== 32768)
        throw new P(28); const c = Pb(a, 'w'); if (c)
        throw new P(c); a.Ga.Oa(a, { size: b, timestamp: Date.now() })
    }
    function la(a, b, c) {
      if (a === '')
        throw new P(44); if (typeof b == 'string') {
        var d = { 'r': 0, 'r+': 2, 'w': 577, 'w+': 578, 'a': 1089, 'a+': 1090 }[b]; if (typeof d == 'undefined')
          throw new Error(`Unknown file open mode: ${b}`); b = d
      }c = b & 64 ? (typeof c == 'undefined' ? 438 : c) & 4095 | 32768 : 0; if (typeof a == 'object') { var e = a }
      else {
        a = u(a); try { e = T(a, { Sa: !(b & 131072) }).node }
        catch (h) {}
      }d = !1; if (b & 64) {
        if (e) {
          if (b & 128)
            throw new P(20)
        }
        else { e = ja(a, c, 0), d = !0 }
      } if (!e)
        throw new P(44); (e.mode & 61440) === 8192 && (b &= -513); if (b & 65536 && !R(e.mode))
        throw new P(54); if (!d && (c
= e ? (e.mode & 61440) === 40960 ? 32 : R(e.mode) && (Rb(b) !== 'r' || b & 512) ? 31 : Pb(e, Rb(b)) : 44))
        throw new P(c); b & 512 && !d && cc(e, 0); b &= -131713; e = Vb({ node: e, path: ha(e), flags: b, seekable: !0, position: 0, Ha: e.Ha, Fb: [], error: !1 }); e.Ha.open && e.Ha.open(e); !f.logReadFiles || b & 1 || (dc ||= {}, a in dc || (dc[a] = 1)); return e
    } function na(a) {
      if (a.fd === null)
        throw new P(8); a.hb && (a.hb = null); try { a.Ha.close && a.Ha.close(a) }
      catch (b) { throw b }
      finally { Jb[a.fd] = null }a.fd = null
    }
    function ec(a, b, c) {
      if (a.fd === null)
        throw new P(8); if (!a.seekable || !a.Ha.Ta)
        throw new P(70); if (c != 0 && c != 1 && c != 2)
        throw new P(28); a.position = a.Ha.Ta(a, b, c); a.Fb = []
    } function fc(a, b, c, d, e) {
      if (d < 0 || e < 0)
        throw new P(28); if (a.fd === null)
        throw new P(8); if ((a.flags & 2097155) === 1)
        throw new P(8); if (R(a.node.mode))
        throw new P(31); if (!a.Ha.read)
        throw new P(28); const h = typeof e != 'undefined'; if (!h)
        e = a.position; else if (!a.seekable)
        throw new P(70); b = a.Ha.read(a, b, c, d, e); h || (a.position += b); return b
    }
    function ma(a, b, c, d, e) {
      if (d < 0 || e < 0)
        throw new P(28); if (a.fd === null)
        throw new P(8); if ((a.flags & 2097155) === 0)
        throw new P(8); if (R(a.node.mode))
        throw new P(31); if (!a.Ha.write)
        throw new P(28); a.seekable && a.flags & 1024 && ec(a, 0, 2); const h = typeof e != 'undefined'; if (!h)
        e = a.position; else if (!a.seekable)
        throw new P(70); b = a.Ha.write(a, b, c, d, e, void 0); h || (a.position += b); return b
    }
    function va(a) {
      const b = 'binary'; if (b !== 'utf8' && b !== 'binary')
        throw new Error(`Invalid encoding type "${b}"`); let c; var d = la(a, d || 0); a = ac(a).size; const e = new Uint8Array(a); fc(d, e, 0, a, 0); b === 'utf8' ? c = M(e, 0) : b === 'binary' && (c = e); na(d); return c
    } function gc() { P || (P = function (a, b) { this.name = 'ErrnoError'; this.node = b; this.Eb = function (c) { this.Ka = c }; this.Eb(a); this.message = 'FS error' }, P.prototype = Error(), P.prototype.constructor = P, [44].forEach((a) => { Eb[a] = new P(a); Eb[a].stack = '<generic error, no stack>' })) } let hc
    function ic(a, b, c) {
      a = u(`/dev/${a}`); const d = ia(!!b, !!c); jc ||= 64; const e = jc++ << 8 | 0; xb(e, { open(h) { h.seekable = !1 }, close() { c?.buffer?.length && c(10) }, read(h, k, r, y) {
        for (var v = 0, F = 0; F < y; F++) {
          try { var H = b() }
          catch (pb) { throw new P(29) } if (void 0 === H && v === 0)
            throw new P(6); if (H === null || void 0 === H)
            break; v++; k[r + F] = H
        }v && (h.node.timestamp = Date.now()); return v
      }, write(h, k, r, y) {
        for (var v = 0; v < y; v++) {
          try { c(k[r + v]) }
          catch (F) { throw new P(29) }
        }y && (h.node.timestamp = Date.now()); return v
      } }); Yb(a, d, e)
    } let jc; const W = {}; let Wb; let dc
    function kc(a, b, c) {
      if (b.charAt(0) === '/')
        return b; a = a === -100 ? '/' : U(a).path; if (b.length == 0) {
        if (!c)
          throw new P(44); return a
      } return u(`${a}/${b}`)
    }
    function lc(a, b, c) {
      try { var d = a(b) }
      catch (h) {
        if (h && h.node && u(b) !== u(ha(h.node)))
          return -54; throw h
      }D[c >> 2] = d.dev; D[c + 4 >> 2] = d.mode; E[c + 8 >> 2] = d.nlink; D[c + 12 >> 2] = d.uid; D[c + 16 >> 2] = d.gid; D[c + 20 >> 2] = d.rdev; J = [d.size >>> 0, (I = d.size, +Math.abs(I) >= 1 ? I > 0 ? +Math.floor(I / 4294967296) >>> 0 : ~~+Math.ceil((I - +(~~I >>> 0)) / 4294967296) >>> 0 : 0)]; D[c + 24 >> 2] = J[0]; D[c + 28 >> 2] = J[1]; D[c + 32 >> 2] = 4096; D[c + 36 >> 2] = d.blocks; a = d.atime.getTime(); b = d.mtime.getTime(); const e = d.ctime.getTime(); J = [Math.floor(a / 1e3) >>> 0, (I = Math.floor(a / 1e3), +Math.abs(I)
      >= 1
        ? I > 0 ? +Math.floor(I / 4294967296) >>> 0 : ~~+Math.ceil((I - +(~~I >>> 0)) / 4294967296) >>> 0
        : 0)]; D[c + 40 >> 2] = J[0]; D[c + 44 >> 2] = J[1]; E[c + 48 >> 2] = a % 1e3 * 1e3; J = [Math.floor(b / 1e3) >>> 0, (I = Math.floor(b / 1e3), +Math.abs(I) >= 1 ? I > 0 ? +Math.floor(I / 4294967296) >>> 0 : ~~+Math.ceil((I - +(~~I >>> 0)) / 4294967296) >>> 0 : 0)]; D[c + 56 >> 2] = J[0]; D[c + 60 >> 2] = J[1]; E[c + 64 >> 2] = b % 1e3 * 1e3; J = [Math.floor(e / 1e3) >>> 0, (I = Math.floor(e / 1e3), +Math.abs(I) >= 1 ? I > 0 ? +Math.floor(I / 4294967296) >>> 0 : ~~+Math.ceil((I - +(~~I >>> 0)) / 4294967296) >>> 0 : 0)]; D[c + 72 >> 2] = J[0]
      D[c + 76 >> 2] = J[1]; E[c + 80 >> 2] = e % 1e3 * 1e3; J = [d.ino >>> 0, (I = d.ino, +Math.abs(I) >= 1 ? I > 0 ? +Math.floor(I / 4294967296) >>> 0 : ~~+Math.ceil((I - +(~~I >>> 0)) / 4294967296) >>> 0 : 0)]; D[c + 88 >> 2] = J[0]; D[c + 92 >> 2] = J[1]; return 0
    } let Mc = void 0; function Oc() { const a = D[+Mc >> 2]; Mc += 4; return a }
    const Pc = (a, b) => b + 2097152 >>> 0 < 4194305 - !!a ? (a >>> 0) + 4294967296 * b : Number.NaN; const Qc = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]; const Rc = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]; const Sc = (a) => { const b = da(a) + 1; const c = ea(b); c && fa(a, q, c, b); return c }; const Tc = {}; const Vc = () => {
      if (!Uc) {
        const a = { USER: 'web_user', LOGNAME: 'web_user', PATH: '/', PWD: '/', HOME: '/home/web_user', LANG: `${(typeof navigator == 'object' && navigator.languages && navigator.languages[0] || 'C').replace('-', '_')}.UTF-8`, _: za || './this.program' }; let b; for (b in Tc) void 0 === Tc[b] ? delete a[b] : a[b] = Tc[b]
        const c = []; for (b in a)c.push(`${b}=${a[b]}`); Uc = c
      } return Uc
    }; let Uc; var ta = (a) => { const b = da(a) + 1; const c = x(b); fa(a, q, c, b); return c }; const Wc = (a, b, c, d) => {
      const e = { string: (v) => { let F = 0; v !== null && void 0 !== v && v !== 0 && (F = ta(v)); return F }, array: (v) => { const F = x(v.length); p.set(v, F); return F } }; a = f[`_${a}`]; const h = []; let k = 0; if (d)
        for (let r = 0; r < d.length; r++) { const y = e[c[r]]; y ? (k === 0 && (k = pa()), h[r] = y(d[r])) : h[r] = d[r] }c = a.apply(null, h); return c = (function (v) { k !== 0 && sa(k); return b === 'string' ? v ? M(q, v) : '' : b === 'boolean' ? !!v : v }(c))
    }; var ba = 0; var aa = (a, b) => {
      b = b == 1
        ? x(a.length)
        : ea(a.length); a.subarray || a.slice || (a = new Uint8Array(a)); q.set(a, b); return b
    }; let Xc; const Yc = []; let Y; var ua = (a) => { Xc.delete(Y.get(a)); Y.set(a, null); Yc.push(a) }; var xa = (a, b) => {
      if (!Xc) {
        Xc = new WeakMap(); var c = Y.length; if (Xc)
          for (var d = 0; d < 0 + c; d++) { var e = Y.get(d); e && Xc.set(e, d) }
      } if (c = Xc.get(a) || 0)
        return c; if (Yc.length) { c = Yc.pop() }
      else {
        try { Y.grow(1) }
        catch (r) {
          if (!(r instanceof RangeError))
            throw r; throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.'
        }c = Y.length - 1
      } try { Y.set(c, a) }
      catch (r) {
        if (!(r instanceof TypeError))
          throw r; if (typeof WebAssembly.Function
            == 'function') { d = WebAssembly.Function; e = { i: 'i32', j: 'i64', f: 'f32', d: 'f64', e: 'externref', p: 'i32' }; for (var h = { parameters: [], results: b[0] == 'v' ? [] : [e[b[0]]] }, k = 1; k < b.length; ++k)h.parameters.push(e[b[k]]); b = new d(h, a) }
        else {
          d = [1]; e = b.slice(0, 1); b = b.slice(1); h = { i: 127, p: 127, j: 126, f: 125, d: 124, e: 111 }; d.push(96); k = b.length; k < 128 ? d.push(k) : d.push(k % 128 | 128, k >> 7); for (k = 0; k < b.length; ++k)d.push(h[b[k]]); e == 'v' ? d.push(0) : d.push(1, h[e]); b = [0, 97, 115, 109, 1, 0, 0, 0, 1]; e = d.length; e < 128
            ? b.push(e)
            : b.push(e % 128
            | 128, e >> 7); b.push.apply(b, d); b.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0); b = new WebAssembly.Module(new Uint8Array(b)); b = (new WebAssembly.Instance(b, { e: { f: a } })).exports.f
        }Y.set(c, b)
      }Xc.set(a, c); return c
    }; function Qb(a, b, c, d) { a ||= this; this.parent = a; this.Ra = a.Ra; this.Va = null; this.id = Kb++; this.name = b; this.mode = c; this.Ga = {}; this.Ha = {}; this.rdev = d }
    Object.defineProperties(Qb.prototype, { read: { get() { return (this.mode & 365) === 365 }, set(a) { a ? this.mode |= 365 : this.mode &= -366 } }, write: { get() { return (this.mode & 146) === 146 }, set(a) { a ? this.mode |= 146 : this.mode &= -147 } } }); gc(); S = Array(4096); Xb(Q, '/'); V('/tmp'); V('/home'); V('/home/web_user');
    (function () { V('/dev'); xb(259, { read: () => 0, write: (d, e, h, k) => k }); Yb('/dev/null', 259); wb(1280, zb); wb(1536, Ab); Yb('/dev/tty', 1280); Yb('/dev/tty1', 1536); const a = new Uint8Array(1024); let b = 0; const c = () => { b === 0 && (b = kb(a).byteLength); return a[--b] }; ic('random', c); ic('urandom', c); V('/dev/shm'); V('/dev/shm/tmp') })();
    (function () { V('/proc'); const a = V('/proc/self'); V('/proc/self/fd'); Xb({ Ra() { const b = Db(a, 'fd', 16895, 73); b.Ga = { lookup(c, d) { const e = U(+d); c = { parent: null, Ra: { tb: 'fake' }, Ga: { readlink: () => e.path } }; return c.parent = c } }; return b } }, '/proc/self/fd') })()
    const $c = { a: (a, b, c, d) => { C(`Assertion failed: ${a ? M(q, a) : ''}, at: ${[b ? b ? M(q, b) : '' : 'unknown filename', c, d ? d ? M(q, d) : '' : 'unknown function']}`) }, h(a, b) {
      try { return a = a ? M(q, a) : '', ka(a, b), 0 }
      catch (c) {
        if (typeof W == 'undefined' || c.name !== 'ErrnoError')
          throw c; return -c.Ka
      }
    }, H(a, b, c) {
      try {
        b = b ? M(q, b) : ''; b = kc(a, b); if (c & -8)
          return -28; const d = T(b, { Sa: !0 }).node; if (!d)
          return -44; a = ''; c & 4 && (a += 'r'); c & 2 && (a += 'w'); c & 1 && (a += 'x'); return a && Pb(d, a) ? -2 : 0
      }
      catch (e) {
        if (typeof W == 'undefined' || e.name !== 'ErrnoError')
          throw e
        return -e.Ka
      }
    }, i(a, b) {
      try { const c = U(a); ka(c.node, b); return 0 }
      catch (d) {
        if (typeof W == 'undefined' || d.name !== 'ErrnoError')
          throw d; return -d.Ka
      }
    }, g(a) {
      try {
        const b = U(a).node; const c = typeof b == 'string' ? T(b, { Sa: !0 }).node : b; if (!c.Ga.Oa)
          throw new P(63); c.Ga.Oa(c, { timestamp: Date.now() }); return 0
      }
      catch (d) {
        if (typeof W == 'undefined' || d.name !== 'ErrnoError')
          throw d; return -d.Ka
      }
    }, b(a, b, c) {
      Mc = c; try {
        const d = U(a); switch (b) {
          case 0:var e = Oc(); if (e < 0)
            return -28; for (;Jb[e];)e++; return Vb(d, e).fd; case 1:case 2:return 0
          case 3:return d.flags; case 4:return e = Oc(), d.flags |= e, 0; case 5:return e = Oc(), Na[e + 0 >> 1] = 2, 0; case 6:case 7:return 0; case 16:case 8:return -28; case 9:return D[Zc() >> 2] = 28, -1; default:return -28
        }
      }
      catch (h) {
        if (typeof W == 'undefined' || h.name !== 'ErrnoError')
          throw h; return -h.Ka
      }
    }, f(a, b) {
      try { const c = U(a); return lc(ac, c.path, b) }
      catch (d) {
        if (typeof W == 'undefined' || d.name !== 'ErrnoError')
          throw d; return -d.Ka
      }
    }, n(a, b, c) {
      b = Pc(b, c); try {
        if (isNaN(b))
          return 61; const d = U(a); if ((d.flags & 2097155) === 0)
          throw new P(28)
        cc(d.node, b); return 0
      }
      catch (e) {
        if (typeof W == 'undefined' || e.name !== 'ErrnoError')
          throw e; return -e.Ka
      }
    }, C(a, b) {
      try {
        if (b === 0)
          return -28; const c = da('/') + 1; if (b < c)
          return -68; fa('/', q, a, b); return c
      }
      catch (d) {
        if (typeof W == 'undefined' || d.name !== 'ErrnoError')
          throw d; return -d.Ka
      }
    }, F(a, b) {
      try { return a = a ? M(q, a) : '', lc(bc, a, b) }
      catch (c) {
        if (typeof W == 'undefined' || c.name !== 'ErrnoError')
          throw c; return -c.Ka
      }
    }, z(a, b, c) {
      try { return b = b ? M(q, b) : '', b = kc(a, b), b = u(b), b[b.length - 1] === '/' && (b = b.substr(0, b.length - 1)), V(b, c), 0 }
      catch (d) {
        if (typeof W == 'undefined' || d.name !== 'ErrnoError')
          throw d; return -d.Ka
      }
    }, E(a, b, c, d) {
      try { b = b ? M(q, b) : ''; const e = d & 256; b = kc(a, b, d & 4096); return lc(e ? bc : ac, b, c) }
      catch (h) {
        if (typeof W == 'undefined' || h.name !== 'ErrnoError')
          throw h; return -h.Ka
      }
    }, y(a, b, c, d) {
      Mc = d; try { b = b ? M(q, b) : ''; b = kc(a, b); const e = d ? Oc() : 0; return la(b, c, e).fd }
      catch (h) {
        if (typeof W == 'undefined' || h.name !== 'ErrnoError')
          throw h; return -h.Ka
      }
    }, w(a, b, c, d) {
      try {
        b = b ? M(q, b) : ''; b = kc(a, b); if (d <= 0)
          return -28
        const e = Mb(b); const h = Math.min(d, da(e)); const k = p[c + h]; fa(e, q, c, d + 1); p[c + h] = k; return h
      }
      catch (r) {
        if (typeof W == 'undefined' || r.name !== 'ErrnoError')
          throw r; return -r.Ka
      }
    }, v(a) {
      try { return a = a ? M(q, a) : '', $b(a), 0 }
      catch (b) {
        if (typeof W == 'undefined' || b.name !== 'ErrnoError')
          throw b; return -b.Ka
      }
    }, G(a, b) {
      try { return a = a ? M(q, a) : '', lc(ac, a, b) }
      catch (c) {
        if (typeof W == 'undefined' || c.name !== 'ErrnoError')
          throw c; return -c.Ka
      }
    }, r(a, b, c) {
      try {
        return b = b ? M(q, b) : '', b = kc(a, b), c === 0 ? wa(b) : c === 512 ? $b(b) : C('Invalid flags passed to unlinkat'),
        0
      }
      catch (d) {
        if (typeof W == 'undefined' || d.name !== 'ErrnoError')
          throw d; return -d.Ka
      }
    }, q(a, b, c) {
      try {
        b = b ? M(q, b) : ''; b = kc(a, b, !0); if (c) { let d = E[c >> 2] + 4294967296 * D[c + 4 >> 2]; let e = D[c + 8 >> 2]; h = 1e3 * d + e / 1e6; c += 16; d = E[c >> 2] + 4294967296 * D[c + 4 >> 2]; e = D[c + 8 >> 2]; k = 1e3 * d + e / 1e6 }
        else { var h = Date.now(); var k = h }a = h; const r = T(b, { Sa: !0 }).node; r.Ga.Oa(r, { timestamp: Math.max(a, k) }); return 0
      }
      catch (y) {
        if (typeof W == 'undefined' || y.name !== 'ErrnoError')
          throw y; return -y.Ka
      }
    }, l(a, b, c) {
      a = new Date(1e3 * Pc(a, b)); D[c >> 2] = a.getSeconds()
      D[c + 4 >> 2] = a.getMinutes(); D[c + 8 >> 2] = a.getHours(); D[c + 12 >> 2] = a.getDate(); D[c + 16 >> 2] = a.getMonth(); D[c + 20 >> 2] = a.getFullYear() - 1900; D[c + 24 >> 2] = a.getDay(); b = a.getFullYear(); D[c + 28 >> 2] = (b % 4 !== 0 || b % 100 === 0 && b % 400 !== 0 ? Rc : Qc)[a.getMonth()] + a.getDate() - 1 | 0; D[c + 36 >> 2] = -(60 * a.getTimezoneOffset()); b = (new Date(a.getFullYear(), 6, 1)).getTimezoneOffset(); const d = (new Date(a.getFullYear(), 0, 1)).getTimezoneOffset(); D[c + 32 >> 2] = (b != d && a.getTimezoneOffset() == Math.min(d, b)) | 0
    }, j(a, b, c, d, e, h, k, r) {
      e = Pc(e, h); try {
        if (isNaN(e))
          return 61
        const y = U(d); if ((b & 2) !== 0 && (c & 2) === 0 && (y.flags & 2097155) !== 2)
          throw new P(2); if ((y.flags & 2097155) === 1)
          throw new P(2); if (!y.Ha.bb)
          throw new P(43); const v = y.Ha.bb(y, a, e, b, c); const F = v.Db; D[k >> 2] = v.ub; E[r >> 2] = F; return 0
      }
      catch (H) {
        if (typeof W == 'undefined' || H.name !== 'ErrnoError')
          throw H; return -H.Ka
      }
    }, k(a, b, c, d, e, h, k) {
      h = Pc(h, k); try {
        if (isNaN(h))
          return 61; const r = U(e); if (c & 2) {
          if ((r.node.mode & 61440) !== 32768)
            throw new P(43); if (!(d & 2)) { const y = q.slice(a, a + b); r.Ha.cb && r.Ha.cb(r, y, h, b, d) }
        }
      }
      catch (v) {
        if (typeof W
          == 'undefined' || v.name !== 'ErrnoError')
          throw v; return -v.Ka
      }
    }, s: (a, b, c) => { function d(y) { return (y = y.toTimeString().match(/\(([A-Za-z ]+)\)$/)) ? y[1] : 'GMT' } let e = (new Date()).getFullYear(); const h = new Date(e, 0, 1); const k = new Date(e, 6, 1); e = h.getTimezoneOffset(); const r = k.getTimezoneOffset(); E[a >> 2] = 60 * Math.max(e, r); D[b >> 2] = Number(e != r); a = d(h); b = d(k); a = Sc(a); b = Sc(b); r < e ? (E[c >> 2] = a, E[c + 4 >> 2] = b) : (E[c >> 2] = b, E[c + 4 >> 2] = a) }, d: () => Date.now(), t: () => 2147483648, c: () => performance.now(), o: (a) => {
      const b = q.length; a >>>= 0; if (a > 2147483648)
        return !1
      for (let c = 1; c <= 4; c *= 2) {
        let d = b * (1 + 0.2 / c); d = Math.min(d, a + 100663296); let e = Math; d = Math.max(a, d); a: {
          e = (e.min.call(e, 2147483648, d + (65536 - d % 65536) % 65536) - La.buffer.byteLength + 65535) / 65536; try { La.grow(e); Qa(); var h = 1; break a }
          catch (k) {}h = void 0
        } if (h)
          return !0
      } return !1
    }, A: (a, b) => { let c = 0; Vc().forEach((d, e) => { let h = b + c; e = E[a + 4 * e >> 2] = h; for (h = 0; h < d.length; ++h)p[e++ >> 0] = d.charCodeAt(h); p[e >> 0] = 0; c += d.length + 1 }); return 0 }, B: (a, b) => { const c = Vc(); E[a >> 2] = c.length; let d = 0; c.forEach(e => d += e.length + 1); E[b >> 2] = d; return 0 }, e(a) {
      try { const b = U(a); na(b); return 0 }
      catch (c) {
        if (typeof W == 'undefined' || c.name !== 'ErrnoError')
          throw c; return c.Ka
      }
    }, p(a, b) {
      try {
        const c = U(a); p[b >> 0] = c.tty ? 2 : R(c.mode) ? 3 : (c.mode & 61440) === 40960 ? 7 : 4; Na[b + 2 >> 1] = 0; J = [0, (I = 0, +Math.abs(I) >= 1 ? I > 0 ? +Math.floor(I / 4294967296) >>> 0 : ~~+Math.ceil((I - +(~~I >>> 0)) / 4294967296) >>> 0 : 0)]; D[b + 8 >> 2] = J[0]; D[b + 12 >> 2] = J[1]; J = [0, (I = 0, +Math.abs(I) >= 1 ? I > 0 ? +Math.floor(I / 4294967296) >>> 0 : ~~+Math.ceil((I - +(~~I >>> 0)) / 4294967296) >>> 0 : 0)]; D[b + 16 >> 2] = J[0]; D[b + 20 >> 2] = J[1]
        return 0
      }
      catch (d) {
        if (typeof W == 'undefined' || d.name !== 'ErrnoError')
          throw d; return d.Ka
      }
    }, x(a, b, c, d) {
      try {
        a: {
          const e = U(a); a = b; for (var h, k = b = 0; k < c; k++) {
            const r = E[a >> 2]; const y = E[a + 4 >> 2]; a += 8; const v = fc(e, p, r, y, h); if (v < 0) { var F = -1; break a }b += v; if (v < y)
              break; typeof h !== 'undefined' && (h += v)
          }F = b
        }E[d >> 2] = F; return 0
      }
      catch (H) {
        if (typeof W == 'undefined' || H.name !== 'ErrnoError')
          throw H; return H.Ka
      }
    }, m(a, b, c, d, e) {
      b = Pc(b, c); try {
        if (isNaN(b))
          return 61; const h = U(a); ec(h, b, d); J = [h.position >>> 0, (I = h.position, +Math.abs(I) >= 1
          ? I > 0 ? +Math.floor(I / 4294967296) >>> 0 : ~~+Math.ceil((I - +(~~I >>> 0)) / 4294967296) >>> 0
          : 0)]; D[e >> 2] = J[0]; D[e + 4 >> 2] = J[1]; h.hb && b === 0 && d === 0 && (h.hb = null); return 0
      }
      catch (k) {
        if (typeof W == 'undefined' || k.name !== 'ErrnoError')
          throw k; return k.Ka
      }
    }, D(a) {
      try { const b = U(a); return b.Ha?.fsync ? b.Ha.fsync(b) : 0 }
      catch (c) {
        if (typeof W == 'undefined' || c.name !== 'ErrnoError')
          throw c; return c.Ka
      }
    }, u(a, b, c, d) {
      try {
        a: {
          const e = U(a); a = b; for (var h, k = b = 0; k < c; k++) {
            const r = E[a >> 2]; const y = E[a + 4 >> 2]; a += 8; const v = ma(e, p, r, y, h); if (v < 0) {
              var F
= -1; break a
            }b += v; typeof h !== 'undefined' && (h += v)
          }F = b
        }E[d >> 2] = F; return 0
      }
      catch (H) {
        if (typeof W == 'undefined' || H.name !== 'ErrnoError')
          throw H; return H.Ka
      }
    } }; var Z = (function () {
      function a(c) { Z = c.exports; La = Z.I; Qa(); Y = Z.Aa; Sa.unshift(Z.J); G--; f.monitorRunDependencies?.(G); G == 0 && (Wa !== null && (clearInterval(Wa), Wa = null), Xa && (c = Xa, Xa = null, c())); return Z } const b = { a: $c }; G++; f.monitorRunDependencies?.(G); if (f.instantiateWasm) {
        try { return f.instantiateWasm(b, a) }
        catch (c) {
          return B(`Module.instantiateWasm callback failed with error: ${c}`),
          !1
        }
      }db(b, (c) => { a(c.instance) }); return {}
    }()); f._sqlite3_free = a => (f._sqlite3_free = Z.K)(a); f._sqlite3_value_text = a => (f._sqlite3_value_text = Z.L)(a); var Zc = () => (Zc = Z.M)(); f._sqlite3_prepare_v2 = (a, b, c, d, e) => (f._sqlite3_prepare_v2 = Z.N)(a, b, c, d, e); f._sqlite3_step = a => (f._sqlite3_step = Z.O)(a); f._sqlite3_finalize = a => (f._sqlite3_finalize = Z.P)(a); f._sqlite3_reset = a => (f._sqlite3_reset = Z.Q)(a); f._sqlite3_clear_bindings = a => (f._sqlite3_clear_bindings = Z.R)(a); f._sqlite3_value_blob = a => (f._sqlite3_value_blob = Z.S)(a)
    f._sqlite3_value_bytes = a => (f._sqlite3_value_bytes = Z.T)(a); f._sqlite3_value_double = a => (f._sqlite3_value_double = Z.U)(a); f._sqlite3_value_int = a => (f._sqlite3_value_int = Z.V)(a); f._sqlite3_value_type = a => (f._sqlite3_value_type = Z.W)(a); f._sqlite3_result_blob = (a, b, c, d) => (f._sqlite3_result_blob = Z.X)(a, b, c, d); f._sqlite3_result_double = (a, b) => (f._sqlite3_result_double = Z.Y)(a, b); f._sqlite3_result_error = (a, b, c) => (f._sqlite3_result_error = Z.Z)(a, b, c); f._sqlite3_result_int = (a, b) => (f._sqlite3_result_int = Z._)(a, b)
    f._sqlite3_result_int64 = (a, b, c) => (f._sqlite3_result_int64 = Z.$)(a, b, c); f._sqlite3_result_null = a => (f._sqlite3_result_null = Z.aa)(a); f._sqlite3_result_text = (a, b, c, d) => (f._sqlite3_result_text = Z.ba)(a, b, c, d); f._sqlite3_aggregate_context = (a, b) => (f._sqlite3_aggregate_context = Z.ca)(a, b); f._sqlite3_column_count = a => (f._sqlite3_column_count = Z.da)(a); f._sqlite3_data_count = a => (f._sqlite3_data_count = Z.ea)(a); f._sqlite3_column_blob = (a, b) => (f._sqlite3_column_blob = Z.fa)(a, b)
    f._sqlite3_column_bytes = (a, b) => (f._sqlite3_column_bytes = Z.ga)(a, b); f._sqlite3_column_double = (a, b) => (f._sqlite3_column_double = Z.ha)(a, b); f._sqlite3_column_text = (a, b) => (f._sqlite3_column_text = Z.ia)(a, b); f._sqlite3_column_type = (a, b) => (f._sqlite3_column_type = Z.ja)(a, b); f._sqlite3_column_name = (a, b) => (f._sqlite3_column_name = Z.ka)(a, b); f._sqlite3_bind_blob = (a, b, c, d, e) => (f._sqlite3_bind_blob = Z.la)(a, b, c, d, e); f._sqlite3_bind_double = (a, b, c) => (f._sqlite3_bind_double = Z.ma)(a, b, c)
    f._sqlite3_bind_int = (a, b, c) => (f._sqlite3_bind_int = Z.na)(a, b, c); f._sqlite3_bind_text = (a, b, c, d, e) => (f._sqlite3_bind_text = Z.oa)(a, b, c, d, e); f._sqlite3_bind_parameter_index = (a, b) => (f._sqlite3_bind_parameter_index = Z.pa)(a, b); f._sqlite3_sql = a => (f._sqlite3_sql = Z.qa)(a); f._sqlite3_normalized_sql = a => (f._sqlite3_normalized_sql = Z.ra)(a); f._sqlite3_errmsg = a => (f._sqlite3_errmsg = Z.sa)(a); f._sqlite3_exec = (a, b, c, d, e) => (f._sqlite3_exec = Z.ta)(a, b, c, d, e); f._sqlite3_changes = a => (f._sqlite3_changes = Z.ua)(a)
    f._sqlite3_close_v2 = a => (f._sqlite3_close_v2 = Z.va)(a); f._sqlite3_create_function_v2 = (a, b, c, d, e, h, k, r, y) => (f._sqlite3_create_function_v2 = Z.wa)(a, b, c, d, e, h, k, r, y); f._sqlite3_open = (a, b) => (f._sqlite3_open = Z.xa)(a, b); var ea = f._malloc = a => (ea = f._malloc = Z.ya)(a); var ca = f._free = a => (ca = f._free = Z.za)(a); f._RegisterExtensionFunctions = a => (f._RegisterExtensionFunctions = Z.Ba)(a); var Gb = (a, b) => (Gb = Z.Ca)(a, b); var pa = () => (pa = Z.Da)(); var sa = a => (sa = Z.Ea)(a); var x = a => (x = Z.Fa)(a); f.stackAlloc = x; f.stackSave = pa; f.stackRestore = sa
    f.cwrap = (a, b, c, d) => { const e = !c || c.every(h => h === 'number' || h === 'boolean'); return b !== 'string' && e && !d ? f[`_${a}`] : function () { return Wc(a, b, c, arguments) } }; f.addFunction = xa; f.removeFunction = ua; f.UTF8ToString = ra; f.ALLOC_NORMAL = ba; f.allocate = aa; f.allocateUTF8OnStack = ta; let ad; Xa = function bd() { ad || cd(); ad || (Xa = bd) }
    function cd() {
      function a() {
        if (!ad && (ad = !0, f.calledRun = !0, !Ma)) {
          f.noFSInit || hc || (hc = !0, gc(), f.stdin = f.stdin, f.stdout = f.stdout, f.stderr = f.stderr, f.stdin ? ic('stdin', f.stdin) : Zb('/dev/tty', '/dev/stdin'), f.stdout ? ic('stdout', null, f.stdout) : Zb('/dev/tty', '/dev/stdout'), f.stderr ? ic('stderr', null, f.stderr) : Zb('/dev/tty1', '/dev/stderr'), la('/dev/stdin', 0), la('/dev/stdout', 1), la('/dev/stderr', 1)); Lb = !1; eb(Sa); if (f.onRuntimeInitialized)
            f.onRuntimeInitialized(); if (f.postRun) {
            for (typeof f.postRun == 'function'
              && (f.postRun = [f.postRun]); f.postRun.length;) { const b = f.postRun.shift(); Ta.unshift(b) }
          }eb(Ta)
        }
      } if (!(G > 0)) {
        if (f.preRun)
          for (typeof f.preRun == 'function' && (f.preRun = [f.preRun]); f.preRun.length;)Va(); eb(Ra); G > 0 || (f.setStatus ? (f.setStatus('Running...'), setTimeout(() => { setTimeout(() => { f.setStatus('') }, 1); a() }, 1)) : a())
      }
    } if (f.preInit)
      for (typeof f.preInit == 'function' && (f.preInit = [f.preInit]); f.preInit.length > 0;)f.preInit.pop()(); cd()

    // The shell-pre.js and emcc-generated code goes above
    return Module
  }) // The end of the promise being returned

  return initSqlJsPromise
} // The end of our initSqlJs function

// This bit below is copied almost exactly from what you get when you use the MODULARIZE=1 flag with emcc
// However, we don't want to use the emcc modularization. See shell-pre.js
if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = initSqlJs
  // This will allow the module to be used in ES6 or CommonJS
  module.exports.default = initSqlJs
}
else if (typeof define === 'function' && define.amd) {
  define([], () => { return initSqlJs })
}
else if (typeof exports === 'object') {
  exports.Module = initSqlJs
}
