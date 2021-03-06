/* @flow */

/* eslint-disable no-unused-vars, no-undef, no-console */

import createSagaMiddleware from 'redux-saga';

import {
  utils,
  delay,
  eventChannel,
  buffers,
  channel,
  takeEvery,
  takeLatest,
  runSaga,
  END,
} from 'redux-saga';

import {
  take,
  takem,
  put,
  call,
  apply,
  cps,
  fork,
  spawn,
  join,
  cancel,
  select,
  actionChannel,
  race,
  cancelled,
} from 'redux-saga/effects';

import type { Task, Channel, Buffer, SagaMonitor } from 'redux-saga';

import type {
  IOEffect,
  TakeEffect,
  PutEffect,
  SelectEffect,
} from 'redux-saga/effects';

/**
 * SOME COMMON TEST INFRASTRUCTURE
 */
const myChannel = channel();

function SomeContext() { this.z = 'foo'; }

const context = { a: 'foo' };
const context2 = new SomeContext();

const sagaMonitor: SagaMonitor = {
  effectTriggered: () => {},
  effectResolved: () => {},
  effectRejected: () => {},
  effectCancelled: () => {},
};

function* g1(a: string): Generator<any, number, any> { return 1; }
function* g2(a: string, b: number): Generator<any, number, any> { return 1; }
function* g3(a: string, b: number, c: string): Generator<any, number, any> { return 1; }
function* g4(a: string, b: number, c: string, d: number): Generator<any, number, any> { return 1; }
function* g5(a: string, b: number, c: string, d: number, e: string): Generator<any, number, any> { return 1; }
function* g6(a: string, b: number, c: string, d: number, e: string, f: number): Generator<any, number, any> { return 1; }

// Note: Without the return annotation, flow cannot determine the union case properly
const fn0 = (): Promise<number> => Promise.resolve(1);
const fn1 = (a: string): Promise<number> => Promise.resolve(1);
const fn2 = (a: string, b: number): Promise<number> => Promise.resolve(1);
const fn3 = (a: string, b: number, c: string): Promise<number> => Promise.resolve(1);
const fn4 = (a: string, b: number, c: string, d: number): Promise<number> => Promise.resolve(1);
const fn5 = (a: string, b: number, c: string, d: number, e: string): Promise<number> => Promise.resolve(1);
const fn6 = (a: string, b: number, c: string, d: number, e: string, f: number): Promise<number> => Promise.resolve(1);

const fnSpread = (...args: Array<number>): Promise<string> => Promise.resolve('');

/**
 * ALL THE TESTS START FROM HERE
 */

function channelTest() {
  (channel(buffers.fixed(1)): $npm$ReduxSaga$Channel);
}

function eventChannelTest() {
  eventChannel((emitter) => () => {}, buffers.dropping(1));
  eventChannel((emitter) => () => {}, buffers.dropping(1), () => true);

  // $FlowExpectedError: MatcherFn needs boolean as return type
  eventChannel((emitter) => () => {}, buffers.dropping(1), () => '');

  // $FlowExpectedError: second parameter needs to be a Buffer
  eventChannel((emitter) => () => {}, '');
}

function takeTest() {
  take((action) => action.type === 'foo');
  takem((action) => action.type === 'foo');

  take(['FOO', 'BAR']);
  takem(['FOO', 'BAR']);

  // $FlowExpectedError: PatternFn returns a boolean
  take((action) => null);

  // $FlowExpectedError: PatternFn returns a boolean
  takem((action) => null);

  // $FlowExpectedError: Only string patterns for arrays
  take(['FOO', 'BAR', 1]);

  // $FlowExpectedError: Only string patterns for arrays
  takem(['FOO', 'BAR', 1]);
}

