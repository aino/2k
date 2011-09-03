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

        rcancelable = /^(click|keydown|keypress|keyup|mousedown|mousemove|mouseout|mouseover|mouseup|wheel|textinput)$/,
        rdontbubble = /^(load|unload|error|abort|resize|focus|blur|mouseenter|mouseleave)$/,

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

        _fix = function( obj, prop, replace ) {
            if ( !( prop in obj ) || typeof obj[prop] == 'undefined' ) {
                obj[ prop ] = replace;
            }
        },

        _normalize = function( ev ) {

            // save some native methods first
            var pd = function() {
                ev.preventDefault.call(ev);
            };

            // now we flatclone the event into a normal object
            // to allow overwrite of read-only attributes
            var e = {};
            for ( var i in ev ) {
                e[i] = ev[i];
            }
            e.constructor = ev.constructor;

            // phase constants
            _fix(e, 'CAPTURING_PHASE', 1);
            _fix(e, 'AT_TARGET', 2);
            _fix(e, 'BUBBLING_PHASE', 3);

            // normalize cancelable
            _fix(e, 'cancelable', (rcancelable.test( e.type )) );

            // normalize bubbles
            _fix(e, 'bubbles', !(rdontbubble.test( e.type )) );

            // normalize preventDefault
            e.preventDefault = function() {
                if ( !e.cancelable ) {
                    return;
                }
                e.returnValue = false;
                e.defaultPrevented = true;
                pd();
            };

            _fix(e, 'defaultPrevented', false);

            // trusted ( Level 3 )
            _fix( e, 'isTrusted', true );

            // normalize stopPropagation & cancelBubble
            e.stopPropagation = function() {
                e.cancelBubble = true;
            };

            e.stopImmediatePropagation = function() {
                e.cancelBubble = true;
                e._stop = true;
            };

            // e.target is (almost) always e.srcElement
            _fix(e, 'target', ( e.srcElement || window ));

            // we can refer currentTarget as this, since we use a special callback for IE
            _fix(e, 'currentTarget', this);

            // normalize relatedTarget
            _fix(e, 'relatedTarget', (function() {

                if (/^(mouseout|mouseleave)$/.test( e.type )) {
                    return e.toElement;
                } else if (/^(mouseover|mouseenter)$/.test( e.type )) {
                    return e.fromElement;
                }

                return null;

            }()));

            // normalize which
            e.which = e.which || e.charCode || e.keyCode;

            // normalize pageX and pageY
            _fix(e, 'pageX', e.clientX + document.body.scrollLeft);
            _fix(e, 'pageY', e.clientY + document.body.scrollTop);

            return e;

        },

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
                ceo = document.createEObject,
                filter = function() {
                    _get({
                        elem: target,
                        type: e.type
                    }, function( i, evt ) {
                        if ( target === e.currentTarget ) {
                            multi.push( evt );
                        }
                        if( evt.capture ) {
                            capture.push( evt );
                        } else if ( e.bubbles ) {
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
                    if( ceo ) {
                        ev = _normalize.call( obj.elem, ceo( window.event ) );
                    } else {
                        e.currentTarget = obj.elem;
                        ev = e;
                    }

                    // force event phase
                    ev.eventPhase = phase;

                    obj.callback.call( obj.elem, ev );

                    // detect propagation
                    if( ev._stop && !obj.capture ) {
                        break;
                    } else if ( ev.cancelBubble ) {
                        if ( multi.length > 1 ) {
                            multi.shift();
                        } else {
                            break;
                        }
                    }
                }
            }
        },

        _unbind = function( elem, type ) {

            var b, j;

            if ( !elem || !type ) {
                return;
            }

            if ( elem.removeEventListener ) {

                elem.removeEventListener( type, _handler );

            } else if( elem.detachEvent ) {

                // retrieve the scoped callback
                for( j=0; bounds[j]; j++ ) {
                    b = bounds[j];
                    if ( b[0] === elem && b[1] == type ) {
                        elem.detachEvent('on' + type, b[2] );
                        bounds.splice( j, 1 );
                        break;
                    }
                }
            }
        };

    return {

        // make the get method public, mostly for testing
        get: _get,

        // bind an event
        bind: function() {

            var args = arguments,
                obj = _makeObject( args ),
                elem = args[0],
                type = args[1],
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

            if( elem.addEventListener ) {

                // the standards way
                elem.addEventListener( type, _handler );

            } else if( elem.attachEvent ) {

                // save the scoped callback in bounds for IE, brings currentTarget to the handler
                bounds.push([ elem, type, function(e) {
                    _handler.call( elem, e );
                }]);

                // the MS way
                elem.attachEvent('on' + type, bounds[bounds.length-1][2] );
            }

            return E;
        },

        // unbind an event, if you leave out the callback, all events for the type will be removed
        // you can also leave out the type, then all events for that element will be removed
        unbind: function() {

            var evt,
                removed = [],
                found = _get( _makeObject( arguments ), function(i, evt) {
                    // removeEListeners on elements that don't have listeners do not raise errors!
                    _unbind( evt.elem, evt.type );
                    events[ i ] = {};
                });

            return E;
        },

        // helper method for mouseover without child elements triggering mouseout
        hover: function( elem, over, out ) {
            var check = function(fn, e) {
                if( e.relatedTarget !== e.currentTarget &&
                    !_contains( e.target, e.relatedTarget ) ) {
                    fn.call( e.currentTarget, e );
                }
            };
            if ( over ) {
                E.bind(elem, 'mouseover', function(e) { check( over, e ); });
            }
            if ( out ) {
                E.bind(elem, 'mouseout', function(e) { check( out, e ); });
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
        trigger: function( elem, type ) {

            var evt, i,
                fn = function(){};

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
            return E;
        }
    };

}( this ));

// some shortcuts jQuery style

(function( window ) {
    var a = 'blur focus focusin focusout load resize scroll unload click dblclick ' +
            'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
            'change select submit keydown keypress keyup error', i, args,
        define = function(type) {
            return function() {
                args = Array.prototype.slice.call( arguments );
                args.splice(1, 0, type);
                E[ args.length === 2 ? 'trigger' : 'bind' ].apply( window, args );
            };
        };
    a = a.split(' ');

    for ( i=0; a[i]; i++ ) {
        E[a[i]] = define( a[i] );
    }

}(this));