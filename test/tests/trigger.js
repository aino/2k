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

        var pass = false;

        Event.one(btn, 'click', function(e) {
            assert( 'the BTN click event was executed', !pass);
        });

        Event.one(div, 'click', function(e) {
        });

        Event.one(span, 'click', function(e) {
        }, true);

        Event.trigger(btn, 'click');

    }
});