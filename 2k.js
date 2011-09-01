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
        get = function(elem, type, callback, each) {

            var evt, i, ret = [];

            for ( i=0; events[i]; i++ ) {
                evt = events[i];
                if ( ( elem && evt.elem !== elem ) ||
                     ( type && evt.type !== type )  ||
                     ( callback && evt.callback !== callback ) ) { continue; }
                if ( typeof each == 'function' ) {
                    each( i, evt );
                }
                ret.push( evt );
            }
            return ret;
        },

        // method for finding if an element contains another element
        contains = function( outer, inner ) {
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

        oFix = function( obj, prop, replace ) {
            if ( !( prop in obj ) || typeof obj[prop] == 'undefined' ) {
                obj[ prop ] = replace;
            }
        },

        normalize = function( e ) {

            // normalize preventDefault
            oFix(e, 'preventDefault', function() {
                e.returnValue = false;
            });

            // normalize stopPropagation
            oFix(e, 'stopPropagation', function() {
                e.cancelBubble = true;
            });

            // e.target is (almost) always e.srcElement
            oFix(e, 'target', ( e.srcElement || window ));

            // we can refer currentTarget as this, since we use a special callback for IE
            oFix(e, 'currentTarget', this);

            // normalize relatedTarget
            oFix(e, 'relatedTarget', (function() {

                if (/^(mouseout|mouseleave)$/.test( e.type )) {
                    return e.toElement;
                } else if (/^(mouseover|mouseenter)$/.test( e.type )) {
                    return e.fromElement;
                }

            }()));

            // normalize keyCode
            oFix(e, 'keyCode', e.which);

            // normalize pageX and pageY
            oFix(e, 'pageX', e.clientX + document.body.scrollLeft);
            oFix(e, 'pageY', e.clientY + document.body.scrollTop);

            return e;

        },

        nobubble = /^(load|unload|focus|blur)$/,

        // the generic event handler
        handler = function( e ) {

            e = normalize.call( this, e );

            var elem = e.currentTarget;

            // loop through events and call callbacks
            get( elem, e.type, false, function( i, evt ) {

                // for IE, we need to create a custom bubble to add capturing functionality
                // TODO: allow stopPropagation in the bubble
                if ( !('bubbles' in e) ) { // detect IE < 9
                    var capture = [],
                        bubble = [],
                        target = e.target,
                        ev, obj,
                        filter = function() {
                            get( target, e.type, false, function( i, evt ) {
                                if( evt.capture ) {
                                    capture.push( evt );
                                } else if ( !( nobubble.test( e.type ) ) ) {
                                    bubble.push( evt );
                                }
                            });
                        };

                    // we need to manually move up the tree and collect events
                    while ( target ) {
                        filter();
                        if ( target == document ) {
                            target = window;
                            filter();
                            break;
                        } else {
                            target = target.parentNode;
                        }
                    }

                    bubble = capture.reverse().concat(bubble);

                    // do the manual capture/bubble
                    if ( bubble.length ) {
                        for ( i=0; bubble[i]; i++ ) {

                            obj = bubble[i];

                            // manually create a normalized event object and trigger the bubble without propagation
                            ev = normalize.call( obj.elem, document.createEventObject( window.event ) );
                            ev.cancelBubble = true;

                            obj.callback.call( obj.elem, ev );
                        }
                    }
                } else {
                    // we can let modern browsers take care of bubbling themselves
                    evt.callback.call( elem, e );
                }
            });
        };

    return {

        // make the get method public, mostly for testing
        get: get,

        // bind an event
        bind: function( elem, type, callback, capture ) {

            // check if we need to add an event listener
            var exists = !!get( elem, type, false, false ).length;

            // add the event to the events holder
            events.push({
                elem: elem,
                type: type,
                callback: callback,
                capture: !!capture
            });

            // no need to bind one type twwice, the handler will take care of multiple events
            if ( exists ) {
                return Event;
            }

            if( elem.addEventListener ) {

                // the standards way
                elem.addEventListener( type, handler, !!capture );

            } else if( elem.attachEvent ) {

                // save the scoped callback in bounds for IE, brings currentTarget to the handler
                bounds.push([ elem, type, function(e) {
                    handler.call( elem, e );
                }]);

                // the MS way
                elem.attachEvent('on' + type, bounds[bounds.length-1][2] );
            }

            return Event;
        },

        // unbind an event, if you leave out the callback, all events for the type will be removed
        unbind: function( elem, type, callback ) {

            var evt, i, j, b,
                removed = 0,
                matched = get( elem, type, callback, function( i, evt ) {
                    events[i] = {};
                    removed++;
                });

            if ( !removed ) {
                return Event;
            }

            if ( removed == matched.length ) {

                if ( elem.removeEventListener ) {
                    elem.removeEventListener( type, handler );
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
            }

            return Event;
        },

        // helper method for mouseover without child elements triggering mouseout
        hover: function( elem, over, out ) {
            var check = function(fn, e) {
                if( e.relatedTarget !== e.currentTarget &&
                    !contains( e.target, e.relatedTarget ) ) {
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

            get( elem, type, false, function( i, evt ) {
                evt.callback.call(elem, {
                    preventDefault: fn,
                    target: elem,
                    currentTarget: elem,
                    type: type,
                    stopPropagation: fn
                });
            });
            return Event;
        }
    };

}( this ));