function putTest() {
  put({ type: 'test' });

  const put1 = put({ type: 'FOO', bar: 'hi' });
  (put1.PUT.action.bar: string);

  const put2 = put(myChannel, { type: 'test' });
  (put2.PUT.channel: ?$npm$ReduxSaga$Channel)

  // $FlowExpectedError: Only action objects allowed
  put('test');

  // $FlowExpectedError: No null as channel accepted
  put(null, { type: 'test' });

  // $FlowExpectedError: This property cannot be inferred
  (put1.PUT.action.unknown: string);
}

function actionChannelTest() {
  (actionChannel('ASDF').ACTION_CHANNEL.pattern: string);
  (actionChannel(['FOO', 'BAR']).ACTION_CHANNEL.pattern[0]: string);
}


function callTest() {
  const c0 = call(fn0);
  const c1 = call(fn1, '1');
  const c2 = call(fn2, '1', 2);
  const c3 = call(fn3, '1', 2, '3');
  const c4 = call(fn4, '1', 2, '3', 4);
  const c5 = call(fn5, '1', 2, '3', 4, '5');
  const c6 = call(fn6, '1', 2, '3', 4, '5', 6);

  // $FlowExpectedError: Too less arguments
  call(fn6, '1', 2, '3', 4);

  const cSpread = call(fnSpread, 1, 2, 3, 1);

  // Args tests
  (c0.CALL.args: []);
  (c1.CALL.args: [string]);
  (c2.CALL.args: [string, number]);
  (c3.CALL.args: [string, number, string]);
  (c4.CALL.args: [string, number, string, number]);
  (c5.CALL.args: [string, number, string, number, string]);
  (c6.CALL.args: [string, number, string, number, string, number]);

  // $FlowExpectedError: First parameter is a string, not a number
  (c1.CALL.args: [number]);

  // Fn tests
  (c1.CALL.fn: typeof fn1);
  (c2.CALL.fn: typeof fn2);
  (c3.CALL.fn: typeof fn3);
  (c4.CALL.fn: typeof fn4);
  (c5.CALL.fn: typeof fn5);
  (c6.CALL.fn: typeof fn6);

  // NOTE: This should actually fail, but apparently more parameter are fine..
  (c1.CALL.fn: typeof fn6);

  // $FlowExpectedError: fn returns a Promise<string> not Promise<number>
  (c1.CALL.fn: (a: boolean) => Promise<number>);

  // $FlowExpectedError: 'a' is actually of type string
  (c4.CALL.fn: (a: number, b: number) => Promise<string>);

  // $FlowExpectedError: Less parameter are noticed
  (c6.CALL.fn: typeof fn1);

  // Context tests
  (c1.CALL.context: null);
  (c2.CALL.context: null);
  (c3.CALL.context: null);
  (c4.CALL.context: null);
  (c5.CALL.context: null);
  (c6.CALL.context: null);

  // $FlowExpectedError
  (c1.CALL.context: Object);
}

function contextCallTest() {
  const c0 = call([context, fn0]);
  const c1 = call([context, fn1], '1');
  const c2 = call([context, fn2], '1', 2);
  const c3 = call([context, fn3], '1', 2, '3');
  const c4 = call([context, fn3], '1', 2, '3', 4);
  const c5 = call([context, fn3], '1', 2, '3', 4, '5');
  const c6 = call([context, fn3], '1', 2, '3', 4, '5', 6);
  const cClass = call([context2, fn1], '1');

  // Fn tests
  (c1.CALL.fn: typeof fn1);
  (c2.CALL.fn: typeof fn2);
  (c3.CALL.fn: typeof fn3);
  (c4.CALL.fn: typeof fn4);
  (c5.CALL.fn: typeof fn5);
  (c6.CALL.fn: typeof fn6);

  // $FlowExpectedError: Wrong number of parameters
  (c6.CALL.fn: typeof fn1);

  // Args tests
  (c1.CALL.args: [string]);
  (c2.CALL.args: [string, number]);
  (c3.CALL.args: [string, number, string]);
  (c4.CALL.args: [string, number, string, number]);
  (c5.CALL.args: [string, number, string, number, string]);
  (c6.CALL.args: [string, number, string, number, string, number]);

  // $FlowExpectedError: a is a number, not an Array
  (c1.CALL.args: [Array<*>]);

  // Context tests
  (c1.CALL.context: typeof context);
  (c2.CALL.context: typeof context);
  (c3.CALL.context: typeof context);
  (c4.CALL.context: typeof context);
  (c5.CALL.context: typeof context);
  (c6.CALL.context: typeof context);

  (c1.CALL.context.a: string);

  // $FlowExpectedError: Different context
  (c1.CALL.context: { b: 'nope' });

  // $FlowExpectedError: Parameter b requires a number
  call([context, fn2], 'test', 'test');
}

