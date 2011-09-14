Test.add({
    name: 'Hover, mouseenter, mouseleave',
    async: true,
    open: true,
    test: function() {

        var span = document.createElement('span');
        span.style.display = 'block';
        span.style.backgroundColor = '#443';
        span.style.height = '20px';

        var div = document.createElement('div');
        div.style.marginTop = '10px';
        div.style.paddingTop = '20px';
        div.style.paddingLeft = '20px';
        div.style.paddingBottom = '20px';
        div.style.paddingRight = '20px';
        div.style.border = '1px solid #000'
        div.style.backgroundColor = '#aaaaa4';

        div.appendChild( span );

        append(div);

        var trigger = 0;

        log('Mouse over & out the areas to pass hover');

        E.mouseenter(div, function(e) {
            assert('Mouseenter triggered on the container', e.target.nodeName == 'DIV' && e.type == 'mouseenter');
            if ( e.target.nodeName === 'SPAN' ) {
                assert('Mouseover triggered on the inner element', false);
            } else {
                div.style.backgroundColor = '#b5d3be';
            }
        }).mouseleave(div, function(e) {
            assert('Mouseleave triggered on the container', e.type == 'mouseleave');
            if ( e.target.nodeName === 'SPAN' ) {
                assert('Mouseout triggered on the inner element', false);
            } else if ( trigger ) {
                end();
            } else {
                log('Move over both areas!');
                span.style.backgroundColor = '#dc8b8b';
            }
        });

        E.mouseover(span, function(e) {
            e.currentTarget.style.backgroundColor = '#b5d3be';
            trigger++;
        });

        /*

        $(div).hover(function(e) {
            console.log('mouseover', e);
        }, function(e){
            console.log('mouseout', e);
        }).mouseenter(function(e) {
            console.log('mouseenter', e);
        }).mouseleave(function(e){
            console.log('mouseleave', e);
        });

        */

    },
    teardown: function() {
        E.unbind();
    }
});