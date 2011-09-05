Test.add({
    name: 'Capture & bubble event',
    test: function() {

        var btn = document.createElement('input');
        btn.type = 'button';
        btn.value = 'Click to pass test';
        var span = document.createElement('span');
        span.appendChild(btn);
        var div = document.createElement('div');
        div.appendChild(span);

        append(div);

        var pass = false;

        Event.bind(btn, 'click', function(e) {
            e.preventDefault();
            assert( 'the BTN click event was executed third', pass);
        });

        Event.bind(div, 'click', function(e) {
            assert( 'the DIV click event was captured and executed first', !pass);
            pass = true;
        }, true);

        Event.bind(span, 'click', function(e) {
            assert( 'the SPAN click event was captured and executed second', pass);
        }, true);

        Event.bind(document, 'click', function() {
            assert( 'the DOCUMENT click event was bubbled and executed last', pass);
            end();
        });

    }
});