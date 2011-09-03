Test.add({
    name: 'Unbind events',
    async: true,
    test: function() {

        var btn = document.createElement('input');
        btn.type = 'button';
        btn.style.display = 'none';

        append(btn);

        var triggers = 0;

        var empty = function() {
            var cleared = true;
            E.get({}, function(i, el) {
                if ( el.elem ) {
                    cleared = false;
                }
            });
            return cleared
        }

        var c1  = function(e) {
            assert('Callback should not fire', false);
        }

        var c2trigger = 0;
        var c2 = function(e) {
            c2trigger++;
            assert('Callback called only once', c2trigger == 1);
        }

        log('test unbind with all arguments');
        E.bind(btn, 'click', c1, true);
        E.unbind(btn, 'click', c1, true);
        E.trigger(btn, 'click');

        assert('Event unbinded with 4 arguments', empty());

        log('test unbinding one of two events');
        E.bind(btn, 'click', c2, true);
        E.bind(btn, 'click', c2)

        E.unbind(btn, 'click', c2, true);
        E.trigger(btn, 'click');
        E.unbind(btn, 'click', c2);
        E.trigger(btn, 'click');

        assert('Events unbinded with 3 arguments', empty());

        log('test unbinding many events with one type');
        E.bind(btn, 'click', c1, true);
        E.bind(btn, 'click', c1);
        E.bind(btn, 'click', function(e) {
            assert('Callback should not fire', false);
        });
        E.unbind(btn, 'click');
        E.trigger(btn, 'click');

        assert('Events unbinded with 2 arguments', empty());

        log('test unbinding many events with one element');
        E.bind(btn, 'click', c1, true);
        E.bind(btn, 'click', c1);
        E.bind(btn, 'click', function(e) {
            assert('Callback should not fire', false);
        });
        E.bind(btn, 'mouseover', function(e) {
            assert('Callback should not fire', false);
        });
        E.unbind(btn);
        E.trigger(btn, 'click');
        E.trigger(btn, 'mouseover');

        assert('Events unbinded with 1 argument', empty());

        log('test unbinding all events');
        E.bind(btn, 'click', c1, true);
        E.bind(btn, 'click', c1);
        E.bind(btn, 'click', function(e) {
            assert('Callback should not fire', false);
        });
        E.bind(btn, 'mouseover', c1);
        E.bind(document, 'click', c1);

        E.unbind();

        E.trigger(btn, 'click');
        E.trigger(btn, 'mouseover');
        E.trigger(document, 'click');

        assert('All events unbinded', empty());

        end();

    },

    teardown: function() {
        E.unbind();
    }
});