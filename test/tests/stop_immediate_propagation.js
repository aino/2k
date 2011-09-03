Test.add({
    name: 'event.stopImmediatePropagation',
    async: true,
    test: function() {

        var btn = document.createElement('input');
        btn.type = 'button';
        btn.value = 'Click to pass test';

        var div = document.createElement('div');
        div.appendChild(btn);

        append(div);

        var triggered = 0;

        E.bind(btn, 'click', function(e) {
            e.stopImmediatePropagation();
        });

        E.bind(btn, 'click', function(e) {
            assert('This method should not execute', false);
        });

        E.bind(document, 'click', function(e) {
            assert('This method should execute (captured)', true);
            end();
        }, true);


        E.bind(div, 'click', function(e) {
            assert('This method should not execute', false);
        });

    },

    teardown: function() {
        E.unbind();
    }
});