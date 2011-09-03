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

        E.bind(btn, 'click', function(e) {
            triggers++;
            assert( 'the BTN click event was executed third', triggers == 3 && e.eventPhase == 2);
        });

        E.bind(div, 'click', function(e) {
            triggers++;
            assert( 'the DIV click event was captured and executed first', triggers == 1 && e.eventPhase == 1);
        }, true);

        E.bind(span, 'click', function(e) {
            triggers++;
            assert( 'the SPAN click event was captured and executed second', triggers == 2 && e.eventPhase == 1);
        }, true);

        E.bind(document.body, 'click', function(e) {
            triggers++;
            assert( 'the BODY click event was bubbled and executed fourth', triggers == 4 && e.eventPhase == 3);
        });

        E.bind(document, 'click', function(e) {
            triggers++;
            assert( 'the DOCUMENT click event was bubbled and executed last', triggers == 5 && e.eventPhase == 3);
            end();
        });

    },

    teardown: function() {
        E.unbind();
    }
});