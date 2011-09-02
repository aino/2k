Test.add({
    name: 'Unbind events',
    async: true,
    test: function() {

        var btn = document.createElement('input');
        btn.type = 'button';
        btn.value = 'Click to pass test';

        append(btn);

        var triggers = 0;

        var c1 = function() {
            assert( 'A BTN click event was executed');
        }

        var c2 = function() {
            assert( 'Another the BTN click event was executed');
            end();
        }

        Event.bind(btn, 'click', c1);
        Event.bind(btn, 'click', c2);

    },

    teardown: function() {
        Event.unbind();
    }
});