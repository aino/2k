Test.add({
    name: 'event.stopImmediatePropagation',
    async: true,
    test: function() {

        var btn = document.createElement('input');
        btn.type = 'button';
        btn.style.display = 'none';

        var div = document.createElement('div');
        div.appendChild(btn);

        append(div);

        var triggered = 0;

        E.bind(btn, 'click', function(e) {
            e.stopImmediatePropagation();
        });

        E.bind(btn, 'click', function(e) {
            assert('This method should not execute (same element)', false);
        });

        E.bind(document, 'click', function(e) {
            assert('This method should execute (captured)', true);
            end();
        }, true);


        E.bind(div, 'click', function(e) {
            assert('This method should not execute', false);
        });

        E.click(btn);

    },

    teardown: function() {
        E.unbind();
    }
});