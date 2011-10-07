Test.add({
    name: 'One',
    async: true,
    test: function() {

        var btn = document.createElement('button');
        btn.style.display = 'none';

        append(btn);

        var triggers = 0;

        E(btn).one('click', function() {
            triggers++;
        });

        E(btn).click().click();

        assert( 'one passed', triggers == 1 );
        end();

    },

    teardown: function() {
        E.unbind();
    }
});