function applyTest() {
  const c0 = apply(context, fn0);
  const c1 = apply(context, fn1, '1');
  const c2 = apply(context, fn2, '1', 2);
  const c3 = apply(context, fn3, '1', 2, '3');
  const c4 = apply(context, fn4, '1', 2, '3', 4);
  const c5 = apply(context, fn5, '1', 2, '3', 4, '5');
  const c6 = apply(context, fn6, '1', 2, '3', 4, '5', 6);
  const cClass = apply(context2, fn1, '1');

  // Fn tests
  (c1.CALL.fn: typeof fn1);
  (c2.CALL.fn: typeof fn2);
  (c3.CALL.fn: typeof fn3);
  (c4.CALL.fn: typeof fn4);
  (c5.CALL.fn: typeof fn5);
  (c6.CALL.fn: typeof fn6);

  // $FlowExpectedError: Wrong number of parameters
  (c6.CALL.fn: typeof fn1);

  // Args tests
  (c1.CALL.args: [string]);
  (c2.CALL.args: [string, number]);
  (c3.CALL.args: [string, number, string]);
  (c4.CALL.args: [string, number, string, number]);
  (c5.CALL.args: [string, number, string, number, string]);
  (c6.CALL.args: [string, number, string, number, string, number]);

  // $FlowExpectedError: a is a number, not an Array
  (c1.CALL.args: [boolean]);

  // Context tests
  (c1.CALL.context: typeof context);
  (c2.CALL.context: typeof context);
  (c3.CALL.context: typeof context);
  (c4.CALL.context: typeof context);
  (c5.CALL.context: typeof context);
  (c6.CALL.context: typeof context);

  (c1.CALL.context.a: string);
  (c1.CALL.context.a: string);

  // $FlowExpectedError: Different context
  (c1.CALL.context: { b: 'nope' });

  // $FlowExpectedError: Parameter b requires a number
  call([context, fn2], 'test', 'test');
}

function contextForkTest() {
  const e0 = fork([context, fn0]);
  const e1 = fork([context, fn1], '1');
  const e2 = fork([context, fn2], '1', 2);
  const e3 = fork([context, fn3], '1', 2, '3');
  const e4 = fork([context, fn4], '1', 2, '3', 4);
  const e5 = fork([context, fn5], '1', 2, '3', 4, '5');
  const e6 = fork([context, fn6], '1', 2, '3', 4, '5', 6);
  const eClass = fork([context2, fn1], '1');
  const eGen = fork([context, g1], '1');

  // Args Test
  (e0.FORK.args: []);
  (e1.FORK.args: [string]);
  (e2.FORK.args: [string, number]);
  (e3.FORK.args: [string, number, string]);
  (e4.FORK.args: [string, number, string, number]);
  (e5.FORK.args: [string, number, string, number, string]);
  (e6.FORK.args: [string, number, string, number, string, number]);

  // Context Test
  (e1.FORK.context: typeof context);
  (e2.FORK.context: typeof context);
  (e3.FORK.context: typeof context);
  (e4.FORK.context: typeof context);
  (e5.FORK.context: typeof context);
  (e6.FORK.context: typeof context);
  (eGen.FORK.context: typeof context);

  // Fn Test
  (e1.FORK.fn: typeof fn1);
  (e2.FORK.fn: typeof fn2);
  (e3.FORK.fn: typeof fn3);
  (e4.FORK.fn: typeof fn4);
  (e5.FORK.fn: typeof fn5);
  (e6.FORK.fn: typeof fn6);
  (eGen.FORK.fn: typeof g1);

  // $FlowExpectedError: wrong fn
  (e6.FORK.fn: typeof fn1);
}

