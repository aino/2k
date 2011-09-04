/**
 * 2k v 1.1 2011-09-03
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
 * E.unbind( [HTMLElement][, type][, callback][, capture] );
 * E.trigger( HTMLElement, type );
 * E.hover( HTMLElement, onMouseOver, onMouseOut );
 *
 * Shorthands:
 * E.click( HTMLElement, callback ); // same as E.bind( HTMLElement, 'click', callback );
 * E.resize( window, callback );
 * E.click( HTMLElement ); // triggers a click event on HTMLElement
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

        // method for finding if an element contains another element
        _contains = function( outer, inner ) {
            if ( inner && outer && inner !== outer ) {
                while( inner && inner !== document.body && inner !== outer ) {
                    inner = inner.parentNode;
                }
                if ( inner === outer ) {
                    return true;
                }
            }
            return false;
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
                    ev.preventDefault.call(ev);
                };

            // now we flatclone the event into a normal object
            // to allow overwrite of read-only attributes
            // we pass some normalized props and let the native ones override if they exist
            var e = _extend({

                CAPTURING_PHASE: 1,
                AT_TARGET: 2,
                BUBBLING_PHASE: 3,

                cancelable: _reg( cancelable ).test( ev.type ),

                bubbles: !_reg( dontbubble ).test( ev.type ),

                defaultPrevented: false,

                isTrusted: true,

                timeStamp: new Date().getTime(),

                target: ( ev.target || ev.srcElement || window ),

                currentTarget: this,

                relatedTarget: (function() {

                    if ( mouseenter.test( ev.type ) ) {
                        return e.toElement;
                    } else if ( mouseleave.test( ev.type ) ) {
                        return e.fromElement;
                    }

                    return null;

                }()),

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
                props = 'elem type callback capture'.split(' '),
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
                    ev = _extend(e, { currentTarget: obj.elem });

                    // force event phase
                    ev.eventPhase = phase;

                    (obj.callback = obj.callback).call( obj.elem, ev );

                    // detect propagation
                    if( ( ev._stop && !obj.capture ) || ( ev.cancelBubble && !multi.length ) ) {
                        break;
                    }

                    // shift raises no error on empty arrays
                    multi.shift();
                }
            }
        },

        _toArray = function(a) {
            return [].slice.call(a);
        },

        // The main class

        E = {

            // make the get method public, mostly for testing
            get: _get,

            // bind an event
            bind: function() {

                var args = arguments,
                    obj = _makeObject( args ),
                    elem = args[0],
                    type = args[1],
                    handler = ie ? function(e) { _handler.call( elem, e ); } : _handler,
                    exists = _get({
                        elem: elem,
                        type: type
                    }, false).length;

                // force a boolean cast of capture
                obj.capture = !!obj.capture;

                // if duplicated event, return
                if ( _get( obj, false ).length ) {
                    return E;
                }

                // add the event to the events holder
                events.push( obj );

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

            // unbind event(s). Takes 0-4 arguments.
            unbind: function() {

                var evt, b, j, elem, type,
                    removed = [],
                    found = _get( _makeObject( arguments ), function(i, evt) {

                        // removeEListeners on elements that don't have listeners do not raise errors!

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

            // helper method for mouseover without child elements triggering mouseout
            hover: function( elem, over, out ) {
                var check = function(fn, e, elem) {
                    if( e.relatedTarget !== elem &&
                        !_contains( e.target, elem ) ) {
                        fn.call( elem, e );
                    }
                };
                if ( over ) {
                    E.bind(elem, types[14], function(e) { check( over, e, elem ); });
                }
                if ( out ) {
                    E.bind(elem, types[15], function(e) { check( out, e, elem ); });
                }

                return E;
            },

            // helper method for binding and unbinding an event
            one: function( elem, type, callback, capture ) {

                var unbind = this.unbind;

                return E.bind( elem, type, function(e) {
                    unbind( elem, type, arguments.callee );
                    callback.call( elem, e );
                }, capture);

            },

            // trigger all events bound to a certian type
            trigger: function( elem, type, e ) {

                var evt, i,
                    fn = function(){};

                _get({
                    elem: elem,
                    type: type
                }, function() {
                    _handler.call(elem, _extend({
                        target: elem,
                        type: type,
                        isTrusted: false
                    }, e));
                });
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
                    return E[ typeof args[2] == 'function' ? 'bind' : 'trigger' ].apply( window, args );
                };
            };

        for ( i=0; types[ i ]; i++ ) {
            E[ types[ i ] ] = define( types[ i ] );
        }

    }());

    // return the singleton class
    return E;

}( this ));