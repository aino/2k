Test.add({
    name: 'Delegate',
    async: true,
    test: function() {

        var btn = document.createElement('button');
        btn.innerHTML = '•';
        //btn.style.display = 'none';

        var span = document.createElement('span');
        span.appendChild( btn );

        var div = document.createElement('div');
        div.appendChild( span );

        append(div);

        var triggers = 0;

        E.delegate( btn, 'click', function(e) {
            if ( e.currentTarget === btn ) {
                triggers++;
            }
        });

        E.delegate( btn, 'click', function(e) {
            var a;
            if ( e.currentTarget === btn ) {
                triggers++;
            }
        });

        E.delegate( span, 'click', function(e) {
            if ( e.currentTarget == span ) {
                triggers++;
            }
            assert('Delegate click test passed', triggers == 3)
            end();
        }, true);

        E(btn).click();

    },
    teardown: function() {
        E.unbind();
    }
});