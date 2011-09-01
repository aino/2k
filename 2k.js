/**
 * @preserve 2k v 1.0 2011-09-01
 * http://galleria.aino.se
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

        normalize = function( e ) {

            // normalize preventDefault
            e.preventDefault = e.preventDefault || function() {
                e.returnValue = false;
            };

            // normalize stopPropagation
            e.stopPropagation = e.stopPropagation || function() {
                e.cancelBubble = true;
            };

            // e.target is (almost) always e.srcElement
            e.target = e.target || e.srcElement || window;

            // we can refer currentTarget as this, since we use a special callback for IE
            e.currentTarget = e.currentTarget || this;

            // normalize relatedTarget
            e.relatedTarget = e.relatedTarget || (function() {

                if (/^(mouseout|mouseleave)$/.test( e.type )) {
                    return e.toElement;
                } else if (/^(mouseover|mouseenter)$/.test( e.type )) {
                    return e.fromElement;
                }

            }());

            // normalize keyCode
            e.keyCode = e.keyCode || e.which;

            // normalize pageX and pageY
            e.pageX = e.pageX || e.clientX + document.body.scrollLeft;
            e.pageY = e.pageY || e.clientY + document.body.scrollTop;

            return e;

        },

        // the generic event handler
        handler = function( e ) {

            e = normalize.call( this, e );

            // loop through events and call callbacks
            get( e.currentTarget, e.type, false, function( i, evt ) {

                // for IE, we need to create a custom bubble to add capturing functionality
                // we should only do this if there is a capturing event above the target
                if ( !('bubbles' in e) ) { // detect IE < 9
                    var capture = [],
                        normal = [],
                        target = e.target,
                        ev, obj,
                        filter = function() {
                            get( target, e.type, false, function( i, evt ) {
                                (evt.capture ? capture : normal).push( evt );
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

                    // do the manual bubble if captures are found
                    if ( capture.length ) {

                        // merge the arrays in the capturing order
                        capture = capture.reverse().concat( normal );

                        for ( i=0; capture[i]; i++ ) {
                            obj = capture[i];
                            // manually create a normalized event object and trigger the bubble without propagation
                            ev = normalize.call( obj.elem, window.event );
                            ev.cancelBubble = true;
                            obj.callback.call( obj.elem, ev );
                        }
                    } else {
                        evt.callback.call( e.currentTarget, e );
                    }
                } else {

                    // we can let modern browsers take care of bubbling themselves
                    evt.callback.call( e.currentTarget, e );
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
                bounds.push([ elem, type, function() {
                    handler.call( elem, window.event );
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