Test.add({
    name: 'Focus, blur',
    async: true,
    open: true,
    test: function() {

        var input = document.createElement('input');

        append(input);

        var triggers = 0;

        E(input).focus(function(e) {
            triggers++
        }).focus().blur(function() {
            assert('Focus and blur passed', triggers === 1);
            end();
        });

        window.setTimeout(function() {
            E(input).blur();
        },10);

    },
    teardown: function() {
        E.unbind();
    }
});