function forkTest() {
  const e0 = fork(fn0);
  const e1 = fork(fn1, '1');
  const e2 = fork(fn2, '1', 2);
  const e3 = fork(fn3, '1', 2, '3');
  const e4 = fork(fn4, '1', 2, '3', 4);
  const e5 = fork(fn5, '1', 2, '3', 4, '5');
  const e6 = fork(fn6, '1', 2, '3', 4, '5', 6);
  const eClass = fork(fn1, '1');
  const eGen = fork(g1, '1');

  // Args Test
  (e0.FORK.args: []);
  (e1.FORK.args: [string]);
  (e2.FORK.args: [string, number]);
  (e3.FORK.args: [string, number, string]);
  (e4.FORK.args: [string, number, string, number]);
  (e5.FORK.args: [string, number, string, number, string]);
  (e6.FORK.args: [string, number, string, number, string, number]);

  // Fn Test
  (e1.FORK.fn: typeof fn1);
  (e2.FORK.fn: typeof fn2);
  (e3.FORK.fn: typeof fn3);
  (e4.FORK.fn: typeof fn4);
  (e5.FORK.fn: typeof fn5);
  (e6.FORK.fn: typeof fn6);
  (eGen.FORK.fn: typeof g1);

  // $FlowExpectedError: wrong fn
  (e6.FORK.fn: typeof fn1);
}

function cpsTest() {
  const e0 = cps(fn0);
  const e1 = cps(fn1, '1');
  const e2 = cps(fn2, '1', 2);
  const e3 = cps(fn3, '1', 2, '3');
  const e4 = cps(fn4, '1', 2, '3', 4);
  const e5 = cps(fn5, '1', 2, '3', 4, '5');
  const e6 = cps(fn6, '1', 2, '3', 4, '5', 6);
  const eClass = cps(fn1, '1');
  const eGen = cps(g1, '1');

  // Args Test
  (e0.CPS.args: []);
  (e1.CPS.args: [string]);
  (e2.CPS.args: [string, number]);
  (e3.CPS.args: [string, number, string]);
  (e4.CPS.args: [string, number, string, number]);
  (e5.CPS.args: [string, number, string, number, string]);
  (e6.CPS.args: [string, number, string, number, string, number]);

  // Fn Test
  (e1.CPS.fn: typeof fn1);
  (e2.CPS.fn: typeof fn2);
  (e3.CPS.fn: typeof fn3);
  (e4.CPS.fn: typeof fn4);
  (e5.CPS.fn: typeof fn5);
  (e6.CPS.fn: typeof fn6);
  (eGen.CPS.fn: typeof g1);

  // $FlowExpectedError: wrong fn
  (e6.CPS.fn: typeof fn1);
}

function contextCpsTest() {
  const e0 = cps([context, fn0]);
  const e1 = cps([context, fn1], '1');
  const e2 = cps([context, fn2], '1', 2);
  const e3 = cps([context, fn3], '1', 2, '3');
  const e4 = cps([context, fn4], '1', 2, '3', 4);
  const e5 = cps([context, fn5], '1', 2, '3', 4, '5');
  const e6 = cps([context, fn6], '1', 2, '3', 4, '5', 6);
  const eClass = cps([context2, fn1], '1');
  const eGen = cps([context, g1], '1');

  // Args Test
  (e0.CPS.args: []);
  (e1.CPS.args: [string]);
  (e2.CPS.args: [string, number]);
  (e3.CPS.args: [string, number, string]);
  (e4.CPS.args: [string, number, string, number]);
  (e5.CPS.args: [string, number, string, number, string]);
  (e6.CPS.args: [string, number, string, number, string, number]);

  // Context Test
  (e1.CPS.context: typeof context);
  (e2.CPS.context: typeof context);
  (e3.CPS.context: typeof context);
  (e4.CPS.context: typeof context);
  (e5.CPS.context: typeof context);
  (e6.CPS.context: typeof context);
  (eGen.CPS.context: typeof context);

  // Fn Test
  (e1.CPS.fn: typeof fn1);
  (e2.CPS.fn: typeof fn2);
  (e3.CPS.fn: typeof fn3);
  (e4.CPS.fn: typeof fn4);
  (e5.CPS.fn: typeof fn5);
  (e6.CPS.fn: typeof fn6);
  (eGen.CPS.fn: typeof g1);

  // $FlowExpectedError: wrong fn
  (e6.CPS.fn: typeof fn1);
}

