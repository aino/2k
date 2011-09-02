Test.add({
    name: 'Trigger event, bubbling and capturing',
    async: true,
    test: function() {

        var btn = document.createElement('input');
        btn.type = 'button';
        btn.value = 'Click to pass test';
        btn.style.display = 'none';
        var span = document.createElement('span');
        span.appendChild(btn);
        var div = document.createElement('div');
        div.appendChild(span);

        append(div);

        var triggers = 0;

        Event.one(btn, 'click', function(e) {
            triggers++;
            assert( 'the BTN click event was triggered and executed second', triggers == 2);
        });

        Event.one(div, 'click', function(e) {
            triggers++;
            assert( 'the DIV click event was bubbled and executed last', triggers == 3);
            end();
        });

        Event.one(span, 'click', function(e) {
            triggers++;
            assert( 'the SPAN click event was captured and executed first', triggers === 1);
        }, true);

        Event.trigger(btn, 'click');

    },
    teardown: function() {
        Event.unbind();
    }
});