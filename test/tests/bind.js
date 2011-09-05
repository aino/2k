Test.add({
    name: 'Bind event',
    async: true,
    test: function() {

        var btn = document.createElement('input');
        btn.type = 'button';
        btn.style.display = 'none';

        append(btn);

        var triggered = 0, m = 0;

        var fn = function(e) {

            triggered++;

            assert('Callback called once since same event was bound twice', triggered == 1);
            assert( 'e.currentTarget OK', e.currentTarget === btn );
            assert( 'e.target OK', e.target === btn );
            assert( 'e.preventDefault OK', typeof e.preventDefault == 'function' );
            assert( 'e.stopPropagation OK', typeof e.stopPropagation == 'function' );
            assert( 'e.relatedTarget OK', e.relatedTarget === null );
            assert( 'e.which OK', e.which === undefined );
            assert( 'e.pageX OK', e.pageX > 100 && e.pageX < 250 );
            assert( 'e.pageY OK', e.pageY > 50 && e.pageY < 80 );
            assert( 'e.bubbles OK', e.bubbles === true );
            assert( 'e.defaultPrevented OK', e.defaultPrevented === false );
            assert( 'e.cancelBubble OK', e.cancelBubble === false );
            assert( 'e.eventPhase OK', e.eventPhase === 2);
            assert( 'e.isTrusted OK', e.isTrusted === false);
            assert( 'e.cancelable OK', e.cancelable === true);
            assert( 'e.CAPTURING_PHASE OK', e.CAPTURING_PHASE === 1);
            assert( 'e.AT_TARGET OK',  e.AT_TARGET === 2);
            assert( 'e.BUBBLING_PHASE OK',  e.BUBBLING_PHASE === 3);
            end();
        }

        E.click(btn, fn);

        // should not fire
        E.bind(btn, 'click', fn);

        // test multiple events
        E.bind(btn,'mousedown mouseup', function(e){
            if ( e.type == 'mousedown' ) {
                m++;
            } else {
                assert('Multiple event types bound and executed', m === 1 && e.type === 'mouseup');
            }
        });

        E.click(btn, {
            pageX: 120,
            pageY: 70
        });

    },

    teardown: function() {
        E.unbind();
    }
});