function spawnTest() {
  const e0 = spawn(fn0);
  const e1 = spawn(fn1, '1');
  const e2 = spawn(fn2, '1', 2);
  const e3 = spawn(fn3, '1', 2, '3');
  const e4 = spawn(fn4, '1', 2, '3', 4);
  const e5 = spawn(fn5, '1', 2, '3', 4, '5');
  const e6 = spawn(fn6, '1', 2, '3', 4, '5', 6);
  const eClass = spawn(fn1, '1');
  const eGen = spawn(g1, '1');

  // Args Test
  (e0.FORK.args: []);
  (e1.FORK.args: [string]);
  (e2.FORK.args: [string, number]);
  (e3.FORK.args: [string, number, string]);
  (e4.FORK.args: [string, number, string, number]);
  (e5.FORK.args: [string, number, string, number, string]);
  (e6.FORK.args: [string, number, string, number, string, number]);

  // Fn Test
  (e1.FORK.fn: typeof fn1);
  (e2.FORK.fn: typeof fn2);
  (e3.FORK.fn: typeof fn3);
  (e4.FORK.fn: typeof fn4);
  (e5.FORK.fn: typeof fn5);
  (e6.FORK.fn: typeof fn6);
  (eGen.FORK.fn: typeof g1);

  // $FlowExpectedError: wrong fn
  (e6.FORK.fn: typeof fn1);
}

function contextSpawnTest() {
  const e0 = spawn([context, fn0]);
  const e1 = spawn([context, fn1], '1');
  const e2 = spawn([context, fn2], '1', 2);
  const e3 = spawn([context, fn3], '1', 2, '3');
  const e4 = spawn([context, fn4], '1', 2, '3', 4);
  const e5 = spawn([context, fn5], '1', 2, '3', 4, '5');
  const e6 = spawn([context, fn6], '1', 2, '3', 4, '5', 6);
  const eClass = spawn([context2, fn1], '1');
  const eGen = spawn([context, g1], '1');

  // Args Test
  (e0.FORK.args: []);
  (e1.FORK.args: [string]);
  (e2.FORK.args: [string, number]);
  (e3.FORK.args: [string, number, string]);
  (e4.FORK.args: [string, number, string, number]);
  (e5.FORK.args: [string, number, string, number, string]);
  (e6.FORK.args: [string, number, string, number, string, number]);

  // Context Test
  (e1.FORK.context: typeof context);
  (e2.FORK.context: typeof context);
  (e3.FORK.context: typeof context);
  (e4.FORK.context: typeof context);
  (e5.FORK.context: typeof context);
  (e6.FORK.context: typeof context);
  (eGen.FORK.context: typeof context);

  // Fn Test
  (e1.FORK.fn: typeof fn1);
  (e2.FORK.fn: typeof fn2);
  (e3.FORK.fn: typeof fn3);
  (e4.FORK.fn: typeof fn4);
  (e5.FORK.fn: typeof fn5);
  (e6.FORK.fn: typeof fn6);
  (eGen.FORK.fn: typeof g1);

  // $FlowExpectedError: wrong fn
  (e6.FORK.fn: typeof fn1);
}

