var TAU = 2*Math.PI;

var RADIUS = 200;
var OFFSET = 350;

Vue.component('floater', {
    props: ['pos', 'img', 'rad', 'rot', 'flip', 'hide'],
    computed: {
        style: function() {
            var style = "left: " + (OFFSET + this.rad*RADIUS*Math.sin(this.pos*TAU/10)) + "px; top: " + (OFFSET - this.rad*RADIUS*Math.cos(this.pos*TAU/10)) + "px; transform: rotate(" + this.rot*TAU/10 + "rad) ";
            if (this.flip) {
                style += "scaleX(-1) ";
            }
            return(style + ";");
        }
    },
    template: '<img v-if="!hide" v-bind:src="img" v-bind:style="style" class="floater"/>'
});


var STATUS = {
    THINKING: ['Pondering', 'Brooding', 'Considering', 'Reflecting', 'Speculating', 'Deliberating', 'Evaluating', 'Contemplating', 'Ruminating', 'Questioning'],
    HUNGRY: ['Empty', 'Famished', 'Hankering', 'Peckish', 'Malnourished', 'Underfed'],
    EATING: ['Consuming', 'Ingesting', 'Partaking', 'Savoring', 'Feasting', 'Dining'],
    FULL: ['Satiated', 'Content', 'Stuffed', 'Well-fed', 'Replete']
};

choose = function(choices) {
    return(choices[Math.floor(choices.length*Math.random())]);
}

function randomExponential() {
    return -Math.log(Math.random());
}

init_phil_states = function() {
    var result = [];
    for (var i = 0; i < 5; i++) {
        result.push(choose(STATUS.THINKING));
        spawn_philosopher(i);
    }
    return(result);
}

spawn_philosopher = function(id) {
    var run_phil = function() {
        var state = app.states[id];
        if (STATUS.THINKING.includes(state)) {
            Vue.set(app.states, id, choose(STATUS.HUNGRY));
            setTimeout(run_phil, 1000);
            return;
        }
        if (STATUS.HUNGRY.includes(state)) {
            if (!app.lhand[id]) {
                if (!app.rhand[(id+1)%5]) {
                    Vue.set(app.lhand, id, true);
                }
                setTimeout(run_phil, 1000);
                return;
            }
            if (!app.rhand[id]) {
                if (!app.lhand[(id+4)%5]) {
                    Vue.set(app.rhand, id, true);
                }
                setTimeout(run_phil, 1000);
                return;
            }
            Vue.set(app.states, id, choose(STATUS.EATING));
            setTimeout(run_phil, 5000+randomExponential()/1e-4);
            return;
        }
        if (STATUS.EATING.includes(state)) {
            Vue.set(app.states, id, choose(STATUS.FULL));
            setTimeout(run_phil, 1000);
            return;
        }
        if (STATUS.FULL.includes(state)) {
            if (app.lhand[id]) {
                Vue.set(app.lhand, id, false);
                setTimeout(run_phil, 1000);
                return;
            }
            if (app.rhand[id]) {
                Vue.set(app.rhand, id, false);
                setTimeout(run_phil, 1000);
                return;
            }
            Vue.set(app.states, id, choose(STATUS.THINKING));
            setTimeout(run_phil, 5000+randomExponential()/1e-4);
            return;
        }
    }
    setTimeout(run_phil, 5000+randomExponential()/1e-4);
}

var app = new Vue({
    el: '#app',
    data: {
        names: [
            'Prof. Peter Singer',
            'Mr. Wikihow',
            'Rene Descartes',
            'Jean-Paul Sarte',
            'Reece Simpson'
        ],
        states: init_phil_states(),
        lhand: [false, false, false, false, false],
        rhand: [false, false, false, false, false]
    }
})
