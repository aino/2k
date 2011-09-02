Test.add({
    name: 'Bind event',
    async: true,
    test: function() {

        var btn = document.createElement('input');
        btn.type = 'button';
        btn.value = 'Click to pass test';

        append(btn);

        Event.bind(btn, 'click', function(e) {

            assert( 'e.currentTarget OK', e.currentTarget === btn );
            assert( 'e.target OK', e.target === btn );
            assert( 'e.preventDefault OK', typeof e.preventDefault == 'function' );
            assert( 'e.stopPropagation OK', typeof e.stopPropagation == 'function' );
            assert( 'e.relatedTarget OK', e.relatedTarget === null );
            assert( 'e.which OK', e.which === 1 );
            assert( 'e.pageX OK', e.pageX > 100 && e.pageX < 200 );
            assert( 'e.pageY OK', e.pageY > 60 && e.pageY < 80 );
            assert( 'e.bubbles OK', e.bubbles === true );
            assert( 'e.defaultPrevented OK', e.defaultPrevented === false );
            assert( 'e.cancelBubble OK', e.cancelBubble === false );

            end();

        });

    },

    teardown: function() {
        Event.unbind();
    }
});