function joinTest() {
  const task = utils.createMockTask();

  const j = join(task);

  // $FlowExpectedError: This is not an actual Task object
  (j.JOIN.call: Function);
}

function cancelTest() {
  const task = utils.createMockTask();

  const c = cancel(task);

  // $FlowExpectedError: This is not an actual Task object
  (c.CANCEL.call: Function);
}

function raceTest() {
  const e1 = take('FOO');
  const e2 = put({ type: 'BAR' });

  const r = race({
    foo: e1,
    bar: e2,
  });

  // Should recognize the RACE data structure
  (r.RACE.foo: TakeEffect<string>);
  (r.RACE.bar: PutEffect<{ type: string }>);

  // $FlowExpectedError: ReduxEffects have a hidden symbol
  race({ fail: { PUT: 'hi' }});
}

function cancelledTest() {
  const c = cancelled();

  (c.CANCELLED: Object);
}

function selectTest() {
  const s0 = (state: Object): Object => ({});
  const s1 = (state: Object, a: string) => ({});
  const s2 = (state: Object, a: string, b: number) => ({});
  const s3 = (state: Object, a: string, b: number, c: string) => ({});
  const s4 = (state: Object, a: string, b: number, c: string, d: number) => ({});
  const s5 = (state: Object, a: string, b: number, c: string, d: number, e: string) => ({});
  const s6 = (state: Object, a: string, b: number, c: string, d: number, e: string, f: number) => ({});
  const sSpread = (state: Object, ...args: Array<string>): Object => ({});

  const e0 = select(s0);
  const e1 = select(s1, '1');
  const e2 = select(s2, '1', 2);
  const e3 = select(s3, '1', 2, '3');
  const e4 = select(s4, '1', 2, '3', 4);
  const e5 = select(s5, '1', 2, '3', 4, '5');
  const e6 = select(s6, '1', 2, '3', 4, '5', 6);

  // Args test
  (e0.SELECT.args: []);
  (e1.SELECT.args: [string]);
  (e2.SELECT.args: [string, number]);
  (e3.SELECT.args: [string, number, string]);
  (e4.SELECT.args: [string, number, string, number]);
  (e5.SELECT.args: [string, number, string, number, string]);
  (e6.SELECT.args: [string, number, string, number, string, number]);

  // $FlowExpectedError: second args is not a boolean
  (e3.SELECT.args: [string, boolean, string]);

  // Fn check
  (e0.SELECT.selector: typeof s0);
  (e1.SELECT.selector: typeof s1);
  (e2.SELECT.selector: typeof s2);
  (e3.SELECT.selector: typeof s3);
  (e4.SELECT.selector: typeof s4);
  (e5.SELECT.selector: typeof s5);
  (e6.SELECT.selector: typeof s6);

  // $FlowExpectedError: args.a should actually be a string
  (e1.SELECT.selector: (state: Object, a: number) => Object);
}

function takeEveryTest() {
  const getStuff = (state: Object): Object => ({a: ''})

  function* saga0(): Generator<IOEffect, string, string> {
    let foo = yield fork((): Promise<number> => Promise.resolve(1));
    return '';
  }

  function* saga1(a: string): Generator<IOEffect,*,*>  {
    // let foo = yield select(getStuff);
    let foo = yield select(getStuff);
    return '';
  }

  function* faultySaga(a: string): Generator<string,*,*> {
    yield 'test';
  }

  // $FlowExpectedError: yield should be a yield*
  function* faulySagaOfSaga(): Generator<IOEffect,*,*> {
    yield takeEvery('Foo', saga0);
  }

  // This saga should work, since it should yield effects as well
  function* nestedSaga(a: string): Generator<IOEffect,*,*> {
    yield* saga1(a);
  }

  function* sagaOfSaga(): Generator<IOEffect,*,*> {
    yield* takeEvery('Foo', saga0);
  }

  const e0 = takeEvery('FOO', saga0);
  const e1 = takeEvery('FOO', saga1, '1');

  (e0.name: string);

  // $FlowExpectedError: faultySaga yields strings, which is not allowed
  takeEvery('FOO', faultySaga, '1');

  takeEvery('FOO', nestedSaga, '1');
}

