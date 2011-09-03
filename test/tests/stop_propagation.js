Test.add({
    name: 'event.stopPropagation',
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
            e.stopPropagation();
        });

        E.bind(btn, 'click', function(e) {
            assert('This method should execute', true);
            end();
        });

        E.bind(document, 'click', function(e) {
            assert('This method should execute first', true);
        }, true);

        E.bind(div, 'click', function(e) {
            assert('This method should not execute', false);
        });

    },

    teardown: function() {
        E.unbind();
    }
});