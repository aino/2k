(function() {

    var div = document.createElement('div');

    document.body.appendChild(div);

    var echo = function( val ) {
        div.innerHTML+= val;
    }

    var tid,
        i = 0,
        tests = [],
        len = 0,
        no = 1,
        l = 0,
        loads = 0;

    var loadScript = function() {
        var s = document.createElement('script');
        s.src = 'tests/' + loads[l] + '.js';
        document.body.appendChild(s);
    };

    var cycle = function() {

        if ( i == len ) {
            return;
        }
        var test = tests[i];

        echo('<h2>' + test.name + ' <span>' + loads[i] + '.js</span></h2>');
        if ( typeof test.setup == 'function') {
            test.setup();
        }
        no = 1;
        if ( typeof test.test == 'function') {
            test.test();
        }
        if ('async' in test && test.async === true ) {
            return;
        }
        i++;
        cycle();
    };

    window.Test = {

        load: function( str ) {
            loads = str.split(' ');
            loadScript();
        },

        add: function( test ) {
            tests.push( test );
            l++;
            if (loads[l]) {
                loadScript();
            } else {
                len = tests.length;
                cycle();
            }
        }
    };

    window.end = function() {
        i++;
        cycle();
    }

    window.assert = function( msg, test, warn ) {
        if (test) {
            echo('<p class="ok">' + no + '. ' + msg + '</p>');
        } else {
            var cl = warn ? 'warning' : 'fail';
            echo('<p class="'+cl+'">' + no + '. ' + msg + '</p>');
        }
        no ++;
    }
    window.log = function() {
        var msg = Array.prototype.slice.call(arguments);
        echo('<p class="log">' + msg.join(' : ') +'</p>');
    }
    window.append = function(html) {
        if ( typeof html == 'string' ) {
            echo(html);
        } else {
            div.appendChild(html);
        }
    }
}());