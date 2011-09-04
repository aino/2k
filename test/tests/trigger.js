Test.add({
    name: 'Trigger event, bubbling and capturing',
    async: true,
    test: function() {

        var btn = document.createElement('button');
        btn.style.display = 'none';

        var span = document.createElement('span');
        span.appendChild( btn );

        var div = document.createElement('div');
        div.appendChild( span );

        append(div);

        var triggers = 0;

        E.one(btn, 'click', function(e) {
            triggers++;
            assert( 'the BTN click event was triggered and executed second', triggers == 2 && e.currentTarget === e.target);
        });

        E.one(div, 'click', function(e) {
            triggers++;
            assert( 'the DIV click event was bubbled and executed last', triggers == 3 && e._extras === true);
        });

        E.one(span, 'click', function(e) {
            triggers++;
            assert( 'the SPAN click event was captured and executed first', triggers === 1 && e.currentTarget === span && e.target === btn);
        }, true);

        E.click(btn, {
            _extras: true
        });

    },
    teardown: function() {
        E.unbind();
    }
});