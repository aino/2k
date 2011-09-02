/**
 * 2k v 1.0 2011-09-01
 * http://aino.com
 *
 * Copyright (c) 2011, Aino
 * Licensed under the MIT license.
 *
 * --
 *
 * Usage:
 * Event.bind( HTMLElement, type, callback, capture );
 * Event.one( HTMLElement, type, callback, capture );
 * Event.unbind( HTMLElement, type[, callback] );
 * Event.hover( HTMLElement, onMouseOver, onMouseOut );
*/

/*global Event:true */

Event = (function( window ) {

    var document = window.document,

        // the events holder
        events = [],

        // holder for callbacks in IE
        bounds = [],

        // method for retrieveing or iterating through matching event objects
        _get = function(filter, each) {

            var evt, i, j, ret = [];

            main: for ( i=0; events[i]; i++ ) {
                evt = events[i];

                if ( !( 'elem' in evt ) ) {
                    continue;
                }

                for ( j in filter ) {
                    if ( evt[ j ] !== filter[ j ] ) {
                        continue main;
                    }
                }
                if ( typeof each == 'function' ) {
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

        _normalize = function( e ) {

            // normalize preventDefault
            _fix(e, 'preventDefault', function() {
                e.returnValue = false;
                e.defaultPrevented = true;
            });

            _fix(e, 'defaultPrevented', false);

            // normalize stopPropagation & cancelBubble
            var sp = e.stopPropagation;
            e.stopPropagation = function() {
                e.cancelBubble = true;
                if ( sp ) {
                    sp.call(this);
                }
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

            _fix(e, 'bubbles', !(/^(load|unload|focus|blur)$/.test( e.type )) );

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
            for( i=0; args[i]; i++ ) {
                o[ props[i] ] = args[i];
            }
            return o;
        },

        // the generic event handler
        _handler = function( e ) {

            e = _normalize.call( this, e );

            var capture = [],
                bubble = [],
                target = e.target,
                ev, obj, i,
                ceo = document.createEventObject,
                filter = function() {
                    _get({
                        elem: target,
                        type: e.type
                    }, function( i, evt ) {
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

            // do the manual capture/bubble
            if ( bubble.length ) {
                for ( i=0; bubble[i]; i++ ) {

                    obj = bubble[i];

                    // manually create a normalized event object and trigger the bubble
                    if( ceo ) {
                        ev = _normalize.call( obj.elem, ceo( window.event ) );
                    } else {
                        e.currentTarget = obj.elem;
                        ev = e;
                    }
                    obj.callback.call( obj.elem, ev );

                    if( ev.cancelBubble ) {
                        break;
                    }
                }
            }
        },

        _unbind = function( elem, type ) {

            var b, j;

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

            // add the event to the events holder
            events.push( obj );

            // no need to bind one type twice, the handler will take care of multiple events
            if ( exists ) {
                return Event;
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

            return Event;
        },

        // unbind an event, if you leave out the callback, all events for the type will be removed
        // you can also leave out the type, then all events for that element will be removed
        unbind: function() {

            var evt,
                removed = [],
                found = _get( _makeObject( arguments ), function(i, evt) {
                    // removeEventListeners on elements that do not have listeners do not raise errors!
                    _unbind( evt.elem, evt.type );
                    events[ i ] = {};
                });

            return Event;
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
                Event.bind(elem, 'mouseover', function(e) { check( over, e ); });
            }
            if ( out ) {
                Event.bind(elem, 'mouseout', function(e) { check( out, e ); });
            }

            return Event;
        },

        // helper method for binding and unbinding an event
        one: function( elem, type, callback, capture ) {

            var unbind = this.unbind;

            return Event.bind( elem, type, function(e) {
                unbind( elem, type, arguments.callee );
                callback.call( elem, e );
            }, capture);

        },

        // trigger all events bound to a certian type
        // TODO: bubble the trigger events (and capture) + allow preventDefault
        trigger: function( elem, type ) {

            var evt, i,
                fn = function(){};

            _get({
                elem: elem,
                type: type
            }, function( i, evt ) {
                var e = {
                    target: elem,
                    type: type,
                    fake: true
                };
                _handler.call(elem, e);
            });
            return Event;
        }
    };

}( this ));