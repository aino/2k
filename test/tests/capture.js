Test.add({
    name: 'Capture & bubble event',
    async: true,
    test: function() {

        var btn = document.createElement('input');
        btn.type = 'button';
        btn.value = 'Click to pass test';
        var span = document.createElement('span');
        span.appendChild(btn);
        var div = document.createElement('div');
        div.appendChild(span);

        append(div);

        var triggers = 0;

        Event.bind(btn, 'click', function(e) {
            triggers++;
            assert( 'the BTN click event was executed third', triggers == 3);
        });

        Event.bind(div, 'click', function(e) {
            triggers++;
            assert( 'the DIV click event was captured and executed first', triggers == 1);
        }, true);

        Event.bind(span, 'click', function(e) {
            triggers++;
            assert( 'the SPAN click event was captured and executed second', triggers == 2);
        }, true);

        Event.bind(document.body, 'click', function(e) {
            triggers++;
            assert( 'the BODY click event was bubbled and executed fourth', triggers == 4);
        });

        Event.bind(document, 'click', function() {
            triggers++;
            assert( 'the DOCUMENT click event was bubbled and executed last', triggers == 5);

            end();
        });

    },

    teardown: function() {
        Event.unbind();
    }
});