function takeLatestTest() {
  const getStuff = (state: Object): Object => ({a: ''})

  function* saga0(): Generator<IOEffect, string, string> {
    let foo = yield fork((): Promise<number> => Promise.resolve(1));
    return '';
  }

  function* saga1(a: string): Generator<IOEffect,*,*>  {
    // let foo = yield select(getStuff);
    let foo = yield select(getStuff);
    return '';
  }

  function* faultySaga(a: string): Generator<string,*,*> {
    yield 'test';
  }

  // $FlowExpectedError: yield should be a yield*
  function* faulySagaOfSaga(): Generator<IOEffect,*,*> {
    yield takeEvery('Foo', saga0);
  }

  // This saga should work, since it should yield effects as well
  function* nestedSaga(a: string): Generator<IOEffect,*,*> {
    yield* saga1(a);
  }

  function* sagaOfSaga(): Generator<IOEffect,*,*> {
    yield* takeLatest('Foo', saga0);
  }

  function* yieldForkSaga(): Generator<IOEffect,*,*> {
    yield fork(takeLatest, 'Foo', saga0);
  }

  const e0 = takeLatest('FOO', saga0);
  const e1 = takeLatest('FOO', saga1, '1');

  (e0.name: string);

  // $FlowExpectedError: faultySaga yields strings, which is not allowed
  takeLatest('FOO', faultySaga, '1');

  takeLatest('FOO', nestedSaga, '1');
}

function runSagaTest() {
  const iter = function* f() {}();

  (runSaga(iter): Task);
  (runSaga(iter, {}): Task);

  const cb = (input) => {};
  const subscribe = (cb) => {
    cb('');
    return () => {}; // unsubscribe fn
  };

  const invalidSubscribe = (cb) => {
    // $FlowExpectedError: cb is a function
    cb + 2;

    // $FlowExpectedError: return needs to be a subscribe fn
    return '';
  }

  // $FlowExpectedError: error level is a string enum
  const invalidLogger = (level: number) => {};


  const dispatch = (output) => {};
  const getState = () => ({});
  const logger = (level) => {};

  // Should be fine
  runSaga(iter, { subscribe });
  runSaga(iter, { dispatch });
  runSaga(iter, { getState });
  runSaga(iter, { sagaMonitor });
  runSaga(iter, { logger });

  // Invalid instantiations
  runSaga(iter, { logger: invalidLogger });
  runSaga(iter, { subscribe: invalidSubscribe });
}

function createSagaMiddlewareTest() {
  const middleware = createSagaMiddleware();

  function* g0(): Generator<*, *, *> {};
  function* g1(a: string): Generator<*, *, *> {};
  function* g2(a: string, b: number): Generator<*, *, *> {};
  function* g3(a: string, b: number, c: string): Generator<*, *, *> {};
  function* g4(a: string, b: number, c: string, d: number): Generator<*, *, *> {};
  function* g5(a: string, b: number, c: string, d: number, e: string): Generator<*, *, *> {};
  function* g6(a: string, b: number, c: string, d: number, e: string, f: number): Generator<*, *, *> {};
  function* gSpread(...args: Array<string>): Generator<*, *, *> {};
  function* gList(): Generator<*, *, *> { yield []; };

  middleware.run(g0);
  middleware.run(g1, '1');
  middleware.run(g2, '1', 2);
  middleware.run(g3, '1', 2, '3');
  middleware.run(g4, '1', 2, '3', 4);
  middleware.run(g5, '1', 2, '3', 4, '5');
  middleware.run(g6, '1', 2, '3', 4, '5', 6);
  middleware.run(gList);

  // $FlowExpectedError: Too few arguments
  middleware.run(g6, '1', 2, '3');

  // $FlowExpectedError: Boolean argument should be string
  middleware.run(g3, true, 2, '3');

  (middleware.run(g0): Task);
}
