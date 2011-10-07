/**
 * 2k v 1.3.3 2011-10-07
 * http://aino.com
 *
 * Copyright (c) 2011, Aino
 * Licensed under the MIT license.
 *
 * --
 *
 * Usage:
 * E.bind( HTMLElement, type, callback[, capture] );
 * E.one( HTMLElement, type, callback[, capture] );
 * E.delegate( HTMLElement, type, callback );
 * E.unbind( [HTMLElement][, type][, callback][, capture] );
 * E.trigger( HTMLElement, type );
 *
 * Shorthands:
 * E.click( HTMLElement, callback ); // same as E.bind( HTMLElement, 'click', callback );
 * E.resize( window, callback );
 * E.click( HTMLElement ); // triggers a click event on HTMLElement
 *
 * Element chaining:
 * E( HTMLElement ).click( callback ).mouseover( callback );
*/

/*global E:true */

E = (function( window ) {

    var document = window.document,

        undef,

        types = ('blur focus focusin focusout load ' +
                 'resize scroll unload click dblclick ' +
                 'mousedown mouseup mousemove mouseover mouseout ' +
                 'mouseenter mouseleave change select submit ' +
                 'keydown keypress keyup error wheel ' +
                 'abort').split(' '),

        // match types
        _reg = function( arr ) {
            var t = [],
                i = 0,
                len = arr.length;
            while( i < len ) {
                t.push( types[ arr[ i++ ]-1 ] );
            }
            return new RegExp('^(' + t.join('|') + ')$');
        },

        // collection of types that cancels/bubbles
        cancelable = _reg( [9,11,12,13,14,15,21,22,23] ),
        dontbubble = _reg( [5,8,24,26,6,2,1,16,17] ),

        // mouseenter / leave
        mouseenter = _reg( [15,17] ),
        mouseleave = _reg( [14,16] ),

        // cache ie detection
        ie = ('attachEvent' in document),

        // the events holder
        events = [],

        // holder for callbacks in IE
        bounds = [],

        // delegates holder
        delegates = {},

        // method for retrieveing or iterating through matching event objects
        _get = function(filter, each) {

            filter = filter || {};

            var evt, i, j, ret = [];

            main: for ( i=0; events[i]; i++ ) {
                evt = events[i];

                for ( j in filter ) {
                    if ( evt[ j ] !== filter[ j ] ) {
                        continue main;
                    }
                }
                if ( each ) {
                    each( i, evt );
                }
                ret.push( evt );
            }
            return ret;
        },

        // garbage collector
        collector = window.setInterval(function() {

            var evts = _get(),
                i = 0;

            for (; evts[i]; i++) {
                if ( events[i] && !('elem' in events[i]) ) {
                    events.splice( i, 1 );
                }
            }

        }, 1000),

        // method for finding if an element contains another element
        _contains = function( outer, inner ) {
            if ( outer === inner ) {
                return false;
            }
            while( inner && inner !== outer ) {
                inner = inner.parentNode;
            }
            return inner === outer;
        },

        // a really basic extend method
        _extend = function( obj, extend ) {
            for ( var i in extend ) {
                obj[ i ] = extend[ i ];
            }
            return obj;
        },

        _page = function( e, xy, sc ) {
            var c = 'client'+xy;
            return typeof e[c] == 'number' ? e[c] + document.body['scroll' + sc] : undef;
        },

        _normalize = function( ev ) {

            // save some native methods first
            var pd = function() {
                    try {
                        ev.preventDefault.call(ev);
                    } catch(e) {}
                };

            // now we flatclone the event into a normal object
            // to allow overwrite of read-only attributes
            // we pass some normalized props and let the native ones override if they exist
            var e = _extend({

                CAPTURING_PHASE: 1,
                AT_TARGET: 2,
                BUBBLING_PHASE: 3,

                cancelable: cancelable.test( ev.type ),

                bubbles: !(dontbubble.test( ev.type )),

                defaultPrevented: false,

                isTrusted: true,

                timeStamp: new Date().getTime(),

                target: ( ev.target || ev.srcElement || window ),

                currentTarget: this,

                relatedTarget: (function() {

                    if ( mouseenter.test( ev.type ) ) {
                        return ev.toElement;
                    } else if ( mouseleave.test( ev.type ) ) {
                        return ev.fromElement;
                    }

                    return null;

                }()),

                cancelBubble: false,

                pageX: _page(ev, 'X', 'Left'),
                pageY: _page(ev, 'Y', 'Top')
            }, ev );

            // the methods will not be native, except preventDefault that we previously saved
            // we need full control of the propagations since we do our own bubbling/capturing
            return _extend(e, {

                preventDefault: function() {
                    if ( !e.cancelable ) {
                        return;
                    }
                    e.returnValue = false;
                    e.defaultPrevented = true;
                    pd();
                },
                stopPropagation: function() {
                    e.cancelBubble = true;
                },
                stopImmediatePropagation: function() {
                    e.cancelBubble = true;
                    e._stop = true;
                }
            });

        },

        // shortcut for making an event object out of arguments
        _makeObject = function( args ) {
            var o = {},
                props = 'elem type callback capture scope'.split(' '),
                i;
            for( i=0; i < args.length; i++ ) {
                o[ props[i] ] = args[i];
            }
            return o;
        },

        // the generic event handler
        _handler = function( e ) {

            e = _normalize.call( this, e );

            var capture = [],
                elem = e.currentTarget,
                bubble = [],
                multi = [],
                target = e.target,
                ev, obj, i, phase,
                filter = function() {
                    _get({
                        elem: target,
                        type: e.type
                    }, function( i, evt ) {
                        if ( target === elem ) {
                            multi.push( evt );
                        }
                        if( evt.capture ) {
                            capture.push( evt );
                        } else if ( target === elem || e.bubbles ) {
                            bubble.push( evt );
                        }
                    });
                };

            // loop through events and call callbacks
            // use our own bubble/capture process for consistency
            // we need to manually move up the tree and collect events
            while ( target ) {
                filter();
                target = target.parentNode;
            }

            bubble = capture.reverse().concat( bubble );

            if ( bubble.length ) {

                // do the manual capture/bubble

                for ( i=0; bubble[i]; i++ ) {

                    obj = bubble[i];

                    phase = obj.elem === elem ? 2 :
                        ( obj.capture ? 1 : 3 );

                    // manually create a normalized event object and trigger the bubble
                    ev = _extend(e, {
                        currentTarget: obj.elem,
                        eventPhase: phase
                    });

                    (obj.callback = obj.callback).call( obj.scope, ev );

                    // detect propagation
                    if( ( ev._stop && !obj.capture ) || ( ev.cancelBubble && !multi.length ) ) {
                        break;
                    }

                    // shift raises no error on empty arrays
                    multi.shift();
                }
            }
        },

        // what to do when someone binds to a certian type if it's not supported
        _special = (function(){

            var check = function( e, type, handler, scope ) {
                e = _normalize(e);
                e.bubbles = false;
                var elem = e.currentTarget,
                    related = e.relatedTarget;

                e.type = types[type];

                if ( elem !== related && !_contains( elem, related ) ) {
                    handler.call(scope, e);
                }
            };

            return {
                mouseenter: function( obj ) {
                    E.bind( obj.elem, types[13], function(e) {
                        check( e, 15, obj.callback, obj.scope );
                    });
                },
                mouseleave: function( obj ) {
                    E.bind( obj.elem, types[14], function(e) {
                        check( e, 16, obj.callback, obj.scope );
                    });
                }
            };
        }()),

        // some native triggers
        _nativeTriggers = (function() {

            var fakeTrigger = function( elem, type ) {
                    _get({
                        elem: elem,
                        type: type
                    }, function() {
                        _handler.call(elem, {
                            target: elem,
                            type: type,
                            isTrusted: false
                        });
                    });
                },
                blurfocus = function( elem, type ) {
                    var style = elem.style;
                    if ( style.visibility == 'hidden' || style.display == 'none' ) {
                        fakeTrigger( elem, type );
                        return;
                    }
                    try {
                        elem[ type ]();
                    } catch(e){}
                };

            return {
                focus: function( elem ) {
                    blurfocus( elem, types[1] );
                },
                blur: function( elem ) {
                    blurfocus( elem, types[0]);
                }
            };
        }()),

        _toArray = function(a) {
            return [].slice.call(a);
        },

        _loopTypes = function( types, args, fn ) {
            for ( var i=0; types[ i ]; i++ ) {
                args[ 1 ] = types[ i ];
                E[ fn ].apply( window, args );
            }
        };

        // The main class

        var methods = {

            // make the get method public, mostly for testing
            get: _get,

            // bind an event
            bind: function() {

                var type, exists,
                    args = _toArray(arguments),
                    obj = _makeObject( args ),
                    elem = args[0],
                    types = args[1].split(' '),
                    scope = typeof obj.scope != 'undefined' ? obj.scope : obj.elem,
                    handler = ie ? function(e) { _handler.call( scope, e ); } : _handler;

                if ( types.length > 1 ) {
                    _loopTypes( types, args, 'bind' );
                    return E;
                }

                type = obj.type = types[0];

                // force a scope, if not defined use the element

                obj.scope = scope;

                // force a boolean cast of capture
                obj.capture = !!obj.capture;

                // if duplicated event, return
                if ( _get( obj, false ).length ) {
                    return E;
                }

                exists = _get({
                    elem: elem,
                    type: type
                }, false).length;

                // add the event to the events holder
                events.push( obj );

                // special events, no bubbling or native handling
                if ( type in _special ) {
                    _special[ type ]( obj );
                    return E;
                }

                // no need to bind one type twice, the handler will take care of multiple events
                if ( exists ) {
                    return E;
                }

                if ( ie ) {
                    // save the anonymous handler
                    bounds.push([ elem, type, handler ]);
                    elem.attachEvent('on'+ type, handler);
                } else {
                    elem.addEventListener( type, handler );
                }

                return E;
            },

            delegate: function() {

                var args = _toArray( arguments ),
                    obj = _makeObject( args );

                E.bind(document, obj.type, function(e) {
                    var target = e.target;
                    while( target && target !== obj.elem ) {
                        target = target.parentNode;
                    }
                    if ( target === obj.elem ) {
                        e.currentTarget = target;
                        obj.callback.call( target, e );
                    }
                });
            },

            // unbind event(s). Takes 0-4 arguments.
            unbind: function() {

                var args = _toArray( arguments ),
                    evt, b, j, elem, type,
                    types = args[1] ? args[1].split(' ') : [];

                if ( types.length > 1 ) {
                    _loopTypes( types, args, 'unbind' );
                    return E;
                }

                _get( _makeObject( args ), function(i, evt) {

                        // removing listeners on elements that don't have listeners do not raise errors!

                        elem = evt.elem;
                        type = evt.type;

                        if ( !elem || !type ) {
                            return;
                        }

                        if ( ie ) {
                            for( j=0; bounds[j]; j++ ) {
                                b = bounds[j];
                                if ( b[0] === elem && b[1] == type ) {
                                    elem.detachEvent( 'on'+type, b[2] );
                                    bounds.splice( j, 1 );
                                    break;
                                }
                            }
                        } else {
                            elem.removeEventListener( type, _handler );
                        }

                        // remove the event
                        events[ i ] = {};
                    });

                return E;
            },

            // helper method for binding and unbinding an event
            one: function() {

                var args = _toArray( arguments ),
                    cb = args[2];

                args[2] = function(e) {
                    E.unbind( e.currentTarget, e.type, arguments.callee );
                    cb(e);
                };

                return E.bind.apply( E, args );

            },

            // trigger all events bound to a certian type
            trigger: function( elem, type, e, scope ) {

                var evt, i,
                    fn = function(){};

                if ( type in _nativeTriggers ) {
                    _nativeTriggers[ type ]( elem );
                    return;
                }

                _handler.call(elem, _extend({
                    target: elem,
                    type: type,
                    isTrusted: false
                }, e));

                return E;
            }
        };

    // some shortcuts jQuery style
    (function() {

        var args, i,
            define = function(type) {
                return function() {
                    args = _toArray( arguments );
                    args.splice(1, 0, type);
                    return methods[ typeof args[2] == 'function' ? 'bind' : 'trigger' ].apply( window, args );
                };
            };

        for ( i=0; types[ i ]; i++ ) {
            methods[ types[ i ] ] = define( types[ i ] );
        }

    }());

    // create the element chain to allow E(elem).bind('click', callback) or E(elem).click(callback)
    return (function() {

        var _init = function( elem ) {
                this.elem = elem;
            },
            args, fn,
            init = function( elem ) {
                return new _init( elem );
            },
            ext = function(fn) {
                return function() {
                    methods[ fn ].apply( window, [ this.elem ].concat( _toArray( arguments ) ) );
                    return this;
                };
            };


        for ( fn in methods ) {
            init[ fn ] = methods[ fn ];
            _init.prototype[ fn ] = ext( fn );
        }

        return init;

    }());

}( this ));